# LaserZone Backend — Mimari

LaserZone online rezervasyon sisteminin backend mimarisi. Node.js + Express + MySQL (mysql2) üzerine kurulmuş; JWT tabanlı kimlik doğrulama, rol-bazlı yetkilendirme (customer/admin) ve REST API katmanı kullanır.

## Katmanlı Mimari

```mermaid
flowchart TB
    Client["İstemci<br/>(Frontend / Mobile)"]

    subgraph App["Express Uygulaması (src/app.js)"]
        direction TB
        CORS["CORS Middleware"]
        JSON["express.json()"]
        Health["/api/health"]

        subgraph Routes["Route Katmanı (src/routes)"]
            R1["authRoutes<br/>/api/auth"]
            R2["slotRoutes<br/>/api/slots"]
            R3["reservationRoutes<br/>/api/reservations"]
            R4["groupRoutes<br/>/api/groups"]
            R5["notificationRoutes<br/>/api/notifications"]
            R6["adminRoutes<br/>/api/admin"]
        end

        subgraph MW["Middleware (src/middleware)"]
            Protect["protect<br/>(JWT doğrulama)"]
            AdminOnly["adminOnly<br/>(rol kontrolü)"]
        end

        subgraph Controllers["Controller Katmanı (src/controllers)"]
            C1["authController"]
            C2["slotController"]
            C3["reservationController"]
            C4["groupController"]
            C5["notificationController"]
            C6["adminController"]
        end

        subgraph Models["Model Katmanı (src/models)"]
            M1["User"]
            M2["Slot"]
            M3["Reservation"]
            M4["GroupReservation"]
            M5["Notification"]
            M6["PastEvent"]
        end

        DB["config/db.js<br/>(mysql2 connection pool)"]
    end

    MySQL[("MySQL<br/>laserzone DB")]

    Client -->|HTTP/JSON| CORS --> JSON
    JSON --> Routes
    JSON --> Health

    Routes --> MW
    MW --> Controllers

    R1 --> C1
    R2 --> C2
    R3 --> C3
    R4 --> C4
    R5 --> C5
    R6 --> C6

    C1 --> M1
    C2 --> M2
    C3 --> M3 & M5 & M6
    C4 --> M4 & M5 & M6
    C5 --> M5
    C6 --> M3 & M4 & M5

    M1 & M2 & M3 & M4 & M5 & M6 --> DB
    DB -->|Connection Pool| MySQL
```

## İstek Akışı (Request Flow)

```mermaid
sequenceDiagram
    autonumber
    participant U as İstemci
    participant E as Express App
    participant MW as authMiddleware
    participant C as Controller
    participant M as Model
    participant DB as MySQL

    U->>E: HTTP isteği (Bearer JWT)
    E->>E: CORS + JSON parse
    E->>MW: protect()
    MW->>MW: jwt.verify(token, JWT_SECRET)
    alt Token geçersiz
        MW-->>U: 401 Unauthorized
    else Token geçerli
        MW->>MW: req.user = decoded
        opt Admin endpoint
            MW->>MW: adminOnly() rol kontrolü
        end
        MW->>C: next()
        C->>M: Veri operasyonu
        M->>DB: SQL sorgusu (pool.execute)
        DB-->>M: Sonuç
        M-->>C: Domain nesnesi
        C-->>U: JSON yanıt
    end
```

## Domain Modeli (Veri İlişkileri)

```mermaid
erDiagram
    USERS ||--o{ RESERVATIONS : "owner"
    USERS ||--o{ GROUP_RESERVATIONS : "leader"
    USERS ||--o{ JOIN_REQUESTS : "applicant"
    USERS ||--o{ LEAVE_REQUESTS : "member"
    USERS ||--o{ NOTIFICATIONS : "recipient"
    USERS ||--o{ PAST_EVENTS : "participant"

    GROUP_RESERVATIONS ||--o{ JOIN_REQUESTS : "has"
    GROUP_RESERVATIONS ||--o{ LEAVE_REQUESTS : "has"

    SLOT_SETTINGS ||..|| SLOT_BLOCKS : "yönetir"

    USERS {
        int id PK
        string username UK
        string password
        enum role "customer|admin"
        timestamp created_at
    }

    RESERVATIONS {
        int id PK
        int user_id FK
        string reservation_name
        date reservation_date
        time start_time
        time end_time
        int player_count
        enum status "active|cancelled|completed"
    }

    GROUP_RESERVATIONS {
        int id PK
        int leader_user_id FK
        string reservation_name
        date reservation_date
        time start_time
        time end_time
        int party_size
        int current_count
        enum status "open|closed|cancelled"
    }

    JOIN_REQUESTS {
        int id PK
        int group_reservation_id FK
        int user_id FK
        int player_count
        enum status "pending|approved|rejected|left|removed"
    }

    LEAVE_REQUESTS {
        int id PK
        int group_reservation_id FK
        int user_id FK
        int player_count
        enum status "pending|approved|rejected"
    }

    SLOT_SETTINGS {
        tinyint id PK
        time open_time
        time close_time
        int slot_duration_minutes
        int max_capacity
        bool is_open
    }

    SLOT_BLOCKS {
        int id PK
        date block_date
        time start_time
        time end_time
        string reason
    }

    NOTIFICATIONS {
        int id PK
        int user_id FK
        string message
        bool is_read
        timestamp created_at
    }

    PAST_EVENTS {
        int id PK
        enum source_type "reservation|group"
        int source_id
        int user_id FK
        string event_name
        date event_date
        time start_time
        time end_time
        int player_count
    }
```

## API Endpoint Haritası

```mermaid
flowchart LR
    API(("/api"))

    API --> Auth["/auth"]
    Auth --> A1["POST /register"]
    Auth --> A2["POST /login"]
    Auth --> A3["GET /me 🔒"]

    API --> Slots["/slots"]
    Slots --> S1["GET /availability"]
    Slots --> S2["GET /settings 🔒👑"]
    Slots --> S3["PUT /settings 🔒👑"]
    Slots --> S4["GET /blocks 🔒👑"]
    Slots --> S5["POST /blocks 🔒👑"]
    Slots --> S6["DELETE /blocks/:id 🔒👑"]

    API --> Res["/reservations"]
    Res --> RS1["POST / 🔒"]
    Res --> RS2["GET /my 🔒"]
    Res --> RS3["GET /history 🔒"]
    Res --> RS4["PUT /:id 🔒"]
    Res --> RS5["DELETE /:id 🔒"]

    API --> Groups["/groups"]
    Groups --> G1["POST / 🔒"]
    Groups --> G2["GET / 🔒"]
    Groups --> G3["GET /my 🔒"]
    Groups --> G4["GET /my-requests 🔒"]
    Groups --> G5["GET /:id 🔒"]
    Groups --> G6["PUT /:id 🔒"]
    Groups --> G7["DELETE /:id 🔒"]
    Groups --> G8["POST /:id/join 🔒"]
    Groups --> G9["POST /:id/leave 🔒"]
    Groups --> G10["GET /:id/requests 🔒"]
    Groups --> G11["PUT /:id/requests/:rid 🔒"]
    Groups --> G12["PUT /:id/leave-requests/:rid 🔒"]
    Groups --> G13["DELETE /:id/members/:uid 🔒"]

    API --> Notif["/notifications"]
    Notif --> N1["GET / 🔒"]
    Notif --> N2["PUT /read-all 🔒"]
    Notif --> N3["PUT /:id/read 🔒"]

    API --> Admin["/admin"]
    Admin --> AD1["GET /reservations 🔒👑"]
    Admin --> AD2["PUT /reservations/:id/approve 🔒👑"]
    Admin --> AD3["PUT /reservations/:id/cancel 🔒👑"]

    API --> Health["GET /health"]

    classDef public fill:#d4edda,stroke:#155724
    classDef auth fill:#fff3cd,stroke:#856404
    classDef admin fill:#f8d7da,stroke:#721c24

    class A1,A2,S1,Health public
    class A3,RS1,RS2,RS3,RS4,RS5,G1,G2,G3,G4,G5,G6,G7,G8,G9,G10,G11,G12,G13,N1,N2,N3 auth
    class S2,S3,S4,S5,S6,AD1,AD2,AD3 admin
```

**Legend:** 🔒 JWT zorunlu · 👑 Admin yetkisi zorunlu

## Boot Akışı (Uygulama Açılışı)

```mermaid
flowchart TB
    Start(["node src/app.js"]) --> Env["dotenv.config()"]
    Env --> Pool["MySQL pool oluştur"]
    Pool --> Conn{"DB bağlantısı?"}
    Conn -->|Başarısız| Err["Hata logla<br/>process.exit(1)"]
    Conn -->|Başarılı| Tables["Tabloları hazırla<br/>(createTable/createTables)"]
    Tables --> T1["Notification"]
    Tables --> T2["GroupReservation"]
    Tables --> T3["Slot"]
    Tables --> T4["PastEvent"]
    T1 & T2 & T3 & T4 --> Listen["app.listen(PORT)"]
    Listen --> Ready(["LaserZone API hazır"])
```

## Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Runtime | Node.js |
| Web Framework | Express 4 |
| Veritabanı | MySQL (mysql2/promise) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| CORS | cors |
| Config | dotenv |
| Test | Jest + Supertest |
| Dev | nodemon |
