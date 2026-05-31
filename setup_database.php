<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<!DOCTYPE html>
<html lang='ar' dir='rtl'>
<head>
    <meta charset='UTF-8'>
    <title>تثبيت قاعدة البيانات - DreamHome</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #fdf8f3;
            padding: 2rem;
            direction: rtl;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            padding: 2rem;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            border: 1px solid #e8ddd0;
        }
        h1 { color: #3b2314; }
        h2 { color: #5c3520; font-size: 1.2rem; margin-top: 1.5rem; }
        .success { color: #2e7d32; background: #e8f5e9; padding: 0.5rem 1rem; border-radius: 10px; margin: 0.5rem 0; }
        .error { color: #c25b4a; background: #feeaea; padding: 0.5rem 1rem; border-radius: 10px; margin: 0.5rem 0; }
        .info { color: #e67e22; background: #fff3e0; padding: 0.5rem 1rem; border-radius: 10px; margin: 0.5rem 0; }
        code { background: #f0e8dc; padding: 0.2rem 0.5rem; border-radius: 5px; font-family: monospace; }
        .login-box {
            background: #fdf8f3;
            border: 1px solid #e8ddd0;
            border-radius: 15px;
            padding: 1rem;
            margin-top: 1.5rem;
        }
        .btn {
            display: inline-block;
            background: #c9a96e;
            color: #3b2314;
            padding: 0.7rem 1.5rem;
            text-decoration: none;
            border-radius: 40px;
            font-weight: bold;
            margin-top: 1rem;
        }
        .btn:hover { background: #e2c89a; }
        table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
        th, td { padding: 0.5rem; text-align: right; border-bottom: 1px solid #e8ddd0; }
        th { background: #f0e8dc; }
    </style>
</head>
<body>
<div class='container'>";

$host = 'localhost';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<h1>🔧 تثبيت نظام DreamHome</h1>";
    
    echo "<h2>📁 1. إنشاء قاعدة البيانات</h2>";
    $pdo->exec("DROP DATABASE IF EXISTS dreamhome_db");
    $pdo->exec("CREATE DATABASE dreamhome_db CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci");
    echo "<div class='success'>✅ تم إنشاء قاعدة البيانات بنجاح</div>";
    
    $pdo->exec("USE dreamhome_db");
    
    echo "<h2>👤 2. إنشاء جدول المستخدمين</h2>";
    $sql = "CREATE TABLE IF NOT EXISTS `users` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `email` varchar(255) NOT NULL UNIQUE,
        `password` varchar(255) NOT NULL,
        `first_name` varchar(100) DEFAULT NULL,
        `last_name` varchar(100) DEFAULT NULL,
        `phone` varchar(20) DEFAULT NULL,
        `city` varchar(100) DEFAULT NULL,
        `bio` text DEFAULT NULL,
        `role` enum('admin','owner','tenant') DEFAULT 'tenant',
        `is_active` tinyint(1) DEFAULT 1,
        `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
        `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";
    $pdo->exec($sql);
    echo "<div class='success'>✅ تم إنشاء جدول users</div>";
    
    echo "<h2>🏠 3. إنشاء جدول العقارات</h2>";
    $sql = "CREATE TABLE IF NOT EXISTS `properties` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `owner_id` int(11) NOT NULL,
        `name` varchar(255) NOT NULL,
        `description` text DEFAULT NULL,
        `location` varchar(100) DEFAULT NULL,
        `district` varchar(100) DEFAULT NULL,
        `type` varchar(50) DEFAULT NULL,
        `price_usd` decimal(10,2) DEFAULT NULL,
        `price_dzd` decimal(15,2) DEFAULT NULL,
        `bedrooms` int(11) DEFAULT 2,
        `bathrooms` int(11) DEFAULT 2,
        `area` int(11) DEFAULT 100,
        `max_guests` int(11) DEFAULT 4,
        `rating` decimal(3,2) DEFAULT 0.00,
        `reviews_count` int(11) DEFAULT 0,
        `status` enum('available','booked','inactive','draft') DEFAULT 'available',
        `admin_status` enum('pending','approved','rejected') DEFAULT 'pending',
        `featured` tinyint(1) DEFAULT 0,
        `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
        `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        PRIMARY KEY (`id`),
        FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";
    $pdo->exec($sql);
    echo "<div class='success'>✅ تم إنشاء جدول properties</div>";
    
    echo "<h2>🖼️ 4. إنشاء جدول صور العقارات</h2>";
    $sql = "CREATE TABLE IF NOT EXISTS `property_images` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `property_id` int(11) NOT NULL,
        `image_url` varchar(500) NOT NULL,
        `is_primary` tinyint(1) DEFAULT 0,
        `sort_order` int(11) DEFAULT 0,
        `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (`id`),
        FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";
    $pdo->exec($sql);
    echo "<div class='success'>✅ تم إنشاء جدول property_images</div>";
    
    echo "<h2>📅 5. إنشاء جدول الحجوزات</h2>";
    $sql = "CREATE TABLE IF NOT EXISTS `reservations` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `booking_ref` varchar(50) DEFAULT NULL,
        `property_id` int(11) NOT NULL,
        `user_id` int(11) NOT NULL,
        `usage_type` varchar(50) DEFAULT NULL,
        `start_date` date NOT NULL,
        `end_date` date NOT NULL,
        `number_of_days` int(11) DEFAULT 1,
        `total_amount_dzd` decimal(15,2) DEFAULT NULL,
        `status` enum('pending','confirmed','cancelled','completed') DEFAULT 'pending',
        `payment_method` varchar(50) DEFAULT NULL,
        `special_requests` text DEFAULT NULL,
        `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (`id`),
        UNIQUE KEY `booking_ref` (`booking_ref`),
        FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE CASCADE,
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";
    $pdo->exec($sql);
    echo "<div class='success'>✅ تم إنشاء جدول reservations</div>";
    
    echo "<h2>⭐ 6. إنشاء جدول التقييمات</h2>";
    $sql = "CREATE TABLE IF NOT EXISTS `reviews` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `user_id` int(11) NOT NULL,
        `property_id` int(11) NOT NULL,
        `rating` int(11) DEFAULT NULL CHECK (rating >= 1 and rating <= 5),
        `comment` text DEFAULT NULL,
        `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (`id`),
        UNIQUE KEY `unique_review` (`user_id`,`property_id`),
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
        FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";
    $pdo->exec($sql);
    echo "<div class='success'>✅ تم إنشاء جدول reviews</div>";
    
    echo "<h2>💬 7. إنشاء جدول الرسائل</h2>";
    $sql = "CREATE TABLE IF NOT EXISTS `messages` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `sender_id` int(11) NOT NULL,
        `receiver_id` int(11) NOT NULL,
        `property_id` int(11) DEFAULT NULL,
        `subject` varchar(255) DEFAULT NULL,
        `message` text NOT NULL,
        `parent_id` int(11) DEFAULT NULL,
        `is_read` tinyint(1) DEFAULT 0,
        `is_deleted_sender` tinyint(1) DEFAULT 0,
        `is_deleted_receiver` tinyint(1) DEFAULT 0,
        `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (`id`),
        FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
        FOREIGN KEY (`receiver_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
        FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";
    $pdo->exec($sql);
    echo "<div class='success'>✅ تم إنشاء جدول messages</div>";
    
    // 9. إنشاء جدول wishlist
    echo "<h2>❤️ 8. إنشاء جدول المفضلة</h2>";
    $sql = "CREATE TABLE IF NOT EXISTS `wishlist` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `user_id` int(11) NOT NULL,
        `property_id` int(11) NOT NULL,
        `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (`id`),
        UNIQUE KEY `unique_wishlist` (`user_id`,`property_id`),
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
        FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";
    $pdo->exec($sql);
    echo "<div class='success'>✅ تم إنشاء جدول wishlist</div>";
    
    // 10. إنشاء جدول user_property_interactions
    echo "<h2>📊 9. إنشاء جدول تفاعلات المستخدم</h2>";
    $sql = "CREATE TABLE IF NOT EXISTS `user_property_interactions` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `user_id` int(11) NOT NULL,
        `property_id` int(11) NOT NULL,
        `action` enum('view','search','click','booking') DEFAULT 'view',
        `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (`id`),
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
        FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";
    $pdo->exec($sql);
    echo "<div class='success'>✅ تم إنشاء جدول user_property_interactions</div>";
    
    echo "<h2>👥 10. إضافة المستخدمين</h2>";
    
    $pdo->exec("DELETE FROM users");
    
    $hashed_password = password_hash('admin123', PASSWORD_DEFAULT);
    
    $stmt = $pdo->prepare("INSERT INTO users (id, email, password, first_name, last_name, role, is_active) VALUES (1, 'admin@dreamhome.com', ?, 'Admin', 'DreamHome', 'admin', 1)");
    $stmt->execute([$hashed_password]);
    echo "<div class='success'>✅ تم إضافة المستخدم ADMIN</div>";
    
    $stmt = $pdo->prepare("INSERT INTO users (id, email, password, first_name, last_name, phone, city, role, is_active) VALUES (2, 'owner@example.com', ?, 'Sarah', 'Owner', '0555987654', 'Seraïdi', 'owner', 1)");
    $stmt->execute([$hashed_password]);
    echo "<div class='success'>✅ تم إضافة المستخدم OWNER</div>";
    
    $stmt = $pdo->prepare("INSERT INTO users (id, email, password, first_name, last_name, phone, city, role, is_active) VALUES (3, 'tenant@example.com', ?, 'John', 'Doe', '0555123456', 'Annaba', 'tenant', 1)");
    $stmt->execute([$hashed_password]);
    echo "<div class='success'>✅ تم إضافة المستخدم TENANT</div>";
    
    echo "<h2>🏘️ 11. إضافة عقارات نموذجية</h2>";
    
    $properties = [
        [3, 'Oceanfront Luxury Villa', 'Beautiful luxury villa with breathtaking ocean views, private pool, and modern amenities.', 'seraidi', 'SERAÏDI', 'villa', 1550, 2170000, 5, 4, 380, 10, 'approved', 1],
        [3, 'Modern Downtown Apartment', 'Stylish apartment in the heart of downtown. Close to shops and restaurants.', 'el bouni', 'EL BOUNI', 'apartment', 500, 700000, 2, 1, 85, 4, 'approved', 0],
        [3, 'Mountain View Chalet', 'Cozy chalet with stunning mountain views. Perfect for nature lovers.', 'sidi amar', 'SIDI AMAR', 'chalet', 850, 1190000, 3, 2, 150, 6, 'approved', 1]
    ];
    
    $images = [
        'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&auto=format',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&auto=format',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format'
    ];
    
    foreach ($properties as $index => $prop) {
        $stmt = $pdo->prepare("INSERT INTO properties (owner_id, name, description, location, district, type, price_usd, price_dzd, bedrooms, bathrooms, area, max_guests, admin_status, featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute($prop);
        $propertyId = $pdo->lastInsertId();
        
        $stmt = $pdo->prepare("INSERT INTO property_images (property_id, image_url, is_primary) VALUES (?, ?, 1)");
        $stmt->execute([$propertyId, $images[$index]]);
        
        echo "<div class='success'>✅ تم إضافة العقار: {$prop[1]}</div>";
    }
    
    echo "<h2>⚙️ 12. إنشاء ملف إعدادات قاعدة البيانات</h2>";
    
    $configContent = "<?php
// config/database.php
\$host = 'localhost';
\$dbname = 'dreamhome_db';
\$username = 'root';
\$password = '';

try {
    \$pdo = new PDO(\"mysql:host=\$host;dbname=\$dbname;charset=utf8mb4\", \$username, \$password);
    \$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    \$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch(PDOException \$e) {
    die(json_encode(['success' => false, 'message' => 'Database connection failed: ' . \$e->getMessage()]));
}

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function getCurrentUser(\$pdo) {
    if (isset(\$_SESSION['user_id'])) {
        \$stmt = \$pdo->prepare(\"SELECT id, email, first_name, last_name, role FROM users WHERE id = ?\");
        \$stmt->execute([\$_SESSION['user_id']]);
        return \$stmt->fetch();
    }
    return null;
}
?>";
    
    if (!is_dir('config')) {
        mkdir('config', 0777, true);
    }
    
    file_put_contents('config/database.php', $configContent);
    echo "<div class='success'>✅ تم إنشاء ملف config/database.php</div>";
    
    echo "<div class='login-box'>";
    echo "<h2>🎉 اكتمل التثبيت بنجاح!</h2>";
    echo "<h3>👑 بيانات تسجيل الدخول كأدمن:</h3>";
    echo "<table>";
    echo "<tr><th>الحقل</th><th>القيمة</th></tr>";
    echo "<tr><td>البريد الإلكتروني</td><td><code>admin@dreamhome.com</code></td></tr>";
    echo "<tr><td>كلمة المرور</td><td><code>admin123</code></td></tr>";
    echo "<tr><td>الدور</td><td>Admin (مدير)</td></tr>";
    echo "</table>";
    
    echo "<h3>👤 بيانات تسجيل الدخول للمالك:</h3>";
    echo "<table>";
    echo "<tr><th>الحقل</th><th>القيمة</th></tr>";
    echo "<tr><td>البريد الإلكتروني</td><td><code>owner@example.com</code></td></tr>";
    echo "<tr><td>كلمة المرور</td><td><code>admin123</code></td></tr>";
    echo "<tr><td>الدور</td><td>Owner (مالك)</td></tr>";
    echo "</table>";
    
    echo "<h3>👥 بيانات تسجيل الدخول للمستخدم:</h3>";
    echo "<table>";
    echo "<tr><th>الحقل</th><th>القيمة</th></tr>";
    echo "<tr><td>البريد الإلكتروني</td><td><code>tenant@example.com</code></td></tr>";
    echo "<tr><td>كلمة المرور</td><td><code>admin123</code></td></tr>";
    echo "<tr><td>الدور</td><td>Tenant (مستأجر)</td></tr>";
    echo "</table>";
    
    echo "<a href='login.php' class='btn'>🔐 الذهاب إلى صفحة تسجيل الدخول</a>";
    echo "</div>";
    
} catch (PDOException $e) {
    echo "<div class='error'>❌ خطأ: " . $e->getMessage() . "</div>";
}

echo "</div></body></html>";
?>