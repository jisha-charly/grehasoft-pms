import os

from django.conf import settings
from rest_framework import viewsets
from django.db.models import Sum
from rest_framework.decorators import api_view
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from .models import Invoice, InvoicePayment
from .serializers import InvoiceSerializer, InvoicePaymentSerializer
from .utils import generate_invoice_number
from reportlab.pdfgen import canvas
from django.http import HttpResponse
from rest_framework.response import Response
from django.core.mail import send_mail
from .email_service import send_invoice_email
import tempfile
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.views.decorators.csrf import csrf_exempt
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.platypus import Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.utils import ImageReader
from num2words import num2words


class InvoiceViewSet(viewsets.ModelViewSet):

    queryset = Invoice.objects.all()

    serializer_class = InvoiceSerializer
    @action(detail=False, methods=["get"], url_path="next-number")
    def next_number(self, request):
        number = generate_invoice_number()
        return Response({"invoice_number": number})

class InvoicePaymentViewSet(viewsets.ModelViewSet):

    queryset = InvoicePayment.objects.all()
    serializer_class = InvoicePaymentSerializer    

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
def download_invoice(request, pk):
    try:
        invoice = Invoice.objects.get(id=pk)
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
        p.drawImage(header, 0, height-110, width=width, height=110)
    except Exception as e:
        print("Header image error:", e)

    # 3️⃣ Start content lower because header occupies space
    y = height - 160

    


    # -----------------------------
    # WATERMARK
    # -----------------------------
    p.saveState()
    p.setFont("Helvetica-Bold", 80)
    p.setFillGray(0.95, 0.15)
    p.drawCentredString(width/2, height/2, "GREHASOFT")
    p.restoreState()


    


    # -----------------------------
    # COMPANY INFO
    # -----------------------------
   
    p.setFont("Helvetica-Bold",16)
    p.drawCentredString(width/2, height-150, "INVOICE BILL")


    # -----------------------------
    # INVOICE INFO
    # -----------------------------
    y = height - 150

    p.setFont("Helvetica",11)

    p.drawString(50, y, f"Invoice No : {invoice.invoice_number}")
    p.drawString(400, y, f"Date : {invoice.issue_date}")

    y -= 20
    p.drawString(50, y, f"Client : {invoice.client.name}")
    y -= 20
    p.drawString(50, y, "GST No : 32ABCDE1234F1Z5")


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
    # TAX CALCULATION
    # -----------------------------
    gst = subtotal * 0.18
    grand_total = subtotal + gst
    

    data.append(["", "", "", "Sub Total", f"Rs {subtotal:.2f}"])
    data.append(["", "", "", "GST (18%)", f"Rs {gst:.2f}"])
    data.append(["", "", "", "Grand Total", f"Rs {grand_total:.2f}"])

   
    
    
    # -----------------------------
    # TABLE
    # -----------------------------
   
    table = Table(data, colWidths=[40,250,60,80,100])
    table.setStyle(TableStyle([
    ("GRID",(0,0),(-1,-1),1,colors.grey),

    ("BACKGROUND",(0,0),(-1,0),colors.HexColor("#1f4e79")),
    ("TEXTCOLOR",(0,0),(-1,0),colors.white),

    ("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),

    ("ALIGN",(2,1),(4,-1),"RIGHT"),

    ("FONTNAME",(0,-1),(-1,-1),"Helvetica-Bold"),
    ("BACKGROUND",(0,-1),(-1,-1),colors.lightgrey),

    ("BOTTOMPADDING",(0,0),(-1,-1),8),
    ("TOPPADDING",(0,0),(-1,-1),8),
]))

    

    table.wrapOn(p,width,height)
    table.drawOn(p,50,y-200)
    y=400
    rupees = int(grand_total)
    paise = int(round((grand_total - rupees) * 100))

    amount_words = num2words(rupees, lang="en_IN").replace(",", "")

    if paise > 0:
     paise_words = num2words(paise, lang="en_IN")
     final_words = f"Rupees {amount_words} and {paise_words} paise only"
    else:
     final_words = f"Rupees {amount_words} only"

    p.setFont("Helvetica",10),
    p.drawString(50, y, f"Amount in Words: {final_words.capitalize()}")
   
   
   
    # -----------------------------
    # BANK DETAILS
    # -----------------------------
    y -= 220
    p.setFont("Helvetica-Bold",11)
    p.drawString(50,y,"Bank Details")

    p.setFont("Helvetica",10)

    y -= 15
    p.drawString(50,y,"Account Name : GREHASOFT")

    y -= 15
    p.drawString(50,y,"Bank Name : SBI")

    y -= 15
    p.drawString(50,y,"Account Number : 41597828369")

    y -= 15
    p.drawString(50,y,"IFSC Code : SBIN0018060")


    # -----------------------------
    # FOOTER
    # -----------------------------
    p.setFont("Helvetica",9)
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