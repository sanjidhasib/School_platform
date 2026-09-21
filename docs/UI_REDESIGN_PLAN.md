# SchoolOS — UI Redesign Plan (Phase 0 Audit)

**Branch:** `ui-redesign` · **Baseline commit:** `b0e0239`
**Scope:** presentation layer only. No backend files, no API endpoints/payloads, no route paths.

---

## 1. Stack audit

| Item | Finding |
| --- | --- |
| Framework | Next.js **14.2.0**, **App Router** (`app/`), React 18, TypeScript 5 (`strict: true`) |
| Styling | Tailwind CSS **3.4**, `@tailwindcss/forms`, PostCSS 8 |
| Tokens | `app/globals.css` declares shadcn-style HSL vars (`--primary`, `--radius: 0.75rem`, …) that **Tailwind never consumes** — `tailwind.config.ts` defines a separate, unrelated `primary/success/warning/danger/neutral` palette. The two systems are disconnected and pages hardcode `blue-600` / `slate-*` directly. No dark theme. |
| UI library | Hand-rolled `components/ui/*` on Radix primitives. **shadcn/ui is not installed** (no `components.json`). Radix packages already present: avatar, dialog, dropdown-menu, label, popover, progress, select, separator, switch, tabs, tooltip |
| Icons | `lucide-react` 0.323 — mixed sizes, no consistent stroke width |
| Toasts | `react-hot-toast` 2.4 (default styling) |
| Charts | `recharts` 2.12 — **installed but never imported** |
| 3D | `three` 0.161 + `@types/three` — **installed but never imported** |
| Data layer | `axios` 1.6, single instance in `lib/api/client.ts` (`withCredentials: true`, 401 interceptor with an anonymous allowlist). No react-query/SWR — every page uses `useEffect` + `useState` |
| Forms | **No form library, no validation library.** Plain controlled `useState` objects + native `required` |
| Auth | `lib/auth-context.tsx` React context → `GET /auth/me`; HTTP-only `accessToken` cookie; `middleware.ts` guards unauthenticated access; each role layout re-checks `user.role` client-side |
| Fonts | `Inter` via `next/font/google`. **No Bangla font loaded** despite Bangla content (`nameBn`) in the database |
| Utilities | `clsx` + `tailwind-merge` (`cn`), `date-fns` 3.3 |
| Total frontend source | **2,891 lines** across 66 files |

### Data and business rules confirmed live against the seeded database

Verified by querying the running API (MongoDB `schoolos`, backend on :5000):

- **School:** Barishal Zilla School — Sadar Road, Barishal Sadar, Barishal-8200, Bangladesh · +880-431-21734 · info@barishal-zillaschool.edu.bd
- **Scale:** 200 students · 15 teachers · 8 classes (Class 3–10, section A) · 40 timetable sessions today
- **Capacity:** every class `capacity: 40`, enrolment currently 22–24. Backend rejects admit at capacity with `409 "Class capacity of 40 has been reached"`
- **School week:** `activeDays: [0,1,2,3,4]` = **Sunday–Thursday** (the Bangladeshi week). The timetable UI hardcodes `[0,1,2,3,4]` in a frontend constant rather than reading settings — it happens to match
- **Periods:** 5 × one hour, 09:00–14:00, from `SchoolSettings.periods`
- **Subjects carry `nameBn`:** Bangla/বাংলা · English/ইংরেজি · Mathematics/গণিত · Science/বিজ্ঞান · ICT/তথ্য ও যোগাযোগ প্রযুক্তি · BGS/বাংলাদেশ ও গ্লোবাল স্টাডিজ · History & Social Science/ইতিহাস ও সামাজিক বিজ্ঞান · Religion & Moral Values/ধর্ম ও নৈতিক শিক্ষা. **The UI renders none of them.**
- **Grading scale** (from settings, not hardcoded): A+ ≥80 (5.0), A ≥70 (4.0), A- ≥60 (3.5), B ≥50 (3.0), C ≥40 (2.0), D …
- **Timetable conflicts:** `409 "Class already has a subject at {time} on this day"` and `409 "Teacher is already assigned to another class at {time} on this day"`
- **Real names for design work:** students e.g. Sima Islam (STU001, Class 3 A); teachers e.g. Md. Abul Kalam, Shahida Akter, Md. Shahidul Islam

---

## 2. Page inventory

Routes that exist today. **Every path below stays unchanged.**

### Public and auth

| Route | File | Data sources | Forms / actions | Modals | States present |
| --- | --- | --- | --- | --- | --- |
| `/` | `app/(public)/page.tsx` (server component) | `publicAPI.getAchievements()`, `getUpcoming()`, `getSchool()` in one `Promise.all`, `try/catch` to empty arrays | Links to `/login` (×3) | — | Sections hidden when empty; no loading or error UI |
| `/login` | `app/(auth)/login/page.tsx` | `useAuth().login()` → `POST /auth/login` | username + password, submit, role-based redirect | — | `loading`, toast error from `response.data.message/error` |

The landing page also renders a **7-slide hardcoded image carousel** (`SCHOOL_SLIDES`, files in `public/school-images/`) and **hardcoded stats** reading "400+ students / Classes 3–10".

### Admin (9 pages)

| Route | Data sources | Forms / actions | Modals | States |
| --- | --- | --- | --- | --- |
| `/admin/dashboard` | `getDashboard()` | — | — | skeleton, empty (no classes today) |
| `/admin/students` | `getStudents({search, classId})`, `getClasses()` | create, edit, delete | add/edit dialog, delete confirm | skeleton, empty, saving, toast |
| `/admin/teachers` | `getTeachers({search})` | create, edit, delete | add/edit dialog, delete confirm | skeleton, empty, saving, toast |
| `/admin/classes` | `getClasses()` | **create only** | add dialog | skeleton, empty |
| `/admin/subjects` | `getSubjects()` | create, delete | add dialog, delete confirm | skeleton, empty |
| `/admin/assignments` | `getAssignments()`, `getTeachers()`, `getClasses()`, `getSubjects()` | create, delete | add dialog, delete confirm | skeleton, empty |
| `/admin/timetable` | `getClasses()`, `getAssignments()`, `getTimetable({classId})` | **create only** (click an empty cell, or "Add Entry") | add dialog | empty ("select a class"); conflicts surface as a toast |
| `/admin/notices` | `getNotices()` | **create only** (forces `status: 'PUBLISHED'`) | add dialog | skeleton, empty |
| `/admin/achievements` | `getAchievements()` | **create only** | add dialog | skeleton, empty |

### Teacher (4 pages)

| Route | Data sources | Forms / actions | Modals | States |
| --- | --- | --- | --- | --- |
| `/teacher/dashboard` | `getTodaySchedule()` | "Take attendance" pushes to `/teacher/attendance` | — | empty ("No classes today"); `pendingGrading` chip |
| `/teacher/attendance` | `getTodaySchedule()`, `createAttendanceSession()`, `getAttendanceSession(id)`, `saveAttendance(id)` | pick session → mark roster → save. Status changes by **cycling a badge** Present → Absent → Leave | — (two in-page steps: `select` / `mark`) | live counts, saving, empty |
| `/teacher/homework` | `getHomework()`, `adminAPI.getAssignments()`, `getHomeworkSubmissions(id)`, `gradeSubmission(id)` | create homework; grade a submission via **`window.prompt()`** | create dialog | empty; no loading state on submissions |
| `/teacher/results` | `getAssessments()`, `adminAPI.getAssignments()` | **none wired** — "Enter Marks" has no handler | — | empty states only |

### Student (6 pages)

| Route | Data sources | Forms / actions | Modals | States |
| --- | --- | --- | --- | --- |
| `/student/dashboard` | `getDashboard()` | links to AI Learning and homework | — | skeleton |
| `/student/attendance` | `getAttendance()` | — | — | skeleton, empty |
| `/student/homework` | `getHomework()`, `submitHomework(id)` | submit a text answer | submit dialog | skeleton, empty, submitting |
| `/student/results` | `getResults()` | — | — | skeleton, empty |
| `/student/notifications` | `getNotifications()`, `markNotificationRead(id)`, `markAllRead()` | mark one read (row click), mark all read | — | empty; read/unread styling |
| `/student/ai-learning` | `aiAPI.getSessions/createSession/getSession/sendMessage`, `studentAPI.getDashboard()`, `adminAPI.getSubjects({classId})` | pick subject + EN/BN, new chat, open session, send message, quick replies | — | typing indicator, AI-unavailable fallback message |

### Guardian (2 pages)

| Route | Data sources | Forms / actions | Modals | States |
| --- | --- | --- | --- | --- |
| `/guardian/dashboard` | `getDashboard()` | child switcher (pills, shown only when more than one child) | — | skeleton, "No linked children found" |
| `/guardian/reports` | `getChildren()`, `downloadChildReport(id)` | child select, term select, download PDF blob | — | `downloading` |

### Shared

| Route | Data sources | Actions |
| --- | --- | --- |
| `/profile` | `useAuth()`, `PATCH /profile`, `PATCH /auth/change-password` | update email and phone; change password |

### API functions that exist but that no UI calls

- `adminAPI`: `getSettings`, `updateSettings`, `getTeacher`, `updateClass`, `getClassStudents`, `updateSubject`, `updateAssignment`, `updateTimetableEntry`, `deleteTimetableEntry`, `updateNotice`, `deleteNotice`, `updateAchievement`, `deleteAchievement`
- `teacherAPI`: `getAttendanceHistory`, `createAssessment`, `saveMarks`, `saveGrades`
- `studentAPI`: `downloadReport`
- `guardianAPI`: `getChildAttendance`, `getChildHomework`, `getChildResults`, `getNotifications`
- `authAPI`: `register`, `changePassword` (the profile page calls the raw axios client instead)

---

## 3. Existing components → replacements

| Today | Replacement | Note |
| --- | --- | --- |
| `components/ui/button.tsx` | `Button` restyled to tokens | radius 8px, tokenised focus ring, `loading` prop with an inline spinner |
| `components/ui/input.tsx`, `label.tsx`, `textarea.tsx` | `Input`, `Label`, `Textarea`, plus a new `Field` wrapper | radius 6px; label, description and error handled in one place |
| `components/ui/select.tsx` | `Select` restyled, plus a new `Combobox` (cmdk) | searchable pickers for teacher, class and subject |
| `components/ui/dialog.tsx` | `Dialog` (radius 16px) and a **new `Sheet`** | side sheets replace dialogs for add/edit forms |
| `components/ui/table.tsx` | `DataTable` (@tanstack/react-table) plus `Table` primitives | sorting, row actions, sticky header, stacked rows on mobile |
| `components/ui/card.tsx` | `Card`, **used far less** | only for real objects: a teacher, an achievement, a homework |
| `components/ui/badge.tsx` | `Badge` and `StatusPill` | icon plus text, never colour alone |
| `components/ui/tabs.tsx` | `Tabs` with a sliding indicator (`layoutId`) | |
| `components/ui/progress.tsx` | `Progress` plus a new `CapacityBar` | the capacity bar knows the 40 limit |
| `components/ui/avatar.tsx` | `Avatar` | deterministic tint per person, tokenised |
| `components/ui/skeleton.tsx`, `shared/LoadingSkeleton.tsx` | `Skeleton` plus shape-specific skeletons | skeletons match the shape of the real content |
| `shared/StatCard.tsx` | **deleted**, replaced by `SummaryStrip` | removes the row of four identical icon cards |
| `shared/StatusBadge.tsx` | `StatusPill` | one status vocabulary across attendance, homework and assessments |
| `shared/PageHeader.tsx` | `PageHeader` | title, description, actions; sentence case |
| `shared/EmptyState.tsx` | `EmptyState` | requires a next action; subject-specific illustration |
| `shared/ConfirmDialog.tsx` | `ConfirmDialog` | names the record; destructive variant |
| `shared/SchoolCarousel.tsx` | kept, restyled | still driven by the same local image list |
| `layout/Sidebar.tsx` | `AppSidebar` | grouped sections, moving active indicator, collapse to icons |
| `layout/Header.tsx` | `Topbar` | breadcrumb, `Ctrl K` search trigger, theme toggle, notification popover, avatar menu (today a CSS `group-hover` menu, which is not keyboard accessible) |
| `layout/DashboardShell.tsx` | `AppShell` | adds mobile bottom nav, command palette, route crossfade |
| — | **new**: `TimetableGrid`, `SubjectChip`, `BilingualLabel`, `CommandPalette`, `ThemeToggle`, `MobileNav` | |
| `react-hot-toast` | `sonner`, restyled | wording matches the button that triggered it |

---

## 4. Dependencies to add

| Package | Why |
| --- | --- |
| shadcn/ui primitives, copied in and restyled to SchoolOS tokens | Sheet, Dropdown, Popover, Tooltip, Command on Radix — the Radix dependencies are already installed |
| `@radix-ui/react-toggle-group`, `@radix-ui/react-scroll-area`, `@radix-ui/react-slot` | segmented attendance control, scroll containers, `asChild` on Button |
| `framer-motion` | sidebar `layoutId` indicator, tab indicator, dialog and sheet transitions, route crossfade, count animation. Wrapped in `MotionConfig reducedMotion="user"` |
| `sonner` | toasts, restyled |
| `@tanstack/react-table` | admin tables: sorting, column sizing, row actions |
| `cmdk` | command palette and searchable comboboxes |
| `next-themes` | light and dark, without a flash |
| an ESLint config file | **ESLint is not configured today**, so `next lint` prompts interactively and cannot run in CI |

Already installed and reused: `recharts` (used at last, and only where a real series exists), `lucide-react`, `clsx`, `tailwind-merge`, `date-fns`, `class-variance-authority`.

**Not adding:** `@react-three/fiber` and `drei`. The landing concept uses a real dashboard preview rather than 3D, so it does not need them. `three` stays an unused dependency unless you want it removed.

**Not changing:** axios, the API modules, the auth context, middleware, and the route guards.

---

## 5. Functionality checklist (re-test at the end)

**Auth and shell**
- [ ] Log in as admin / teacher001 / student001 / guardian001 and land on the correct role dashboard
- [ ] Wrong password shows the server error message
- [ ] Logout returns to `/login`; a protected route while logged out redirects to `/login`
- [ ] A role hitting another role's route is redirected
- [ ] Profile: update email and phone; change password (a wrong current password shows an error)

**Admin**
- [ ] Dashboard: totals and today's routine render from `/admin/dashboard`
- [ ] Students: search, filter by class, add, edit, delete (the confirm names the student)
- [ ] Students: assigning to a class at 40/40 is blocked and explains why
- [ ] Teachers: search, add, edit, delete
- [ ] Classes: list with enrolment against capacity; create a class
- [ ] Subjects: list, create, delete
- [ ] Assignments: create teacher → class → subject; duplicate or conflict error is shown; delete
- [ ] Timetable: pick a class, create an entry in an empty slot; a class conflict shows the `409` message; a teacher conflict shows the `409` message
- [ ] Notices: create and publish. Achievements: create
- [ ] Every list still reads from the API — nothing hardcoded

**Teacher**
- [ ] Dashboard shows today's schedule and the `pendingGrading` count
- [ ] Attendance: open a scheduled session, mark Present/Absent/Leave, watch the live counts, save successfully
- [ ] Homework: create one, open it, grade a submission, and see the marks persist
- [ ] Results: the assessments list loads

**Student**
- [ ] Dashboard: attendance percentage, pending homework, notices
- [ ] Attendance: summary and per-session records
- [ ] Homework: pending and submitted lists, submit an answer, overdue is marked
- [ ] Results: subject grades and assessment marks
- [ ] Notifications: mark one read, mark all read
- [ ] AI Learning: pick a subject, switch EN/BN, start a chat, send a message, receive a reply, use quick replies

**Guardian**
- [ ] Dashboard: child switcher, attendance percentage, pending homework, grades
- [ ] Reports: select a child and term, download the PDF

**Cross-cutting**
- [ ] Bangla renders correctly everywhere it appears
- [ ] No horizontal page overflow at 375px
- [ ] Keyboard: every action reachable, focus visible, dialogs trap focus
- [ ] `git diff --stat` touches no `backend/` file

---

## 6. Baseline: run and build

**Runtime works.** MongoDB is running, the backend connects (`MongoDB Connected: localhost`, port 5000), the seeded data is present, and all four demo logins return `200`.

**The production build fails today, before any redesign work.**

`npx next build` stops at the first type error. `npx tsc --noEmit` lists **9 pre-existing errors**:

```
app/(auth)/login/page.tsx(27,38): TS2339: Property 'username' does not exist on type 'void'.
app/(auth)/login/page.tsx(34,36): TS2339: Property 'role' does not exist on type 'void'.
app/(public)/page.tsx(153,32):    TS7006: Parameter 'a' implicitly has an 'any' type.
app/(public)/page.tsx(175,40):    TS7006: Parameter 'n' implicitly has an 'any' type.
app/admin/timetable/page.tsx(72,110):  TS7006: Parameter 'f' implicitly has an 'any' type.
app/admin/timetable/page.tsx(73,89):   TS7006: Parameter 'f' implicitly has an 'any' type.
app/admin/timetable/page.tsx(76,112):  TS7006: Parameter 'f' implicitly has an 'any' type.
app/admin/timetable/page.tsx(77,108):  TS7006: Parameter 'f' implicitly has an 'any' type.
app/admin/timetable/page.tsx(79,121):  TS7006: Parameter 'f' implicitly has an 'any' type.
```

The two login errors are a **type-signature mismatch only**: `AuthContextType.login` is declared as returning `Promise<void>`, but the implementation returns the user object, which the login page then reads. The runtime behaviour is already correct; only the declared type is wrong.

Other pre-existing issues found, **not fixed**, listed for your decision:

1. **`GET /api/public/school` returns almost nothing.** `publicController.getSchool` does `.select('schoolName logoUrl address phone email')`, but `SchoolSettings` stores `name`, `contactPhone` and `contactEmail`. The live response is `{_id, logoUrl, address}` only. The landing page's `school?.schoolName` is therefore always undefined and falls back to a **hardcoded** `'Barishal Zilla School'`, and the footer contact block never renders. This is a backend fix, which is out of scope here.
2. **`AiMessage` enum mismatch.** The model allows `role: ['user','assistant']` while `aiController` writes `'USER'` and `'ASSISTANT'`. Backend, so out of scope, but it needs verifying that AI chat history actually persists.
3. **`frontend/package-lock.json` is 0 bytes**, which makes Next print `SyntaxError: Unexpected end of JSON input` on every build. Harmless but noisy; regenerating it is a one-line fix if you want it.
4. **ESLint is not configured** — there is no `.eslintrc*`, so `next lint` prompts interactively and cannot run in CI.
5. **The landing page hardcodes operational data**: "400+" students (the real figure is 200) and the achievements count badge.
6. **`/register` has no page**, yet `middleware.ts` matches `/register` and `authAPI.register` exists.
7. `cookies.txt` and `public/login-test.html` look like leftover debugging artefacts.

---

## 7. Scope gaps — decisions needed before Phase 2

The brief's Section 7 describes a product noticeably larger than what is built. Rule 1 says existing functionality must stay identical; it does not say whether missing functionality should be built. These are the gaps.

**Pages described in Section 7 that do not exist**

| Role | Missing page |
| --- | --- |
| Public | `/register` (account type, stepped form, password checklist, guardian–student linking) |
| Admin | Attendance, Homework, Results, Notifications, Settings; student profile with tabs; class detail with tabs; teacher detail |
| Teacher | Marks (spreadsheet grid with keyboard navigation), Schedule (day and week) |
| Guardian | Notifications, Attendance, Results |

**Behaviour described in Section 7 that is not wired, although the API exists**

- Teacher **Results**: "Enter Marks" has no handler; `createAssessment`, `saveMarks` and `saveGrades` are never called; "Final Grades" is a placeholder
- Admin **edit and delete** are missing for classes, notices, achievements, subjects (edit), assignments (edit) and timetable entries
- The Admin **Settings** page does not exist (`getSettings` and `updateSettings` are unused)
- **Class capacity 40 is enforced only by the backend** — no UI disables a full class or explains why
- The student **report card download** (`studentAPI.downloadReport`) has no button
- Student homework has no file or drag-and-drop submission (text answer only) and no All/Pending/Submitted/Graded/Overdue tabs
- Student attendance has no month calendar
- Guardian: `getChildAttendance`, `getChildHomework` and `getChildResults` are unused
- AI Learning has no per-source citation chips (only a generic line) and no "not found in the textbook" state
- There is no command palette, dark mode, topbar search, notification bell or mobile bottom nav anywhere

**Default approach unless you direct otherwise:** redesign the presentation of everything that exists, and wire up only what is *purely presentational surfacing of an already-called endpoint* — for example showing `nameBn`, showing capacity bars, and replacing `window.prompt()` grading with a proper form against the same `gradeSubmission` call. Anything needing a **new page or a new API call** is left out and reported, because that would be new functionality rather than a redesign.
