-- Veritabanı kurulumu
CREATE DATABASE IF NOT EXISTS laserzone;
USE laserzone;

-- 0. Kullanıcılar Tablosu (Users)
CREATE TABLE IF NOT EXISTS users (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    username   VARCHAR(50) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    role       ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1. Rezervasyonlar Tablosu (Reservations)
CREATE TABLE IF NOT EXISTS reservations (
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

-- 2. Grup Rezervasyonlar Tablosu (Group Reservations)
CREATE TABLE IF NOT EXISTS group_reservations (
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

-- 3. Katılım İstekleri Tablosu (Join Requests)
CREATE TABLE IF NOT EXISTS join_requests (
    id                   INT AUTO_INCREMENT PRIMARY KEY,
    group_reservation_id INT NOT NULL,
    user_id              INT NOT NULL,
    player_count         INT NOT NULL,
    status               ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_request (group_reservation_id, user_id),
    FOREIGN KEY (group_reservation_id) REFERENCES group_reservations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Slot çalışma saatleri ve kapasite ayarları
CREATE TABLE IF NOT EXISTS slot_settings (
    id                    TINYINT PRIMARY KEY DEFAULT 1,
    open_time             TIME NOT NULL DEFAULT '10:00:00',
    close_time            TIME NOT NULL DEFAULT '22:00:00',
    slot_duration_minutes INT NOT NULL DEFAULT 30,
    max_capacity          INT NOT NULL DEFAULT 20,
    is_open               BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO slot_settings
    (id, open_time, close_time, slot_duration_minutes, max_capacity, is_open)
VALUES
    (1, '10:00:00', '22:00:00', 30, 20, TRUE);

-- 5. Admin tarafından bloke edilen slotlar
CREATE TABLE IF NOT EXISTS slot_blocks (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    block_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time   TIME NOT NULL,
    reason     VARCHAR(255) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_slot_block (block_date, start_time, end_time)
);

-- 6. Geçmiş oyun / event arşivi
CREATE TABLE IF NOT EXISTS past_events (
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
