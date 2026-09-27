/**
 * NCTB subjects by class, as in the textbooks NCTB currently prints.
 *
 * In 2025 NCTB withdrew the 2021 curriculum for Classes 6–10 and returned to
 * the (revised) 2012 curriculum, so those classes follow the 2012 subject
 * list; primary (Classes 3–5) is unchanged. Nothing here is applied on its
 * own — the admin previews a class's list and adds what the school teaches.
 *
 * `code` is what links a catalogue entry to a subject already in the
 * database; the eight codes the app was seeded with are reused.
 */

const S = (code, name, nameBn, group = 'Compulsory') => ({ code, name, nameBn, group });

const PRIMARY = [
  S('BAN', 'Bangla', 'বাংলা'),
  S('ENG', 'English', 'ইংরেজি'),
  S('MAT', 'Mathematics', 'গণিত'),
  S('BGS', 'Bangladesh & Global Studies', 'বাংলাদেশ ও বিশ্বপরিচয়'),
  S('SCI', 'Primary Science', 'প্রাথমিক বিজ্ঞান'),
  S('REL', 'Religion & Moral Education', 'ধর্ম ও নৈতিক শিক্ষা'),
];

const JUNIOR = [
  S('BAN', 'Bangla 1st Paper', 'বাংলা ১ম পত্র'),
  S('BAN2', 'Bangla 2nd Paper', 'বাংলা ২য় পত্র'),
  S('ENG', 'English 1st Paper', 'ইংরেজি ১ম পত্র'),
  S('ENG2', 'English 2nd Paper', 'ইংরেজি ২য় পত্র'),
  S('MAT', 'Mathematics', 'গণিত'),
  S('SCI', 'Science', 'বিজ্ঞান'),
  S('BGS', 'Bangladesh & Global Studies', 'বাংলাদেশ ও বিশ্বপরিচয়'),
  S('ICT', 'ICT', 'তথ্য ও যোগাযোগ প্রযুক্তি'),
  S('REL', 'Religion & Moral Education', 'ধর্ম ও নৈতিক শিক্ষা'),
  S('AGR', 'Agriculture Studies', 'কৃষিশিক্ষা', 'Optional'),
  S('HSC', 'Home Science', 'গার্হস্থ্য বিজ্ঞান', 'Optional'),
  S('PEH', 'Physical Education & Health', 'শারীরিক শিক্ষা ও স্বাস্থ্য'),
  S('WLE', 'Work & Life-Oriented Education', 'কর্ম ও জীবনমুখী শিক্ষা'),
  S('ART', 'Arts & Crafts', 'চারু ও কারুকলা'),
];

const SECONDARY = [
  S('BAN', 'Bangla 1st Paper', 'বাংলা ১ম পত্র'),
  S('BAN2', 'Bangla 2nd Paper', 'বাংলা ২য় পত্র'),
  S('ENG', 'English 1st Paper', 'ইংরেজি ১ম পত্র'),
  S('ENG2', 'English 2nd Paper', 'ইংরেজি ২য় পত্র'),
  S('MAT', 'Mathematics', 'গণিত'),
  S('ICT', 'ICT', 'তথ্য ও যোগাযোগ প্রযুক্তি'),
  S('REL', 'Religion & Moral Education', 'ধর্ম ও নৈতিক শিক্ষা'),
  S('PEH', 'Physical Education, Health & Sports', 'শারীরিক শিক্ষা, স্বাস্থ্য বিজ্ঞান ও খেলাধুলা'),
  S('CAR', 'Career Education', 'ক্যারিয়ার শিক্ষা'),
  S('PHY', 'Physics', 'পদার্থবিজ্ঞান', 'Science group'),
  S('CHE', 'Chemistry', 'রসায়ন', 'Science group'),
  S('BIO', 'Biology', 'জীববিজ্ঞান', 'Science group'),
  S('HMA', 'Higher Mathematics', 'উচ্চতর গণিত', 'Science group'),
  S('BGS', 'Bangladesh & Global Studies', 'বাংলাদেশ ও বিশ্বপরিচয়', 'Science group'),
  S('SCI', 'General Science', 'বিজ্ঞান', 'Humanities & Business'),
  S('HIS', 'History of Bangladesh & World Civilisation', 'বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা', 'Humanities group'),
  S('GEO', 'Geography & Environment', 'ভূগোল ও পরিবেশ', 'Humanities group'),
  S('ECO', 'Economics', 'অর্থনীতি', 'Humanities group'),
  S('CIV', 'Civics & Citizenship', 'পৌরনীতি ও নাগরিকতা', 'Humanities group'),
  S('ACC', 'Accounting', 'হিসাববিজ্ঞান', 'Business group'),
  S('FIN', 'Finance & Banking', 'ফিন্যান্স ও ব্যাংকিং', 'Business group'),
  S('BEN', 'Business Entrepreneurship', 'ব্যবসায় উদ্যোগ', 'Business group'),
  S('AGR', 'Agriculture Studies', 'কৃষিশিক্ষা', 'Optional'),
];

function curriculumFor(grade) {
  const g = Number(grade);
  if (g >= 1 && g <= 5) return g >= 3 ? PRIMARY : PRIMARY.filter((s) => !['BGS', 'SCI'].includes(s.code));
  if (g >= 6 && g <= 8) return JUNIOR;
  if (g === 9 || g === 10) return SECONDARY;
  return [];
}

const SOURCE_NOTE =
  'NCTB textbooks in print: primary curriculum for Classes 3–5; the revised 2012 curriculum NCTB returned to in 2025 for Classes 6–10.';

module.exports = { curriculumFor, SOURCE_NOTE };
