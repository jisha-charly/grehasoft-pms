import os
from io import BytesIO
from decimal import Decimal
from typing import Any, Dict

from django.conf import settings
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph


def _money(value: Any) -> str:
    try:
        return f"{Decimal(value):,.2f}"
    except Exception:
        return str(value)


def _base_canvas() -> tuple[canvas.Canvas, BytesIO]:
    buf = BytesIO()
    p = canvas.Canvas(buf, pagesize=A4)
    return p, buf


def draw_hr_document_template(p: canvas.Canvas, width: float, height: float):
    blue = HexColor("#0753F6")
    green = HexColor("#1AB728")
    dark_blue = HexColor("#05044A")

    # Header Background
    p.setFillColor(dark_blue)
    p.rect(0, height - 80, width, 80, stroke=0, fill=1)

    # Logo
    logo_path = os.path.join(settings.BASE_DIR, 'media', 'logo', 'Grehasoft-logo.png')
    if os.path.exists(logo_path):
        p.drawImage(logo_path, 40, height - 65, width=140, preserveAspectRatio=True, mask='auto')
    else:
        p.setFillColor(blue)
        p.setFont("Helvetica-Bold", 24)
        p.drawString(40, height - 50, "GREHASOFT")

    # Right Contact Info
    p.setFillColor(HexColor("#FFFFFF"))
    p.setFont("Helvetica", 9)
    rx = width - 200
    y_contact = height - 30
    p.drawString(rx, y_contact, "Phone: (+91) 89215 40183")
    p.drawString(rx, y_contact - 15, "Email: info@grehasoft.com")
    p.drawString(rx + 110, y_contact, "Loc: Infopark, Kochi")
    p.drawString(rx + 110, y_contact - 15, "Web: grehasoft.com")

    # Curved Green + Blue lines (using bezier for aesthetic curves)
    p.setStrokeColor(green)
    p.setLineWidth(4)
    p.bezier(0, height - 85, width/2, height - 85, width/2 + 50, height - 70, width, height - 70)
    
    p.setStrokeColor(blue)
    p.setLineWidth(4)
    p.bezier(0, height - 90, width/2 - 20, height - 90, width/2 + 30, height - 75, width, height - 75)

    # Watermark
    p.saveState()
    p.setFillAlpha(0.1)
    if os.path.exists(logo_path):
        p.drawImage(logo_path, width/2 - 150, height/2 - 150, width=300, preserveAspectRatio=True, mask='auto', anchor='c')
    else:
        p.setFillColor(blue)
        p.setFont("Helvetica-Bold", 120)
        p.drawCentredString(width/2, height/2 - 40, "GS")
    p.restoreState()

    # Footer Line
    p.setStrokeColor(green)
    p.setLineWidth(3)
    p.line(50, 60, width - 50, 60)
    p.setFillColor(dark_blue)
    p.setFont("Helvetica", 9)
    p.drawCentredString(width/2, 40, "Grehasoft | Infopark, Kochi, Kerala | www.grehasoft.com")


def build_offer_letter_pdf(context: Dict[str, Any]) -> bytes:
    p, buf = _base_canvas()
    width, height = A4
    draw_hr_document_template(p, width, height)

    y = height - 150
    p.setFillColor(HexColor("#05044A"))
    p.setFont("Helvetica-Bold", 16)
    p.drawString(50, y, "Job Offer Letter")
    y -= 30

    p.setFillColor(HexColor("#444444"))
    p.setFont("Helvetica", 11)
    p.drawString(50, y, f"Date: {context.get('date')}")
    y -= 20

    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, y, f"To, {context.get('employee_name')}")
    y -= 16
    p.setFont("Helvetica", 11)
    p.drawString(50, y, f"Address: {context.get('address')}")
    y -= 24

    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, y, "Subject: Offer of Employment")
    y -= 24

    p.setFont("Helvetica", 11)
    lines = [
        f"We are pleased to offer you the position of {context.get('position')} in the {context.get('department')} department.",
        f"Your joining date will be {context.get('joining_date')}.",
        f"Your monthly salary will be INR {_money(context.get('salary_monthly'))}.",
        "We look forward to working with you and wish you a successful career with GREHASOFT.",
    ]
    for line in lines:
        p.drawString(50, y, line)
        y -= 18

    y -= 20
    p.drawString(50, y, "Sincerely,")
    y -= 40
    p.setFont("Helvetica-Bold", 11)
    p.drawString(50, y, "Authorized Signatory")

    p.showPage()
    p.save()
    buf.seek(0)
    return buf.getvalue()


def build_appraisal_letter_pdf(context: Dict[str, Any]) -> bytes:
    p, buf = _base_canvas()
    width, height = A4
    draw_hr_document_template(p, width, height)
    
    y = height - 150
    p.setFillColor(HexColor("#05044A"))
    p.setFont("Helvetica-Bold", 16)
    p.drawString(50, y, "Annual Salary Appraisal Letter")
    y -= 30

    p.setFillColor(HexColor("#444444"))
    p.setFont("Helvetica", 11)
    p.drawString(50, y, f"Date: {context.get('date')}")
    y -= 24

    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, y, f"Dear {context.get('employee_name')},")
    y -= 24

    p.setFont("Helvetica", 11)
    lines = [
        f"This is to inform you that your annual appraisal has been processed effective {context.get('effective_date')}.",
        f"Increase Percentage: {context.get('increase_percentage')}%",
        f"Previous Monthly Salary: INR {_money(context.get('old_salary_monthly'))}",
        f"Revised Monthly Salary: INR {_money(context.get('new_salary_monthly'))}",
        "Congratulations and best wishes for continued success.",
    ]
    for line in lines:
        p.drawString(50, y, line)
        y -= 18

    y -= 20
    p.drawString(50, y, "Sincerely,")
    y -= 40
    p.setFont("Helvetica-Bold", 11)
    p.drawString(50, y, "Authorized Signatory")

    p.showPage()
    p.save()
    buf.seek(0)
    return buf.getvalue()


def build_experience_certificate_pdf(context: Dict[str, Any]) -> bytes:
    p, buf = _base_canvas()
    width, height = A4
    draw_hr_document_template(p, width, height)

    y = height - 160
    p.setFillColor(HexColor("#05044A"))
    p.setFont("Helvetica-Bold", 20)
    p.drawCentredString(width / 2, y, "EXPERIENCE CERTIFICATE")
    y -= 40

    p.setFillColor(HexColor("#444444"))
    p.setFont("Helvetica", 11)
    p.drawCentredString(width / 2, y, "This is to certify that")
    y -= 30

    p.setFont("Helvetica-Bold", 14)
    p.drawCentredString(width / 2, y, str(context.get("employee_name")))
    y -= 30

    p.setFont("Helvetica", 11)
    body = (
        f"has worked with GREHASOFT as {context.get('role')} "
        f"from {context.get('start_date')} to {context.get('end_date')}."
    )
    p.drawCentredString(width / 2, y, body)
    y -= 40

    p.drawCentredString(width / 2, y, "We wish them all the best for future endeavors.")
    y -= 50

    p.drawString(50, y, f"Date: {context.get('date')}")
    p.setFont("Helvetica-Bold", 11)
    p.drawString(width - 200, y, "Authorized Signatory")

    p.showPage()
    p.save()
    buf.seek(0)
    return buf.getvalue()


def build_salary_certificate_pdf(context: Dict[str, Any]) -> bytes:
    p, buf = _base_canvas()
    width, height = A4
    draw_hr_document_template(p, width, height)
    
    y = height - 150
    p.setFillColor(HexColor("#05044A"))
    p.setFont("Helvetica-Bold", 16)
    p.drawString(50, y, "Salary Certificate")
    y -= 30

    p.setFillColor(HexColor("#444444"))
    p.setFont("Helvetica", 11)
    lines = [
        f"Date of Issue: {context.get('issue_date')}",
        "",
        f"This is to certify that {context.get('employee_name')} is employed with us as {context.get('position')}.",
        f"Joining Date: {context.get('joining_date')}",
        f"Monthly Salary: INR {_money(context.get('salary_monthly'))}",
        "",
        "This certificate is issued upon the request of the employee for official purposes.",
    ]
    for line in lines:
        p.drawString(50, y, line)
        y -= 18

    y -= 20
    p.setFont("Helvetica-Bold", 11)
    p.drawString(50, y, "Authorized Signatory")

    p.showPage()
    p.save()
    buf.seek(0)
    return buf.getvalue()


def build_internship_certificate_pdf(context: Dict[str, Any]) -> bytes:
    p, buf = _base_canvas()
    width, height = A4
    draw_hr_document_template(p, width, height)

    y = height - 150
    p.setFillColor(HexColor("#05044A"))
    p.setFont("Helvetica-Bold", 20)
    p.drawCentredString(width / 2, y, "INTERNSHIP CERTIFICATE")
    y -= 40

    styles = getSampleStyleSheet()
    style = styles["Normal"]
    style.fontName = "Helvetica"
    style.fontSize = 12
    style.leading = 18
    style.textColor = HexColor("#444444")

    intern_name = context.get('intern_name')
    college_name = context.get('college_name')
    position = context.get('position')
    company_name = context.get('company_name') or 'GREHASOFT'
    start_date = context.get('start_date')
    end_date = context.get('end_date')

    para1_text = (
        f"This is to certify that Mr./Ms. <b>{intern_name}</b> from <b>{college_name}</b> has "
        f"successfully completed an internship as <b>{position}</b> at <b>{company_name}</b> "
        f"from <b>{start_date}</b> to <b>{end_date}</b>."
    )
    para1 = Paragraph(para1_text, style)

    para2_text = (
        "During the internship period, the intern demonstrated sincerity, dedication, "
        "and professionalism in assigned tasks."
    )
    para2 = Paragraph(para2_text, style)

    para3_text = "We wish them all the best in their future endeavors."
    para3 = Paragraph(para3_text, style)

    para1.wrapOn(p, width - 100, height)
    para1.drawOn(p, 50, y - para1.height)
    y -= (para1.height + 25)

    para2.wrapOn(p, width - 100, height)
    para2.drawOn(p, 50, y - para2.height)
    y -= (para2.height + 25)

    para3.wrapOn(p, width - 100, height)
    para3.drawOn(p, 50, y - para3.height)
    y -= (para3.height + 50)

    p.setFont("Helvetica", 11)
    p.setFillColor(HexColor("#05044A"))
    p.drawString(50, y, f"Date: {context.get('issue_date')}")

    p.setFont("Helvetica-Bold", 11)
    p.drawString(width - 200, y, "Authorized Signatory")
    y -= 20
    p.setFont("Helvetica", 11)
    p.drawString(width - 200, y, str(context.get('hr_name')))
    y -= 15
    p.drawString(width - 200, y, str(company_name))

    p.showPage()
    p.save()
    buf.seek(0)
    return buf.getvalue()
