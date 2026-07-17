# PRISM — AI-Powered Assessment Platform

> **P**latform for **R**eal-time **I**ntelligent **S**tudent **M**easurement — A comprehensive AI-powered assessment system for Gordon College — College of Computer Studies (CCS). Generate, assign, take, and analyze assessments with real-time analytics and anti-cheat integrity monitoring.

[![Live Demo](https://img.shields.io/badge/demo-live-22c55e?style=for-the-badge)](https://prismgcccs.app) [![Angular](https://img.shields.io/badge/Angular_19-DD0031?style=for-the-badge&logo=angular&logoColor=white)]() [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)]() [![PWA Ready](https://img.shields.io/badge/PWA-ready-8B5CF6?style=for-the-badge)]() [![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)]()

---

## What It Does

PRISM is a full-stack educational assessment platform connecting instructors and students. Instructors can generate AI-powered assessments, assign them to classes, and get real-time analytics. Students take assessments in a secure environment with integrity monitoring, receive AI-generated performance insights, and track their progress over time.

```
┌──────────────────────────────────────────────────────────────────┐
│                      Client (PWA)                                │
│  Angular 19 · Tailwind CSS 4 · Angular Material · Chart.js      │
│  Firebase Auth · AES-256-GCM Encryption · Service Worker        │
├────────────────┬────────────────┬───────────────────────────────┤
│   Instructor   │    Student     │          Admin                │
│  Dashboard     │  Dashboard     │  System Overview              │
│  AI Generation │  Take Exam     │  User Management              │
│  Analytics     │  History       │  Settings                     │
│  Results       │  Results       │                               │
├────────────────┴────────────────┴───────────────────────────────┤
│                     REST API (prismgcccs.app)                    │
│  User · Instructor · Student · Submission · Settings · Admin    │
├──────────────────────────────────────────────────────────────────┤
│                  AI Microservices                                │
│  Nebius AI Studio · Groq · Custom AI Worker · AI Analytics      │
│  Assessment Generation · Performance Insights · Skill Eval      │
└──────────────────────────────────────────────────────────────────┘
```

### Key Features

- **AI-Powered Assessment Generation** — Generate assessments from any course topic using multiple AI backends (Nebius, Groq, Custom AI Worker). Supports PDF/DOCX/PPTX upload for context-aware question generation.
- **Multiple Question Types** — Multiple Choice, True/False, Identification, Enumeration, and Essay questions.
- **Secure Assessment Environment** — Tab-switch detection, DevTools blocking, copy/paste prevention, window focus monitoring, inactivity detection, and screenshot attempt logging. High-integrity exam mode with real-time violation tracking.
- **Real-Time Analytics** — Instructor dashboards with live SSE streaming, class performance comparisons, topic analysis, performance trends, and exportable PDF reports.
- **Role-Based Dashboards** — Three distinct portals for Instructors, Students, and Admins, each with tailored tools and data.
- **Class Management** — Create/join classes via codes, approve pending applications, import students from CSV/Excel, and archive inactive classes.
- **Mastery-Based Assessment** — Track student mastery levels with detailed breakdowns by topic and skill.
- **AI Performance Insights** — Students receive personalized feedback, recommended learning materials, and skill gap analysis after each assessment.
- **Interactive Onboarding** — Role-based guided tutorials powered by Intro.js (16 steps for students, 30+ steps for instructors).
- **Anti-Cheat Integrity Monitoring** — Comprehensive client-side integrity checks including local/session storage tampering detection, debugger presence detection, and window resize anomaly detection.
- **Result Rectification** — Instructors can manually adjust scores. AI rectification for non-objective question grading (essay/identification).
- **Assessment Sharing** — Share assessments with other instructors, assign to whole classes or individual students, or publish publicly via a join code.
- **QR Code Generation** — Generate QR codes for public assessments and class join links.
- **PWA Support** — Installable on mobile and desktop, offline-capable with service worker caching.
- **Export & Reports** — Export assessments to Word/PDF, export results to XLSX, generate PDF analytics reports.
- **Encrypted Communication** — AES-256-GCM encryption for sensitive API requests and responses.

---

## Screenshots

### Instructor Dashboard

![Instructor Dashboard]<img width="1895" height="944" alt="Screenshot 2026-07-14 111705" src="https://github.com/user-attachments/assets/7f8bc565-ddfb-4bb3-a9cb-55e43bd81032" />
The instructor's command center. A welcome header with quick-action buttons ("Create Assessment", "View Classes"), three stat cards showing total students, active assessments, and total classes. Below are ongoing and scheduled assessment cards with progress bars and due dates. A student performance table lists each student's completion count, average score with color-coded badges, and enrolled classes. Class performance bar charts and student distribution pie charts provide visual analytics. *(src/app/instructor/home/)*

### Classes Page (Instructor)

<img width="1898" height="938" alt="Screenshot 2026-07-14 111728" src="https://github.com/user-attachments/assets/d2b17009-325a-450d-a704-b907a5fb0e6f" />

Instructors can view the classes they own. Instructors can see the basic data of the class, the statistics. A "Create Class" button opens a modal for entering creating a class. From this page the Instructor can click a student name and view their past submissions *(src/app/instructor/students/)*

### Assessment History (Instructor)

<img width="1895" height="942" alt="Screenshot 2026-07-14 111742" src="https://github.com/user-attachments/assets/4df69a6c-3c10-4c8d-9cd0-07db4e73f24f" />
A full history of all the Instructor Assigned Assessments with status tabs (All, Scheduled, Ongoing, Completed). Each assessment row displays the type icon, title, mode badge, status badge, category tag, metadata (questions, time limit, class, score, time spent, remaining attempts), and a CTA button to either view the result or start the assessment. Supports search, mode filtering, sorting, and infinite scroll pagination. *(src/app/instructor/manage/)*

### AI Assessment Generation

<img width="1899" height="944" alt="Screenshot 2026-07-14 111815" src="https://github.com/user-attachments/assets/766bfc36-f1d4-4576-9299-a37e2692216f" />

A two-step AI-powered workflow. **Step 1:** Instructors enter a topic, select difficulty, choose question types with per-type quantity controls, upload reference materials (PDF/DOCX/PPTX), pick an AI model, and generate. A real-time progress animation shows "PRISM AI is generating questions..." with bouncing dots. **Step 2:** Review generated questions organized by type, edit inline, add manual questions, then save. A floating action button provides quick access to sort, delete, generate more, or save. *(src/app/instructor/final-generate-assessment/)*

### Assessment Results (Instructor)

<img width="1896" height="941" alt="Screenshot 2026-07-14 111854" src="https://github.com/user-attachments/assets/2a5d661f-898d-4abf-ba1e-d297a6c28b0d" />

Class-wide results view with a PRISM Insights card showing AI-generated performance analysis. The class overview displays total students, average/highest/lowest scores with animated rolling numbers. A student list table includes search, status filter, and sort options — each row shows name, score (color-coded), submission status, and integrity rating (Clean/Warning/Cheated). A detailed question analysis table breaks down success rates per question with progress bars. Instructors can start, end, extend assessments, or export results. *(src/app/instructor/result/)*

---

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9
- Angular CLI 19

### Local Setup

```bash
git clone https://github.com/redradishs/prism-frontend.git
cd prism-frontend
npm install --legacy-peer-deps
cp .env.example .env
# Edit .env with your Firebase project credentials and API URL
ng serve
```

### Environment Variables

Create a `.env` file in the root directory:

```env
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=
FIREBASE_MEASUREMENT_ID=
API_URL=
ENCRYPTION_KEY=
```

### Build for Production

```bash
ng build --configuration production
```

The build output is in `dist/prism_frontend/browser/`. Deployable to any static hosting (Vercel configuration included).

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Angular 19 with standalone components |
| **Language** | TypeScript ~5.6 |
| **UI Components** | Angular Material 19 + Flowbite |
| **Styling** | Tailwind CSS 4 with PostCSS |
| **State Management** | RxJS BehaviorSubject |
| **Charts** | Chart.js + ng2-charts |
| **Authentication** | Firebase Auth (email/password + Google OAuth) |
| **Backend API** | Custom REST API at api.prismgcccs.app |
| **AI Providers** | Nebius AI Studio, Groq, Custom Cloudflare AI Worker |
| **Encryption** | AES-256-GCM via Web Crypto API |
| **PWA** | @angular/service-worker with ngsw-config |
| **Security Monitoring** | Custom IntegrityMonitoringService (tab switch, DevTools, clipboard) |
| **Tutorials** | Intro.js |
| **PDF Generation** | jsPDF, pdfmake, pdfjs-dist |
| **Export** | ExcelJS, XLSX, docx, file-saver |
| **QR Codes** | qrcode |
| **Alerts** | SweetAlert2 |
| **Deployment** | Vercel (static hosting) |
| **Testing** | Karma + Jasmine |
| **Build Tool** | Angular CLI + custom webpack |

---

## Architecture Overview

### Role-Based Routing

| Portal | Routes | Guard |
|---|---|---|
| **Public** | `/`, `/login`, `/verify-email`, `/forgot-password`, `/complete-profile`, `/join/:code` | None |
| **Student** | `/student/dashboard`, `/student/classes`, `/student/history`, `/student/profile`, `/student/assessment/take`, `/student/result` | `authGuard` (role: student) |
| **Instructor** | `/instructor/dashboard`, `/instructor/create`, `/instructor/assign`, `/instructor/result`, `/instructor/analytics`, `/instructor/manage`, `/instructor/evaluate`, `/instructor/students` | `authGuard` (role: instructor) |
| **Admin** | `/admin/dashboard`, `/admin/users`, `/admin/settings`, `/admin/profile` | `authGuard` (role: admin) |

### Key Services

| Service | Purpose |
|---|---|
| `AuthService` | Authentication, profile management, password reset |
| `ApiService` | Instructor operations (assessments, classes, analytics) |
| `StudentService` | Student operations (assessments, results, classes) |
| `AdminService` | Admin operations (users, settings) |
| `IntegrityMonitoringService` | Anti-cheat client-side monitoring |
| `EncryptionService` | AES-256-GCM encrypt/decrypt |
| `BarchartService` | Chart.js bar chart configuration |
| `ExportService` | Assessment & result export utilities |
| `TutorialService` | Intro.js tutorial management |
| `PwaService` | PWA install prompt handling |
| `SeoService` | Dynamic meta tags, Open Graph, structured data |

---

## License

MIT © 2025 — Capstone Project for College of Computer Studies (CCS) under ICTe Solutions.

### Gordon College Best in BSIT Capstone Project of the Year
