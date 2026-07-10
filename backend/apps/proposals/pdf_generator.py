from reportlab.platypus import Frame
import os
import re
import tempfile
from django.conf import settings
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.utils import ImageReader

# ==========================================
# TEMPLATES SPECIFICATION
# ==========================================
TEMPLATES = {
    'corporate': {
        'primary': '#0753F6',
        'secondary': '#6B7280',
        'accent': '#1AB728',
        'font_title': 'Helvetica-Bold',
        'font_body': 'Helvetica',
        'spacing': 15,
        'bg_card': '#f8fafc',
    },
    'modern': {
        'primary': '#0f172a',
        'secondary': '#3b82f6',
        'accent': '#10b981',
        'font_title': 'Helvetica-Bold',
        'font_body': 'Helvetica',
        'spacing': 18,
        'bg_card': '#f1f5f9',
    },
    'enterprise': {
        'primary': '#1e3a8a',
        'secondary': '#3b82f6',
        'accent': '#047857',
        'font_title': 'Helvetica-Bold',
        'font_body': 'Helvetica',
        'spacing': 20,
        'bg_card': '#eff6ff',
    },
    'minimal': {
        'primary': '#000000',
        'secondary': '#4b5563',
        'accent': '#1f2937',
        'font_title': 'Helvetica-Bold',
        'font_body': 'Helvetica',
        'spacing': 12,
        'bg_card': '#ffffff',
    },
    'classic': {
        'primary': '#701a75',
        'secondary': '#a21caf',
        'accent': '#b5179e',
        'font_title': 'Helvetica-Bold',
        'font_body': 'Helvetica',
        'spacing': 16,
        'bg_card': '#fae8ff',
    }
}

# ==========================================
# NUMBERED CANVAS
# ==========================================
class NumberedCanvas(canvas.Canvas):
    """Canvas that computes total pages dynamically and adds branded decorations."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, total_pages):
        # Text headers/footers removed as per user request.
        # Header banner image (invoice_header.png) is handled in draw_background_later.
        pass


# ==========================================
# HTML PARSER HELPER
# ==========================================
def escape_html_except_tags(text):
    if not text:
        return ""
    # Escape special XML/HTML characters
    text = text.replace("&", "&amp;")
    text = text.replace("<", "&lt;")
    text = text.replace(">", "&gt;")
    
    # Restore supported tag elements
    supported_tags = [
        ("b", "b"), ("i", "i"), ("u", "u"),
        ("strong", "b"), ("em", "i"),
        ("p", "p"), ("li", "li"), ("div", "div"),
        ("h1", "h1"), ("h2", "h2"), ("h3", "h3"), ("h4", "h4"), ("h5", "h5"), ("h6", "h6")
    ]
    for tag_name, target in supported_tags:
        text = text.replace(f"&lt;{tag_name}&gt;", f"<{target}>")
        text = text.replace(f"&lt;/{tag_name}&gt;", f"</{target}>")
        text = text.replace(f"&lt;{tag_name} /&gt;", f"<{target}/>")
        text = text.replace(f"&lt;{tag_name}/&gt;", f"<{target}/>")
        
    text = text.replace("&lt;br&gt;", "<br/>")
    text = text.replace("&lt;br/&gt;", "<br/>")
    text = text.replace("&lt;br /&gt;", "<br/>")
    
    return text


def parse_html_to_flowables(html_text, style):
    if not html_text:
        return []
    
    # 1. Escape special characters to prevent SAXParseException, while keeping allowed tags
    text = escape_html_except_tags(html_text.strip())
    
    flowables = []
    
    # 2. Check if there are any paragraph-level HTML tags
    # If not, we can split by newline and render each line as a separate Paragraph
    if not any(tag in text for tag in ['<p>', '<li>', '<div>', '<h1>', '<h2>', '<h3>', '<h4>', '<h5>', '<h6>']):
        blocks = text.split('\n')
        for block in blocks:
            block = block.strip()
            if not block:
                # Add a small spacing for empty lines to preserve spacing
                flowables.append(Spacer(1, 6))
                continue
            try:
                flowables.append(Paragraph(block, style))
            except Exception:
                block_clean = re.sub(r'<[^>]+>', '', block)
                try:
                    flowables.append(Paragraph(block_clean, style))
                except Exception:
                    pass
        return flowables

    # Otherwise, split by HTML paragraph-level tags
    blocks = re.split(r'</?(p|li|div|h1|h2|h3|h4|h5|h6)>\s*', text)
    for block in blocks:
        block = block.strip()
        if not block or block in ['p', 'li', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
            continue
            
        block_clean = re.sub(r'<[^>]+>', '', block)
        if not block_clean.strip():
            continue
            
        try:
            # If the block itself has no tags but has internal newlines, replace them with line breaks
            if '<' not in block:
                block = block.replace('\n', '<br/>')
            flowables.append(Paragraph(block, style))
        except Exception:
            flowables.append(Paragraph(block_clean, style))
            
    return flowables


def draw_background(canvas, doc):
    width, height = doc.pagesize
    watermark_path = os.path.join(settings.MEDIA_ROOT, "grehasoftwatermark.png")
    if not os.path.exists(watermark_path):
        watermark_path = os.path.join(settings.MEDIA_ROOT, "logo", "grehasoftwatermark.png")
    
    print("Watermark path:", watermark_path)
    print("Exists:", os.path.exists(watermark_path))
    print("Drawing watermark...")
    
    if os.path.exists(watermark_path):
        canvas.saveState()
        try:
            canvas.setFillAlpha(0.15)  # 15% opacity
            canvas.setStrokeAlpha(0.15)
        except AttributeError:
            pass
        
        try:
            from PIL import Image as PILImage
            from reportlab.lib.utils import ImageReader
            
            img = PILImage.open(watermark_path)
            img_w, img_h = img.size
            
            # Scale proportionally to fit 65% of the page width
            draw_w = width * 0.65
            scale = draw_w / img_w
            draw_h = img_h * scale
            
            # Double check to prevent vertical overflow (e.g. max 65% height)
            if draw_h > height * 0.65:
                draw_h = height * 0.65
                scale = draw_h / img_h
                draw_w = img_w * scale
            
            # Centered coordinates
            x = (width - draw_w) / 2.0
            y = (height - draw_h) / 2.0
            
            watermark = ImageReader(watermark_path)
            canvas.drawImage(watermark, x, y, width=draw_w, height=draw_h, preserveAspectRatio=True, mask='auto')
        except Exception as e:
            print("Watermark draw error:", e)
        canvas.restoreState()
    else:
        print("Watermark path does not exist!")


def draw_background_later(canvas, doc):
    # 1. Draw watermark (same as cover page)
    draw_background(canvas, doc)
    
    # 2. Draw corporate header banner (Full Page Width)
    width, height = doc.pagesize
    header_path = os.path.join(settings.MEDIA_ROOT, "invoice_header.png")
    if not os.path.exists(header_path):
        header_path = os.path.join(settings.MEDIA_ROOT, "logo", "invoice_header.png")
        
    if os.path.exists(header_path):
        canvas.saveState()
        try:
            from PIL import Image as PILImage
            from reportlab.lib.utils import ImageReader
            
            img = PILImage.open(header_path)
            img_w, img_h = img.size
            
            # Scale proportionally to fit full page width
            draw_w = width
            draw_h = draw_w * (img_h / img_w)
            
            # Position at the absolute top of the page
            x = 0
            y = height - draw_h
            
            header_img = ImageReader(header_path)
            canvas.drawImage(header_img, x, y, width=draw_w, height=draw_h, preserveAspectRatio=True, mask='auto')
        except Exception as e:
            print("Header banner draw error:", e)
        canvas.restoreState()


class ProposalDocTemplate(SimpleDocTemplate):
    """Custom SimpleDocTemplate that adjusts the 'Later' template frame dynamically 
    to clear the corporate header banner, preventing any overlapping."""
    def build(self, flowables, onFirstPage=None, onLaterPages=None, canvasmaker=None):
        self._calc()
        
        # 1. First Page Template (Cover Page margin = 54 pt)
        frame_first = Frame(
            self.leftMargin, self.bottomMargin, 
            self.width, self.height, 
            id='first_frame',
            leftPadding=6, rightPadding=6, topPadding=6, bottomPadding=6
        )
        
        # 2. Later Page Template (Top margin adjusted to clear corporate header banner)
        width, height = self.pagesize
        header_path = os.path.join(settings.MEDIA_ROOT, "invoice_header.png")
        if not os.path.exists(header_path):
            header_path = os.path.join(settings.MEDIA_ROOT, "logo", "invoice_header.png")
            
        banner_h = 78  # default fallback banner height
        if os.path.exists(header_path):
            try:
                from PIL import Image as PILImage
                img = PILImage.open(header_path)
                banner_h = width * (img.size[1] / img.size[0])
            except Exception as e:
                print("Error calculating header aspect ratio:", e)
                
        # Space between banner bottom and page content start: 30 pt
        later_top_margin = banner_h + 30
        
        frame_later = Frame(
            54, 54, width - 108, height - 54 - later_top_margin, 
            id='later_frame',
            leftPadding=6, rightPadding=6, topPadding=6, bottomPadding=6
        )
        
        # Add templates to the document
        from reportlab.platypus import PageTemplate
        self.addPageTemplates([
            PageTemplate(id='First', frames=frame_first, onPage=onFirstPage, pagesize=self.pagesize),
            PageTemplate(id='Later', frames=frame_later, onPage=onLaterPages, pagesize=self.pagesize)
        ])
        
        # Call BaseDocTemplate.build directly to bypass default SimpleDocTemplate build
        from reportlab.platypus import BaseDocTemplate
        BaseDocTemplate.build(self, flowables, canvasmaker=canvasmaker)


# ==========================================
# MAIN GENERATOR CLASS
# ==========================================
class ProposalPDFGenerator:
    def __init__(self, proposal, builder_config=None):
        self.proposal = proposal
        self.builder_config = builder_config or {}
        
        # Extract template parameters
        template_name = self.builder_config.get('template', 'corporate')
        if template_name not in TEMPLATES:
            template_name = 'corporate'
        self.tpl = TEMPLATES[template_name]
        
        # Override theme color if custom colors provided
        custom_colors = self.builder_config.get('colors', {})
        if custom_colors.get('primary'):
            self.tpl['primary'] = custom_colors['primary']
        if custom_colors.get('secondary'):
            self.tpl['secondary'] = custom_colors['secondary']

        # Setup standard styles
        self.styles = getSampleStyleSheet()
        
        self.title_style = ParagraphStyle(
            'PropTitle',
            parent=self.styles['Normal'],
            fontName=self.tpl['font_title'],
            fontSize=28,
            leading=32,
            textColor=colors.HexColor(self.tpl['primary'])
        )
        
        self.heading1_style = ParagraphStyle(
            'PropH1',
            parent=self.styles['Heading1'],
            fontName=self.tpl['font_title'],
            fontSize=22,
            leading=26,
            textColor=colors.HexColor(self.tpl['primary']),
            spaceAfter=12
        )

        self.heading2_style = ParagraphStyle(
            'PropH2',
            parent=self.styles['Heading2'],
            fontName=self.tpl['font_title'],
            fontSize=16,
            leading=20,
            textColor=colors.HexColor(self.tpl['secondary']),
            spaceAfter=8
        )
        
        self.body_style = ParagraphStyle(
            'PropBody',
            parent=self.styles['Normal'],
            fontName=self.tpl['font_body'],
            fontSize=12,
            leading=16,
            textColor=colors.HexColor('#2d3748'),
            spaceAfter=10
        )

        self.meta_style = ParagraphStyle(
            'PropMeta',
            parent=self.body_style,
            fontSize=11,
            leading=15,
            textColor=colors.HexColor('#718096')
        )

        # Custom Cover Page styles
        self.cover_title_style = ParagraphStyle(
            'CoverTitle',
            parent=self.styles['Normal'],
            fontName=self.tpl['font_title'],
            fontSize=44,
            leading=50,
            alignment=1, 
            textColor=colors.HexColor(self.tpl['primary']),
            spaceAfter=30
        )
        
        self.cover_subtitle_style = ParagraphStyle(
            'CoverSubtitle',
            parent=self.styles['Normal'],
            fontName=self.tpl['font_body'],
            fontSize=24,
            leading=28,
            alignment=1,
            textColor=colors.HexColor(self.tpl['secondary']),
            spaceAfter=30
        )
        
        self.meta_label_style = ParagraphStyle(
            'CoverMetaLabel',
            parent=self.styles['Normal'],
            fontName=self.tpl['font_title'],
            fontSize=16,
            leading=20,
            alignment=0, 
            textColor=colors.HexColor('#1F2937'),
            spaceAfter=6
        )
        
        self.meta_content_style = ParagraphStyle(
            'CoverMetaContent',
            parent=self.styles['Normal'],
            fontName=self.tpl['font_body'],
            fontSize=13,
            leading=17,
            alignment=0, 
            textColor=colors.HexColor('#6B7280')
        )

    def draw_cover_page(self):
        story = []
        cover_conf = self.builder_config.get('cover_page', {})
        
        # 1. Logo
        logo_path = os.path.join(settings.MEDIA_ROOT, "grehasoftlogo.png")
        if not os.path.exists(logo_path):
            logo_path = os.path.join(settings.MEDIA_ROOT, "logo", "grehasoftlogo.png")
        try:
            if os.path.exists(logo_path):
                from PIL import Image as PILImage
                from reportlab.platypus import Image
                
                img = PILImage.open(logo_path)
                original_width, original_height = img.size
                
                logo_width = 320 # Target width
                logo_height = logo_width * (original_height / original_width)
                
                logo = Image(logo_path, width=logo_width, height=logo_height)
                logo.hAlign = 'CENTER'
                story.append(logo)
            else:
                story.append(Spacer(1, 60))
        except Exception as e:
            print("Logo drawing error:", e)
            story.append(Spacer(1, 60))

        # 2. Proposal Title and Subtitle (Dynamic)
        cover_title = cover_conf.get('title', '').strip()
        if not cover_title:
            project_title = (self.proposal.title or "").strip()
            # Prevent duplicate "Proposal"
            if project_title.lower().endswith("proposal"):
                cover_title = project_title
            else:
                cover_title = f"{project_title} Proposal"

        # Determine exact colors
        green_color = '#047857'  # Solid forest green
        blue_color = '#0753F6'   # Vibrant royal blue

        title_style = ParagraphStyle(
            'CoverTitleCustom',
            parent=self.cover_title_style,
            textColor=colors.HexColor(green_color)
        )
        story.append(Paragraph(f"<u>{cover_title}</u>", title_style))
        
        # Draw subtitle if enabled
        show_sub = cover_conf.get('showSubtitle', True)
        sub_text = cover_conf.get('subtitle', '').strip()
        if show_sub and sub_text:
            sub_style = ParagraphStyle(
                'CoverSubtitleCustom',
                parent=self.cover_subtitle_style,
                textColor=colors.HexColor(blue_color)
            )
            story.append(Spacer(1, 10))
            story.append(Paragraph(sub_text, sub_style))
            
        story.append(Spacer(1, 60))
        
        # 3. Prepared For / Prepared By left-aligned sequence
        client_name = cover_conf.get('preparedForName', '').strip()
        if not client_name:
            client_name = self.proposal.client.name if self.proposal.client else ((self.proposal.lead.name if self.proposal.lead else None) or "Valued Client")
            
        client_company = cover_conf.get('preparedForCompany', '').strip()
        if not client_company:
            client_company = self.proposal.client.company_name if self.proposal.client else ""
            if not client_company:
                client_company = "Client Company"

        by_company = cover_conf.get('preparedByCompany', '').strip() or "Grehasoft Smart IT Solutions"
        by_address = cover_conf.get('preparedByAddress', '').strip() or "Kochi, Kerala"
        by_email = cover_conf.get('preparedByEmail', '').strip() or "info@grehasoft.com"
        by_website = cover_conf.get('preparedByWebsite', '').strip() or "www.grehasoft.com"

        doc_date = cover_conf.get('proposalDate', '').strip()
        if not doc_date:
            import datetime
            doc_date = datetime.date.today().strftime("%d-%m-%Y")
            
        place = cover_conf.get('place', '').strip() or "Kochi"

        lbl_style = ParagraphStyle(
            'CoverLblBlack',
            parent=self.meta_label_style,
            alignment=0, # Left-aligned
            textColor=colors.HexColor('#1F2937'),
            spaceAfter=4
        )
        content_blue_style = ParagraphStyle(
            'CoverContentBlue',
            parent=self.meta_content_style,
            alignment=0, # Left-aligned
            textColor=colors.HexColor(blue_color),
            spaceAfter=20
        )
        content_green_style = ParagraphStyle(
            'CoverContentGreen',
            parent=self.meta_content_style,
            alignment=0, # Left-aligned
            textColor=colors.HexColor(green_color),
            spaceAfter=25
        )

        # Prepared For
        story.append(Paragraph("<u>Prepared For:</u>", lbl_style))
        prepared_for_text = f"<b>{client_company}</b><br/>{client_name}" if client_name != client_company else f"<b>{client_company}</b>"
        if client_name.lower() in client_company.lower():
            prepared_for_text = f"<b>{client_company}</b>"
        story.append(Paragraph(prepared_for_text, content_blue_style))
        
        # Prepared By
        story.append(Paragraph("<u>Prepared By:</u>", lbl_style))
        by_details = f"<b>{by_company}</b>,<br/>{by_address}.<br/>Website: {by_website}<br/>Email: {by_email}"
        story.append(Paragraph(by_details, content_green_style))
        
        # Date & Place (no proposal ID, prefixes in black, values in blue)
        date_place_style = ParagraphStyle(
            'CoverDatePlace',
            parent=self.meta_content_style,
            alignment=0, # Left-aligned
            textColor=colors.HexColor('#1F2937'),
            spaceAfter=4
        )
        story.append(Paragraph(f"<b>DATE:</b> <font color='{blue_color}'>{doc_date}</font>", date_place_style))
        story.append(Paragraph(f"<b>PLACE:</b> <font color='{blue_color}'>{place}</font>", date_place_style))

        return story
 
    def draw_cover_letter(self):
        story = []
        
        letter_content = self.builder_config.get('cover_letter', "")
        if not letter_content:
            # Fallback
            letter_content = (
                "<p>Dear Sir,</p>"
                "<p>Thank you for considering GrehaSoft for your software development needs. As discussed, we are pleased to submit a proposal for your consideration.</p>"
                "<p>At GrehaSoft, we prioritize client satisfaction, delivering modern, secure, and SEO friendly solutions designed for scalability.</p>"
                "<p>Best regards,</p>"
                "<p><b>Grehasoft Smart IT Solutions</b></p>"
            )
            
        story.extend(parse_html_to_flowables(letter_content, self.body_style))
        return story

    def draw_company_profile(self):
        story = []
        story.append(Paragraph("Company Profile", self.heading1_style))
        story.append(Spacer(1, 10))
        
        profile_content = self.builder_config.get('company_profile', "")
        if not profile_content:
            profile_content = (
                "<p>Grehasoft Smart IT Solutions is an enterprise software development agency based in Kochi, Infopark. "
                "We provide comprehensive mobile app, web application, branding, and digital marketing services to clients worldwide.</p>"
                "<p>Our dedicated team of professionals strives to build scalable solutions using state-of-the-art frameworks.</p>"
            )
            
        story.extend(parse_html_to_flowables(profile_content, self.body_style))
        return story

    def draw_project_overview(self):
        story = []
        story.append(Paragraph("Project Overview", self.heading1_style))
        story.append(Spacer(1, 10))
        
        overview_content = self.builder_config.get('project_overview', self.proposal.project_overview)
        if not overview_content:
            overview_content = "<p>Provide a brief outline of the project objectives and scope here.</p>"
            
        story.extend(parse_html_to_flowables(overview_content, self.body_style))
        return story

    def draw_scope_of_work(self):
        story = []
        story.append(Paragraph("Scope of Work", self.heading1_style))
        story.append(Spacer(1, 10))
        
        scope_content = self.builder_config.get('scope_of_work', self.proposal.description)
        if not scope_content:
            scope_content = "<p>Outline the features, architecture, and constraints of the work to be completed here.</p>"
            
        story.extend(parse_html_to_flowables(scope_content, self.body_style))
        return story

    def draw_features(self):
        story = []
        story.append(Paragraph("Key Features & Security", self.heading1_style))
        story.append(Spacer(1, 10))
        
        features_list = self.builder_config.get('features', [])
        if not features_list:
            features_list = [
                {"title": "Device Independence", "desc": "Fully responsive layouts suitable for desktops, tablets, and mobiles."},
                {"title": "SEO Friendliness", "desc": "Pre-configured SEO URLs, meta fields, and Google Search Console tags."},
                {"title": "Security & Encryption", "desc": "Pre-coded SSL certificate integration and encrypted user credentials."}
            ]
            
        for f in features_list:
            card_story = []
            f_title = escape_html_except_tags(f.get('title', ''))
            f_desc = escape_html_except_tags(f.get('desc', ''))
            card_story.append(Paragraph(f"<b>{f_title}</b>", self.heading2_style))
            card_story.append(Paragraph(f_desc, self.body_style))
            
            # Draw as a rounded card table
            card_table = Table([[card_story]], colWidths=[480])
            card_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor(self.tpl['bg_card'])),
                ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#e2e8f0')),
                ('TOPPADDING', (0,0), (-1,-1), 10),
                ('BOTTOMPADDING', (0,0), (-1,-1), 10),
                ('LEFTPADDING', (0,0), (-1,-1), 12),
                ('RIGHTPADDING', (0,0), (-1,-1), 12),
            ]))
            story.append(card_table)
            story.append(Spacer(1, 8))
            
        return story

    def draw_deliverables(self):
        story = []
        story.append(Paragraph("Project Deliverables & Milestones", self.heading1_style))
        story.append(Spacer(1, 10))
        
        delivs = self.builder_config.get('deliverables', [])
        if not delivs:
            delivs = [
                {"phase": "Phase 1: Wireframes", "timeline": "Week 1", "details": "Initial layout mockups, user flow, and design review."},
                {"phase": "Phase 2: Core Development", "timeline": "Week 2-3", "details": "Frontend UI elements, backend database, and REST APIs."},
                {"phase": "Phase 3: UAT & Launch", "timeline": "Week 4", "details": "Unit testing, client acceptance testing, server deployment."}
            ]
            
        table_data = [["Phase / Milestone", "Timeline", "Deliverables / Details"]]
        for d in delivs:
            d_phase = escape_html_except_tags(d.get('phase', ''))
            d_timeline = escape_html_except_tags(d.get('timeline', ''))
            d_details = escape_html_except_tags(d.get('details', ''))
            table_data.append([
                Paragraph(f"<b>{d_phase}</b>", self.body_style),
                Paragraph(d_timeline, self.body_style),
                Paragraph(d_details, self.body_style)
            ])
            
        delivs_table = Table(table_data, colWidths=[120, 80, 280])
        delivs_table.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor(self.tpl['primary'])),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), self.tpl['font_title']),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('TOPPADDING', (0,0), (-1,-1), 6),
        ]))
        
        story.append(delivs_table)
        return story

    def draw_timeline(self):
        story = []
        story.append(Paragraph("Implementation Timeline", self.heading1_style))
        story.append(Spacer(1, 10))
        
        timeline_text = self.builder_config.get('timeline', "")
        if not timeline_text:
            timeline_text = (
                "<p>The estimated delivery timeline is 4-6 weeks upon contract signoff and advance payment. "
                "Any change in scope may affect this estimate.</p>"
            )
            
        story.extend(parse_html_to_flowables(timeline_text, self.body_style))
        return story

    def draw_pricing(self):
        story = []
        story.append(Paragraph("Financial Investment", self.heading1_style))
        story.append(Spacer(1, 10))
        
        pricing_data = [["Service Item", "Description", "Cost (INR)"]]
        
        pricing_conf = self.builder_config.get('pricing', {})
        custom_items = pricing_conf.get('items', [])
        
        subtotal = float(pricing_conf.get('subtotal', self.proposal.subtotal or 0))
        discount = float(pricing_conf.get('discount', self.proposal.discount or 0))
        grand_total = float(pricing_conf.get('amount', self.proposal.amount or 0))
        
        if custom_items:
            for item in custom_items:
                cost_val = float(item.get('cost', 0))
                service_val = escape_html_except_tags(item.get('service', 'Service'))
                desc_val = escape_html_except_tags(item.get('description') or "-")
                pricing_data.append([
                    Paragraph(f"<b>{service_val}</b>", self.body_style),
                    Paragraph(desc_val, self.body_style),
                    f"Rs {cost_val:,.2f}"
                ])
        else:
            for item in self.proposal.items.all():
                service_val = escape_html_except_tags(item.service)
                desc_val = escape_html_except_tags(item.description or "-")
                pricing_data.append([
                    Paragraph(f"<b>{service_val}</b>", self.body_style),
                    Paragraph(desc_val, self.body_style),
                    f"Rs {float(item.cost):,.2f}"
                ])
                
        if not custom_items and len(self.proposal.items.all()) == 0:
            title_val = escape_html_except_tags(self.proposal.title)
            pricing_data.append([
                Paragraph(f"<b>{title_val}</b>", self.body_style),
                Paragraph("Professional development services", self.body_style),
                f"Rs {grand_total:,.2f}"
            ])
            
        pricing_data.append(["", "Subtotal", f"Rs {subtotal:,.2f}"])
        pricing_data.append(["", "Discount", f"Rs {discount:,.2f}"])
        pricing_data.append(["", "Grand Total", f"Rs {grand_total:,.2f}"])
        
        pricing_table = Table(pricing_data, colWidths=[150, 230, 100])
        pricing_table.setStyle(TableStyle([
            ('GRID', (0,0), (-1, -4), 0.5, colors.HexColor('#cbd5e1')),
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor(self.tpl['primary'])),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), self.tpl['font_title']),
            ('ALIGN', (2, 1), (2, -1), 'RIGHT'),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('FONTNAME', (1, -3), (2, -1), self.tpl['font_title']),
            ('BACKGROUND', (1, -1), (2, -1), colors.HexColor(self.tpl['bg_card'])),
            ('BOX', (1, -1), (2, -1), 1, colors.HexColor(self.tpl['primary'])),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
            ('TOPPADDING', (0,0), (-1,-1), 8),
        ]))
        
        story.append(pricing_table)
        return story
 
    def draw_payment_terms(self):
        story = []
        story.append(Paragraph("Payment Terms & Schedule", self.heading1_style))
        story.append(Spacer(1, 10))
        
        schedule = self.builder_config.get('payment_terms', {})
        adv = schedule.get('advance', 50)
        dev = schedule.get('development', 30)
        dep = schedule.get('deployment', 20)
        
        story.append(Paragraph(
            f"The payment for the project is scheduled as follows:<br/>"
            f"• <b>{adv}% Advance:</b> payable immediately to kick off the development.<br/>"
            f"• <b>{dev}% Development Milestone:</b> payable upon completion of core modules.<br/>"
            f"• <b>{dep}% Final Deployment:</b> payable prior to launching the production workspace.",
            self.body_style
        ))
        
        return story
 
    def draw_why_choose_us(self):
        story = []
        story.append(Paragraph("Why Choose Grehasoft", self.heading1_style))
        story.append(Spacer(1, 10))
        
        why_content = self.builder_config.get('why_choose_us', "")
        if not why_content:
            why_content = (
                "<p>• <b>Experienced Team:</b> Senior engineers with expertise in modern frameworks.</p>"
                "<p>• <b>SEO Centric Coding:</b> Fast loading speeds and standards-compliant markups.</p>"
                "<p>• <b>Pixel-Perfect UIs:</b> Premium design aesthetics that reflect your brand identity.</p>"
                "<p>• <b>Post-launch Support:</b> Dedicated support windows for seamless maintenance.</p>"
            )
            
        story.extend(parse_html_to_flowables(why_content, self.body_style))
        return story
 
    def draw_terms_conditions(self):
        story = []
        story.append(Paragraph("Terms & Conditions", self.heading1_style))
        story.append(Spacer(1, 10))
        
        terms_content = self.builder_config.get('terms_conditions', "")
        if not terms_content:
            terms_content = (
                "<p>1. <b>Validity:</b> This proposal remains valid for 30 days from issuance.</p>"
                "<p>2. <b>Scope Change:</b> Features outside this specification will require a scope change request.</p>"
                "<p>3. <b>Support:</b> Support is provided on business days between 9:00 AM and 6:00 PM IST.</p>"
                "<p>4. <b>IP Ownership:</b> Intellectual property rights transfer upon final balance clearance.</p>"
            )
            
        story.extend(parse_html_to_flowables(terms_content, self.body_style))
        return story
 
    def draw_thank_you(self):
        story = []
        story.append(Spacer(1, 20))
        
        thanks_config = self.builder_config.get('thank_you', {})
        message = escape_html_except_tags(thanks_config.get('message', "For any queries or clarifications, please feel free to contact us."))
        
        # 1. Message block (italicized/styled like the image)
        msg_style = ParagraphStyle(
            'ThankYouMessage',
            parent=self.body_style,
            fontName=f"{self.tpl['font_title']}" if 'Bold' in self.tpl['font_title'] else f"{self.tpl['font_title']}-Bold",
            fontSize=10,
            leading=14
        )
        story.append(Paragraph(message, msg_style))
        story.append(Spacer(1, 15))
        
        # 2. "WISHING YOU A GREAT DAY!!" heading in accent/primary color
        wish_style = ParagraphStyle(
            'WishHeading',
            parent=self.heading1_style,
            textColor=colors.HexColor(self.tpl['primary'])
        )
        story.append(Paragraph("WISHING YOU A GREAT DAY!!", wish_style))
        story.append(Spacer(1, 25))
        
        # 3. Signature & Contact grid
        rep_name = escape_html_except_tags(thanks_config.get('rep_name', 'Raji T. Skariah'))
        rep_phone = escape_html_except_tags(thanks_config.get('rep_phone', '+91 89215 40183 | +91 98954 80145'))
        rep_email = escape_html_except_tags(thanks_config.get('rep_email', 'info@grehasoft.com | grehasoft@gmail.com'))
        
        cover_conf = self.builder_config.get('cover_page', {})
        place = escape_html_except_tags(cover_conf.get('place', '').strip() or "Kochi")
        doc_date = escape_html_except_tags(cover_conf.get('proposalDate', '').strip())
        if not doc_date:
            import datetime
            doc_date = datetime.date.today().strftime("%d-%m-%Y")
            
        left_text = f"{rep_name}<br/>{rep_phone}<br/>{rep_email}"
        right_text = f"{place}<br/>{doc_date}"
        
        col_style = ParagraphStyle(
            'ThankYouColumn',
            parent=self.body_style,
            fontSize=10,
            leading=14
        )
        right_align_style = ParagraphStyle(
            'ThankYouColumnRight',
            parent=col_style,
            alignment=2 # Right aligned
        )
        
        thanks_table = Table([[
            Paragraph(left_text, col_style),
            Paragraph(right_text, right_align_style)
        ]], colWidths=[300, 180])
        
        thanks_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
            ('TOPPADDING', (0,0), (-1,-1), 0),
        ]))
        
        story.append(thanks_table)
        return story

    def generate_pdf(self):
        """Compiles the enabled and ordered sections into a single PDF blob."""
        tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        
        # Setup Page Geometry (A4 margins = 0.75 inch / 54 pt)
        doc = ProposalDocTemplate(
            tmp_file.name,
            pagesize=A4,
            leftMargin=54,
            rightMargin=54,
            topMargin=54,
            bottomMargin=54
        )
        
        story = []
        
        # Read the section execution order
        sections = self.builder_config.get('sections', [
            "cover",
            "cover_letter",
            "company_profile",
            "project_overview",
            "scope",
            "features",
            "deliverables",
            "pricing",
            "payment_terms",
            "why_us",
            "terms",
            "thank_you"
        ])
        
        # Render sections in order
        for section_id in sections:
            # Map section_id to their draw function
            section_story = []
            if section_id == "cover":
                section_story = self.draw_cover_page()
            elif section_id == "cover_letter":
                section_story = self.draw_cover_letter()
            elif section_id == "company_profile":
                section_story = self.draw_company_profile()
            elif section_id == "overview" or section_id == "project_overview":
                section_story = self.draw_project_overview()
            elif section_id == "scope" or section_id == "scope_of_work":
                section_story = self.draw_scope_of_work()
            elif section_id == "features":
                section_story = self.draw_features()
            elif section_id == "deliverables":
                section_story = self.draw_deliverables()
            elif section_id == "timeline":
                section_story = self.draw_timeline()
            elif section_id == "pricing":
                section_story = self.draw_pricing()
            elif section_id == "payment_terms":
                section_story = self.draw_payment_terms()
            elif section_id == "why_us" or section_id == "why_choose_us":
                section_story = self.draw_why_choose_us()
            elif section_id == "terms" or section_id == "terms_conditions":
                section_story = self.draw_terms_conditions()
            elif section_id == "thank_you":
                section_story = self.draw_thank_you()
                
            if section_story:
                story.extend(section_story)
                
                # Append page break after major sections (except the final thank you)
                if section_id != "thank_you" and section_id != sections[-1]:
                    story.append(PageBreak())
                    
        # Compile document using NumberedCanvas and draw callbacks
        doc.build(
            story, 
            onFirstPage=draw_background, 
            onLaterPages=draw_background_later, 
            canvasmaker=NumberedCanvas
        )
        
        return tmp_file.name
