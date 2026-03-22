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

## Task Progress (Mustafa Göçmen)

| Task | Description | Sprint | Status |
|------|-------------|--------|--------|
| T-02 | Implement register/login API endpoints (JWT) | Sprint 1 | ✅ Done |
| T-04 | Write authentication unit tests | Sprint 1 | ✅ Done |
| T-08 | Implement reservation creation API (conflict check) | Sprint 1 | 🔲 Todo |
| T-10 | Write reservation integration tests | Sprint 1 | 🔲 Todo |
| T-12 | Implement open-group creation API | Sprint 1 | 🔲 Todo |
| T-18 | Implement approve/reject join request API | Sprint 2 | 🔲 Todo |
| T-19 | Auto-lock reservation when group is full | Sprint 2 | 🔲 Todo |
| T-20 | Send notifications to all members on group full/approved | Sprint 2 | 🔲 Todo |
| T-29 | Reservation history API & UI (customer) | Sprint 3 | 🔲 Todo |

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
