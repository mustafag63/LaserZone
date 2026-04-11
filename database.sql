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
