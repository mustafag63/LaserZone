# LaserZone – Online Reservation System

**COMP 202 – Software Engineering | Spring 2026**

LaserZone is a web-based reservation system for a laser tag entertainment business. Customers can register, browse available time slots, and make reservations online. A key feature is **Group Matchmaking**, which lets a group leader open a reservation publicly so other users can send join requests to fill the session collaboratively. All payments are handled on-site; the platform manages reservations only.

---

## Team

| Name | Student ID | Role |
|---|---|---|
| Mustafa Göçmen | 2311051039 | Full-stack Dev / Scrum Master |
| Tuna Öcal | 2311051049 | Backend Developer |
| Muhammet Gümüş | 2311051021 | Frontend Developer |
| Begüm Rana Türkoğlu | 2311021002 | Database Designer |
| Eylül Sena Altunsaray | 2311021022 | Database Designer / Docs |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, TailwindCSS |
| Backend | Node.js + Express (REST API) |
| Database | MySQL |
| Authentication | JWT (JSON Web Tokens) |
| E-mail | SendGrid / SMTP |
| Version Control | GitHub |

---

## Project Structure

```
laserzone/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js               # MySQL connection pool
│   │   ├── controllers/
│   │   │   └── authController.js   # Register / Login / Me
│   │   ├── middleware/
│   │   │   └── authMiddleware.js   # JWT protect, adminOnly
│   │   ├── models/
│   │   │   └── User.js             # User model (CRUD + bcrypt)
│   │   ├── routes/
│   │   │   └── authRoutes.js       # /api/auth routes
│   │   ├── tests/
│   │   │   └── auth.test.js        # Authentication unit tests
│   │   └── app.js                  # Express app entry point
│   ├── .env.example
│   ├── .gitignore
│   └── package.json
├── frontend/                        # React app (Sprint 1 – Week 2)
├── LaserZone_Project_Template.docx
├── LaserZone_Initial_Work_Plan_v3.docx
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js >= 18
- MySQL >= 8

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your DB credentials and JWT secret
npm run dev
```

The API will be available at `http://localhost:5000`.

### Run Tests

```bash
cd backend
npm test
```

---

## API Endpoints

### Auth (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | No | Register a new customer account |
| POST | `/login` | No | Login and receive a JWT |
| GET | `/me` | Bearer JWT | Get current user profile |

#### Register – Request Body
```json
{
  "name": "Mustafa Göçmen",
  "email": "mustafa@example.com",
  "password": "secret123"
}
```

#### Register – Response `201`
```json
{
  "message": "Registration successful.",
  "token": "<jwt>",
  "user": { "id": 1, "name": "Mustafa Göçmen", "email": "mustafa@example.com", "role": "customer" }
}
```

#### Login – Request Body
```json
{
  "email": "mustafa@example.com",
  "password": "secret123"
}
```

#### Login – Response `200`
```json
{
  "message": "Login successful.",
  "token": "<jwt>",
  "user": { "id": 1, "name": "Mustafa Göçmen", "email": "mustafa@example.com", "role": "customer" }
}
```

---

## Database Schema

### `users`
```sql
CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  role       ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

> Additional tables (reservations, group_reservations, join_requests) will be added in Sprint 1 by the Database Designers.

---

## Sprint Plan

| Sprint | Weeks | Key Goals |
|--------|-------|-----------|
| Sprint 1 | 1–2 | Auth, slot availability, standard reservation, open-group creation & join requests |
| Sprint 2 | 3–4 | Group leader approval flow, cancel/modify, e-mail notifications, admin panel |
| Sprint 3 | 5–6 | Reservation history, occupancy reports, real-time availability |
| Sprint 4 | 7–8 | Full testing, UI polish, CI/CD deployment, final documentation |

**Total:** 13 User Stories · 97 Story Points · 36 Tasks

---

## Task Progress

> Durum ikonları: ✅ Done · 🔄 In Progress · 🔲 Todo

### Sprint 1 — Weeks 1–2
*Auth, slot availability, standard reservation, open-group creation & join requests*

| Task | Description | Assignee | Est. | Status |
|------|-------------|----------|------|--------|
| T-01 | Design user database schema | Begüm Rana Türkoğlu | 3h | ✅  Todo |
| T-02 | Implement register/login API endpoints (JWT) | Mustafa Göçmen | 4h | ✅ Done |
| T-03 | Build register & login UI pages | Muhammet Gümüş | 4h | 🔲 Todo |
| T-04 | Write authentication unit tests | Mustafa Göçmen | 2h | ✅ Done |
| T-05 | Implement availability query API | Tuna Öcal | 4h | 🔲 Todo |
| T-06 | Build calendar/slot display component | Muhammet Gümüş | 6h | 🔲 Todo |
| T-07 | Design reservation database schema | Begüm R. Türkoğlu / Eylül S. Altunsaray | 3h | 🔲 Todo |
| T-08 | Implement reservation creation API (conflict check) | Mustafa Göçmen | 6h | 🔲 Todo |
| T-09 | Build reservation form UI | Muhammet Gümüş | 5h | 🔲 Todo |
| T-10 | Write reservation integration tests | Mustafa Göçmen | 3h | 🔲 Todo |
| T-11 | Design group reservation DB schema (open/closed, party size) | Begüm R. Türkoğlu / Eylül S. Altunsaray | 3h | 🔲 Todo |
| T-12 | Implement open-group creation API | Mustafa Göçmen | 4h | 🔲 Todo |
| T-13 | Build open-group creation UI for group leader | Muhammet Gümüş | 4h | 🔲 Todo |
| T-14 | Implement open groups listing API with filters | Tuna Öcal | 3h | 🔲 Todo |
| T-15 | Build open groups browse page & join request form | Muhammet Gümüş | 5h | 🔲 Todo |
| T-16 | Implement join request submission API | Tuna Öcal | 3h | 🔲 Todo |

### Sprint 2 — Weeks 3–4
*Group leader approval flow, cancel/modify, e-mail notifications, admin panel*

| Task | Description | Assignee | Est. | Status |
|------|-------------|----------|------|--------|
| T-17 | Build group leader dashboard (pending requests list) | Muhammet Gümüş | 5h | 🔲 Todo |
| T-18 | Implement approve/reject join request API | Mustafa Göçmen | 4h | 🔲 Todo |
| T-19 | Auto-lock reservation when group is full | Mustafa Göçmen | 3h | 🔲 Todo |
| T-20 | Send notifications to all members on group full/approved | Mustafa Göçmen | 3h | 🔲 Todo |
| T-21 | Implement cancel & modify reservation API endpoints | Tuna Öcal | 4h | 🔲 Todo |
| T-22 | Build reservation management UI (customer side) | Muhammet Gümüş | 4h | 🔲 Todo |
| T-23 | Integrate e-mail service (SendGrid/SMTP) | Tuna Öcal | 3h | 🔲 Todo |
| T-24 | Design e-mail confirmation templates | Muhammet Gümüş | 2h | 🔲 Todo |
| T-25 | Build admin panel – reservation list & filters | Muhammet Gümüş | 6h | 🔲 Todo |
| T-26 | Implement admin approve/cancel operations | Eylül Sena Altunsaray | 3h | 🔲 Todo |
| T-27 | Implement working hours & slot management API | Begüm Rana Türkoğlu | 4h | 🔲 Todo |
| T-28 | Build admin calendar configuration UI | Muhammet Gümüş | 4h | 🔲 Todo |

### Sprint 3 — Weeks 5–6
*Reservation history, occupancy reports, real-time availability*

| Task | Description | Assignee | Est. | Status |
|------|-------------|----------|------|--------|
| T-29 | Reservation history API & UI (customer) | Mustafa Göçmen | 4h | 🔲 Todo |
| T-30 | Occupancy reports & chart dashboard | Begüm Rana Türkoğlu | 6h | 🔲 Todo |
| T-31 | Real-time availability (WebSocket / polling) | Tuna Öcal | 5h | 🔲 Todo |
| T-32 | Live update UI integration | Eylül Sena Altunsaray | 4h | 🔲 Todo |

### Sprint 4 — Weeks 7–8
*Full testing, UI polish, CI/CD deployment, final documentation*

| Task | Description | Assignee | Est. | Status |
|------|-------------|----------|------|--------|
| T-33 | Full system testing & bug fixes | Tuna Öcal (All Team) | 6h | 🔲 Todo |
| T-34 | UI/UX final polish & responsive design | Muhammet Gümüş | 4h | 🔲 Todo |
| T-35 | Deployment & CI/CD setup | Tuna Öcal | 4h | 🔲 Todo |
| T-36 | Final documentation & README | Eylül Sena Altunsaray (All Team) | 3h | 🔲 Todo |

---

## Definition of Done

A user story is **Done** when:
- Code is pushed to GitHub and reviewed by at least one team member
- Unit tests are written and passing
- Integration test is completed
- Feature is demonstrated as working software
- Task board is updated (tasks moved to Done)
- No critical bugs; any known issues are documented

---

*COMP 202 Spring 2026 · LaserZone Reservation System*
