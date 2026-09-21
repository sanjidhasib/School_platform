import { Suspense } from 'react';
import Link from 'next/link';
import { publicAPI } from '@/lib/api/public';
import { SchoolCarousel } from '@/components/shared/SchoolCarousel';
import { GraduationCap, BookOpen, Users, Award, Calendar, Phone, Mail, MapPin } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const SCHOOL_SLIDES = [
  {
    src: '/school-images/slide-1.jpg',
    alt: 'Barishal Zilla School main building',
    caption: 'A Historic Institution of Learning in Barishal',
  },
  {
    src: '/school-images/slide-3.jpg',
    alt: 'Classroom learning',
    caption: 'Modern Classrooms with Interactive Learning',
  },
  {
    src: '/school-images/slide-4.jpg',
    alt: 'Library and study area',
    caption: 'Well-Stocked Library for Curious Minds',
  },
  {
    src: '/school-images/slide-5.jpg',
    alt: 'Students in science lab',
    caption: 'Hands-On Science & ICT Laboratories',
  },
  {
    src: '/school-images/slide-6.jpg',
    alt: 'School assembly',
    caption: 'Morning Assembly & Co-curricular Activities',
  },
  {
    src: '/school-images/slide-7.jpg',
    alt: 'Sports field',
    caption: 'Sports & Physical Education for Holistic Growth',
  },
  {
    src: '/school-images/slide-8.jpg',
    alt: 'School campus',
    caption: 'A Green Campus in the Heart of Barishal',
  },
];

async function getPublicData() {
  try {
    const [achievements, upcoming, school] = await Promise.all([
      publicAPI.getAchievements(),
      publicAPI.getUpcoming(),
      publicAPI.getSchool(),
    ]);
    return {
      achievements: achievements.data.data,
      upcoming: upcoming.data.data,
      school: school.data.data,
    };
  } catch {
    return { achievements: [], upcoming: [], school: null };
  }
}

export default async function HomePage() {
  const { achievements, upcoming, school } = await getPublicData();
  const schoolName = school?.schoolName || 'Barishal Zilla School';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      {/* Nav */}
      <nav className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg">SchoolOS</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Login
            </Link>
            <Link
              href="/login"
              className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Carousel */}
      <section className="max-w-7xl mx-auto px-4 pt-8">
        <SchoolCarousel slides={SCHOOL_SLIDES} autoPlay intervalMs={5000} />
      </section>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <BookOpen className="h-4 w-4" />
            Classes 3–10 · Bangladesh Curriculum
          </div>
          <h1 className="text-5xl font-bold text-slate-900 leading-tight">
            {schoolName}
          </h1>
          <p className="text-xl text-slate-600 mt-4">
            Digital School Management &amp; Personalized Learning Platform
          </p>
          {school?.address && (
            <p className="text-slate-500 mt-2 flex items-center justify-center gap-1">
              <MapPin className="h-4 w-4" /> {school.address}
            </p>
          )}

          <div className="flex justify-center gap-4 mt-8">
            <Link
              href="/login"
              className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
            >
              Sign In
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mt-12 text-center">
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <Users className="h-6 w-6 text-blue-600 mx-auto mb-1" />
            <p className="text-xs text-slate-500">Students</p>
            <p className="font-bold text-slate-900">400+</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <BookOpen className="h-6 w-6 text-green-600 mx-auto mb-1" />
            <p className="text-xs text-slate-500">Classes</p>
            <p className="font-bold text-slate-900">3–10</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <Award className="h-6 w-6 text-purple-600 mx-auto mb-1" />
            <p className="text-xs text-slate-500">Achievements</p>
            <p className="font-bold text-slate-900">{achievements.length}+</p>
          </div>
        </div>
      </section>

      {/* Achievements */}
      {achievements.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">School Achievements</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {achievements.map((a: any) => (
              <div
                key={a._id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="h-10 w-10 rounded-xl bg-yellow-100 flex items-center justify-center mb-3">
                  <Award className="h-5 w-5 text-yellow-600" />
                </div>
                <h3 className="font-semibold text-slate-900">{a.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{a.description}</p>
                <p className="text-xs text-slate-400 mt-2">{formatDate(a.achievementDate)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Events */}
      {upcoming.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Upcoming Events</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {upcoming.slice(0, 6).map((n: any) => (
              <div
                key={n._id}
                className="flex items-start gap-4 bg-white rounded-xl border border-slate-200 p-5"
              >
                <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{n.title}</h3>
                  <p className="text-sm text-slate-500">
                    {n.description ? n.description.slice(0, 80) + '…' : ''}
                  </p>
                  <p className="text-xs text-blue-600 font-medium mt-1">
                    {formatDate(n.eventDate)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-sm text-slate-500">
          <p className="font-medium text-slate-700">© 2026 {schoolName}. Powered by SchoolOS.</p>
          {(school?.contactPhone || school?.contactEmail) && (
            <p className="mt-2 flex items-center justify-center gap-4 flex-wrap">
              {school?.contactPhone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> {school.contactPhone}
                </span>
              )}
              {school?.contactEmail && (
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" /> {school.contactEmail}
                </span>
              )}
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}
