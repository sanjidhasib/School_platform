"""
SchoolOS Documentation Generator
Generates a comprehensive Word (.docx) document for SchoolOS using python-docx.
"""

from docx import Document
from docx.shared import Pt, RGBColor, Inches, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
from docx.enum.section import WD_SECTION
import copy

# ─── Color Palette ────────────────────────────────────────────────────────────
PRIMARY   = RGBColor(0x1A, 0x3C, 0x5E)   # Dark navy blue
ACCENT    = RGBColor(0x2E, 0x86, 0xC1)   # Medium blue
WHITE     = RGBColor(0xFF, 0xFF, 0xFF)
LIGHT_GRAY= RGBColor(0xF2, 0xF2, 0xF2)
MID_GRAY  = RGBColor(0xD0, 0xD8, 0xE4)
DARK_GRAY = RGBColor(0x44, 0x44, 0x44)
TABLE_HDR = RGBColor(0x1A, 0x3C, 0x5E)
TABLE_ALT = RGBColor(0xEA, 0xF2, 0xFB)

# ─── Helpers ──────────────────────────────────────────────────────────────────

def set_cell_bg(cell, hex_color: str):
    """Set cell background color via XML shading."""
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), hex_color)
    # Remove existing shd if present
    for existing in tcPr.findall(qn('w:shd')):
        tcPr.remove(existing)
    tcPr.append(shd)


def set_para_bg(para, hex_color: str):
    """Set paragraph background (highlight) via pPr shading – used for code blocks."""
    pPr = para._p.get_or_add_pPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), hex_color)
    for existing in pPr.findall(qn('w:shd')):
        pPr.remove(existing)
    pPr.append(shd)


def set_cell_borders(cell, color="AAAAAA", sz="4"):
    """Add thin borders to a table cell."""
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    for side in ['top', 'left', 'bottom', 'right']:
        border = OxmlElement(f'w:{side}')
        border.set(qn('w:val'), 'single')
        border.set(qn('w:sz'), sz)
        border.set(qn('w:space'), '0')
        border.set(qn('w:color'), color)
        tcBorders.append(border)
    for existing in tcPr.findall(qn('w:tcBorders')):
        tcPr.remove(existing)
    tcPr.append(tcBorders)


def add_page_break(doc):
    para = doc.add_paragraph()
    run = para.add_run()
    run.add_break(docx_break_type_page())
    return para


def docx_break_type_page():
    from docx.oxml import OxmlElement
    from docx.oxml.ns import qn
    br = OxmlElement('w:br')
    br.set(qn('w:type'), 'page')
    return br


def add_explicit_page_break(doc):
    """Add a page break paragraph."""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    run = p.add_run()
    br = OxmlElement('w:br')
    br.set(qn('w:type'), 'page')
    run._r.append(br)
    return p


def style_heading(para, level=1):
    """Apply primary color and formatting to heading paragraphs."""
    for run in para.runs:
        run.font.color.rgb = PRIMARY
        if level == 1:
            run.font.size = Pt(18)
            run.font.bold = True
        elif level == 2:
            run.font.size = Pt(14)
            run.font.bold = True
            run.font.color.rgb = ACCENT
        elif level == 3:
            run.font.size = Pt(12)
            run.font.bold = True
            run.font.color.rgb = PRIMARY


def add_h1(doc, text):
    para = doc.add_heading(text, level=1)
    style_heading(para, 1)
    para.paragraph_format.space_before = Pt(18)
    para.paragraph_format.space_after = Pt(6)
    return para


def add_h2(doc, text):
    para = doc.add_heading(text, level=2)
    style_heading(para, 2)
    para.paragraph_format.space_before = Pt(14)
    para.paragraph_format.space_after = Pt(4)
    return para


def add_h3(doc, text):
    para = doc.add_heading(text, level=3)
    style_heading(para, 3)
    para.paragraph_format.space_before = Pt(10)
    para.paragraph_format.space_after = Pt(3)
    return para


def add_body(doc, text, bold_parts=None):
    """Add a body paragraph with optional inline bold segments."""
    para = doc.add_paragraph()
    para.paragraph_format.space_after = Pt(8)
    para.paragraph_format.space_before = Pt(2)
    para.paragraph_format.line_spacing_rule = WD_LINE_SPACING.ONE_POINT_FIVE
    if bold_parts:
        # bold_parts is list of (text, bold) tuples
        for segment, is_bold in bold_parts:
            run = para.add_run(segment)
            run.font.bold = is_bold
            run.font.size = Pt(11)
            run.font.color.rgb = DARK_GRAY
    else:
        run = para.add_run(text)
        run.font.size = Pt(11)
        run.font.color.rgb = DARK_GRAY
    return para


def add_bullet(doc, text, bold_label=None):
    """Add a bullet list paragraph with optional bold label."""
    para = doc.add_paragraph(style='List Bullet')
    para.paragraph_format.space_after = Pt(4)
    para.paragraph_format.left_indent = Inches(0.3)
    if bold_label:
        run_b = para.add_run(bold_label)
        run_b.font.bold = True
        run_b.font.size = Pt(11)
        run_b.font.color.rgb = PRIMARY
        run_n = para.add_run(text)
        run_n.font.size = Pt(11)
        run_n.font.color.rgb = DARK_GRAY
    else:
        run = para.add_run(text)
        run.font.size = Pt(11)
        run.font.color.rgb = DARK_GRAY
    return para


def add_code_block(doc, code_text):
    """Add a monospace code block with light gray background."""
    lines = code_text.strip('\n').split('\n')
    for line in lines:
        para = doc.add_paragraph()
        para.paragraph_format.space_before = Pt(0)
        para.paragraph_format.space_after = Pt(0)
        para.paragraph_format.left_indent = Inches(0.25)
        para.paragraph_format.right_indent = Inches(0.25)
        set_para_bg(para, 'F0F0F0')
        run = para.add_run(line if line else ' ')
        run.font.name = 'Courier New'
        run.font.size = Pt(8)
        run.font.color.rgb = RGBColor(0x20, 0x20, 0x20)
    # Add small spacing after block
    spacer = doc.add_paragraph()
    spacer.paragraph_format.space_before = Pt(0)
    spacer.paragraph_format.space_after = Pt(6)
    return


def add_header_footer(doc, section):
    """Add custom header and footer with page numbers."""
    # Header
    header = section.header
    header.is_linked_to_previous = False
    htable = header.add_table(1, 2, width=Inches(6.5))
    htable.alignment = WD_TABLE_ALIGNMENT.CENTER
    # Left cell - logo/brand
    left_cell = htable.cell(0, 0)
    left_para = left_cell.paragraphs[0]
    left_run = left_para.add_run("SchoolOS")
    left_run.font.bold = True
    left_run.font.color.rgb = PRIMARY
    left_run.font.size = Pt(10)
    left_para.alignment = WD_ALIGN_PARAGRAPH.LEFT
    # Right cell - section title
    right_cell = htable.cell(0, 1)
    right_para = right_cell.paragraphs[0]
    right_run = right_para.add_run("SchoolOS — Technical Documentation")
    right_run.font.color.rgb = ACCENT
    right_run.font.size = Pt(9)
    right_para.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    # Remove table borders
    for row in htable.rows:
        for cell in row.cells:
            set_cell_borders(cell, color="FFFFFF", sz="0")

    # Footer with page numbers
    footer = section.footer
    footer.is_linked_to_previous = False
    fpara = footer.paragraphs[0]
    fpara.alignment = WD_ALIGN_PARAGRAPH.CENTER
    fpara.paragraph_format.space_before = Pt(4)

    # Add separator line
    pPr = fpara._p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    top = OxmlElement('w:top')
    top.set(qn('w:val'), 'single')
    top.set(qn('w:sz'), '4')
    top.set(qn('w:space'), '1')
    top.set(qn('w:color'), '1A3C5E')
    pBdr.append(top)
    pPr.append(pBdr)

    left_run = fpara.add_run("SchoolOS v1.0.0  |  October 2026  |  Page ")
    left_run.font.size = Pt(9)
    left_run.font.color.rgb = ACCENT

    # Page number field
    fldChar1 = OxmlElement('w:fldChar')
    fldChar1.set(qn('w:fldCharType'), 'begin')
    instrText = OxmlElement('w:instrText')
    instrText.text = 'PAGE'
    fldChar2 = OxmlElement('w:fldChar')
    fldChar2.set(qn('w:fldCharType'), 'end')

    run_pg = fpara.add_run()
    run_pg._r.append(fldChar1)
    run_pg._r.append(instrText)
    run_pg._r.append(fldChar2)
    run_pg.font.size = Pt(9)
    run_pg.font.color.rgb = PRIMARY
    run_pg.font.bold = True

    right_run = fpara.add_run(" of ")
    right_run.font.size = Pt(9)
    right_run.font.color.rgb = ACCENT

    fldChar3 = OxmlElement('w:fldChar')
    fldChar3.set(qn('w:fldCharType'), 'begin')
    instrText2 = OxmlElement('w:instrText')
    instrText2.text = 'NUMPAGES'
    fldChar4 = OxmlElement('w:fldChar')
    fldChar4.set(qn('w:fldCharType'), 'end')
    run_pg2 = fpara.add_run()
    run_pg2._r.append(fldChar3)
    run_pg2._r.append(instrText2)
    run_pg2._r.append(fldChar4)
    run_pg2.font.size = Pt(9)
    run_pg2.font.color.rgb = PRIMARY
    run_pg2.font.bold = True


def add_rbac_table(doc):
    """Add the RBAC capabilities matrix table."""
    headers = ["Permission", "Super Admin", "Inst. Admin", "Teacher", "Student", "Parent"]
    rows = [
        ["Manage Institutions",          "✓", "✗", "✗", "✗", "✗"],
        ["Manage Users",                 "✓", "✓", "✗", "✗", "✗"],
        ["Create/Edit Classes",          "✓", "✓", "✗", "✗", "✗"],
        ["Take/Edit Attendance",         "✓", "✓", "✓", "✗", "✗"],
        ["Enter Grades",                 "✓", "✓", "✓", "✗", "✗"],
        ["View Own Grades/Attendance",   "✗", "✗", "✗", "✓", "✓"],
        ["Send Announcements",           "✓", "✓", "✓", "✗", "✗"],
        ["View AI Reports",              "✓", "✓", "✓", "✗", "✗"],
        ["View Child's Reports",         "✗", "✗", "✗", "✗", "✓"],
    ]
    col_widths = [Inches(2.4), Inches(0.85), Inches(0.85), Inches(0.75), Inches(0.75), Inches(0.75)]
    table = doc.add_table(rows=1 + len(rows), cols=6)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = 'Table Grid'

    # Header row
    hdr_row = table.rows[0]
    for i, hdr in enumerate(headers):
        cell = hdr_row.cells[i]
        cell.width = col_widths[i]
        set_cell_bg(cell, '1A3C5E')
        set_cell_borders(cell, color='FFFFFF', sz='4')
        para = cell.paragraphs[0]
        para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = para.add_run(hdr)
        run.font.bold = True
        run.font.color.rgb = WHITE
        run.font.size = Pt(9)

    # Data rows
    for r_idx, row_data in enumerate(rows):
        row = table.rows[r_idx + 1]
        bg = 'EAF2FB' if r_idx % 2 == 0 else 'FFFFFF'
        for c_idx, cell_text in enumerate(row_data):
            cell = row.cells[c_idx]
            cell.width = col_widths[c_idx]
            set_cell_bg(cell, bg)
            set_cell_borders(cell, color='D0D8E4', sz='4')
            para = cell.paragraphs[0]
            para.alignment = WD_ALIGN_PARAGRAPH.CENTER if c_idx > 0 else WD_ALIGN_PARAGRAPH.LEFT
            run = para.add_run(cell_text)
            run.font.size = Pt(9)
            if c_idx == 0:
                run.font.bold = True
                run.font.color.rgb = PRIMARY
            elif cell_text == "✓":
                run.font.color.rgb = RGBColor(0x1A, 0x7A, 0x3C)
                run.font.bold = True
            else:
                run.font.color.rgb = RGBColor(0xAA, 0xAA, 0xAA)


def add_efficiency_table(doc):
    """Add the operational efficiency metrics table."""
    headers = ["Metric", "Before SchoolOS", "After SchoolOS", "Efficiency Gain"]
    rows = [
        ["Daily Attendance Processing",    "30-45 min (manual registers)", "< 2 min (bulk digital marking)", "~95% time reduction"],
        ["Report Card Generation",         "3-5 days (manual writing)",    "< 2 hours (auto-generated)",    "~98% time reduction"],
        ["Parent Communication (per event)","1-2 days (circulars/calls)",  "< 5 seconds (broadcast push)",  "~99.9% time reduction"],
        ["Grade Entry & GPA Calculation",  "2-3 hours per term (manual)",  "Real-time (auto-calculated)",   "~100% automation"],
        ["Administrative Paper Cost",      "Significant annual spend",     "Near-zero (digital-first)",     "~90% cost reduction"],
        ["Data Retrieval (student records)","Hours (physical file search)", "Milliseconds (indexed search)", ">99.9% improvement"],
    ]
    col_widths = [Inches(1.8), Inches(1.6), Inches(1.6), Inches(1.5)]
    table = doc.add_table(rows=1 + len(rows), cols=4)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = 'Table Grid'

    # Header row
    hdr_row = table.rows[0]
    for i, hdr in enumerate(headers):
        cell = hdr_row.cells[i]
        cell.width = col_widths[i]
        set_cell_bg(cell, '1A3C5E')
        set_cell_borders(cell, color='FFFFFF', sz='4')
        para = cell.paragraphs[0]
        para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = para.add_run(hdr)
        run.font.bold = True
        run.font.color.rgb = WHITE
        run.font.size = Pt(9)

    # Data rows
    for r_idx, row_data in enumerate(rows):
        row = table.rows[r_idx + 1]
        bg = 'EAF2FB' if r_idx % 2 == 0 else 'FFFFFF'
        for c_idx, cell_text in enumerate(row_data):
            cell = row.cells[c_idx]
            cell.width = col_widths[c_idx]
            set_cell_bg(cell, bg)
            set_cell_borders(cell, color='D0D8E4', sz='4')
            para = cell.paragraphs[0]
            para.alignment = WD_ALIGN_PARAGRAPH.LEFT
            run = para.add_run(cell_text)
            run.font.size = Pt(9)
            if c_idx == 0:
                run.font.bold = True
                run.font.color.rgb = PRIMARY
            elif c_idx == 3:
                run.font.color.rgb = RGBColor(0x1A, 0x7A, 0x3C)
                run.font.bold = True
            else:
                run.font.color.rgb = DARK_GRAY


def build_cover_page(doc):
    """Build a professional cover page."""
    section = doc.sections[0]
    section.different_first_page_header_footer = True
    # Blank first-page header/footer (no page number on cover)
    first_header = section.first_page_header
    first_header.paragraphs[0].clear()
    first_footer = section.first_page_footer
    first_footer.paragraphs[0].clear()

    # Top spacer
    for _ in range(5):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)

    # Title
    title_para = doc.add_paragraph()
    title_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_para.paragraph_format.space_before = Pt(0)
    title_para.paragraph_format.space_after = Pt(8)
    title_run = title_para.add_run("SchoolOS")
    title_run.font.size = Pt(40)
    title_run.font.bold = True
    title_run.font.color.rgb = PRIMARY

    tagline_para = doc.add_paragraph()
    tagline_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    tagline_para.paragraph_format.space_before = Pt(0)
    tagline_para.paragraph_format.space_after = Pt(4)
    tagline_run = tagline_para.add_run("The Operating System for Modern Education")
    tagline_run.font.size = Pt(18)
    tagline_run.font.bold = False
    tagline_run.font.color.rgb = ACCENT

    # Horizontal rule via border
    rule_para = doc.add_paragraph()
    rule_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    rule_para.paragraph_format.space_before = Pt(10)
    rule_para.paragraph_format.space_after = Pt(10)
    pPr = rule_para._p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    bottom = OxmlElement('w:bottom')
    bottom.set(qn('w:val'), 'single')
    bottom.set(qn('w:sz'), '12')
    bottom.set(qn('w:space'), '1')
    bottom.set(qn('w:color'), '1A3C5E')
    pBdr.append(bottom)
    pPr.append(pBdr)

    # Subtitle
    sub_para = doc.add_paragraph()
    sub_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sub_para.paragraph_format.space_before = Pt(6)
    sub_para.paragraph_format.space_after = Pt(6)
    sub_run = sub_para.add_run("Comprehensive Technical Architecture & Strategic Product Documentation")
    sub_run.font.size = Pt(13)
    sub_run.font.bold = False
    sub_run.font.color.rgb = DARK_GRAY

    for _ in range(4):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)

    # Metadata block
    meta_items = [
        ("Version:", "1.0.0"),
        ("Classification:", "Internal Engineering & Executive Overview"),
        ("Date:", "October 2026"),
        ("Platform:", "SchoolOS — AI-Integrated Educational Management System"),
    ]
    for label, value in meta_items:
        meta_para = doc.add_paragraph()
        meta_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        meta_para.paragraph_format.space_before = Pt(2)
        meta_para.paragraph_format.space_after = Pt(2)
        run_l = meta_para.add_run(f"{label}  ")
        run_l.font.bold = True
        run_l.font.size = Pt(11)
        run_l.font.color.rgb = PRIMARY
        run_v = meta_para.add_run(value)
        run_v.font.size = Pt(11)
        run_v.font.color.rgb = DARK_GRAY


def build_toc(doc):
    """Add a Table of Contents placeholder."""
    add_h1(doc, "Table of Contents")
    toc_entries = [
        ("1.", "Project Origin & Vision", "3"),
        ("1.1", "The Ideation & Problem Statement", "3"),
        ("1.2", "Project Inception & Timeline", "4"),
        ("2.", "Software Development Lifecycle & Version Control", "5"),
        ("2.1", "SDLC Methodology — Agile / Iterative Model", "5"),
        ("2.2", "Version Control & GitHub Workflow", "6"),
        ("3.", "Full System Architecture & System Flow Diagrams", "8"),
        ("3.1", "Architectural Paradigm", "8"),
        ("3.2", "System Architecture Diagram", "9"),
        ("3.3", "Request-Response Lifecycle Flowchart", "10"),
        ("3.4", "Data Flow Diagram — User Authentication", "11"),
        ("4.", "Featural & System Breakdown", "12"),
        ("4.1", "Authentication & Role-Based Access Control (RBAC)", "12"),
        ("4.2", "Academic & Administrative Management", "14"),
        ("4.3", "Communication & Notification Hub", "16"),
        ("4.4", "AI Integrations & Smart Features", "17"),
        ("5.", "Technical Stack Rationale & Implementation", "19"),
        ("5.1", "Frontend Layer — Next.js 14+ with React & Tailwind CSS", "19"),
        ("5.2", "Backend Layer — Node.js with Express.js", "20"),
        ("5.3", "Database Layer — MongoDB with Mongoose ODM", "22"),
        ("5.4", "Security & Utility Tools", "24"),
        ("6.", "Socio-Economic Impact & Nation-Wide Utility", "26"),
        ("6.1", "Digital Transformation of Education", "26"),
        ("6.2", "Operational Efficiency & Paperless Administration", "27"),
        ("6.3", "Data-Driven Insights for National Growth", "28"),
    ]
    for num, title, pg in toc_entries:
        toc_para = doc.add_paragraph()
        toc_para.paragraph_format.space_before = Pt(1)
        toc_para.paragraph_format.space_after = Pt(1)
        indent = Inches(0.3) if len(num) > 2 else Inches(0.0)
        toc_para.paragraph_format.left_indent = indent
        run_num = toc_para.add_run(f"{num}  ")
        run_num.font.bold = True
        run_num.font.size = Pt(10)
        run_num.font.color.rgb = PRIMARY if len(num) <= 2 else ACCENT
        run_title = toc_para.add_run(title)
        run_title.font.size = Pt(10)
        run_title.font.color.rgb = DARK_GRAY
        # Add tab leader to page number
        tab_stops = toc_para.paragraph_format.tab_stops
        run_dots = toc_para.add_run(f"{'.' * (60 - len(num) - len(title))} {pg}")
        run_dots.font.size = Pt(10)
        run_dots.font.color.rgb = RGBColor(0x99, 0x99, 0x99)


# ─── Main Document Builder ─────────────────────────────────────────────────────

def build_document():
    doc = Document()

    # Page setup
    section = doc.sections[0]
    section.page_width  = Inches(8.5)
    section.page_height = Inches(11)
    section.left_margin   = Inches(1.0)
    section.right_margin  = Inches(1.0)
    section.top_margin    = Inches(1.0)
    section.bottom_margin = Inches(1.0)

    # ── COVER PAGE ─────────────────────────────────────────────────────────────
    build_cover_page(doc)
    add_explicit_page_break(doc)

    # Set up header/footer for remaining sections (after cover)
    add_header_footer(doc, section)

    # ── TABLE OF CONTENTS ──────────────────────────────────────────────────────
    build_toc(doc)
    add_explicit_page_break(doc)

    # ══════════════════════════════════════════════════════════════════════════
    # SECTION 1: PROJECT ORIGIN & VISION
    # ══════════════════════════════════════════════════════════════════════════
    add_h1(doc, "1. Project Origin & Vision")

    add_h2(doc, "1.1 The Ideation & Problem Statement")

    add_body(doc, (
        "Educational institutions around the world — particularly in South Asia and emerging economies "
        "— continue to operate on a patchwork of disconnected, legacy tools and largely paper-based "
        "administrative systems. The core challenges identified prior to the conception of SchoolOS include:"
    ))

    add_bullet(doc, (
        " Teachers, students, parents, and administrative staff routinely rely on disparate mediums — "
        "WhatsApp groups, printed circulars, verbal notices, and individual emails — with no centralized, "
        "role-aware communication hub. This fragmentation consistently results in miscommunication, delayed "
        "notices, and administrative chaos."
    ), bold_label="Fragmented Communication Channels:")

    add_bullet(doc, (
        " Academic performance records are maintained in physical ledgers or unstructured spreadsheet files. "
        "The process is error-prone, offers no real-time visibility to parents or students, and provides no "
        "mechanism for longitudinal academic trend analysis."
    ), bold_label="Manual Gradebook Tracking:")

    add_bullet(doc, (
        " Daily attendance in most schools is taken using handwritten registers. Data is rarely digitized, "
        "making it impossible to detect early warning signals such as chronic absenteeism, which is a primary "
        "predictor of academic underperformance and eventual dropout."
    ), bold_label="Inefficient Attendance Monitoring:")

    add_bullet(doc, (
        " Parents have virtually no real-time visibility into their child's daily academic life — exam schedules, "
        "grades, attendance records, teacher feedback, or school announcements. Students operate without a "
        "centralized academic dashboard. Teachers lack digital tools for streamlined class management and "
        "reporting. All three stakeholder groups operate in information silos."
    ), bold_label="Disconnected Stakeholder Portals:")

    add_bullet(doc, (
        " School administrators and national education boards lack access to aggregated, real-time institutional "
        "data. Policy interventions are reactive rather than proactive, driven by annual paper reports rather "
        "than live metrics."
    ), bold_label="Absence of Data-Driven Decision Making:")

    add_body(doc, (
        "The Central Insight: These are not technology problems in isolation — they are systems integration "
        "failures. Each piece of the educational puzzle exists in some software form somewhere, but no single "
        "platform stitches them into a coherent, role-aware, real-time operating environment for a school. "
        "SchoolOS was conceived to fill precisely this gap."
    ))

    add_body(doc, (
        'The founding question was simple: "What if a school had an operating system — just like a computer '
        '— where every process, every actor, and every piece of data was managed through a single, intelligent, '
        'unified platform?"'
    ))

    add_h2(doc, "1.2 Project Inception & Timeline")

    add_body(doc, "The SchoolOS initiative followed a structured progression from conceptual ideation to production-grade application:")

    phases = [
        ("Phase 0 — Discovery & Research (Month 1):", " Stakeholder interviews were conducted with teachers, school administrators, students, and parents to identify pain points. Competitive landscape analysis covered existing platforms (Google Classroom, Fedena, OpenSIS, ClassDojo) to identify capability gaps."),
        ("Phase 1 — Proof of Concept (Month 2–3):", " A minimal PoC was built to validate core assumptions: a single-role authentication flow, a rudimentary gradebook CRUD interface, and a basic attendance marking screen. Technology stack decisions were finalized during this phase."),
        ("Phase 2 — Alpha Development (Month 4–6):", " Core modules were architected and built — RBAC engine, academic management layer, attendance system, and the API framework. Internal testing began with simulated institutional data."),
        ("Phase 3 — Beta Integration & Feature Expansion (Month 7–9):", " Communication hub, notification broadcasting, AI integration layer, and parent portal were added. End-to-end integration testing, performance profiling, and security audits were conducted."),
        ("Phase 4 — Production Hardening & Launch (Month 10–12):", " Database indexing optimization, JWT security hardening, CI/CD pipeline configuration, environment variable management, and deployment to cloud infrastructure. Initial onboarding of pilot institutions."),
    ]
    for label, desc in phases:
        add_bullet(doc, desc, bold_label=label)

    add_explicit_page_break(doc)

    # ══════════════════════════════════════════════════════════════════════════
    # SECTION 2: SDLC & VERSION CONTROL
    # ══════════════════════════════════════════════════════════════════════════
    add_h1(doc, "2. Software Development Lifecycle (SDLC) & Version Control")

    add_h2(doc, "2.1 SDLC Methodology — Agile / Iterative Model")

    add_body(doc, (
        "SchoolOS adopted an Agile/Iterative Software Development Lifecycle for the following strategic reasons:"
    ))

    agile_reasons = [
        ("Continuous Educator Feedback:", " The domain expertise lies with teachers and administrators, not engineers. Short sprint cycles (2-week sprints) allowed features to be rapidly validated with real educators before full-scale development investment was made."),
        ("Rapid Feature Integration:", " Educational institutions have dynamic needs — new regulatory requirements, mid-year curriculum changes, emergency communication needs. Agile allows the platform to absorb and ship these requirements without disrupting stable modules."),
        ("Modular Deployability:", " Each system module (Attendance, Gradebook, Communication) was designed as an independently deliverable unit. This allowed phased rollouts to institutions without requiring the entire platform to be complete."),
        ("Risk Mitigation via Iteration:", " Early technical risk (database schema design, real-time WebSocket architecture, AI model integration) was isolated into spikes and discovery sprints to validate feasibility before committing engineering resources."),
    ]
    for label, desc in agile_reasons:
        add_bullet(doc, desc, bold_label=label)

    add_h3(doc, "Sprint Structure")

    sprint_items = [
        ("Sprint Duration:", " 2 weeks"),
        ("Sprint Planning:", " Feature backlog refinement, story point estimation (Fibonacci scale), assignment of owners"),
        ("Daily Standups:", " 15-minute async check-ins covering blockers, progress, and cross-module dependencies"),
        ("Sprint Review:", " Demonstration of completed features against acceptance criteria"),
        ("Sprint Retrospective:", " Process improvement discussions — what worked, what to fix next sprint"),
        ("Definition of Done:", " Code reviewed, tests passing (≥80% coverage), documentation updated, feature flagged and deployed to staging"),
    ]
    for label, desc in sprint_items:
        add_bullet(doc, desc, bold_label=label)

    add_h2(doc, "2.2 Version Control & GitHub Workflow")

    add_h3(doc, "Git Branching Strategy (Feature Branch Workflow)")

    add_body(doc, "The repository follows a structured, multi-tier branching model:")

    add_code_block(doc, """main          ← Production-ready, protected, requires PR + 2 approvals
  └── development   ← Integration branch; all features merge here first
        ├── feature/auth-rbac
        ├── feature/attendance-engine
        ├── feature/gradebook-module
        ├── feature/notification-hub
        ├── feature/ai-performance-analytics
        ├── bugfix/jwt-expiry-refresh
        └── bugfix/attendance-date-boundary""")

    add_h3(doc, "Branch Protection Rules")

    add_bullet(doc, " No direct pushes. All changes via reviewed Pull Requests. Requires passing CI checks (lint, unit tests, build).", bold_label="main branch:")
    add_bullet(doc, " Feature branches merge here. Integration tests run automatically on every merge.", bold_label="development branch:")

    add_h3(doc, "Commit Conventions (Conventional Commits Standard)")

    add_code_block(doc, """feat(auth): implement multi-role JWT issuance with expiry rotation
fix(attendance): resolve off-by-one error in date range queries
docs(api): add Swagger annotations for gradebook endpoints
refactor(db): normalize mongoose schema for student-course relations
test(gradebook): add unit tests for GPA calculation edge cases
chore(deps): upgrade bcrypt to v5.1.1 for security patch""")

    add_h3(doc, "Pull Request Management")

    pr_items = [
        "Every PR is linked to a GitHub Issue with the feature spec",
        "Mandatory code review by at least one other developer",
        "Automated checks: ESLint (frontend), ESLint + Prettier (backend), Jest (unit tests)",
        "Environment Keys: .env files strictly excluded via .gitignore. Environment variables managed via GitHub Secrets for CI/CD and a dedicated secrets manager for production",
        "PR Template includes: Summary, Changes Made, Testing Checklist, Screenshots (for UI changes), Breaking Changes Notice",
    ]
    for item in pr_items:
        add_bullet(doc, item)

    add_explicit_page_break(doc)

    # ══════════════════════════════════════════════════════════════════════════
    # SECTION 3: SYSTEM ARCHITECTURE
    # ══════════════════════════════════════════════════════════════════════════
    add_h1(doc, "3. Full System Architecture & System Flow Diagrams")

    add_h2(doc, "3.1 Architectural Paradigm")

    add_body(doc, (
        "SchoolOS is built on a Decoupled Modular Monolithic Architecture — a deliberate architectural "
        "choice that balances the development velocity of a monolith with the logical separation of a "
        "microservices design."
    ))

    add_h3(doc, "Rationale for Decoupled Monolith over Full Microservices")

    add_bullet(doc, (
        "A full microservices architecture introduces significant operational overhead (service discovery, "
        "inter-service authentication, distributed tracing, network latency) that is unnecessary for the "
        "current scale of SchoolOS deployments."
    ))
    add_bullet(doc, (
        "A decoupled monolith allows clean separation of concerns via well-defined module boundaries (each "
        "module has its own router, controller, service layer, and data model) while keeping deployment, "
        "debugging, and testing straightforward."
    ))
    add_bullet(doc, (
        "The architecture is designed for eventual microservice extraction: any module can be extracted "
        "into an independent service as institutional scale demands it, without rewriting business logic."
    ))

    add_h3(doc, "Architectural Layers")

    layers = [
        ("Presentation Layer:", " Next.js application handling SSR, CSR, and static generation based on page requirements."),
        ("API Gateway / Routing Layer:", " Express.js router acting as the single entry point for all client requests."),
        ("Middleware Layer:", " JWT authentication, role-based access enforcement, request validation, rate limiting, and error normalization."),
        ("Business Logic Layer:", " Module-specific service files encapsulating all application logic, independent of transport (HTTP) concerns."),
        ("Data Access Layer:", " Mongoose ODM abstracting all MongoDB interactions, with model-level validation and lifecycle hooks."),
        ("Database Layer:", " MongoDB Atlas providing a scalable, document-oriented persistence layer."),
    ]
    for i, (label, desc) in enumerate(layers, 1):
        add_bullet(doc, desc, bold_label=f"{i}. {label}")

    add_h2(doc, "3.2 System Architecture Diagram")

    add_code_block(doc, """╔══════════════════════════════════════════════════════════════════╗
║                    SCHOOLOS SYSTEM ARCHITECTURE                  ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║   ┌─────────────────────────────────────────────────────────┐   ║
║   │                  CLIENT PRESENTATION LAYER               │   ║
║   │    ┌─────────────┐  ┌────────────┐  ┌───────────────┐  │   ║
║   │    │  Admin      │  │  Teacher   │  │  Student /    │  │   ║
║   │    │  Dashboard  │  │  Portal    │  │  Parent Portal│  │   ║
║   │    │  (Next.js)  │  │  (Next.js) │  │  (Next.js)    │  │   ║
║   │    └──────┬──────┘  └─────┬──────┘  └───────┬───────┘  │   ║
║   └───────────┼───────────────┼─────────────────┼───────────┘   ║
║               └───────────────┼─────────────────┘               ║
║                               │  HTTPS / REST / WebSocket       ║
║   ┌───────────────────────────▼─────────────────────────────┐   ║
║   │              API GATEWAY — EXPRESS.JS ROUTER             │   ║
║   │   /api/auth  /api/users  /api/attendance  /api/grades   │   ║
║   │   /api/classes  /api/notifications  /api/ai             │   ║
║   └───────────────────────────┬─────────────────────────────┘   ║
║                               │                                  ║
║   ┌───────────────────────────▼─────────────────────────────┐   ║
║   │                    MIDDLEWARE STACK                       │   ║
║   │  [CORS] → [Rate Limiter] → [JWT Verifier] → [RBAC Guard]│   ║
║   │  → [Request Validator] → [Error Handler]                 │   ║
║   └───────────────────────────┬─────────────────────────────┘   ║
║                               │                                  ║
║   ┌───────────────────────────▼─────────────────────────────┐   ║
║   │                  BUSINESS LOGIC LAYER                    │   ║
║   │   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   ║
║   │   │   Auth   │ │Attendance│ │Gradebook │ │Notif.    │  │   ║
║   │   │ Service  │ │ Service  │ │ Service  │ │ Service  │  │   ║
║   │   └──────────┘ └──────────┘ └──────────┘ └──────────┘  │   ║
║   │   ┌──────────┐ ┌──────────┐ ┌──────────────────────┐   │   ║
║   │   │  Class   │ │  User    │ │  AI Analytics Engine │   │   ║
║   │   │ Service  │ │ Service  │ │  (ML/LLM Integration)│   │   ║
║   │   └──────────┘ └──────────┘ └──────────────────────┘   │   ║
║   └───────────────────────────┬─────────────────────────────┘   ║
║                               │                                  ║
║   ┌───────────────────────────▼─────────────────────────────┐   ║
║   │               DATA ACCESS LAYER (Mongoose ODM)           │   ║
║   │   User Model │ Class Model │ Attendance Model │ Grade    │   ║
║   │   Model │ Notification Model │ AI Report Model           │   ║
║   └───────────────────────────┬─────────────────────────────┘   ║
║                               │                                  ║
║   ┌───────────────────────────▼─────────────────────────────┐   ║
║   │                  DATABASE LAYER — MongoDB Atlas           │   ║
║   │         Collections: users, classes, attendance,         │   ║
║   │         grades, notifications, aiReports, sessions       │   ║
║   └─────────────────────────────────────────────────────────┘   ║
╚══════════════════════════════════════════════════════════════════╝""")

    add_h2(doc, "3.3 Request-Response Lifecycle Flowchart")

    add_code_block(doc, """CLIENT REQUEST
      │
      ▼
┌─────────────────┐
│  CORS Middleware │ ← Validates origin, sets headers
└────────┬────────┘
         │
         ▼
┌────────────────────┐
│  Rate Limit Check  │ ← Rejects if > 100 req/min per IP
└────────┬───────────┘
         │
         ▼
┌────────────────────┐        ┌───────────────────┐
│  JWT Token Extract │───────▶│  Token Invalid?   │──▶ 401 Unauthorized
└────────┬───────────┘  NO    └───────────────────┘
         │ YES (valid token)
         ▼
┌────────────────────┐        ┌───────────────────┐
│  RBAC Role Check   │───────▶│  Role Forbidden?  │──▶ 403 Forbidden
└────────┬───────────┘  NO    └───────────────────┘
         │ YES (authorized)
         ▼
┌────────────────────┐
│  Request Body      │ ← Joi / Zod schema validation
│  Validation        │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│  Route Controller  │ ← Receives sanitized req object
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│  Service Layer     │ ← Pure business logic execution
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│  Mongoose Query    │ ← Database read/write operation
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│  Response Builder  │ ← Standardized JSON envelope
└────────┬───────────┘
         │
         ▼
JSON RESPONSE → CLIENT
{ "success": true, "data": {...}, "meta": {...} }""")

    add_h2(doc, "3.4 Data Flow Diagram — User Authentication")

    add_code_block(doc, """[User: Login Form] → POST /api/auth/login
        │
        ▼
[AuthController.login()]
        │
        ├──▶ [UserService.findByEmail(email)]
        │           │
        │           ▼
        │    [MongoDB: users collection]
        │           │
        │    ◀── {user document or null}
        │
        ├──▶ [bcrypt.compare(password, user.passwordHash)]
        │           │
        │    ◀── {boolean: match}
        │
        ├──▶ [JWTService.sign({id, role, institutionId})]
        │           │
        │    ◀── {accessToken, refreshToken}
        │
        ▼
[Response: 200 OK]
{
  "success": true,
  "data": {
    "user": { id, name, role, email },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}""")

    add_explicit_page_break(doc)

    # ══════════════════════════════════════════════════════════════════════════
    # SECTION 4: FEATURAL & SYSTEM BREAKDOWN
    # ══════════════════════════════════════════════════════════════════════════
    add_h1(doc, "4. Featural & System Breakdown")

    add_h2(doc, "4.1 Authentication & Role-Based Access Control (RBAC)")

    add_body(doc, (
        "SchoolOS implements a multi-tenant, multi-role RBAC architecture designed to handle the complex "
        "permission hierarchies of educational institutions."
    ))

    add_h3(doc, "Role Hierarchy")

    add_code_block(doc, """SUPER_ADMIN (Platform Level)
    └── INSTITUTION_ADMIN (Institution Level)
            ├── TEACHER (Class Level)
            ├── STUDENT (Self Level)
            └── PARENT (Child-linked Level)""")

    add_h3(doc, "Role Capabilities Matrix")

    add_rbac_table(doc)

    doc.add_paragraph()  # spacer

    add_h3(doc, "Authentication Flow")

    auth_items = [
        ("Password Hashing:", " Passwords are hashed using bcrypt (cost factor: 12) before storage. Plaintext passwords are never persisted."),
        ("Token Issuance:", " On login, a short-lived Access Token (15 minutes expiry) and a long-lived Refresh Token (7 days expiry) are issued."),
        ("Token Storage:", " The Access Token is stored in memory (Redux/Zustand store). The Refresh Token is stored in an httpOnly, Secure, SameSite=Strict cookie to prevent XSS-based token theft."),
        ("Token Rotation:", " Automatic token rotation on refresh: every refresh request invalidates the old refresh token and issues a new one (sliding window)."),
        ("Logout:", " On logout, the refresh token is invalidated server-side via a token blacklist stored in MongoDB."),
    ]
    for label, desc in auth_items:
        add_bullet(doc, desc, bold_label=label)

    add_h3(doc, "Multi-Tenancy")

    add_bullet(doc, " Every JWT payload includes an institutionId field.", bold_label="Institution Scoping:")
    add_bullet(doc, " All database queries are scoped by institutionId at the service layer, ensuring complete data isolation between institutions on the same platform instance.", bold_label="Data Isolation:")

    add_h2(doc, "4.2 Academic & Administrative Management")

    add_h3(doc, "4.2.1 Class & Course Allocation")

    add_bullet(doc, ' Administrators create academic classes (e.g., "Grade 10 — Science A") with metadata: academic year, section, subjects, and assigned teachers.')
    add_bullet(doc, " Teachers are linked to classes via a many-to-many relationship: a teacher can manage multiple classes; a class can have multiple subject teachers.")
    add_bullet(doc, " Students are enrolled in classes, generating automatic linkages to all associated gradebooks, attendance registers, and notification channels.")

    add_h3(doc, "4.2.2 Automated Attendance Engine")

    attendance_items = [
        ("Daily Attendance:", " Teachers mark attendance per class session through a mobile-optimized interface. Status options: Present, Absent, Late, Excused."),
        ("Bulk Marking:", " Default-to-present bulk marking with individual overrides reduces the time to mark attendance for a 40-student class to under 60 seconds."),
        ("Automated Alerts:", " If a student's attendance drops below a configurable threshold (default: 75%), an automated alert is dispatched to the parent and flagged on the admin dashboard."),
        ("Monthly Reports:", " Auto-generated attendance summary reports per student, per class, per month — exportable as PDF or accessible in-portal."),
        ("Chronic Absenteeism Detection:", " The AI layer cross-references attendance patterns over rolling 30-day windows to identify at-risk students."),
    ]
    for label, desc in attendance_items:
        add_bullet(doc, desc, bold_label=label)

    add_h3(doc, "4.2.3 Exam & Grading System")

    grading_items = [
        "Teachers create exams with metadata: subject, exam type (quiz, midterm, final, assignment), maximum marks, date, and associated class.",
        "Grade entry is done per-exam per-student, with server-side validation ensuring scores do not exceed the defined maximum.",
        "GPA Calculation Engine: Configurable grading scales (percentage, letter grade, GPA-4.0, custom) are applied at the institution level. The engine auto-calculates cumulative GPA per term and academic year.",
        "Grade Progression Tracking: Historical grade data is stored and visualized as trend charts, providing longitudinal academic performance views for teachers, students, and parents.",
        "Report Card Generation: End-of-term report cards are auto-generated as structured PDF documents, incorporating attendance, grades, teacher comments, and GPA.",
    ]
    for item in grading_items:
        add_bullet(doc, item)

    add_h2(doc, "4.3 Communication & Notification Hub")

    add_body(doc, (
        "The Communication Hub is a critical differentiation point for SchoolOS, replacing the fragmented "
        "communication channels (WhatsApp, email, printed circulars) with a centralized, role-aware broadcast "
        "and messaging system."
    ))

    add_h3(doc, "Notification Architecture")

    notif_items = [
        ("Server-Sent Events (SSE) / WebSocket Layer:", " Real-time push notifications delivered to connected clients without polling. On reconnection, a backlog of missed notifications (up to 7 days) is delivered."),
        ("Notification Types:", " System (platform-level alerts), Academic (grade posted, exam scheduled), Attendance (absence alert, late notification), Administrative (fee reminder, school closure), and Direct Messages."),
        ("Audience Targeting:", " Notifications can be scoped by institution, class, role, or individual user. A teacher can broadcast to their specific class; an admin can broadcast institution-wide."),
    ]
    for label, desc in notif_items:
        add_bullet(doc, desc, bold_label=label)

    add_h3(doc, "Announcement System")

    add_bullet(doc, " Rich-text announcement editor (supporting attachments, embedded media links) for administrative and teacher-level broadcasts.", bold_label="Rich Editor:")
    add_bullet(doc, " Announcements are time-stamped, archived, and searchable.", bold_label="Archiving:")
    add_bullet(doc, " Read receipts are tracked per-user, enabling admins to verify critical notice delivery.", bold_label="Read Receipts:")

    add_h3(doc, "Direct Messaging")

    add_bullet(doc, " Secure, in-platform direct messaging between teachers and parents, or teachers and students.", bold_label="Secure Messaging:")
    add_bullet(doc, " Message threads are role-scoped: parents can only initiate conversations with their child's assigned teachers; students can only message their class teachers.", bold_label="Role Scoping:")
    add_bullet(doc, " All messages are stored, auditable, and moderated at the institution admin level.", bold_label="Auditability:")

    add_h2(doc, "4.4 AI Integrations & Smart Features")

    add_body(doc, "SchoolOS embeds an AI/ML layer to transform raw institutional data into actionable intelligence.")

    add_h3(doc, "4.4.1 Predictive Performance Analytics")

    add_bullet(doc, " A machine learning model is trained on multi-dimensional student data: historical grades, attendance frequency, assignment submission rates, and participation metrics.", bold_label="Model Input:")
    add_bullet(doc, " The model outputs a Performance Risk Score (PRS) per student on a rolling weekly basis — a normalized 0–100 score indicating the predicted likelihood of academic underperformance in the upcoming assessment period.", bold_label="Output:")
    add_bullet(doc, " Teachers and administrators receive a prioritized 'At-Risk Student' dashboard, ranked by PRS, enabling proactive intervention before academic failure occurs.", bold_label="Dashboard:")
    add_bullet(doc, " A gradient-boosted ensemble (XGBoost baseline) with periodic retraining cycles triggered by new grade batch submissions.", bold_label="Model Architecture:")

    add_h3(doc, "4.4.2 Automated Schedule Generation")

    add_bullet(doc, " Given constraints (teacher availability, room capacity, subject requirements, break periods, maximum daily subject load), the AI scheduling engine generates an optimized weekly timetable.", bold_label="Input Constraints:")
    add_bullet(doc, " Constraint Satisfaction Problem (CSP) solver with heuristic backtracking, inspired by the standard educational timetabling problem (ITC-2019 benchmark formulations).", bold_label="Algorithm:")
    add_bullet(doc, " The engine detects and resolves teacher double-booking, room double-booking, and student schedule conflicts.", bold_label="Conflict Detection:")
    add_bullet(doc, " A fully formed, downloadable timetable per class, per teacher, and a master institution schedule.", bold_label="Output:")

    add_h3(doc, "4.4.3 Intelligent Student Reporting (LLM-Augmented)")

    add_body(doc, (
        "When generating student progress reports, the system invokes an LLM (via API integration with OpenAI "
        "GPT-4o or a locally hosted model) to auto-draft narrative teacher comments based on structured grade "
        "and attendance data. Teachers receive AI-drafted comment suggestions and can accept, edit, or discard "
        "the AI suggestion. This reduces report card writing time per student from an average of 8 minutes to "
        "under 90 seconds."
    ))

    add_code_block(doc, """Example AI-Generated Comment:
"Aiden has demonstrated consistent improvement in Mathematics, achieving 87% in the latest
assessment, up from 63% in the previous term. However, attendance irregularities (72%) may
be impacting progress in other subjects." """)

    add_explicit_page_break(doc)

    # ══════════════════════════════════════════════════════════════════════════
    # SECTION 5: TECHNICAL STACK
    # ══════════════════════════════════════════════════════════════════════════
    add_h1(doc, "5. Technical Stack Rationale & Implementation")

    add_h2(doc, "5.1 Frontend Layer — Next.js 14+ with React & Tailwind CSS")

    add_h3(doc, "Why Next.js?")

    add_body(doc, (
        "Next.js was selected as the frontend framework due to its hybrid rendering capability — the ability "
        "to choose Server-Side Rendering (SSR), Static Site Generation (SSG), Incremental Static Regeneration (ISR), "
        "or Client-Side Rendering (CSR) on a per-page basis."
    ))

    rendering_items = [
        ("SSR for Dynamic Dashboards:", " Role-specific dashboards are server-rendered on each request, ensuring data is always current at page load without a client-side fetch waterfall."),
        ("SSG for Static Content:", " Documentation pages, onboarding guides, and marketing pages are statically generated at build time for maximum performance and SEO."),
        ("CSR for Interactive Widgets:", " Attendance marking interfaces, real-time notification panels, and grade entry forms operate as interactive client-side components using React hooks and state management."),
    ]
    for label, desc in rendering_items:
        add_bullet(doc, desc, bold_label=label)

    add_h3(doc, "Component Architecture")

    component_items = [
        ("Atomic Design System:", " UI components are organized in an atomic hierarchy — Atoms (Button, Input, Badge), Molecules (FormField, NotificationCard, GradeRow), Organisms (AttendanceTable, GradebookPanel, AnnouncementFeed), and Pages (assembled from organisms)."),
        ("State Management:", " Zustand for global client-side state (authenticated user, notification queue, active class). React Query (TanStack Query) for server state management, providing automatic caching, background refetching, optimistic updates, and query invalidation."),
        ("Tailwind CSS:", " Utility-first CSS framework enabling rapid, consistent, responsive UI development. Custom design tokens (colors, typography, spacing) are configured in tailwind.config.js to enforce the SchoolOS brand system."),
    ]
    for label, desc in component_items:
        add_bullet(doc, desc, bold_label=label)

    add_h2(doc, "5.2 Backend Layer — Node.js with Express.js")

    add_h3(doc, "Why Node.js + Express.js?")

    backend_items = [
        ("Event-Driven, Non-Blocking I/O:", " Node.js's single-threaded event loop is ideally suited for I/O-bound operations that dominate educational management systems — database reads/writes, notification dispatches, API calls to AI services."),
        ("JavaScript Ecosystem Consistency:", " Using JavaScript on both frontend (Next.js) and backend (Node.js) enables shared utility libraries, consistent type definitions (via TypeScript), and reduced context-switching for developers."),
        ("Express.js Minimalism:", " Express.js provides a minimal, un-opinionated HTTP framework that grants full architectural control. The SchoolOS backend implements a clean, layered structure: Router → Controller → Service → Model."),
    ]
    for label, desc in backend_items:
        add_bullet(doc, desc, bold_label=label)

    add_h3(doc, "API Design — RESTful Endpoints")

    add_code_block(doc, """POST   /api/auth/login          → Authenticate user, issue tokens
POST   /api/auth/refresh        → Rotate refresh token
DELETE /api/auth/logout         → Invalidate session

GET    /api/users               → List users (admin-scoped)
POST   /api/users               → Create user
GET    /api/users/:id           → Get user profile
PATCH  /api/users/:id           → Update user data
DELETE /api/users/:id           → Soft-delete user

GET    /api/classes             → List classes for institution
POST   /api/classes             → Create class
GET    /api/classes/:id         → Get class detail with roster

POST   /api/attendance          → Submit attendance session
GET    /api/attendance/:classId → Get attendance records
GET    /api/attendance/student/:studentId → Student attendance summary

POST   /api/grades              → Submit grade entry
GET    /api/grades/class/:classId → Gradebook for class
GET    /api/grades/student/:studentId → Student grade history

GET    /api/notifications       → Get notification inbox
POST   /api/notifications/broadcast → Send announcement
PATCH  /api/notifications/:id/read  → Mark as read""")

    add_h3(doc, "Error Handling Middleware")

    add_code_block(doc, """// Centralized error handler
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  const response = {
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  };
  logger.error({ status, path: req.path, error: err.message });
  res.status(status).json(response);
});""")

    add_h2(doc, "5.3 Database Layer — MongoDB with Mongoose ODM")

    add_h3(doc, "Why MongoDB?")

    db_items = [
        ("Document-Oriented Flexibility:", " Educational data is inherently hierarchical and variable in structure. A student's academic profile, attendance history, grades, and AI-generated risk scores are naturally represented as nested JSON documents rather than normalized relational tables requiring complex JOINs."),
        ("Horizontal Scalability:", " MongoDB's native sharding support provides a clear path to horizontal scaling as the platform onboards thousands of institutions."),
        ("Mongoose ODM:", " Provides schema validation at the application level (the last line of defense before data persistence), lifecycle hooks (pre-save password hashing, post-save notification triggers), and populate()-based document references for relationship resolution."),
    ]
    for label, desc in db_items:
        add_bullet(doc, desc, bold_label=label)

    add_h3(doc, "Core Schema Designs")

    add_code_block(doc, """// User Schema
const UserSchema = new Schema({
  institutionId: { type: ObjectId, ref: 'Institution', required: true, index: true },
  name:          { type: String, required: true, trim: true },
  email:         { type: String, required: true, unique: true, lowercase: true },
  passwordHash:  { type: String, required: true, select: false },
  role:          { type: String, enum: ['super_admin','admin','teacher','student','parent'], required: true },
  parentOf:      [{ type: ObjectId, ref: 'User' }],    // for parent role
  enrolledIn:    [{ type: ObjectId, ref: 'Class' }],   // for student role
  teaches:       [{ type: ObjectId, ref: 'Class' }],   // for teacher role
  createdAt:     { type: Date, default: Date.now }
}, { timestamps: true });

// Attendance Schema
const AttendanceSchema = new Schema({
  institutionId: { type: ObjectId, ref: 'Institution', required: true, index: true },
  classId:       { type: ObjectId, ref: 'Class', required: true, index: true },
  teacherId:     { type: ObjectId, ref: 'User', required: true },
  date:          { type: Date, required: true, index: true },
  records:       [{
    studentId: { type: ObjectId, ref: 'User', required: true },
    status:    { type: String, enum: ['present','absent','late','excused'], required: true },
    note:      { type: String, default: '' }
  }]
}, { timestamps: true });

// Grade Schema
const GradeSchema = new Schema({
  institutionId: { type: ObjectId, ref: 'Institution', required: true, index: true },
  studentId:     { type: ObjectId, ref: 'User', required: true, index: true },
  classId:       { type: ObjectId, ref: 'Class', required: true },
  examId:        { type: ObjectId, ref: 'Exam', required: true },
  marksObtained: { type: Number, required: true, min: 0 },
  maximumMarks:  { type: Number, required: true },
  percentage:    { type: Number },
  letterGrade:   { type: String },
  enteredBy:     { type: ObjectId, ref: 'User', required: true },
  enteredAt:     { type: Date, default: Date.now }
}, { timestamps: true });""")

    add_h3(doc, "Indexing Strategy")

    idx_items = [
        "Compound indexes on { institutionId, classId, date } for attendance queries",
        "Text index on { name, email } for user search",
        "TTL index on refresh token collection (auto-expiry after 7 days)",
        "Sparse indexes on optional fields to conserve index space",
    ]
    for item in idx_items:
        add_bullet(doc, item)

    add_h2(doc, "5.4 Security & Utility Tools")

    add_h3(doc, "JWT Authentication Implementation")

    jwt_items = [
        ("RS256 Signing:", " Access tokens signed with RS256 (asymmetric RSA key pair). The private key signs tokens; the public key verifies them. Enables future microservice token verification without sharing the signing secret."),
        ("Token Payload:", " { sub: userId, role, institutionId, iat, exp }"),
        ("Refresh Token Storage:", " Stored as a hash in MongoDB (not raw value), preventing database-level token theft."),
    ]
    for label, desc in jwt_items:
        add_bullet(doc, desc, bold_label=label)

    add_h3(doc, "Password Security")

    pwd_items = [
        ("bcrypt Cost Factor:", " Cost factor 12 (~250ms hash time on modern hardware) — slow enough to resist brute-force attacks, fast enough for UX."),
        ("Complexity Rules:", " Minimum 8 characters; at least one uppercase, one lowercase, one digit, one special character."),
        ("Account Lockout:", " 5 failed login attempts trigger a 15-minute lockout with automatic unlock or admin override capability."),
    ]
    for label, desc in pwd_items:
        add_bullet(doc, desc, bold_label=label)

    add_h3(doc, "Additional Security Measures")

    sec_items = [
        ("CORS:", " Strict allowlist — only whitelisted institutional frontend domains permitted. Credentials enabled only for explicitly whitelisted origins."),
        ("Environment Security:", " .env files excluded from version control. Secrets loaded exclusively from environment variables. GitHub Secrets for CI/CD; AWS Secrets Manager or HashiCorp Vault in production."),
        ("Helmet.js:", " Sets secure HTTP headers (Content-Security-Policy, X-Frame-Options, X-XSS-Protection)."),
        ("express-rate-limit:", " IP-based rate limiting (100 requests/minute per IP for API endpoints)."),
        ("Joi / Zod:", " Runtime request body validation with structured error messages."),
        ("Winston + Morgan:", " Structured logging (JSON format) with request logging middleware."),
        ("Nodemailer:", " Transactional email delivery for password resets, welcome emails, and critical alerts."),
    ]
    for label, desc in sec_items:
        add_bullet(doc, desc, bold_label=label)

    add_explicit_page_break(doc)

    # ══════════════════════════════════════════════════════════════════════════
    # SECTION 6: SOCIO-ECONOMIC IMPACT
    # ══════════════════════════════════════════════════════════════════════════
    add_h1(doc, "6. Socio-Economic Impact & Nation-Wide Utility")

    add_h2(doc, "6.1 Digital Transformation of Education")

    add_body(doc, (
        "SchoolOS is architected with a deliberate focus on inclusivity and accessibility — recognizing that "
        "the institutions that stand to benefit most are not elite urban schools with existing digital "
        "infrastructure, but the vast majority of schools in peri-urban and rural areas operating with "
        "limited resources."
    ))

    add_h3(doc, "Bridging the Urban-Rural Digital Divide")

    divide_items = [
        ("Progressive Web App (PWA) Capability:", " SchoolOS is designed as a PWA, enabling installation on low-end Android devices without requiring a native app store download. Offline-first functionality (attendance can be marked offline and synced when connectivity is restored) is essential for areas with unreliable internet."),
        ("Low-Bandwidth Optimization:", " API responses are optimized for minimal payload size. The frontend uses lazy loading, image compression, and service workers to ensure acceptable performance on 2G/3G mobile connections."),
        ("Multilingual Interface:", " The internationalization (i18n) layer (via next-intl) supports localized language packs, enabling deployment in linguistically diverse regions without rebuilding the application."),
        ("Device Agnosticism:", " The responsive design system ensures the full application is functional on smartphones (the primary device for many rural educators and parents) through to desktop workstations."),
    ]
    for label, desc in divide_items:
        add_bullet(doc, desc, bold_label=label)

    add_h3(doc, "Institutional Onboarding")

    onboard_items = [
        "A self-service institution registration flow allows new schools to onboard in under 15 minutes without technical expertise.",
        "Pre-configured curriculum templates (based on national education board standards) reduce setup overhead for standard academic structures.",
        "A dedicated onboarding wizard guides administrators through: institution profile setup → class creation → teacher invitation → student enrollment → first attendance session.",
    ]
    for item in onboard_items:
        add_bullet(doc, item)

    add_h2(doc, "6.2 Operational Efficiency & Paperless Administration")

    add_body(doc, "The quantifiable impact of SchoolOS on institutional operations:")

    add_efficiency_table(doc)

    doc.add_paragraph()  # spacer

    add_h3(doc, "Eliminating Human Error")

    add_bullet(doc, " Manual data entry errors in gradebooks and attendance registers are eliminated via server-side validation, computed fields, and audit trails.", bold_label="Validation:")
    add_bullet(doc, " Every data modification is logged with a timestamp and user ID, creating an immutable audit trail for dispute resolution.", bold_label="Audit Trail:")

    add_h3(doc, "Teacher Workload Reduction")

    add_body(doc, (
        "By automating attendance processing, report generation, and parent communication, SchoolOS reclaims "
        "an estimated 5–8 hours per week of teacher time that can be redirected toward actual instruction and "
        "student support."
    ))

    add_h2(doc, "6.3 Data-Driven Insights for National Growth")

    add_body(doc, (
        "At the aggregate level, SchoolOS generates an unprecedented dataset of real-time educational metrics "
        "with profound implications for national education policy."
    ))

    add_h3(doc, "Institutional Analytics Dashboard")

    add_bullet(doc, " Real-time enrollment figures, attendance rates, academic performance distributions, and subject-level pass rates — visualized as charts and exportable as standardized reports.", bold_label="Live Metrics:")
    add_bullet(doc, " Institutions can track their own improvement trajectories across academic years.", bold_label="Year-over-Year Comparison:")

    add_h3(doc, "Policy & Governance Implications")

    policy_items = [
        ("Dropout Rate Reduction:", " Early warning systems (attendance-based and PRS-based) enable counselors and administrators to intervene before a student disengages completely. SchoolOS operationalizes this intervention at scale."),
        ("Resource Allocation Intelligence:", " National education boards can identify under-resourced schools (high enrollment, high dropout, low performance correlation) and prioritize infrastructure and teacher deployment accordingly."),
        ("Curriculum Effectiveness Assessment:", " Aggregated performance data across subjects and academic levels can reveal systemic curriculum gaps — subjects where pass rates consistently fall below benchmarks nationally — enabling evidence-based curriculum reform."),
        ("National Academic Dashboard:", " With multi-institution deployment, SchoolOS can function as a real-time national academic monitoring system, providing education ministries with live data that currently requires months-long manual data collection exercises."),
    ]
    for label, desc in policy_items:
        add_bullet(doc, desc, bold_label=label)

    add_h3(doc, "Parent Engagement & Family Outcomes")

    add_body(doc, (
        "Research demonstrates that parental involvement is one of the strongest predictors of student academic "
        "success. By giving parents real-time visibility into attendance, grades, and teacher communications, "
        "SchoolOS systematically increases parental engagement at scale — effectively raising academic outcomes "
        "across the board without requiring additional educational resources."
    ))

    add_body(doc, (
        "Parents in rural areas, who historically had no mechanism to engage with their child's school other "
        "than physically visiting during working hours, can now access complete academic profiles via their "
        "smartphone at any time — bridging the information gap that has historically disadvantaged students "
        "from low-income and rural backgrounds."
    ))

    # Final spacer
    doc.add_paragraph()

    # Save
    output_path = r"e:\anti+puku\schoolos\SchoolOS_Documentation.docx"
    doc.save(output_path)
    print(f"Document saved to: {output_path}")

    import os
    size = os.path.getsize(output_path)
    print(f"File size: {size:,} bytes ({size / 1024:.1f} KB)")


if __name__ == "__main__":
    build_document()
