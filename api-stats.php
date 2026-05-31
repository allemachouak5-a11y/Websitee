<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

require_once 'config/database.php';

$type = $_GET['type'] ?? '';

switch ($type) {
    case 'users':
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM users");
        $total = $stmt->fetch();
        $stmt = $pdo->query("SELECT role, COUNT(*) as count FROM users GROUP BY role");
        $roles = $stmt->fetchAll();
        $owners = $tenants = $admins = 0;
        foreach ($roles as $role) {
            if ($role['role'] === 'owner') $owners = $role['count'];
            if ($role['role'] === 'tenant') $tenants = $role['count'];
            if ($role['role'] === 'admin') $admins = $role['count'];
        }
        $stmt = $pdo->query("SELECT COUNT(*) as new_users FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)");
        $newUsers = $stmt->fetch();
        echo json_encode([
            'success' => true,
            'total_users' => (int)$total['total'],
            'owners_count' => $owners,
            'tenants_count' => $tenants,
            'admins_count' => $admins,
            'new_users_last_month' => (int)$newUsers['new_users']
        ]);
        break;
        
    case 'total_bookings':
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM reservations");
        $total = $stmt->fetch();
        echo json_encode(['success' => true, 'total_bookings' => (int)$total['total']]);
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid type parameter']);
        break;
}
?>