<?php
$host = 'localhost';
$dbname = 'dreamhome_db';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch(PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!function_exists('getCurrentUser')) {
    function getCurrentUser($pdo) {
        if (isset($_SESSION['user_id'])) {
            $stmt = $pdo->prepare("SELECT id, email, first_name, last_name, phone, city, role, is_active FROM users WHERE id = ?");
            $stmt->execute([$_SESSION['user_id']]);
            return $stmt->fetch();
        }
        return null;
    }
}

if (!function_exists('isAdmin')) {
    function isAdmin($pdo) {
        $user = getCurrentUser($pdo);
        return $user && $user['role'] === 'admin';
    }
}

if (!function_exists('isOwner')) {
    function isOwner($pdo, $propertyId = null) {
        $user = getCurrentUser($pdo);
        if (!$user) return false;
        if ($user['role'] === 'admin') return true;
        if ($propertyId && $user['role'] === 'owner') {
            $stmt = $pdo->prepare("SELECT id FROM properties WHERE id = ? AND owner_id = ?");
            $stmt->execute([$propertyId, $user['id']]);
            return $stmt->fetch() !== false;
        }
        return $user['role'] === 'owner';
    }
}
?>