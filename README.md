# LaserZone – Online Reservation System

**COMP 202 – Software Engineering | Spring 2026**

LaserZone is a web-based reservation system for a laser tag entertainment business. Customers can register, browse available time slots, and make reservations online. A key feature is **Group Matchmaking**, which lets a group leader open a reservation publicly so other users can send join requests to fill the session collaboratively. The system also supports admin reservation management, working-hours/slot configuration, reservation history, group leave/remove workflows, and TR/EN multilingual UI. All payments are handled on-site; the platform manages reservations only.

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

| Layer           | Technology                   |
| --------------- | ---------------------------- |
| Frontend        | React.js, TailwindCSS        |
| Backend         | Node.js + Express (REST API) |
| Database        | MySQL                        |
| Authentication  | JWT (JSON Web Tokens)        |
| E-mail          | SendGrid / SMTP              |
| Version Control | GitHub                       |

---

## Current Features

- Customer registration/login with JWT authentication
- Individual reservation creation, editing, cancellation, and history
- Live slot availability with configurable working hours, slot duration, capacity, and admin slot blocks
- Open group reservations with join requests, leader approvals/rejections, member leave requests, and leader direct member removal
- Admin reservation panel with filters, approve/reactivate, and cancel operations
- Notification bell with unread badge and read/read-all actions
- TR/EN multilingual frontend with persistent language preference

---

## Project Structure

```
laserzone/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                    # MySQL connection pool
│   │   ├── controllers/
│   │   │   ├── authController.js        # Register / Login / Me
│   │   │   ├── groupController.js       # Group reservation operations
│   │   │   ├── notificationController.js# Notification CRUD & mark-read
│   │   │   ├── reservationController.js # Reservation CRUD
│   │   │   ├── adminController.js       # Admin reservation operations
│   │   │   └── slotController.js        # Slot availability & management
│   │   ├── middleware/
│   │   │   └── authMiddleware.js        # JWT protect, adminOnly
│   │   ├── models/
│   │   │   ├── GroupReservation.js      # Group reservation model
│   │   │   ├── Notification.js          # Notification model
│   │   │   ├── PastEvent.js             # Past game/event history model
│   │   │   ├── Reservation.js           # Reservation model
│   │   │   ├── Slot.js                  # Slot model
│   │   │   └── User.js                  # User model (CRUD + bcrypt)
│   │   ├── routes/
│   │   │   ├── adminRoutes.js           # /api/admin routes
│   │   │   ├── authRoutes.js            # /api/auth routes
│   │   │   ├── groupRoutes.js           # /api/groups routes
│   │   │   ├── notificationRoutes.js    # /api/notifications routes
│   │   │   ├── reservationRoutes.js     # /api/reservations routes
│   │   │   └── slotRoutes.js            # /api/slots routes
│   │   ├── tests/
│   │   │   ├── admin.test.js            # Admin reservation tests
│   │   │   ├── auth.test.js             # Authentication unit tests
│   │   │   ├── reservation.test.js      # Reservation integration tests
│   │   │   └── slot.test.js             # Slot availability tests
│   │   └── app.js                       # Express app entry point
│   ├── .env.example
│   ├── .gitignore
│   └── package.json
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── BookingDemo.jsx          # Booking demo/preview
│       │   ├── AdminReservations.jsx    # Admin reservation list, filters, approve/cancel
│       │   ├── BrowseGroups.jsx         # Open groups browse page (full date, capacity bar, join flow, filters)
│       │   ├── CalendarSlotPicker.jsx   # Calendar & time slot picker
│       │   ├── Dashboard.jsx            # User dashboard (my reservations)
│       │   ├── DashboardLayout.jsx      # Layout wrapper with topbar & notification bell
│       │   ├── LanguageToggle.jsx       # TR/EN language switcher
│       │   ├── Login.jsx                # Login page
│       │   ├── MakeReservationModal.jsx # New reservation modal (Open/Closed toggle + live capacity preview)
│       │   ├── MyGroups.jsx             # Leader dashboard: requests, leave approvals, member removal
│       │   ├── NotificationBell.jsx     # Bell icon, unread badge, dropdown, 5 notification types, 30s polling
│       │   ├── ProfileModal.jsx         # User profile modal
│       │   ├── ProtectedRoute.jsx       # Auth route guard
│       │   ├── Register.jsx             # Register page
│       │   ├── ReservationForm.jsx      # Reservation form
│       │   ├── Sidebar.jsx              # Sidebar navigation
│       │   └── SuccessModal.jsx         # Success confirmation modal
│       ├── context/
│       │   ├── AuthContext.jsx          # Auth state management
│       │   ├── LanguageContext.jsx      # Language provider
│       │   └── languageCore.js          # i18n context/hook
│       └── utils/
│           ├── api.js                   # API helper functions
│           └── slotHelpers.js           # Slot utility functions
├── database.sql
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

The API will be available at `http://localhost:5001`.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

> **Note:** Run the backend first so the frontend can connect to the API.

### Demo Login

| Username | Password |
| -------- | -------- |
| `123`    | `123123` |

### Run Tests

```bash
cd backend
npm test
```

**Test Suites:** 4 · **Tests:** 57 (Auth, Slot Availability/Management, Reservation/History, Admin)

---

## API Endpoints

### Auth (`/api/auth`)

| Method | Endpoint    | Auth       | Description                     |
| ------ | ----------- | ---------- | ------------------------------- |
| POST   | `/register` | No         | Register a new customer account |
| POST   | `/login`    | No         | Login and receive a JWT         |
| GET    | `/me`       | Bearer JWT | Get current user profile        |

#### Register – Request Body

```json
{
  "username": "testuser",
  "password": "secret123"
}
```

#### Register – Response `201`

```json
{
  "message": "Registration successful.",
  "token": "<jwt>",
  "user": { "id": 1, "username": "testuser", "role": "customer" }
}
```

#### Login – Request Body

```json
{
  "username": "testuser",
  "password": "secret123"
}
```

#### Login – Response `200`

```json
{
  "message": "Login successful.",
  "token": "<jwt>",
  "user": { "id": 1, "username": "testuser", "role": "customer" }
}
```

### Groups (`/api/groups`)

| Method | Endpoint                         | Auth       | Description                                      |
| ------ | -------------------------------- | ---------- | ------------------------------------------------ |
| POST   | `/`                              | Bearer JWT | Create an open group reservation                 |
| GET    | `/`                              | Bearer JWT | List open groups (filters: date, search, available) |
| GET    | `/my`                            | Bearer JWT | List groups led by the current user              |
| GET    | `/my-requests`                   | Bearer JWT | List current user's own join/leave request state |
| GET    | `/:id`                           | Bearer JWT | Get single group details                         |
| PUT    | `/:id`                           | Bearer JWT | Update a group (leader only)                     |
| DELETE | `/:id`                           | Bearer JWT | Cancel a group (leader only)                     |
| POST   | `/:id/join`                      | Bearer JWT | Submit a join request                            |
| POST   | `/:id/leave`                     | Bearer JWT | Submit a leave request as an approved member     |
| GET    | `/:id/requests`                  | Bearer JWT | List join requests and pending leave requests    |
| PUT    | `/:id/requests/:requestId`       | Bearer JWT | Approve or reject a join request (leader only)   |
| PUT    | `/:id/leave-requests/:requestId` | Bearer JWT | Approve or reject a leave request (leader only)  |
| DELETE | `/:id/members/:userId`           | Bearer JWT | Remove an approved member directly (leader only) |

### Reservations (`/api/reservations`)

| Method | Endpoint   | Auth       | Description                                      |
| ------ | ---------- | ---------- | ------------------------------------------------ |
| POST   | `/`        | Bearer JWT | Create an individual reservation                 |
| GET    | `/my`      | Bearer JWT | List active reservations for the current user    |
| GET    | `/history` | Bearer JWT | Store completed past games and list user history |
| PUT    | `/:id`     | Bearer JWT | Update an active reservation                     |
| DELETE | `/:id`     | Bearer JWT | Cancel an active reservation                     |

### Slots (`/api/slots`)

| Method | Endpoint        | Auth             | Description                                      |
| ------ | --------------- | ---------------- | ------------------------------------------------ |
| GET    | `/availability` | No               | Get availability for a date or date range        |
| GET    | `/settings`     | Bearer JWT admin | Get working hours, slot duration, and capacity   |
| PUT    | `/settings`     | Bearer JWT admin | Update working hours, slot duration, and capacity |
| GET    | `/blocks`       | Bearer JWT admin | List blocked slots for a date                    |
| POST   | `/blocks`       | Bearer JWT admin | Block a date/time range                          |
| DELETE | `/blocks/:id`   | Bearer JWT admin | Remove a slot block                              |

### Admin (`/api/admin`)

| Method | Endpoint                       | Auth             | Description                               |
| ------ | ------------------------------ | ---------------- | ----------------------------------------- |
| GET    | `/reservations`                | Bearer JWT admin | List all reservations with status/date filters |
| PUT    | `/reservations/:id/approve`    | Bearer JWT admin | Reactivate/approve a non-completed reservation |
| PUT    | `/reservations/:id/cancel`     | Bearer JWT admin | Cancel a non-completed reservation        |

### Notifications (`/api/notifications`)

| Method | Endpoint      | Auth       | Description                        |
| ------ | ------------- | ---------- | ---------------------------------- |
| GET    | `/`           | Bearer JWT | Get notifications (last 30)        |
| PUT    | `/read-all`   | Bearer JWT | Mark all notifications as read     |
| PUT    | `/:id/read`   | Bearer JWT | Mark a single notification as read |

---

## Database Schema

### `users`

```sql
CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  username   VARCHAR(50) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  role       ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `reservations`

```sql
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
```

### `group_reservations`

```sql
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
```

### `join_requests`

```sql
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
```

### `leave_requests`

```sql
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
```

### `slot_settings`

```sql
CREATE TABLE slot_settings (
  id                    TINYINT PRIMARY KEY DEFAULT 1,
  open_time             TIME NOT NULL DEFAULT '10:00:00',
  close_time            TIME NOT NULL DEFAULT '22:00:00',
  slot_duration_minutes INT NOT NULL DEFAULT 30,
  max_capacity          INT NOT NULL DEFAULT 20,
  is_open               BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### `slot_blocks`

```sql
CREATE TABLE slot_blocks (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  block_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time   TIME NOT NULL,
  reason     VARCHAR(255) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_slot_block (block_date, start_time, end_time)
);
```

### `past_events`

```sql
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
```

### `notifications`

```sql
CREATE TABLE IF NOT EXISTS notifications (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  type          ENUM('join_request','request_approved','request_rejected','group_full','group_cancelled') NOT NULL,
  title         VARCHAR(200) NOT NULL,
  body          VARCHAR(500),
  is_read       BOOLEAN NOT NULL DEFAULT FALSE,
  ref_group_id  INT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

> The `notifications`, `slot_settings`, `slot_blocks`, `leave_requests`, and `past_events` tables are created automatically by the backend bootstrap.

---

## Sprint Plan

| Sprint   | Weeks | Key Goals                                                                          |
| -------- | ----- | ---------------------------------------------------------------------------------- |
| Sprint 1 | 1–2   | Auth, slot availability, standard reservation, open-group creation & join requests |
| Sprint 2 | 3–4   | Group leader approval flow, cancel/modify, e-mail notifications, admin panel       |
| Sprint 3 | 5–6   | Reservation history, occupancy reports, real-time availability                     |
| Sprint 4 | 7–8   | Full testing, UI polish, CI/CD deployment, final documentation                     |

**Total:** 13 User Stories · 97 Story Points · 44 Tasks

---

## Task Progress

> Durum ikonları: ✅ Done · 🔄 In Progress · 🔲 Todo

### Sprint 1 — Weeks 1–2

_Auth, slot availability, standard reservation, open-group creation & join requests_

| Task | Description                                                                                                         | Assignee                                | Est. | Status          |
| ---- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ---- | --------------- |
| T-01 | Design user database schema                                                                                         | Begüm Rana Türkoğlu                     | 3h   | ✅ Done         |
| T-02 | Implement register/login API endpoints (JWT)                                                                        | Mustafa Göçmen                          | 4h   | ✅ Done         |
| T-03 | Build register & login UI pages                                                                                     | Muhammet Gümüş                          | 4h   | ✅ Done         |
| T-04 | Write authentication unit tests                                                                                     | Mustafa Göçmen                          | 2h   | ✅ Done         |
| T-05 | Implement availability query API                                                                                    | Tuna Öcal                               | 4h   | ✅ Done         |
| T-06 | Build calendar/slot display component                                                                               | Muhammet Gümüş                          | 6h   | ✅ Done         |
| T-07 | Design reservation database schema                                                                                  | Begüm R. Türkoğlu / Eylül S. Altunsaray | 3h   | ✅ Done         |
| T-08 | Implement reservation creation API (conflict check)                                                                 | Mustafa Göçmen                          | 6h   | ✅ Done         |
| T-09 | Build reservation form UI                                                                                           | Muhammet Gümüş                          | 5h   | ✅ Done         |
| T-10 | Write reservation integration tests                                                                                 | Mustafa Göçmen                          | 3h   | ✅ Done         |
| T-11 | Design group reservation DB schema (open/closed, party size)                                                        | Begüm R. Türkoğlu / Eylül S. Altunsaray | 3h   | ✅ Done         |
| T-12 | Implement open-group creation API                                                                                   | Mustafa Göçmen                          | 4h   | ✅ Done         |
| T-13 | Build open-group creation UI for group leader                                                                       | Muhammet Gümüş                          | 4h   | ✅ Done         |
| T-14 | Implement open groups listing API with filters                                                                      | Tuna Öcal                               | 3h   | ✅ Done         |
| T-15 | Build open groups browse page & join request form                                                                   | Muhammet Gümüş                          | 5h   | ✅ Done         |
| T-16 | Implement join request submission API                                                                               | Tuna Öcal                               | 3h   | ✅ Done         |
| T-37 | Enhance group creation UI: Open/Closed toggle + live capacity preview                                              | Muhammet Gümüş                          | 3h   | ✅ Done         |
| T-38 | Enhance browse page: full date/time, capacity progress bar, "I Want to Join" flow, filtering                      | Muhammet Gümüş                          | 5h   | ✅ Done         |
| T-41 | Enforce one-group-per-slot rule: block duplicate groups & individual reservations when slot is taken (API + model) | Mustafa Göçmen                          | 3h   | ✅ Done         |
| T-42 | Live slot availability in reservation modal: fetch real API on date select, disable taken slots in dropdown       | Mustafa Göçmen                          | 2h   | ✅ Done         |

### Sprint 2 — Weeks 3–4

_Group leader approval flow, cancel/modify, e-mail notifications, admin panel_

| Task | Description                                                                                                        | Assignee              | Est. | Status          |
| ---- | ------------------------------------------------------------------------------------------------------------------ | --------------------- | ---- | --------------- |
| T-17 | Build group leader dashboard (pending requests list, approve/reject UI)                                            | Muhammet Gümüş        | 5h   | ✅ Done         |
| T-18 | Implement approve/reject join request API                                                                          | Tuna Öcal             | 4h   | ✅ Done         |
| T-19 | Auto-lock reservation when group is full                                                                           | Tuna Öcal             | 3h   | ✅ Done         |
| T-20 | Send notifications to all members on group full/approved/rejected/cancelled                                        | Tuna Öcal             | 3h   | ✅ Done         |
| T-21 | Implement cancel & modify reservation API endpoints                                                                | Tuna Öcal             | 4h   | ✅ Done         |
| T-22 | Build reservation management UI (customer side)                                                                    | Muhammet Gümüş        | 4h   | ✅ Done         |
| T-23 | Integrate e-mail service (SendGrid/SMTP)                                                                           | Tuna Öcal             | 3h   | 🔲 Todo         |
| T-24 | Design e-mail confirmation templates                                                                               | Muhammet Gümüş        | 2h   | 🔲 Todo         |
| T-25 | Build admin panel – reservation list & filters                                                                     | Muhammet Gümüş        | 6h   | ✅ Done         |
| T-26 | Implement admin approve/cancel operations                                                                          | Eylül Sena Altunsaray | 3h   | ✅ Done         |
| T-27 | Implement working hours & slot management API                                                                      | Begüm Rana Türkoğlu   | 4h   | ✅ Done         |
| T-28 | Build admin calendar configuration UI                                                                              | Muhammet Gümüş        | 4h   | 🔲 Todo         |
| T-39 | Implement notifications API (table auto-create, GET / PUT read / PUT read-all endpoints)                          | Tuna Öcal             | 3h   | ✅ Done         |
| T-40 | Build NotificationBell: bell icon, unread badge, dropdown, 5 types, 30s polling, mark all read                   | Muhammet Gümüş        | 4h   | ✅ Done         |
| T-43 | Group member leave request and manager direct removal flow                                                        | Tuna Öcal             | 4h   | ✅ Done         |

### Sprint 3 — Weeks 5–6

_Reservation history, occupancy reports, real-time availability_

| Task | Description                                  | Assignee              | Est. | Status  |
| ---- | -------------------------------------------- | --------------------- | ---- | ------- |
| T-29 | Reservation history API & UI (customer)      | Mustafa Göçmen        | 4h   | ✅ Done |
| T-30 | Occupancy reports & chart dashboard          | Begüm Rana Türkoğlu   | 6h   | ✅ Done|
| T-31 | Real-time availability (WebSocket / polling) | Tuna Öcal             | 5h   | 🔲 Todo |
| T-32 | Live update UI integration                   | Eylül Sena Altunsaray | 4h   | 🔲 Todo |
| T-44 | TR/EN multilingual UI support                | Muhammet Gümüş        | 3h   | ✅ Done |

### Sprint 4 — Weeks 7–8

_Full testing, UI polish, CI/CD deployment, final documentation_

| Task | Description                            | Assignee                         | Est. | Status  |
| ---- | -------------------------------------- | -------------------------------- | ---- | ------- |
| T-33 | Full system testing & bug fixes        | Tuna Öcal (All Team)             | 6h   | 🔲 Todo |
| T-34 | UI/UX final polish & responsive design | Muhammet Gümüş                   | 4h   | 🔲 Todo |
| T-35 | Deployment & CI/CD setup               | Tuna Öcal                        | 4h   | 🔲 Todo |
| T-36 | Final documentation & README           | Eylül Sena Altunsaray (All Team) | 3h   | 🔲 Todo |

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

_COMP 202 Spring 2026 · LaserZone Reservation System_
