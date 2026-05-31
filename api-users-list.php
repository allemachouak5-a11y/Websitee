<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'config/database.php';

$userId = $_SESSION['user_id'] ?? $_GET['user_id'] ?? null;

$sql = "SELECT id, email, first_name, last_name, role FROM users";
$params = [];
if ($userId) { $sql .= " WHERE id != ?"; $params[] = $userId; }
$sql .= " ORDER BY first_name ASC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
echo json_encode(['success' => true, 'users' => $stmt->fetchAll()]);
?>