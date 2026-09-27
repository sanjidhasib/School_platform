import { redirect } from 'next/navigation';

/**
 * Teachers are assigned on each class's page now (Classes → a class →
 * Subjects & teachers), so the separate Assignments screen is retired.
 */
export default function AssignmentsRedirect() {
  redirect('/admin/classes');
}
