-- Mevcut Veritabanınız ve Kullanıcılar Tablosu
-- CREATE DATABASE laserzone;
-- USE laserzone;

-- CREATE TABLE users (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     name VARCHAR(100),
--     email VARCHAR(100) UNIQUE,
--     password VARCHAR(255),
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- 1. Oyun Alanları / Odalar Tablosu (Arenas)
-- Hangi arenada/odada rezervasyon yapılacağını belirlemek için
CREATE TABLE arenas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,             -- Alanın adı (Örn: Neon Arena, Dark Zone)
    capacity INT NOT NULL,                  -- Maksimum oyuncu kapasitesi
    hourly_rate DECIMAL(10, 2) NOT NULL,    -- Saatlik oyun ücreti
    description TEXT,                       -- Alanın açıklaması
    is_active BOOLEAN DEFAULT TRUE,         -- Alan şu an kullanıma açık mı?
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Rezervasyonlar Tablosu (Reservations)
-- Kullanıcılar ve Oyun Alanları arasındaki ilişkiyi kurar
CREATE TABLE reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,                   -- Rezervasyonu yapan kullanıcı (Foreign Key)
    arena_id INT NOT NULL,                  -- Rezerve edilen alan (Foreign Key)
    reservation_date DATE NOT NULL,         -- Rezervasyonun oynanacağı gün
    start_time TIME NOT NULL,               -- Oyun başlangıç saati
    end_time TIME NOT NULL,                 -- Oyun bitiş saati
    number_of_players INT NOT NULL,         -- Oyuncu sayısı
    total_price DECIMAL(10, 2) NOT NULL,    -- Toplam ücret
    status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending', -- Rezervasyon durumu
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- İlişkiler (Foreign Keys)
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (arena_id) REFERENCES arenas(id) ON DELETE RESTRICT
);

-- 3. Ödemeler Tablosu (Payments) - İsteğe Bağlı
-- Rezervasyonlara ait ödeme süreçlerini takip etmek için
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id INT NOT NULL,            -- Hangi rezervasyonun ödemesi (Foreign Key)
    amount DECIMAL(10, 2) NOT NULL,         -- Ödenen miktar
    payment_method ENUM('credit_card', 'cash', 'bank_transfer') NOT NULL, -- Ödeme yöntemi
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending', -- Ödeme durumu
    transaction_id VARCHAR(255),            -- Banka veya ödeme sağlayıcı işlem ID'si
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- İlişkiler (Foreign Keys)
    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE
);

-- 4. Grup Rezervasyonlar Tablosu (Group Reservations) — T-11
-- Grup lideri açık bir rezervasyon oluşturur; diğer kullanıcılar katılım isteği gönderebilir
CREATE TABLE group_reservations (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    leader_user_id      INT NOT NULL,                          -- Grubu oluşturan lider (FK)
    reservation_name    VARCHAR(100) NOT NULL,                 -- Grup adı
    reservation_date    DATE NOT NULL,                         -- Oyun günü
    start_time          TIME NOT NULL,                         -- Başlangıç saati
    end_time            TIME NOT NULL,                         -- Bitiş saati
    party_size          INT NOT NULL,                          -- Maksimum oyuncu sayısı (3–20)
    current_count       INT NOT NULL DEFAULT 0,                -- Onaylanan oyuncu sayısı (lider dahil)
    status              ENUM('open','closed','cancelled') NOT NULL DEFAULT 'open',
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (leader_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Katılım İstekleri Tablosu (Join Requests) — T-11
-- Kullanıcıların açık grup rezervasyonlarına katılım talepleri
CREATE TABLE join_requests (
    id                      INT AUTO_INCREMENT PRIMARY KEY,
    group_reservation_id    INT NOT NULL,                      -- Hangi gruba katılmak istiyor (FK)
    user_id                 INT NOT NULL,                      -- Katılmak isteyen kullanıcı (FK)
    player_count            INT NOT NULL,                      -- Kaç oyuncu getireceği
    status                  ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_request (group_reservation_id, user_id), -- Aynı gruba tekrar istek gönderilemez
    FOREIGN KEY (group_reservation_id) REFERENCES group_reservations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);