import os


from rest_framework import viewsets, filters, permissions
from django.conf import settings
from rest_framework import viewsets
from django.db.models import Sum
from rest_framework.decorators import api_view
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from .models import Invoice, InvoicePayment
from .serializers import InvoiceSerializer, InvoicePaymentSerializer
from .utils import generate_invoice_number

from django.http import HttpResponse
from rest_framework.response import Response
from django.core.mail import send_mail
from .email_service import send_invoice_email
import tempfile
from rest_framework.decorators import api_view, permission_classes
from apps.projects.utils import log_failed_attempt
from rest_framework.permissions import IsAuthenticated
from django.views.decorators.csrf import csrf_exempt
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.platypus import Table, TableStyle, Paragraph, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.utils import ImageReader
from num2words import num2words
from django_filters.rest_framework import DjangoFilterBackend
from core.permissions import IsClientOwner

class InvoiceViewSet(viewsets.ModelViewSet):

    queryset = Invoice.objects.all().order_by("-id")
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated, IsClientOwner]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]

    search_fields = [
        "invoice_number",
        "client__name"
    ]

    def get_queryset(self):
        user = self.request.user
        role_name = getattr(user.role, 'name', None) if hasattr(user, 'role') else None
        
        if role_name == 'CLIENT':
            if self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
                return Invoice.objects.all().order_by("-id")
            
        return Invoice.get_for_user(user).order_by("-id")

    def check_permissions(self, request):
        super().check_permissions(request)
        role_name = getattr(request.user.role, 'name', None) if hasattr(request.user, 'role') else None
        if role_name == 'CLIENT' and request.method not in permissions.SAFE_METHODS:
            log_failed_attempt(request.user, f"Tried to write invoice via {request.method}")
            self.permission_denied(request, message="Clients do not have permission to modify invoices.")


    @action(detail=False, methods=["get"], url_path="next-number")
    def next_number(self, request):
        number = generate_invoice_number()
        return Response({"invoice_number": number})

class InvoicePaymentViewSet(viewsets.ModelViewSet):

    queryset = InvoicePayment.objects.all()
    serializer_class = InvoicePaymentSerializer    

    def get_queryset(self):
        user = self.request.user
        role_name = getattr(user.role, 'name', None) if hasattr(user, 'role') else None
        
        if role_name == 'CLIENT':
            client = user.get_associated_client()
            if client:
                return InvoicePayment.objects.filter(invoice__client=client)
            return InvoicePayment.objects.none()
            
        return InvoicePayment.objects.all()

    def check_permissions(self, request):
        super().check_permissions(request)
        role_name = getattr(request.user.role, 'name', None) if hasattr(request.user, 'role') else None
        if role_name == 'CLIENT' and request.method not in permissions.SAFE_METHODS:
            log_failed_attempt(request.user, f"Tried to write invoice payment via {request.method}")
            self.permission_denied(request, message="Clients do not have permission to modify invoice payments.")

@api_view(["GET"])
def invoice_analytics(request):

    invoices = Invoice.objects.all()

    total_invoices = invoices.count()

    total_revenue = invoices.aggregate(
        total=Sum("total")
    )["total"] or 0

    # total_paid is a property
    total_paid = sum(i.total_paid for i in invoices)

    # balance is a property
    total_balance = sum(i.balance for i in invoices)

    return Response({
        "total_invoices": total_invoices,
        "total_revenue": total_revenue,
        "total_paid": total_paid,
        "total_balance": total_balance
    })
@api_view(["GET"])
def download_invoice(request, pk):
    try:
        user = request.user
        if not user or not user.is_authenticated:
            token_str = request.GET.get('token')
            if token_str:
                from rest_framework_simplejwt.authentication import JWTAuthentication
                try:
                    validated_token = JWTAuthentication().get_validated_token(token_str)
                    user = JWTAuthentication().get_user(validated_token)
                except Exception:
                    pass

        if not user or not user.is_authenticated:
            return HttpResponse("Unauthorized", status=401)
            
        invoice = Invoice.objects.get(id=pk)
        
        role_name = getattr(user.role, 'name', None) if hasattr(user, 'role') else None
        if role_name == 'CLIENT':
            client = user.get_associated_client()
            if not client or invoice.client != client:
                log_failed_attempt(user, f"Tried to download Invoice ID {invoice.id} (owned by another client)")
                return HttpResponse("Forbidden", status=403)
                
        # Audit logging
        from apps.activity.models import ActivityLog
        ActivityLog.objects.create(
            user=user,
            action=f"Downloaded invoice {invoice.invoice_number}"
        )
            
        pdf_path = generate_invoice_pdf(invoice)

        with open(pdf_path, "rb") as pdf:
            response = HttpResponse(pdf.read(), content_type="application/pdf")
            response["Content-Disposition"] = f'attachment; filename="invoice_{invoice.invoice_number}.pdf"'

        return response

    except Exception as e:
        return HttpResponse(str(e))
def generate_invoice_pdf(invoice):
    tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")

    # 1️⃣ Create canvas FIRST
    p = canvas.Canvas(tmp_file.name, pagesize=A4)

    width, height = A4

    # 2️⃣ Then draw header
    header_path = os.path.join(settings.MEDIA_ROOT, "logo", "invoice_header.png")

    try:
        header = ImageReader(header_path)
        p.drawImage(header, 0, height-90, width=width, height=90)
    except Exception as e:
        print("Header image error:", e)

    # 3️⃣ Start content lower because header occupies space
    y = height - 135

    # -----------------------------
    # WATERMARK
    # -----------------------------
    p.saveState()
    p.setFont("Helvetica-Bold", 80)
    p.setFillGray(0.95, 0.15)
    p.drawCentredString(width/2, height/2, "GREHASOFT")
    p.restoreState()

    # -----------------------------
    # COMPANY INFO / TITLE
    # -----------------------------
    p.setFont("Helvetica-Bold", 16)
    p.drawCentredString(width/2, y, "INVOICE BILL")
    y -= 25

    # -----------------------------
    # STATUS BADGE CALCULATION
    # -----------------------------
    status_val = invoice.status.upper()
    if status_val == "PARTIAL":
        status_display = "PARTIALLY PAID"
        badge_color = colors.HexColor("#17a2b8")
    elif status_val == "PAID":
        status_display = "PAID"
        badge_color = colors.HexColor("#28a745")
    elif status_val == "OVERDUE":
        status_display = "OVERDUE"
        badge_color = colors.HexColor("#dc3545")
    else:
        status_display = "UNPAID"
        badge_color = colors.HexColor("#fd7e14")

    # -----------------------------
    # INVOICE INFO HEADER
    # -----------------------------
    p.setFont("Helvetica", 10)
    p.drawString(50, y, f"Invoice No : {invoice.invoice_number}")
    p.drawString(190, y, f"Date : {invoice.issue_date}")
    if invoice.due_date:
        p.drawString(320, y, f"Due Date : {invoice.due_date}")

    badge_width = 110 if status_display == "PARTIALLY PAID" else 80
    badge_x = width - 50 - badge_width
    badge_y = y - 4

    p.saveState()
    p.setFillColor(badge_color)
    p.roundRect(badge_x, badge_y, badge_width, 16, 3, fill=1, stroke=0)
    p.setFillColor(colors.white)
    p.setFont("Helvetica-Bold", 8)
    p.drawCentredString(badge_x + badge_width/2, badge_y + 4, status_display)
    p.restoreState()

    y -= 15

    # Top separator line
    p.setStrokeColor(colors.HexColor("#e2e8f0"))
    p.setLineWidth(1)
    p.line(50, y, width - 50, y)
    y -= 15

    # -----------------------------
    # ISSUED BY & BILL TO PANELS
    # -----------------------------
    styles = getSampleStyleSheet()
    content_style = ParagraphStyle(
        'PanelContent',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13
    )

    issued_by_html = (
        "<b>Grehasoft Smart IT Solutions</b><br/>"
        "Vismaya Building, Infopark Phase 1,<br/>"
        "Kakkanad, Kochi, Kerala - 682030<br/>"
        "Phone: +91 89215 40183<br/>"
        "Email: info@grehasoft.com<br/>"
        "Website: www.grehasoft.com<br/>"
        # "GSTIN: 32ABCDE1234F1Z5<br/>"
        "PAN: ABCDE1234F"
    )

    client = invoice.client
    bill_to_lines = []
    if client.company_name:
        bill_to_lines.append(f"<b>{client.company_name}</b>")
    if client.name:
        bill_to_lines.append(f"Contact: {client.name}")
    if client.email:
        bill_to_lines.append(f"Email: {client.email}")
    if client.phone:
        bill_to_lines.append(f"Phone: {client.phone}")
    if client.address:
        addr_clean = client.address.replace("\n", "<br/>").replace("\r", "")
        bill_to_lines.append(f"Address: {addr_clean}")
    if client.gst_no:
        bill_to_lines.append(f"GSTIN: {client.gst_no}")

    bill_to_html = "<br/>".join(bill_to_lines)

    left_cell = Paragraph(f"<font color='#1f4e79'><b>ISSUED BY:</b></font><br/><br/>{issued_by_html}", content_style)
    right_cell = Paragraph(f"<font color='#1f4e79'><b>BILL TO:</b></font><br/><br/>{bill_to_html}", content_style)

    info_table = Table([[left_cell, right_cell]], colWidths=[265, 265])
    info_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))

    iw, ih = info_table.wrap(width - 100, height)
    info_table.drawOn(p, 50, y - ih)
    y = y - ih - 15

    # Bottom separator line
    p.line(50, y, width - 50, y)
    y -= 20

    # -----------------------------
    # TABLE DATA
    # -----------------------------
    data = [
        ["#", "Description", "Qty", "Rate", "Amount"]
    ]

    i = 1
    subtotal = 0

    for item in invoice.items.all():
        subtotal += float(item.amount)
        data.append([
            i,
            item.description,
            item.quantity,
            f"Rs {item.rate}",
            f"Rs {item.amount}"
        ])
        i += 1

    # -----------------------------
    # SUMMARY ROWS
    # -----------------------------
    subtotal_row_idx = len(data)
    data.append(["", "", "", "Sub Total", f"Rs {subtotal:.2f}"])

    gst_row_idx = len(data)
    data.append(["", "", "", "GST", f"Rs {float(invoice.tax):.2f}"])

    grand_total_row_idx = len(data)
    data.append(["", "", "", "Grand Total", f"Rs {float(invoice.total):.2f}"])

    amount_paid_row_idx = len(data)
    data.append(["", "", "", "Amount Paid", f"Rs {float(invoice.total_paid):.2f}"])

    balance_due_row_idx = len(data)
    data.append(["", "", "", "Balance Due", f"Rs {float(invoice.balance):.2f}"])

    # -----------------------------
    # TABLE STYLING
    # -----------------------------
    table = Table(data, colWidths=[40, 250, 60, 80, 100])
    
    table_styles = [
        ("GRID", (0, 0), (-1, len(invoice.items.all())), 1, colors.grey),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f4e79")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("ALIGN", (2, 1), (4, len(invoice.items.all())), "RIGHT"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
    ]

    # Style summary rows
    table_styles.extend([
        ("FONTNAME", (3, subtotal_row_idx), (4, subtotal_row_idx), "Helvetica"),
        ("FONTNAME", (3, gst_row_idx), (4, gst_row_idx), "Helvetica"),
        ("FONTNAME", (3, grand_total_row_idx), (4, grand_total_row_idx), "Helvetica-Bold"),
        ("LINEABOVE", (3, grand_total_row_idx), (4, grand_total_row_idx), 1, colors.grey),
        ("FONTNAME", (3, amount_paid_row_idx), (4, amount_paid_row_idx), "Helvetica"),
        ("FONTNAME", (3, balance_due_row_idx), (4, balance_due_row_idx), "Helvetica-Bold"),
        ("LINEABOVE", (3, balance_due_row_idx), (4, balance_due_row_idx), 1, colors.grey),
        ("LINEBELOW", (3, balance_due_row_idx), (4, balance_due_row_idx), 1.5, colors.grey),
    ])

    # Highlight Balance Due
    if invoice.balance > 0:
        table_styles.extend([
            ("BACKGROUND", (3, balance_due_row_idx), (4, balance_due_row_idx), colors.HexColor("#fff3cd")),
            ("TEXTCOLOR", (3, balance_due_row_idx), (4, balance_due_row_idx), colors.HexColor("#856404")),
        ])
    else:
        table_styles.extend([
            ("BACKGROUND", (3, balance_due_row_idx), (4, balance_due_row_idx), colors.HexColor("#d4edda")),
            ("TEXTCOLOR", (3, balance_due_row_idx), (4, balance_due_row_idx), colors.HexColor("#155724")),
        ])

    table_styles.append(("ALIGN", (3, subtotal_row_idx), (4, -1), "RIGHT"))
    table.setStyle(TableStyle(table_styles))

    w, h = table.wrap(width - 100, height)
    if y - h < 120:
        p.showPage()
        p.saveState()
        p.setFont("Helvetica-Bold", 80)
        p.setFillGray(0.95, 0.15)
        p.drawCentredString(width/2, height/2, "GREHASOFT")
        p.restoreState()
        y = height - 80
        w, h = table.wrap(width - 100, height)

    table.drawOn(p, 50, y - h)
    y = y - h - 15

    # -----------------------------
    # AMOUNT IN WORDS
    # -----------------------------
    grand_total = float(invoice.total)
    rupees = int(grand_total)
    paise = int(round((grand_total - rupees) * 100))

    amount_words = num2words(rupees, lang="en_IN").replace(",", "")

    if paise > 0:
        paise_words = num2words(paise, lang="en_IN")
        final_words = f"Rupees {amount_words} and {paise_words} paise only"
    else:
        final_words = f"Rupees {amount_words} only"

    p.setFont("Helvetica", 10)
    p.drawString(50, y, f"Amount in Words: {final_words.capitalize()}")
    y -= 30

    # -----------------------------
    # PAYMENT HISTORY
    # -----------------------------
    if y < 150:
        p.showPage()
        p.saveState()
        p.setFont("Helvetica-Bold", 80)
        p.setFillGray(0.95, 0.15)
        p.drawCentredString(width/2, height/2, "GREHASOFT")
        p.restoreState()
        y = height - 80

    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, y, "Payment History")
    y -= 15

    payments = invoice.payments.all().order_by("payment_date")
    if not payments.exists():
        p.setFont("Helvetica-Oblique", 10)
        p.drawString(50, y, "No payments received yet.")
        y -= 25
    else:
        pay_data = [["Date", "Amount", "Method", "Notes"]]
        for pay in payments:
            mode_display = {
                "cash": "Cash",
                "bank": "Bank Transfer",
                "upi": "UPI",
                "card": "Card"
            }.get(pay.payment_mode, pay.payment_mode.capitalize())

            pay_data.append([
                str(pay.payment_date),
                f"Rs {float(pay.amount):.2f}",
                mode_display,
                pay.notes or "-"
            ])

        pay_table = Table(pay_data, colWidths=[100, 100, 100, 230])
        pay_table.setStyle(TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f1f1")),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("ALIGN", (1, 1), (1, -1), "RIGHT"),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
        ]))

        pw, ph = pay_table.wrap(width - 100, height)
        if y - ph < 120:
            p.showPage()
            p.saveState()
            p.setFont("Helvetica-Bold", 80)
            p.setFillGray(0.95, 0.15)
            p.drawCentredString(width/2, height/2, "GREHASOFT")
            p.restoreState()
            y = height - 80
            pw, ph = pay_table.wrap(width - 100, height)

        pay_table.drawOn(p, 50, y - ph)
        y = y - ph - 30

    # -----------------------------
    # DYNAMIC FOOTER TABLE
    # -----------------------------
    bank_html = (
        "<b>Bank Details</b><br/>"
        "Account Name : GREHASOFT<br/>"
        "Bank Name : SBI<br/>"
        "Account Number : 41597828369<br/>"
        "IFSC Code : SBIN0018060"
    )

    terms_html = (
        "<br/><b>Terms & Conditions:</b><br/>"
        "1. Please quote Invoice Number in all payments.<br/>"
        "2. Payments should be made as per the agreed schedule.<br/>"
        "3. All disputes are subject to Kochi jurisdiction."
    )

    left_footer_flowable = Paragraph(f"{bank_html}<br/>{terms_html}", content_style)

    qr_flowable = None
    qr_path = os.path.join(settings.MEDIA_ROOT, "scanpay.jpeg")
    try:
        if os.path.exists(qr_path):
            qr_flowable = Image(qr_path, width=80, height=104)
    except Exception as e:
        print("QR image error:", e)

    sig_html = (
        "<br/><b>For GREHASOFT</b><br/><br/><br/>"
        "_______________________<br/>"
        "Authorized Signature"
    )
    sig_style = ParagraphStyle(
        'SigStyle',
        parent=content_style,
        alignment=2
    )
    sig_flowable = Paragraph(sig_html, sig_style)

    right_cell_content = []
    if qr_flowable:
        right_cell_content.append(qr_flowable)
    right_cell_content.append(sig_flowable)

    footer_table = Table([[left_footer_flowable, right_cell_content]], colWidths=[270, 260])
    footer_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))

    fw, fh = footer_table.wrap(width - 100, height)
    if y - fh < 60:
        p.showPage()
        p.saveState()
        p.setFont("Helvetica-Bold", 80)
        p.setFillGray(0.95, 0.15)
        p.drawCentredString(width/2, height/2, "GREHASOFT")
        p.restoreState()
        y = height - 80

    footer_table.drawOn(p, 50, y - fh)

    # -----------------------------
    # FOOTER
    # -----------------------------
    p.setFont("Helvetica", 9)
    p.drawCentredString(width/2, 40, "Thank you for doing business with GREHASOFT")

    p.save()

    return tmp_file.name
@csrf_exempt
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_invoice_email_view(request, pk):
    try:
        invoice = Invoice.objects.get(id=pk)
    except Invoice.DoesNotExist:
        return Response({"error": "Invoice not found"}, status=404)

    try:
        pdf_path = generate_invoice_pdf(invoice)
        send_invoice_email(invoice, pdf_path)
        return Response({"message": "Email sent"})
    except Exception as e:
        return Response({"error": f"Failed to send email: {str(e)}"}, status=500)