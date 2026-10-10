import type { CarouselSlide } from '@/components/shared/SchoolCarousel';

/**
 * The homepage carousel's five slides. The admin can replace each slide's
 * picture in Settings; the text stays as written here (and in the Bangla
 * dictionary).
 */
/*
  "Explore SchoolOS" leads to sign-in: the one public entry point into
  SchoolOS, and where each role's own pages begin.
*/
export const SLIDES: CarouselSlide[] = [
  {
    id: 'manage',
    title: 'Smart School Management',
    description:
      'SchoolOS brings students, teachers, guardians, and administrators together in one digital platform.',
    image: '/school-images/bzs-campus.jpg',
    alt: 'Students of Barishal Zilla School gathered on the school field',
    href: '/login',
  },
  {
    id: 'learn',
    title: 'Learn Smarter',
    description:
      'Help students learn through organized academic resources and an intelligent AI-powered learning assistant.',
    image: '/school-images/slide-8.jpg',
    alt: 'Shelves of books in a library',
    href: '/login',
  },
  {
    id: 'teach',
    title: 'Empower Teachers',
    description:
      'Teachers can manage attendance, academic results, classes, and student information from one place.',
    image: '/school-images/slide-4.jpg',
    alt: 'A teacher at the blackboard while a student raises a hand',
    href: '/login',
  },
  {
    id: 'connect',
    title: 'Stay Connected',
    description:
      "Guardians can easily monitor attendance, results, notices, and their child's academic progress.",
    image: '/school-images/bzs-guardian-meeting.jpg',
    alt: 'A meeting with guardians in the Barishal Zilla School auditorium',
    href: '/login',
  },
  {
    id: 'platform',
    title: 'One Platform. Every School.',
    description:
      'SchoolOS digitizes everyday school activities and creates a connected learning environment.',
    image: '/school-images/slide-5.jpg',
    alt: 'A school building across a green lawn',
    href: '/login',
  },
];
