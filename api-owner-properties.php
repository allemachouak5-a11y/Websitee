<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config/database.php';
if (session_status() === PHP_SESSION_NONE) session_start();

if (!isset($_SESSION['user_id'])) { echo json_encode(['success' => false, 'message' => 'Unauthorized - Please login']); exit; }
$userId = $_SESSION['user_id'];
$userRole = $_SESSION['user_role'] ?? 'tenant';
if ($userRole !== 'owner' && $userRole !== 'admin') { echo json_encode(['success' => false, 'message' => 'Only property owners can manage properties']); exit; }

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $pdo->prepare("SELECT p.*, (SELECT image_url FROM property_images WHERE property_id = p.id AND is_primary = 1 LIMIT 1) as main_image, (SELECT COUNT(*) FROM reservations WHERE property_id = p.id AND status != 'cancelled') as bookings_count FROM properties p WHERE p.owner_id = ? ORDER BY p.created_at DESC");
        $stmt->execute([$userId]);
        echo json_encode(['success' => true, 'properties' => $stmt->fetchAll()]);
        break;
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        if (empty($data['name'])) { echo json_encode(['success' => false, 'message' => 'Property name is required']); exit; }
        if (empty($data['price_dzd']) || $data['price_dzd'] <= 0) { echo json_encode(['success' => false, 'message' => 'Valid price is required']); exit; }
        $priceUsd = $data['price_usd'] ?? round($data['price_dzd'] / 140, 2);
        $priceDzd = $data['price_dzd'];
        $stmt = $pdo->prepare("INSERT INTO properties (owner_id, name, description, location, district, type, price_usd, price_dzd, bedrooms, bathrooms, area, max_guests, status, admin_status, featured, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'available', 'pending', 0, NOW())");
        $result = $stmt->execute([$userId, $data['name'], $data['description'] ?? '', $data['location'] ?? 'annaba', $data['district'] ?? strtoupper($data['location'] ?? 'ANNABA'), $data['type'] ?? 'apartment', $priceUsd, $priceDzd, $data['bedrooms'] ?? 2, $data['bathrooms'] ?? 2, $data['area'] ?? 100, $data['max_guests'] ?? 4]);
        if ($result) {
            $propertyId = $pdo->lastInsertId();
            if (!empty($data['image']) || !empty($data['main_image'])) { $imageUrl = !empty($data['image']) ? $data['image'] : $data['main_image']; $stmt = $pdo->prepare("INSERT INTO property_images (property_id, image_url, is_primary, sort_order) VALUES (?, ?, 1, 0)"); $stmt->execute([$propertyId, $imageUrl]); }
            echo json_encode(['success' => true, 'id' => $propertyId, 'message' => 'Property submitted for admin approval']);
        } else echo json_encode(['success' => false, 'message' => 'Failed to add property']);
        break;
    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        $propertyId = $data['id'] ?? 0;
        $stmt = $pdo->prepare("SELECT owner_id FROM properties WHERE id = ?");
        $stmt->execute([$propertyId]);
        $property = $stmt->fetch();
        if (!$property) { echo json_encode(['success' => false, 'message' => 'Property not found']); exit; }
        if ($property['owner_id'] != $userId && $userRole !== 'admin') { echo json_encode(['success' => false, 'message' => 'Unauthorized']); exit; }
        $stmt = $pdo->prepare("UPDATE properties SET name = ?, description = ?, location = ?, district = ?, type = ?, price_usd = ?, price_dzd = ?, bedrooms = ?, bathrooms = ?, area = ?, max_guests = ?, status = ?, admin_status = 'pending', updated_at = NOW() WHERE id = ? AND owner_id = ?");
        $result = $stmt->execute([$data['name'], $data['description'] ?? '', $data['location'] ?? 'annaba', $data['district'] ?? strtoupper($data['location'] ?? 'ANNABA'), $data['type'] ?? 'apartment', $data['price_usd'] ?? round($data['price_dzd'] / 140, 2), $data['price_dzd'] ?? 0, $data['bedrooms'] ?? 2, $data['bathrooms'] ?? 2, $data['area'] ?? 100, $data['max_guests'] ?? 4, $data['status'] ?? 'available', $propertyId, $userId]);
        if ($result && (!empty($data['image']) || !empty($data['main_image']))) {
            $imageUrl = !empty($data['image']) ? $data['image'] : $data['main_image'];
            $stmt = $pdo->prepare("SELECT id FROM property_images WHERE property_id = ? AND is_primary = 1");
            $stmt->execute([$propertyId]);
            if ($stmt->fetch()) { $stmt = $pdo->prepare("UPDATE property_images SET image_url = ? WHERE property_id = ? AND is_primary = 1"); $stmt->execute([$imageUrl, $propertyId]); }
            else { $stmt = $pdo->prepare("INSERT INTO property_images (property_id, image_url, is_primary, sort_order) VALUES (?, ?, 1, 0)"); $stmt->execute([$propertyId, $imageUrl]); }
        }
        echo json_encode(['success' => $result, 'message' => $result ? 'Property updated and pending approval' : 'Failed to update']);
        break;
    case 'DELETE':
        $propertyId = $_GET['id'] ?? 0;
        $stmt = $pdo->prepare("SELECT owner_id FROM properties WHERE id = ?");
        $stmt->execute([$propertyId]);
        $property = $stmt->fetch();
        if (!$property) { echo json_encode(['success' => false, 'message' => 'Property not found']); exit; }
        if ($property['owner_id'] != $userId && $userRole !== 'admin') { echo json_encode(['success' => false, 'message' => 'Unauthorized']); exit; }
        $stmt = $pdo->prepare("DELETE FROM property_images WHERE property_id = ?"); $stmt->execute([$propertyId]);
        $stmt = $pdo->prepare("DELETE FROM properties WHERE id = ? AND owner_id = ?");
        $result = $stmt->execute([$propertyId, $userId]);
        echo json_encode(['success' => $result, 'message' => $result ? 'Property deleted successfully' : 'Failed to delete']);
        break;
    default: echo json_encode(['success' => false, 'message' => 'Method not allowed']); break;
}
?>