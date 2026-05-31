<?php
header('Content-Type: application/json');
require_once 'config/database.php';
if (session_status() === PHP_SESSION_NONE) session_start();

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$userId = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $pdo->prepare("SELECT id, email, first_name, last_name, phone, city, bio, role, created_at FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        echo json_encode(['success' => true, 'user' => $stmt->fetch()]);
        break;
        
    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("UPDATE users SET first_name = ?, last_name = ?, phone = ?, city = ?, bio = ? WHERE id = ?");
        $result = $stmt->execute([
            $data['first_name'] ?? '',
            $data['last_name'] ?? '',
            $data['phone'] ?? '',
            $data['city'] ?? '',
            $data['bio'] ?? '',
            $userId
        ]);
        if ($result) {
            $_SESSION['user_name'] = ($data['first_name'] ?? '') . ' ' . ($data['last_name'] ?? '');
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false]);
        }
        break;
        
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("SELECT password FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        
        if (!password_verify($data['current_password'], $user['password'])) {
            echo json_encode(['success' => false, 'message' => 'Current password is incorrect']);
            exit;
        }
        
        if (strlen($data['new_password']) < 6) {
            echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters']);
            exit;
        }
        
        $hashedPassword = password_hash($data['new_password'], PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
        $result = $stmt->execute([$hashedPassword, $userId]);
        echo json_encode(['success' => $result]);
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
?>