from io import BytesIO
from decimal import Decimal
from typing import Any, Dict

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas


def _money(value: Any) -> str:
    try:
        return f"{Decimal(value):,.2f}"
    except Exception:
        return str(value)


def _base_canvas() -> tuple[canvas.Canvas, BytesIO]:
    buf = BytesIO()
    p = canvas.Canvas(buf, pagesize=A4)
    return p, buf


def build_offer_letter_pdf(context: Dict[str, Any]) -> bytes:
    p, buf = _base_canvas()
    width, height = A4

    y = height - 60
    p.setFont("Helvetica-Bold", 16)
    p.drawString(50, y, "GREHASOFT")
    y -= 24
    p.setFont("Helvetica", 10)
    p.drawString(50, y, "Job Offer Letter")
    y -= 24

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

    y -= 18
    p.drawString(50, y, "Sincerely,")
    y -= 36
    p.setFont("Helvetica-Bold", 11)
    p.drawString(50, y, "Authorized Signatory")

    p.showPage()
    p.save()
    return buf.getvalue()


def build_appraisal_letter_pdf(context: Dict[str, Any]) -> bytes:
    p, buf = _base_canvas()
    width, height = A4
    y = height - 60

    p.setFont("Helvetica-Bold", 16)
    p.drawString(50, y, "GREHASOFT")
    y -= 24
    p.setFont("Helvetica", 10)
    p.drawString(50, y, "Annual Salary Appraisal Letter")
    y -= 24

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

    y -= 18
    p.drawString(50, y, "Sincerely,")
    y -= 36
    p.setFont("Helvetica-Bold", 11)
    p.drawString(50, y, "Authorized Signatory")

    p.showPage()
    p.save()
    return buf.getvalue()


def build_experience_certificate_pdf(context: Dict[str, Any]) -> bytes:
    p, buf = _base_canvas()
    width, height = A4

    p.setFont("Helvetica-Bold", 20)
    p.drawCentredString(width / 2, height - 80, "EXPERIENCE CERTIFICATE")

    p.setFont("Helvetica", 11)
    p.drawCentredString(width / 2, height - 110, "This is to certify that")

    p.setFont("Helvetica-Bold", 14)
    p.drawCentredString(width / 2, height - 140, str(context.get("employee_name")))

    p.setFont("Helvetica", 11)
    body = (
        f"has worked with GREHASOFT as {context.get('role')} "
        f"from {context.get('start_date')} to {context.get('end_date')}."
    )
    p.drawCentredString(width / 2, height - 170, body)

    p.setFont("Helvetica", 11)
    p.drawCentredString(width / 2, height - 210, "We wish them all the best for future endeavors.")

    p.setFont("Helvetica", 11)
    p.drawString(50, 120, f"Date: {context.get('date')}")

    p.setFont("Helvetica-Bold", 11)
    p.drawString(width - 220, 90, "Authorized Signatory")

    p.showPage()
    p.save()
    return buf.getvalue()


def build_salary_certificate_pdf(context: Dict[str, Any]) -> bytes:
    p, buf = _base_canvas()
    width, height = A4
    y = height - 60

    p.setFont("Helvetica-Bold", 16)
    p.drawString(50, y, context.get("company_name") or "GREHASOFT")
    y -= 24
    p.setFont("Helvetica", 10)
    p.drawString(50, y, "Salary Certificate")
    y -= 28

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

    y -= 18
    p.setFont("Helvetica-Bold", 11)
    p.drawString(50, y, "Authorized Signatory")

    p.showPage()
    p.save()
    return buf.getvalue()

