
from docx import Document
from docx.shared import Pt, Cm, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.section import WD_SECTION
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import copy

BANGLA_FONT = "Arial Unicode MS"
CODE_FONT = "Courier New"
NAVY = RGBColor(0x1A, 0x3C, 0x5E)
GRAY = RGBColor(0x88, 0x88, 0x88)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
LIGHT_BLUE_BG = RGBColor(0xE8, 0xF4, 0xFD)

doc = Document()

# ── Page setup: A4, 1-inch margins ──────────────────────────────────────────
section = doc.sections[0]
section.page_width  = Cm(21.0)
section.page_height = Cm(29.7)
for attr in ('left_margin','right_margin','top_margin','bottom_margin'):
    setattr(section, attr, Inches(1))

# ── Default paragraph font ───────────────────────────────────────────────────
style = doc.styles['Normal']
style.font.name = BANGLA_FONT
style.font.size = Pt(13)
style._element.rPr.rFonts.set(qn('w:eastAsia'), BANGLA_FONT)

# ── Footer ───────────────────────────────────────────────────────────────────
def add_footer(sec):
    footer = sec.footer
    para = footer.paragraphs[0] if footer.paragraphs else footer.add_paragraph()
    para.clear()
    para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = para.add_run("SchoolOS | বাংলা উপস্থাপনা স্ক্রিপ্ট | ২০২৬")
    run.font.name = BANGLA_FONT
    run.font.size = Pt(9)
    run.font.color.rgb = GRAY

add_footer(section)

# ── Helper: set paragraph shading ────────────────────────────────────────────
def shade_paragraph(para, hex_fill):
    pPr = para._p.get_or_add_pPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), hex_fill)
    pPr.append(shd)

# ── Helper: add a run with specific font/size/bold/color ─────────────────────
def add_run(para, text, font=BANGLA_FONT, size=13, bold=False, italic=False, color=None):
    run = para.add_run(text)
    run.font.name = font
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    if color:
        run.font.color.rgb = color
    # ensure east-asia font is also set
    rPr = run._r.get_or_add_rPr()
    rFonts = rPr.find(qn('w:rFonts'))
    if rFonts is None:
        rFonts = OxmlElement('w:rFonts')
        rPr.insert(0, rFonts)
    rFonts.set(qn('w:eastAsia'), font)
    return run

# ── Helper: horizontal rule ──────────────────────────────────────────────────
def add_hr(doc):
    para = doc.add_paragraph()
    para.paragraph_format.space_before = Pt(4)
    para.paragraph_format.space_after  = Pt(4)
    pPr = para._p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    bottom = OxmlElement('w:bottom')
    bottom.set(qn('w:val'), 'single')
    bottom.set(qn('w:sz'), '6')
    bottom.set(qn('w:space'), '1')
    bottom.set(qn('w:color'), '1A3C5E')
    pBdr.append(bottom)
    pPr.append(pBdr)

# ── Helper: section heading ──────────────────────────────────────────────────
def add_section_heading(doc, heading_text, timing_text):
    add_hr(doc)
    para = doc.add_paragraph()
    para.paragraph_format.space_before = Pt(14)
    para.paragraph_format.space_after  = Pt(2)
    add_run(para, heading_text, size=15, bold=True, color=NAVY)

    time_para = doc.add_paragraph()
    time_para.paragraph_format.space_before = Pt(0)
    time_para.paragraph_format.space_after  = Pt(8)
    add_run(time_para, timing_text, size=10, italic=True, color=GRAY)

# ── Helper: body paragraph ───────────────────────────────────────────────────
def add_body(doc, segments, space_after=6):
    """segments = list of (text, is_code) tuples"""
    para = doc.add_paragraph()
    para.paragraph_format.space_after = Pt(space_after)
    for text, is_code in segments:
        if is_code:
            add_run(para, text, font=CODE_FONT, size=11, bold=True)
        else:
            add_run(para, text, size=13)
    return para

# ════════════════════════════════════════════════════════════════════════════
#  COVER SECTION
# ════════════════════════════════════════════════════════════════════════════
doc.add_paragraph()  # top spacing

title_para = doc.add_paragraph()
title_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
title_para.paragraph_format.space_before = Pt(20)
title_para.paragraph_format.space_after  = Pt(8)
add_run(title_para, "SchoolOS", size=30, bold=True, color=NAVY)
add_run(title_para, "\n— ৫ মিনিটের বাংলা উপস্থাপনা স্ক্রিপ্ট", size=22, bold=True, color=NAVY)

sub_para = doc.add_paragraph()
sub_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
sub_para.paragraph_format.space_after = Pt(4)
add_run(sub_para, "সফটওয়্যার পরিচিতি, ফোল্ডার স্ট্রাকচার ও লাইভ রান গাইড", size=14, italic=True, color=GRAY)

date_para = doc.add_paragraph()
date_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
date_para.paragraph_format.space_after = Pt(20)
add_run(date_para, "তারিখ: অক্টোবর ২০২৬", size=11, color=GRAY)

add_hr(doc)

# ════════════════════════════════════════════════════════════════════════════
#  PART 1 — ভূমিকা ও পরিচিতি
# ════════════════════════════════════════════════════════════════════════════
add_section_heading(doc, "[অংশ ১ — ভূমিকা ও পরিচিতি]", "সময়: ০:০০ – ০:৩০")

add_body(doc, [
    ("আসসালামু আলাইকুম! কেমন আছেন সবাই? আশা করি সবাই ভালো আছেন।", False)
])
add_body(doc, [
    ("আমি আজকে আপনাদের সামনে উপস্থাপন করতে যাচ্ছি আমাদের একটি সম্পূর্ণ AI-integrated শিক্ষা প্রতিষ্ঠান ম্যানেজমেন্ট সিস্টেম — যার নাম হলো ", False),
    ("SchoolOS", True),
    ("।", False)
])
add_body(doc, [
    ("SchoolOS হলো একটি full-stack ওয়েব সফটওয়্যার যেটা দিয়ে যেকোনো স্কুল বা শিক্ষা প্রতিষ্ঠান তাদের পুরো ব্যবস্থাপনা — ছাত্র ভর্তি থেকে শুরু করে পরীক্ষার ফলাফল পর্যন্ত — সব কিছু digitally পরিচালনা করতে পারবে।", False)
])
add_body(doc, [
    ("আজকের এই ভিডিওতে আমি আপনাদের দেখাবো — কিভাবে এই সফটওয়্যারের ফোল্ডার স্ট্রাকচার সাজানো আছে, এবং কিভাবে মাত্র কয়েকটা command দিয়ে পুরো সিস্টেমটা live করা যায়। তো চলুন শুরু করা যাক।", False)
])

# ════════════════════════════════════════════════════════════════════════════
#  PART 2 — ফোল্ডার স্ট্রাকচার
# ════════════════════════════════════════════════════════════════════════════
add_section_heading(doc, "[অংশ ২ — প্রজেক্ট ফোল্ডার স্ট্রাকচার]", "সময়: ০:৩০ – ১:৩০")

add_body(doc, [
    ("ঠিক আছে, এখন আমি আমার screen share করছি। আপনারা দেখতে পাচ্ছেন আমাদের মূল প্রজেক্ট ফোল্ডারটি — এর নাম হলো ", False),
    ("schoolos", True),
    ("। এটাই আমাদের root directory।", False)
])
add_body(doc, [
    ("এই ", False), ("schoolos", True), (" ফোল্ডারের ভেতরে প্রথমেই চোখে পড়বে ", False),
    ("backend/", True), (" ফোল্ডার। এখানে আমাদের সম্পূর্ণ সার্ভার-সাইড কোড আছে। পুরো backend টি Node.js এবং Express.js দিয়ে তৈরি করা হয়েছে।", False)
])
add_body(doc, [
    ("এই ", False), ("backend/", True), (" এর ভেতরে একটি গুরুত্বপূর্ণ ফোল্ডার আছে — ", False),
    ("src/", True), ("। এই ", False), ("src/", True),
    (" এর ভেতরে আপনারা দেখতে পাবেন বেশ কিছু sub-folder:", False)
])

folders = [
    ("controllers/", "এখানে আমাদের সব business logic লেখা আছে — প্রতিটা feature এর জন্য আলাদা controller।"),
    ("routes/", "API endpoints define করা আছে এখানে।"),
    ("models/", "MongoDB এর database schema বা data structure এখানে define করা।"),
    ("services/", "Complex business operations যেমন AI integration, email service — এগুলো এখানে।"),
    ("middleware/", "Authentication, authorization, error handling — সব middleware এখানে।"),
    ("config/", "Database connection ও অন্যান্য configuration এখানে।"),
    ("utils/", "ছোট ছোট helper functions এখানে রাখা আছে।"),
    ("validators/", "User input validation logic এখানে লেখা আছে।"),
]
for folder, desc in folders:
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_after = Pt(3)
    add_run(p, folder, font=CODE_FONT, size=11, bold=True)
    add_run(p, f" — {desc}", size=12)

doc.add_paragraph()

add_body(doc, [
    ("এরপর আছে ", False), ("frontend/", True),
    (" ফোল্ডার। এটা হলো আমাদের Next.js ওয়েব অ্যাপ্লিকেশন — মানে যেটা browser এ দেখা যায়।", False)
])
add_body(doc, [
    ("তারপর আছে ", False), ("mobile/", True),
    (" ফোল্ডার, যেখানে Android mobile app এর কোড আছে।", False)
])
add_body(doc, [
    ("আছে ", False), ("scripts/", True),
    (" ফোল্ডার — কিছু utility scripts রাখা আছে এখানে যেগুলো development কাজে লাগে।", False)
])
add_body(doc, [
    ("অত্যন্ত গুরুত্বপূর্ণ একটি ফাইল হলো ", False), (".env", True),
    (" ফাইল। এখানে আমাদের সব secret configuration থাকে — যেমন database URL, JWT secret key, এবং AI API key। এই ফাইলটি কখনো GitHub এ upload করা হয় না।", False)
])
add_body(doc, [
    ("এবং সবশেষে ", False), ("package.json", True),
    (" — এখানে সব dependency এবং run commands লেখা আছে। তো এটাই ছিলো আমাদের ফোল্ডার স্ট্রাকচারের একটা overview।", False)
])

# ════════════════════════════════════════════════════════════════════════════
#  PART 3 — Backend Live
# ════════════════════════════════════════════════════════════════════════════
add_section_heading(doc, "[অংশ ৩ — Backend কিভাবে Live হয়]", "সময়: ১:৩০ – ২:৪৫")

add_body(doc, [
    ("এখন আমি দেখাবো কিভাবে backend সার্ভারটা চালু করতে হয়। এটা করার জন্য আমাদের Command Prompt বা Terminal দরকার হবে।", False)
])

steps_backend = [
    [("প্রথমে আপনার keyboard এ ", False), ("Windows + R", True), (" চাপুন এবং ", False), ("cmd", True), (" লিখে Enter দিন — Command Prompt খুলে যাবে।", False)],
    [("এখন লিখুন: ", False), ("cd e:\\anti+puku\\schoolos\\backend", True), (" — এবং Enter চাপুন। এতে আমরা backend ফোল্ডারে চলে যাবো।", False)],
    [("এখন চলুন ", False), (".env", True), (" ফাইলটা একটু দেখি। এখানে আমাদের কিছু গুরুত্বপূর্ণ variable সেট করা আছে — ", False),
     ("PORT=5000", True), (", ", False), ("MONGODB_URI", True), (", ", False), ("JWT_SECRET", True), (" এবং আমাদের AI এর জন্য ", False), ("GEMINI_API_KEY", True), ("।", False)],
    [("যদি আপনি প্রথমবার project run করছেন, তাহলে লিখুন ", False), ("npm install", True), (" — এটা দিলে সব প্যাকেজ বা dependency আপনার computer এ install হয়ে যাবে। একটু সময় লাগবে।", False)],
    [("install শেষ হলে এখন লিখুন: ", False), ("npm run dev", True), (" — এবং Enter চাপুন।", False)],
    [("দেখুন console এ message এলো: ", False), ("Server running in development mode on port 5000", True), (" — এর মানে backend সার্ভার সফলভাবে চালু হয়ে গেছে।", False)],
    [("এখন backend সার্ভার ", False), ("http://localhost:5000", True), (" এই address এ live আছে। যেকোনো API call এই address এ আসবে।", False)],
    [("লক্ষ্য করুন, MongoDB database connection ও automatically হয়ে যায়। console এ ", False), ("MongoDB Connected", True), (" message দেখা যাবে।", False)],
    [("এর পাশাপাশি background jobs — যেমন homework reminder notification, AI provider verification — এগুলোও automatically শুরু হয়ে যায় server startup এর সাথে সাথে।", False)],
]
for i, segs in enumerate(steps_backend, 1):
    p = doc.add_paragraph(style='List Number')
    p.paragraph_format.space_after = Pt(5)
    for text, is_code in segs:
        if is_code:
            add_run(p, text, font=CODE_FONT, size=11, bold=True)
        else:
            add_run(p, text, size=13)

doc.add_paragraph()
add_body(doc, [
    ("একটু বলি ", False), ("server.js", True),
    (" ফাইলটা কী করে — এই ফাইলটাই হলো আমাদের backend এর প্রবেশদ্বার। এটি প্রথমে MongoDB database এর সাথে connect করে, তারপর port 5000 এ HTTP server চালু করে, এরপর background jobs শুরু করে, এবং সবশেষে AI provider যেমন Google Gemini কে verify করে।", False)
])

# ════════════════════════════════════════════════════════════════════════════
#  PART 4 — Frontend Live
# ════════════════════════════════════════════════════════════════════════════
add_section_heading(doc, "[অংশ ৪ — Frontend কিভাবে Live হয়]", "সময়: ২:৪৫ – ৩:৩০")

add_body(doc, [
    ("Backend তো চলছে — এবার আমরা frontend চালু করবো। এর জন্য আমাদের একটি নতুন CMD window খুলতে হবে। Backend এর window টা বন্ধ করবেন না — ওটা চলতে থাকুক।", False)
])

steps_frontend = [
    [("Taskbar এ right-click করে অথবা ", False), ("Windows + R", True), (" দিয়ে আরেকটি নতুন Command Prompt খুলুন।", False)],
    [("লিখুন: ", False), ("cd e:\\anti+puku\\schoolos\\frontend", True), (" — Enter চাপুন। এখন আমরা frontend ফোল্ডারে আছি।", False)],
    [("এখন লিখুন: ", False), ("npm run dev", True), (" — এবং Enter চাপুন।", False)],
    [("Next.js এর compile process শুরু হবে। কিছু seconds এর মধ্যে আপনি দেখবেন ", False), ("ready - started server on 0.0.0.0:3000", True), (" লেখা আসবে।", False)],
    [("এর মানে হলো আমাদের web application এখন ", False), ("http://localhost:3000", True), (" এ live হয়ে গেছে।", False)],
    [("এখন browser খুলুন — Chrome বা Firefox যেকোনোটা — এবং address bar এ লিখুন ", False), ("localhost:3000", True), (" — Enter চাপুন।", False)],
    [("দেখুন SchoolOS এর beautiful login page চলে এসেছে! এখান থেকে Admin, Teacher, Student বা Guardian — যেকোনো role এ login করা যাবে।", False)],
]
for segs in steps_frontend:
    p = doc.add_paragraph(style='List Number')
    p.paragraph_format.space_after = Pt(5)
    for text, is_code in segs:
        if is_code:
            add_run(p, text, font=CODE_FONT, size=11, bold=True)
        else:
            add_run(p, text, size=13)

# ════════════════════════════════════════════════════════════════════════════
#  PART 5 — মূল ফিচারগুলো
# ════════════════════════════════════════════════════════════════════════════
add_section_heading(doc, "[অংশ ৫ — সফটওয়্যারের মূল ফিচারগুলো সংক্ষেপে]", "সময়: ৩:৩০ – ৪:৩০")

add_body(doc, [
    ("তো এখন চলুন একটু দেখি এই SchoolOS এ কী কী feature আছে। এটা basically চারটি আলাদা dashboard নিয়ে তৈরি:", False)
])

features = [
    ("Admin Panel", "স্কুলের পুরো সিস্টেম এখান থেকে control করা হয়। ক্লাস তৈরি করা, শিক্ষক যোগ করা, ছাত্র-ছাত্রী ভর্তি করা, notice board manage করা, টাইমটেবিল সাজানো এবং subject পরিচালনা — সব কিছু Admin এর হাতে।"),
    ("Teacher Portal", "শিক্ষকরা এখান থেকে প্রতিদিনের উপস্থিতি নিতে পারবেন, homework assign করতে পারবেন, class test এর নম্বর দিতে পারবেন এবং নিজের class routine দেখতে পারবেন।"),
    ("Student Dashboard", "ছাত্র-ছাত্রীরা তাদের নিজস্ব dashboard এ ঢুকলে দেখতে পাবে তাদের attendance record, exam results, assigned homework, class diary এবং timetable — সব এক জায়গায়।"),
    ("Guardian / Parent Portal", "অভিভাবকরা এই portal থেকে তাদের সন্তানের সব information real-time এ দেখতে পাবেন — উপস্থিতি, পরীক্ষার ফলাফল, homework status সহ সব কিছু।"),
    ("AI Integration", "এই সফটওয়্যারে Google Gemini AI integrate করা আছে। AI দিয়ে automatic report generation, textbook content analysis এবং আরো অনেক smart feature কাজ করে।"),
    ("Role-Based Access Control", "Admin, Teacher, Student, Guardian — প্রত্যেকের জন্য আলাদা dashboard এবং আলাদা permission set করা আছে। কেউ অন্যের data দেখতে বা edit করতে পারবে না।"),
]
for title, desc in features:
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_after = Pt(6)
    add_run(p, f"{title}: ", size=13, bold=True, color=NAVY)
    add_run(p, desc, size=13)

doc.add_paragraph()
add_body(doc, [
    ("এই ছয়টি major feature ছাড়াও আরো অনেক ছোট ছোট feature আছে যেগুলো মিলিয়ে SchoolOS কে একটি সম্পূর্ণ solution করে তুলেছে।", False)
])

# ════════════════════════════════════════════════════════════════════════════
#  PART 6 — সমাপ্তি
# ════════════════════════════════════════════════════════════════════════════
add_section_heading(doc, "[অংশ ৬ — সমাপ্তি]", "সময়: ৪:৩০ – ৫:০০")

add_body(doc, [
    ("তো বন্ধুরা, আজকে আমরা দেখলাম SchoolOS — একটি সম্পূর্ণ full-stack solution যেটা দিয়ে যেকোনো শিক্ষা প্রতিষ্ঠান তাদের পুরো ব্যবস্থাপনা digitally পরিচালনা করতে পারবে।", False)
])
add_body(doc, [
    ("Backend চালু করা থেকে শুরু করে frontend এর login page পর্যন্ত — সব কিছু আমরা live দেখলাম। Admin থেকে Guardian পর্যন্ত সব user এর জন্য আলাদা dashboard, AI integration, এবং real-time data — এই সব কিছু মিলিয়ে SchoolOS সত্যিকারের একটি আধুনিক শিক্ষা ব্যবস্থাপনা প্ল্যাটফর্ম।", False)
])
add_body(doc, [
    ("আপনাদের যদি কোনো প্রশ্ন থাকে তাহলে নিচে comment section এ জানাতে পারেন। আমি সব প্রশ্নের উত্তর দেওয়ার চেষ্টা করবো।", False)
])
add_body(doc, [
    ("ভিডিওটা যদি helpful মনে হয় তাহলে অবশ্যই একটা 👍 Like দিন, বন্ধুদের সাথে Share করুন, এবং আমাদের channel Subscribe করে notification bell টা on রাখুন — কারণ এরকম আরো ভিডিও আসছে।", False)
])
add_body(doc, [
    ("আজকের মতো এতটুকুই। ধন্যবাদ সবাইকে। আল্লাহ হাফেজ! 🙏", False)
])

# ════════════════════════════════════════════════════════════════════════════
#  SPEAKING TIPS TABLE
# ════════════════════════════════════════════════════════════════════════════
add_hr(doc)
tips_title = doc.add_paragraph()
tips_title.paragraph_format.space_before = Pt(12)
tips_title.paragraph_format.space_after  = Pt(6)
add_run(tips_title, "📌 উপস্থাপনার টিপস (Speaking Tips)", size=13, bold=True, color=NAVY)

table = doc.add_table(rows=1, cols=3)
table.style = 'Table Grid'

tips = [
    ("🎙️ ধীরে ধীরে বলুন\nতাড়াহুড়ো না করে প্রতিটি বাক্য clearly বলুন যাতে দর্শক বুঝতে পারে।",
     "🖥️ স্ক্রিনের দিকে Point করুন\nযখন folder বা command দেখাবেন, mouse দিয়ে সেটা highlight করুন।",
     "💪 Confident থাকুন\nক্যামেরার দিকে তাকিয়ে কথা বলুন। ভুল হলেও থামবেন না — চালিয়ে যান।"),
]

cells = table.rows[0].cells
tip_texts = tips[0]
for i, cell in enumerate(cells):
    cell.paragraphs[0].clear()
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after  = Pt(6)
    add_run(p, tip_texts[i], size=11)
    # light blue shading
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), 'E8F4FD')
    tcPr.append(shd)

add_hr(doc)

# final spacing
doc.add_paragraph()

# ── Save ─────────────────────────────────────────────────────────────────────
out_path = r"e:\anti+puku\schoolos\SchoolOS_Bangla_Script.docx"
doc.save(out_path)
print(f"Saved: {out_path}")
