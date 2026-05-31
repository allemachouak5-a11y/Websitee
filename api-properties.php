<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config/database.php';
if (session_status() === PHP_SESSION_NONE) session_start();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $propertyId = $_GET['id'] ?? null;
        $limit = $_GET['limit'] ?? null;
        
        if ($propertyId) {
            $stmt = $pdo->prepare("SELECT p.*, 
                (SELECT image_url FROM property_images WHERE property_id = p.id AND is_primary = 1 LIMIT 1) as main_image,
                u.id as owner_id,
                u.first_name as owner_first_name,
                u.last_name as owner_last_name,
                u.email as owner_email,
                u.phone as owner_phone,
                CONCAT(u.first_name, ' ', u.last_name) as owner_name
                FROM properties p 
                LEFT JOIN users u ON p.owner_id = u.id
                WHERE p.id = ?");
            $stmt->execute([$propertyId]);
            $properties = $stmt->fetchAll();
            echo json_encode(['success' => true, 'properties' => $properties]);
        } else {
            $sql = "SELECT p.*, 
                (SELECT image_url FROM property_images WHERE property_id = p.id AND is_primary = 1 LIMIT 1) as main_image,
                u.id as owner_id,
                u.first_name as owner_first_name,
                u.last_name as owner_last_name,
                CONCAT(u.first_name, ' ', u.last_name) as owner_name
                FROM properties p 
                LEFT JOIN users u ON p.owner_id = u.id
                WHERE p.admin_status = 'approved' AND p.status = 'available'
                ORDER BY p.featured DESC, p.created_at DESC";
            
            if ($limit) {
                $sql .= " LIMIT " . intval($limit);
            }
            
            $stmt = $pdo->query($sql);
            $properties = $stmt->fetchAll();
            echo json_encode(['success' => true, 'properties' => $properties]);
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
?>