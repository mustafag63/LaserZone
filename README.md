# LaserZone — Online Reservation System

**COMP 202 · Software Engineering · Spring 2026**

LaserZone is a full-stack web application for managing laser tag reservations. Customers can register, browse available time slots, and book sessions individually or as part of a group. The standout feature is **Group Matchmaking**: a group leader opens a reservation publicly, and other users send join requests to fill the session collaboratively. The system also supports an admin panel for reservation oversight, configurable working hours and slot management, reservation history, group leave/remove workflows, and a TR/EN multilingual UI.

> All payments are handled on-site. This platform manages reservations only.

---

## Table of Contents

- [Team](#team)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Sprint Plan & Task Progress](#sprint-plan--task-progress)
- [Definition of Done](#definition-of-done)

---

## Team

| Name                  | Student ID | Role                          |
| --------------------- | ---------- | ----------------------------- |
| Mustafa Göçmen        | 2311051039 | Full-stack Dev / Scrum Master |
| Tuna Öcal             | 2311051049 | Backend Developer             |
| Muhammet Gümüş        | 2311051021 | Frontend Developer            |
| Begüm Rana Türkoğlu   | 2311021002 | Database Designer             |
| Eylül Sena Altunsaray | 2311021022 | Database Designer / Docs      |

---

## Tech Stack

| Layer           | Technology                        |
| --------------- | --------------------------------- |
| Frontend        | React 19, React Router 7, Vite 8  |
| Styling         | TailwindCSS 3                     |
| Backend         | Node.js + Express 4 (REST API)    |
| Database        | MySQL 8                           |
| Authentication  | JWT (JSON Web Tokens) + bcryptjs  |
| Email           | SendGrid / SMTP                   |
| Testing         | Jest 29 + Supertest               |
| Version Control | Git / GitHub                      |

---

## Features

| Feature | Status |
| ------- | ------ |
| Customer registration & login with JWT | ✅ Done |
| Individual reservation create, edit, cancel | ✅ Done |
| Live slot availability with configurable hours, duration, and capacity | ✅ Done |
| Open group reservations with join requests and leader approval/rejection | ✅ Done |
| Group member leave requests and direct removal by leader | ✅ Done |
| Auto-lock when group reaches party size | ✅ Done |
| Admin panel: reservation list, filters, approve/cancel | ✅ Done |
| Working hours & slot block management (admin) | ✅ Done |
| Notification bell with unread badge, dropdown, 5 event types, 30s polling | ✅ Done |
| Reservation history (customer) | ✅ Done |
| Occupancy reports & chart dashboard (admin) | ✅ Done |
| TR/EN multilingual UI with persistent language preference | ✅ Done |
| Email confirmation notifications | 🔲 Planned |
| Real-time availability (WebSocket / polling) | 🔲 Planned |

---

## Project Structure

```
laserzone/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                     # MySQL connection pool
│   │   ├── controllers/
│   │   │   ├── adminController.js        # Admin reservation operations
│   │   │   ├── authController.js         # Register / Login / Me
│   │   │   ├── groupController.js        # Group reservation operations
│   │   │   ├── notificationController.js # Notification CRUD & mark-read
│   │   │   ├── reservationController.js  # Reservation CRUD
│   │   │   └── slotController.js         # Slot availability & management
│   │   ├── middleware/
│   │   │   └── authMiddleware.js         # JWT protect, adminOnly
│   │   ├── models/
│   │   │   ├── GroupReservation.js       # Group reservation model
│   │   │   ├── Notification.js           # Notification model
│   │   │   ├── PastEvent.js              # Past game/event history model
│   │   │   ├── Reservation.js            # Reservation model
│   │   │   ├── Slot.js                   # Slot model
│   │   │   └── User.js                   # User model (CRUD + bcrypt)
│   │   ├── routes/
│   │   │   ├── adminRoutes.js            # /api/admin
│   │   │   ├── authRoutes.js             # /api/auth
│   │   │   ├── groupRoutes.js            # /api/groups
│   │   │   ├── notificationRoutes.js     # /api/notifications
│   │   │   ├── reservationRoutes.js      # /api/reservations
│   │   │   └── slotRoutes.js             # /api/slots
│   │   ├── tests/
│   │   │   ├── admin.test.js             # Admin reservation tests
│   │   │   ├── auth.test.js              # Authentication unit tests
│   │   │   ├── reservation.test.js       # Reservation integration tests
│   │   │   └── slot.test.js              # Slot availability tests
│   │   └── app.js                        # Express entry point
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── AdminReservations.jsx     # Admin reservation list, filters, approve/cancel
│       │   ├── BookingDemo.jsx           # Booking demo/preview
│       │   ├── BrowseGroups.jsx          # Open groups browse page with join flow
│       │   ├── CalendarSlotPicker.jsx    # Calendar & time slot picker
│       │   ├── Dashboard.jsx             # User dashboard (my reservations)
│       │   ├── DashboardLayout.jsx       # Layout wrapper with topbar & notification bell
│       │   ├── LanguageToggle.jsx        # TR/EN language switcher
│       │   ├── Login.jsx                 # Login page
│       │   ├── MakeReservationModal.jsx  # New reservation modal (Open/Closed + live capacity)
│       │   ├── MyGroups.jsx              # Leader dashboard: requests, leave approvals, removal
│       │   ├── NotificationBell.jsx      # Bell icon, unread badge, dropdown, 5 types, 30s poll
│       │   ├── ProfileModal.jsx          # User profile modal
│       │   ├── ProtectedRoute.jsx        # Auth route guard
│       │   ├── Register.jsx              # Register page
│       │   ├── ReservationForm.jsx       # Reservation form
│       │   ├── Sidebar.jsx               # Sidebar navigation
│       │   └── SuccessModal.jsx          # Success confirmation modal
│       ├── context/
│       │   ├── AuthContext.jsx           # Auth state management
│       │   ├── LanguageContext.jsx       # Language provider
│       │   └── languageCore.js           # i18n context/hook
│       └── utils/
│           ├── api.js                    # API helper functions
│           └── slotHelpers.js            # Slot utility functions
├── database.sql
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js >= 18
- MySQL >= 8

### 1. Database

```bash
mysql -u root -p < database.sql
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# Fill in DB credentials, JWT secret, and (optionally) SendGrid key
npm run dev
```

API runs at `http://localhost:5001`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`.

> Start the backend before the frontend.

### Demo Credentials

| Username | Password |
| -------- | -------- |
| `123`    | `123123` |

### Running Tests

```bash
cd backend
npm test
```

**4 suites · 57 tests** — Auth, Slot Availability/Management, Reservation/History, Admin.  
Tests mock the MySQL pool (`jest.mock('../config/db')`) — no real database connection required.

---

## API Reference

All authenticated endpoints require `Authorization: Bearer <token>`.

### Auth — `/api/auth`

| Method | Endpoint    | Auth  | Description                     |
| ------ | ----------- | ----- | ------------------------------- |
| POST   | `/register` | No    | Register a new customer account |
| POST   | `/login`    | No    | Log in and receive a JWT        |
| GET    | `/me`       | JWT   | Get current user profile        |

<details>
<summary>Request / Response examples</summary>

**POST /api/auth/register**
```json
// Request
{ "username": "testuser", "password": "secret123" }

// Response 201
{
  "message": "Registration successful.",
  "token": "<jwt>",
  "user": { "id": 1, "username": "testuser", "role": "customer" }
}
```

**POST /api/auth/login**
```json
// Request
{ "username": "testuser", "password": "secret123" }

// Response 200
{
  "message": "Login successful.",
  "token": "<jwt>",
  "user": { "id": 1, "username": "testuser", "role": "customer" }
}
```
</details>

---

### Groups — `/api/groups`

| Method | Endpoint                         | Auth        | Description                                         |
| ------ | -------------------------------- | ----------- | --------------------------------------------------- |
| POST   | `/`                              | JWT         | Create an open group reservation                    |
| GET    | `/`                              | JWT         | List open groups (filters: date, search, available) |
| GET    | `/my`                            | JWT         | List groups led by the current user                 |
| GET    | `/my-requests`                   | JWT         | Current user's own join/leave request state         |
| GET    | `/:id`                           | JWT         | Get single group details                            |
| PUT    | `/:id`                           | JWT (leader)| Update a group                                      |
| DELETE | `/:id`                           | JWT (leader)| Cancel a group                                      |
| POST   | `/:id/join`                      | JWT         | Submit a join request                               |
| POST   | `/:id/leave`                     | JWT         | Submit a leave request as an approved member        |
| GET    | `/:id/requests`                  | JWT (leader)| List join requests and pending leave requests       |
| PUT    | `/:id/requests/:requestId`       | JWT (leader)| Approve or reject a join request                    |
| PUT    | `/:id/leave-requests/:requestId` | JWT (leader)| Approve or reject a leave request                   |
| DELETE | `/:id/members/:userId`           | JWT (leader)| Remove an approved member directly                  |

---

### Reservations — `/api/reservations`

| Method | Endpoint   | Auth | Description                                       |
| ------ | ---------- | ---- | ------------------------------------------------- |
| POST   | `/`        | JWT  | Create an individual reservation                  |
| GET    | `/my`      | JWT  | List active reservations for the current user     |
| GET    | `/history` | JWT  | List completed past games for the current user    |
| PUT    | `/:id`     | JWT  | Update an active reservation                      |
| DELETE | `/:id`     | JWT  | Cancel an active reservation                      |

---

### Slots — `/api/slots`

| Method | Endpoint        | Auth       | Description                                       |
| ------ | --------------- | ---------- | ------------------------------------------------- |
| GET    | `/availability` | No         | Get slot availability for a date or range         |
| GET    | `/settings`     | JWT (admin)| Get working hours, slot duration, and capacity    |
| PUT    | `/settings`     | JWT (admin)| Update working hours, slot duration, and capacity |
| GET    | `/blocks`       | JWT (admin)| List blocked slots for a date                     |
| POST   | `/blocks`       | JWT (admin)| Block a date/time range                           |
| DELETE | `/blocks/:id`   | JWT (admin)| Remove a slot block                               |

---

### Admin — `/api/admin`

| Method | Endpoint                    | Auth       | Description                                      |
| ------ | --------------------------- | ---------- | ------------------------------------------------ |
| GET    | `/reservations`             | JWT (admin)| List all reservations with status/date filters   |
| PUT    | `/reservations/:id/approve` | JWT (admin)| Reactivate/approve a non-completed reservation   |
| PUT    | `/reservations/:id/cancel`  | JWT (admin)| Cancel a non-completed reservation               |

---

### Notifications — `/api/notifications`

| Method | Endpoint    | Auth | Description                        |
| ------ | ----------- | ---- | ---------------------------------- |
| GET    | `/`         | JWT  | Get notifications (last 30)        |
| PUT    | `/read-all` | JWT  | Mark all notifications as read     |
| PUT    | `/:id/read` | JWT  | Mark a single notification as read |

---

## Database Schema

> The `notifications`, `slot_settings`, `slot_blocks`, `leave_requests`, and `past_events` tables are created automatically on backend startup.

<details>
<summary>View all CREATE TABLE statements</summary>

```sql
CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  username   VARCHAR(50) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  role       ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reservations (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL,
  reservation_name VARCHAR(100) NOT NULL DEFAULT '',
  reservation_date DATE NOT NULL,
  start_time       TIME NOT NULL,
  end_time         TIME NOT NULL,
  player_count     INT NOT NULL DEFAULT 3,
  status           ENUM('active', 'cancelled', 'completed') NOT NULL DEFAULT 'active',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE group_reservations (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  leader_user_id   INT NOT NULL,
  reservation_name VARCHAR(100) NOT NULL,
  reservation_date DATE NOT NULL,
  start_time       TIME NOT NULL,
  end_time         TIME NOT NULL,
  party_size       INT NOT NULL,
  current_count    INT NOT NULL DEFAULT 0,
  status           ENUM('open','closed','cancelled') NOT NULL DEFAULT 'open',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (leader_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE join_requests (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  group_reservation_id INT NOT NULL,
  user_id              INT NOT NULL,
  player_count         INT NOT NULL,
  status               ENUM('pending','approved','rejected','left','removed') NOT NULL DEFAULT 'pending',
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_request (group_reservation_id, user_id),
  FOREIGN KEY (group_reservation_id) REFERENCES group_reservations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE leave_requests (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  group_reservation_id INT NOT NULL,
  user_id              INT NOT NULL,
  player_count         INT NOT NULL,
  status               ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_leave_request_member (group_reservation_id, user_id, status),
  FOREIGN KEY (group_reservation_id) REFERENCES group_reservations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE slot_settings (
  id                    TINYINT PRIMARY KEY DEFAULT 1,
  open_time             TIME NOT NULL DEFAULT '10:00:00',
  close_time            TIME NOT NULL DEFAULT '22:00:00',
  slot_duration_minutes INT NOT NULL DEFAULT 30,
  max_capacity          INT NOT NULL DEFAULT 20,
  is_open               BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE slot_blocks (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  block_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time   TIME NOT NULL,
  reason     VARCHAR(255) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_slot_block (block_date, start_time, end_time)
);

CREATE TABLE past_events (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  source_type  ENUM('reservation', 'group') NOT NULL,
  source_id    INT NOT NULL,
  user_id      INT NOT NULL,
  event_name   VARCHAR(100) NOT NULL,
  event_date   DATE NOT NULL,
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  player_count INT NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_past_event (source_type, source_id, user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  type         ENUM('join_request','request_approved','request_rejected','group_full','group_cancelled') NOT NULL,
  title        VARCHAR(200) NOT NULL,
  body         VARCHAR(500),
  is_read      BOOLEAN NOT NULL DEFAULT FALSE,
  ref_group_id INT,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```
</details>

---

## Sprint Plan & Task Progress

**Total:** 13 User Stories · 97 Story Points · 44 Tasks

Status icons: ✅ Done · 🔄 In Progress · 🔲 Todo

### Sprint 1 — Weeks 1–2
*Auth, slot availability, standard reservation, open-group creation & join requests*

| Task | Description | Assignee | Est. | Status |
| ---- | ----------- | -------- | ---- | ------ |
| T-01 | Design user database schema | Begüm Rana Türkoğlu | 3h | ✅ |
| T-02 | Implement register/login API endpoints (JWT) | Mustafa Göçmen | 4h | ✅ |
| T-03 | Build register & login UI pages | Muhammet Gümüş | 4h | ✅ |
| T-04 | Write authentication unit tests | Mustafa Göçmen | 2h | ✅ |
| T-05 | Implement availability query API | Tuna Öcal | 4h | ✅ |
| T-06 | Build calendar/slot display component | Muhammet Gümüş | 6h | ✅ |
| T-07 | Design reservation database schema | Begüm R. Türkoğlu / Eylül S. Altunsaray | 3h | ✅ |
| T-08 | Implement reservation creation API (conflict check) | Mustafa Göçmen | 6h | ✅ |
| T-09 | Build reservation form UI | Muhammet Gümüş | 5h | ✅ |
| T-10 | Write reservation integration tests | Mustafa Göçmen | 3h | ✅ |
| T-11 | Design group reservation DB schema (open/closed, party size) | Begüm R. Türkoğlu / Eylül S. Altunsaray | 3h | ✅ |
| T-12 | Implement open-group creation API | Mustafa Göçmen | 4h | ✅ |
| T-13 | Build open-group creation UI for group leader | Muhammet Gümüş | 4h | ✅ |
| T-14 | Implement open groups listing API with filters | Tuna Öcal | 3h | ✅ |
| T-15 | Build open groups browse page & join request form | Muhammet Gümüş | 5h | ✅ |
| T-16 | Implement join request submission API | Tuna Öcal | 3h | ✅ |
| T-37 | Enhance group creation UI: Open/Closed toggle + live capacity preview | Muhammet Gümüş | 3h | ✅ |
| T-38 | Enhance browse page: full date/time, capacity bar, "I Want to Join" flow, filtering | Muhammet Gümüş | 5h | ✅ |
| T-41 | Enforce one-group-per-slot rule: block duplicates & individual reservations when slot is taken | Mustafa Göçmen | 3h | ✅ |
| T-42 | Live slot availability in reservation modal: fetch real API on date select, disable taken slots | Mustafa Göçmen | 2h | ✅ |

### Sprint 2 — Weeks 3–4
*Group leader approval flow, cancel/modify, email notifications, admin panel*

| Task | Description | Assignee | Est. | Status |
| ---- | ----------- | -------- | ---- | ------ |
| T-17 | Build group leader dashboard (pending requests, approve/reject UI) | Muhammet Gümüş | 5h | ✅ |
| T-18 | Implement approve/reject join request API | Tuna Öcal | 4h | ✅ |
| T-19 | Auto-lock reservation when group is full | Tuna Öcal | 3h | ✅ |
| T-20 | Send notifications on group full/approved/rejected/cancelled | Tuna Öcal | 3h | ✅ |
| T-21 | Implement cancel & modify reservation API endpoints | Tuna Öcal | 4h | ✅ |
| T-22 | Build reservation management UI (customer side) | Muhammet Gümüş | 4h | ✅ |
| T-23 | Integrate email service (SendGrid/SMTP) | Tuna Öcal | 3h | 🔲 |
| T-24 | Design email confirmation templates | Muhammet Gümüş | 2h | 🔲 |
| T-25 | Build admin panel — reservation list & filters | Muhammet Gümüş | 6h | ✅ |
| T-26 | Implement admin approve/cancel operations | Eylül Sena Altunsaray | 3h | ✅ |
| T-27 | Implement working hours & slot management API | Begüm Rana Türkoğlu | 4h | ✅ |
| T-28 | Build admin calendar configuration UI | Muhammet Gümüş | 4h | 🔲 |
| T-39 | Notifications API (table auto-create, GET / PUT read / PUT read-all) | Tuna Öcal | 3h | ✅ |
| T-40 | Build NotificationBell: bell icon, unread badge, dropdown, 5 types, 30s polling | Muhammet Gümüş | 4h | ✅ |
| T-43 | Group member leave request and leader direct removal flow | Tuna Öcal | 4h | ✅ |

### Sprint 3 — Weeks 5–6
*Reservation history, occupancy reports, real-time availability*

| Task | Description | Assignee | Est. | Status |
| ---- | ----------- | -------- | ---- | ------ |
| T-29 | Reservation history API & UI (customer) | Mustafa Göçmen | 4h | ✅ |
| T-30 | Occupancy reports & chart dashboard | Begüm Rana Türkoğlu | 6h | ✅ |
| T-31 | Real-time availability (WebSocket / polling) | Tuna Öcal | 5h | 🔲 |
| T-32 | Live update UI integration | Eylül Sena Altunsaray | 4h | 🔲 |
| T-44 | TR/EN multilingual UI support | Muhammet Gümüş | 3h | ✅ |

### Sprint 4 — Weeks 7–8
*Full testing, UI polish, CI/CD deployment, final documentation*

| Task | Description | Assignee | Est. | Status |
| ---- | ----------- | -------- | ---- | ------ |
| T-33 | Full system testing & bug fixes | Tuna Öcal (All Team) | 6h | 🔲 |
| T-34 | UI/UX final polish & responsive design | Muhammet Gümüş | 4h | 🔲 |
| T-35 | Deployment & CI/CD setup | Tuna Öcal | 4h | 🔲 |
| T-36 | Final documentation & README | Eylül Sena Altunsaray (All Team) | 3h | 🔲 |

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

*COMP 202 · Spring 2026 · LaserZone Reservation System*
