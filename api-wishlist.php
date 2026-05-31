<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config/database.php';
if (session_status() === PHP_SESSION_NONE) session_start();

$method = $_SERVER['REQUEST_METHOD'];
$userId = $_GET['user_id'] ?? null;
$inputData = json_decode(file_get_contents('php://input'), true);
if (!$userId && $inputData && isset($inputData['user_id'])) $userId = $inputData['user_id'];
if (!$userId && isset($_SESSION['user_id'])) $userId = $_SESSION['user_id'];

switch ($method) {
    case 'GET':
        if (!$userId) { echo json_encode(['success' => false, 'message' => 'Unauthorized - Please login']); exit; }
        $sql = "SELECT w.id as wishlist_id, w.created_at as saved_at, p.*, (SELECT image_url FROM property_images WHERE property_id = p.id AND is_primary = 1 LIMIT 1) as main_image FROM wishlist w JOIN properties p ON w.property_id = p.id WHERE w.user_id = ? ORDER BY w.created_at DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$userId]);
        $wishlist = $stmt->fetchAll();
        echo json_encode(['success' => true, 'wishlist' => $wishlist, 'count' => count($wishlist)]);
        break;
        
    case 'POST':
        if (!$userId) { echo json_encode(['success' => false, 'message' => 'Please login first']); exit; }
        $propertyId = $inputData['property_id'] ?? null;
        if (!$propertyId) { echo json_encode(['success' => false, 'message' => 'Property ID required']); exit; }
        $stmt = $pdo->prepare("SELECT id FROM wishlist WHERE user_id = ? AND property_id = ?");
        $stmt->execute([$userId, $propertyId]);
        if ($stmt->fetch()) { echo json_encode(['success' => false, 'message' => 'Already in wishlist']); exit; }
        $stmt = $pdo->prepare("INSERT INTO wishlist (user_id, property_id) VALUES (?, ?)");
        $result = $stmt->execute([$userId, $propertyId]);
        echo json_encode(['success' => $result, 'message' => $result ? 'Added to wishlist' : 'Failed to add']);
        break;
        
    case 'DELETE':
        if (!$userId) { echo json_encode(['success' => false, 'message' => 'Please login first']); exit; }
        $propertyId = $_GET['property_id'] ?? ($inputData['property_id'] ?? null);
        if (!$propertyId) { echo json_encode(['success' => false, 'message' => 'Property ID required']); exit; }
        $stmt = $pdo->prepare("DELETE FROM wishlist WHERE user_id = ? AND property_id = ?");
        $result = $stmt->execute([$userId, $propertyId]);
        echo json_encode(['success' => $result, 'message' => $result ? 'Removed from wishlist' : 'Failed to remove']);
        break;
        
    default: echo json_encode(['success' => false, 'message' => 'Method not allowed']); break;
}
?>