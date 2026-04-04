# First Iteration Notes

## Requirements until 2nd meeting:
### Runnable system that has:
- Login & Register pages (username + password)
- Dashboard with left sidebar and user profile
- My Reservations page (dynamic list)
- Make Reservation popup form
- Backend Auth API + Reservation API (with conflict check)
- Slot Availability API
- Database schema for users, reservations, group reservations

---

## Overall Requirements:

| Title | Description |
|-------|-------------|
| **Login** | UI that allows user to enter the app using username and password. JWT token is issued on successful login. |
| **Sign-up** | UI that allows user to create an account with username and password. Username must be unique, min 3 characters. Password min 6 characters. |
| **Dashboard – Sidebar** | After login, left-hand side panel shows user avatar (generated from username initial), username, and role. Includes navigation menu and logout button. |
| **My Reservations** | Main menu item. When clicked, main content area shows a dynamic list of the user's active reservations. Each card displays reservation name, date, time, player count, and a Locked badge. |
| **Make Reservation** | Button on the dashboard opens a popup form. Form requires: reservation name (min 2 chars), number of players (− / + buttons, default min 3, max 20), date and time selection via interactive calendar. On confirm, the selected slot is locked and cannot be double-booked. |
| **Reservation API** | POST /api/reservations — creates a reservation with conflict check. Validates date (future only), time (10:00–21:00), players (3–20). Returns 409 if slot is fully booked. |
| **Slot Availability API** | GET /api/slots/availability — returns hourly slots (10:00–22:00) for a given date or date range, with booked/available player counts per slot. |
| **Group Reservation API** | POST /api/groups — group leader creates an open reservation with a party size. Other users can browse and send join requests. Group auto-closes when party size is reached. |
| **Auth API** | POST /api/auth/register and /api/auth/login — JWT-based authentication. POST /api/auth/me — returns current user info. |
| **Database Schema** | Tables: users (username, password, role), reservations (name, date, time, players, status), group_reservations (open/closed/cancelled, party_size, current_count), join_requests (pending/approved/rejected). |

---

## Test Coverage:
- **44 passing tests** across 3 suites
  - Auth API: 12 tests
  - Slot Availability API: 11 tests
  - Reservation API: 21 tests

---

**Link:** https://github.com/mustafag63/laserzone

---

**Mustafa Göçmen**
**Tuna Öcal**
**Muhammet Gümüş**
**Begüm Rana Türkoğlu**
**Eylül Sena Altunsaray**
