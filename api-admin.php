<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config/database.php';

function checkAdminOrOwner() {
    global $pdo;
    
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized - Please login']);
        exit;
    }
    
    $userId = $_SESSION['user_id'];
    
    $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    
    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'User not found']);
        exit;
    }
    
    $_SESSION['user_role'] = $user['role'];
    
    if ($user['role'] !== 'admin' && $user['role'] !== 'owner') {
        echo json_encode(['success' => false, 'message' => 'Access denied. Admin or Owner only.']);
        exit;
    }
    
    return $userId;
}

function checkAdmin() {
    global $pdo;
    
    if (!isset($_SESSION['user_id']) || !isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'admin') {
        if (isset($_SESSION['user_id'])) {
            $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
            $stmt->execute([$_SESSION['user_id']]);
            $user = $stmt->fetch();
            if ($user && $user['role'] === 'admin') {
                $_SESSION['user_role'] = 'admin';
                return $_SESSION['user_id'];
            }
        }
        echo json_encode(['success' => false, 'message' => 'Unauthorized - Admin access required']);
        exit;
    }
    return $_SESSION['user_id'];
}

function checkOwner() {
    global $pdo;
    
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized - Please login']);
        exit;
    }
    
    $userId = $_SESSION['user_id'];
    
    $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    
    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'User not found']);
        exit;
    }
    
    $_SESSION['user_role'] = $user['role'];
    
    if ($user['role'] !== 'owner' && $user['role'] !== 'admin') {
        echo json_encode(['success' => false, 'message' => 'Only property owners can access this']);
        exit;
    }
    
    return $userId;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? ($_POST['action'] ?? null);

if ($method === 'GET') {
    if ($action === 'owner_pending_requests') {
        $userId = checkAdminOrOwner();
        $userRole = $_SESSION['user_role'] ?? 'tenant';
        
        if ($userRole === 'admin') {
            $stmt = $pdo->prepare("
                SELECT 
                    r.*, 
                    p.name as property_name, 
                    p.district as property_location,
                    CONCAT(u.first_name, ' ', u.last_name) as tenant_name,
                    u.email as tenant_email, 
                    u.phone as tenant_phone,
                    (SELECT image_url FROM property_images WHERE property_id = p.id AND is_primary = 1 LIMIT 1) as property_image
                FROM reservations r
                JOIN properties p ON r.property_id = p.id
                JOIN users u ON r.user_id = u.id
                WHERE r.status = 'pending'
                ORDER BY r.created_at DESC
            ");
            $stmt->execute();
        } else {
            $stmt = $pdo->prepare("
                SELECT 
                    r.*, 
                    p.name as property_name, 
                    p.district as property_location,
                    CONCAT(u.first_name, ' ', u.last_name) as tenant_name,
                    u.email as tenant_email, 
                    u.phone as tenant_phone,
                    (SELECT image_url FROM property_images WHERE property_id = p.id AND is_primary = 1 LIMIT 1) as property_image
                FROM reservations r
                JOIN properties p ON r.property_id = p.id
                JOIN users u ON r.user_id = u.id
                WHERE p.owner_id = ? AND r.status = 'pending'
                ORDER BY r.created_at DESC
            ");
            $stmt->execute([$userId]);
        }
        
        $requests = $stmt->fetchAll();
        
        foreach ($requests as &$req) {
            $req['tenant_name'] = $req['tenant_name'] ?? 'Guest';
            $req['tenant_email'] = $req['tenant_email'] ?? '-';
            $req['tenant_phone'] = $req['tenant_phone'] ?? '';
            $req['property_image'] = $req['property_image'] ?? 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=100&auto=format';
        }
        
        echo json_encode(['success' => true, 'requests' => $requests]);
        exit;
    }
    
    $adminId = checkAdmin();
    
    switch ($action) {
        case 'stats':
            $stmt = $pdo->query("SELECT COUNT(*) as total FROM properties WHERE admin_status = 'approved'");
            $stats['total_properties'] = $stmt->fetch()['total'];
            
            $stmt = $pdo->query("SELECT COUNT(*) as total FROM properties WHERE admin_status = 'pending' OR admin_status IS NULL");
            $stats['pending_properties'] = $stmt->fetch()['total'];
            
            $stmt = $pdo->query("SELECT COUNT(*) as total FROM users WHERE is_active = 1");
            $stats['active_users'] = $stmt->fetch()['total'];
            
            $stmt = $pdo->query("SELECT COUNT(*) as total FROM reservations");
            $stats['total_bookings'] = $stmt->fetch()['total'];
            
            echo json_encode(['success' => true, ...$stats]);
            break;
            
        case 'pending_properties':
            $stmt = $pdo->query("SELECT p.*, u.first_name as owner_first_name, u.last_name as owner_last_name, u.email as owner_email, 
                                (SELECT image_url FROM property_images WHERE property_id = p.id AND is_primary = 1 LIMIT 1) as main_image 
                                FROM properties p 
                                JOIN users u ON p.owner_id = u.id 
                                WHERE (p.admin_status = 'pending' OR p.admin_status IS NULL) 
                                ORDER BY p.created_at DESC");
            $properties = $stmt->fetchAll();
            
            foreach ($properties as &$prop) {
                $prop['owner_name'] = trim(($prop['owner_first_name'] ?? '') . ' ' . ($prop['owner_last_name'] ?? ''));
            }
            
            echo json_encode(['success' => true, 'properties' => $properties]);
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
            break;
    }
} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    
    if ($action === 'update_booking_by_owner') {
        $userId = checkAdminOrOwner();
        $bookingId = $input['booking_id'] ?? 0;
        $status = $input['status'] ?? '';
        
        if (!in_array($status, ['confirmed', 'cancelled'])) {
            echo json_encode(['success' => false, 'message' => 'Invalid status']);
            exit;
        }
        
        $stmt = $pdo->prepare("
            SELECT r.id, p.owner_id, p.name as property_name
            FROM reservations r
            JOIN properties p ON r.property_id = p.id
            WHERE r.id = ?
        ");
        $stmt->execute([$bookingId]);
        $booking = $stmt->fetch();
        
        if (!$booking) {
            echo json_encode(['success' => false, 'message' => 'Booking not found']);
            exit;
        }
        
        $userRole = $_SESSION['user_role'] ?? 'tenant';
        
        if ($userRole !== 'admin' && $booking['owner_id'] != $userId) {
            echo json_encode(['success' => false, 'message' => 'Unauthorized - This booking does not belong to your property']);
            exit;
        }
        
        $stmt = $pdo->prepare("UPDATE reservations SET status = ? WHERE id = ?");
        $result = $stmt->execute([$status, $bookingId]);
        
        if ($result) {
            $message = $status === 'confirmed' ? 'Booking approved successfully' : 'Booking declined';
            echo json_encode(['success' => true, 'message' => $message]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to update booking']);
        }
        exit;
    }
    
    $adminId = checkAdmin();
    
    switch ($action) {
        case 'approve_property':
            $propertyId = $input['property_id'] ?? 0;
            $stmt = $pdo->prepare("UPDATE properties SET admin_status = 'approved', status = 'available' WHERE id = ?");
            $result = $stmt->execute([$propertyId]);
            echo json_encode(['success' => $result]);
            break;
            
        case 'reject_property':
            $propertyId = $input['property_id'] ?? 0;
            $stmt = $pdo->prepare("UPDATE properties SET admin_status = 'rejected' WHERE id = ?");
            $result = $stmt->execute([$propertyId]);
            echo json_encode(['success' => $result]);
            break;
            
        case 'delete_property':
            $propertyId = $input['property_id'] ?? 0;
            $stmt = $pdo->prepare("DELETE FROM properties WHERE id = ?");
            $result = $stmt->execute([$propertyId]);
            echo json_encode(['success' => $result]);
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
            break;
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>