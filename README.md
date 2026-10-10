# SchoolOS

**Digital School Management & Personalized Learning Platform**
A Bangladesh High-School Education Workflow System (Classes 3–10)

---

## Overview

SchoolOS is a full-stack web application that digitises the daily academic
workflow of a Bangladeshi school. It serves four roles — **Admin, Teacher,
Student, Guardian** — through a clean, database-driven responsive interface.

| Layer    | Technology                                    |
| -------- | --------------------------------------------- |
| Frontend | Next.js 14 + React + Tailwind CSS + Three.js  |
| Backend  | Node.js + Express REST API                    |
| Database | MongoDB + Mongoose                            |
| AI       | Google Gemini API + textbook-grounded RAG     |

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 6+ (local or Atlas)
- Git

### 1. Clone and install
```bash
git clone <repo>
cd schoolos

# Install backend
cd backend && npm install

# Install frontend
cd ../frontend && npm install
```

### 2. Configure environment

**Backend** — copy `.env.example` to `.env` and fill in values:
```bash
cd backend
cp .env.example .env
# Edit .env: set MONGODB_URI, JWT_SECRET, GEMINI_API_KEY
```

**Frontend** — copy `.env.local.example` to `.env.local`:
```bash
cd frontend
cp .env.local.example .env.local
```

### 3. Seed demo data
```bash
cd backend
npm run seed
```
This creates:
- **Admin**: `admin@barishal-zillaschool.edu.bd` / `Admin@123`
- 15 teachers (e.g., `teacher001@barishal-zillaschool.edu.bd` / `Teacher@123`)
- 200+ students across Classes 3–10
- Full timetable, attendance history, homework, marks, and grades
- School: **Barishal Zilla School**

### 4. Start development servers
```bash
# Terminal 1 — Backend (port 5000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 3000)
cd frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Demo Accounts

| Role     | Email                                   | Password       |
| -------- | --------------------------------------- | -------------- |
| Admin    | admin@barishal-zillaschool.edu.bd       | Admin@123      |
| Teacher  | teacher001@barishal-zillaschool.edu.bd  | Teacher@123    |
| Student  | student001@barishal-zillaschool.edu.bd  | Student@123    |
| Guardian | guardian001@barishal-zillaschool.edu.bd | Guardian@123   |

---

## Project Structure

```
schoolos/
  frontend/         # Next.js 14 App Router
  backend/          # Node.js + Express API
  scripts/          # Utility scripts
  docs/             # SRS and documentation
  docker-compose.yml
  README.md
```

---

## Hosting

To put SchoolOS online (Vercel + Render + MongoDB Atlas), follow [DEPLOY.md](DEPLOY.md).

## Docker (Optional)

```bash
# Start MongoDB only
docker-compose up -d mongodb

# Or start everything
docker-compose up -d
```

---

## Key Features

- **Admin**: Full school configuration — teachers, students, classes, timetable, subjects, assignments
- **Timetable**: Weekly schedule with conflict detection (class & teacher)
- **Attendance**: Session-based with batch save and guardian notifications
- **Homework**: Create → Submit → Grade workflow with missing-homework alerts
- **Results**: Assessment marks + subject grades with configurable grading scale
- **AI Learning**: RAG-powered textbook-grounded tutoring in Bangla or English
- **Progress Reports**: PDF download for students and guardians
- **Responsive**: Desktop, tablet and mobile layouts

---

## Architecture

```
Browser ─▶ Next.js (port 3000)
              │
              ▼ REST API (withCredentials)
           Express (port 5000)
              │
              ▼
         ┌────┴────┐
         ▼         ▼
      MongoDB   Gemini API
      (data)    (AI only)
```

---

## SRS Reference

See `docs/SRS-v2.0.md` for the complete Software Requirements Specification.

---

## License

Private — Barishal Zilla School demo implementation.
