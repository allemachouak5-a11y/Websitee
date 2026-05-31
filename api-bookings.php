<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

$host = 'localhost';
$dbname = 'dreamhome_db';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (isset($_GET['property_id']) && !isset($_GET['user_id'])) {
        $property_id = intval($_GET['property_id']);
        
        $stmt = $pdo->prepare("
            SELECT start_date, end_date 
            FROM reservations 
            WHERE property_id = ? AND status != 'cancelled'
        ");
        $stmt->execute([$property_id]);
        $reservations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $booked_dates = [];
        foreach ($reservations as $res) {
            $start = new DateTime($res['start_date']);
            $end = new DateTime($res['end_date']);
            $end->modify('-1 day');
            
            $period = new DatePeriod($start, new DateInterval('P1D'), $end);
            foreach ($period as $date) {
                $booked_dates[] = $date->format('Y-m-d');
            }
        }
        
        echo json_encode(['success' => true, 'booked_dates' => $booked_dates]);
        exit;
    }
    
    elseif (isset($_GET['user_id'])) {
        $user_id = intval($_GET['user_id']);
        
        $stmt = $pdo->prepare("
            SELECT r.*, p.name as property_name, p.location, p.district,
                   (SELECT image_url FROM property_images WHERE property_id = p.id AND is_primary = 1 LIMIT 1) as main_image
            FROM reservations r
            JOIN properties p ON r.property_id = p.id
            WHERE r.user_id = ?
            ORDER BY r.created_at DESC
        ");
        $stmt->execute([$user_id]);
        $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'bookings' => $bookings]);
        exit;
    }
    
    elseif (isset($_GET['id'])) {
        $id = intval($_GET['id']);
        
        $stmt = $pdo->prepare("
            SELECT r.*, p.name as property_name 
            FROM reservations r
            JOIN properties p ON r.property_id = p.id
            WHERE r.id = ?
        ");
        $stmt->execute([$id]);
        $booking = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'booking' => $booking]);
        exit;
    }
    
    else {
        echo json_encode(['success' => false, 'message' => 'Missing parameters']);
        exit;
    }
}

elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
        exit;
    }
    
    $required_fields = ['property_id', 'user_id', 'start_date', 'end_date', 'total_amount_dzd'];
    foreach ($required_fields as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            echo json_encode(['success' => false, 'message' => "Missing required field: $field"]);
            exit;
        }
    }
    
    $booking_ref = isset($input['booking_ref']) ? $input['booking_ref'] : 'DREAM-' . date('Ymd') . '-' . rand(1000, 9999);
    
    $start = new DateTime($input['start_date']);
    $end = new DateTime($input['end_date']);
    $number_of_days = $start->diff($end)->days;
    if ($number_of_days <= 0) $number_of_days = 1;
    
    $sql = "INSERT INTO reservations (
        booking_ref, 
        property_id, 
        user_id, 
        usage_type, 
        start_date, 
        end_date, 
        number_of_days, 
        total_amount_dzd, 
        status, 
        payment_method, 
        special_requests,
        created_at
    ) VALUES (
        :booking_ref,
        :property_id,
        :user_id,
        :usage_type,
        :start_date,
        :end_date,
        :number_of_days,
        :total_amount_dzd,
        :status,
        :payment_method,
        :special_requests,
        NOW()
    )";
    
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':booking_ref' => $booking_ref,
            ':property_id' => intval($input['property_id']),
            ':user_id' => intval($input['user_id']),
            ':usage_type' => isset($input['usage_type']) ? $input['usage_type'] : 'vacation',
            ':start_date' => $input['start_date'],
            ':end_date' => $input['end_date'],
            ':number_of_days' => $number_of_days,
            ':total_amount_dzd' => floatval($input['total_amount_dzd']),
            ':status' => 'pending',
            ':payment_method' => isset($input['payment_method']) ? $input['payment_method'] : null,
            ':special_requests' => isset($input['special_requests']) ? $input['special_requests'] : null
        ]);
        
        $booking_id = $pdo->lastInsertId();
        
        echo json_encode([
            'success' => true, 
            'message' => 'Booking request sent to owner for approval',
            'id' => $booking_id,
            'booking_ref' => $booking_ref
        ]);
        
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

elseif ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['id'])) {
        echo json_encode(['success' => false, 'message' => 'Invalid data or missing ID']);
        exit;
    }
    
    $id = intval($input['id']);
    $status = isset($input['status']) ? $input['status'] : null;
    
    if ($status) {
        try {
            $stmt = $pdo->prepare("UPDATE reservations SET status = ? WHERE id = ?");
            $stmt->execute([$status, $id]);
            
            echo json_encode(['success' => true, 'message' => 'Booking updated successfully']);
        } catch(PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'No update data provided']);
    }
    exit;
}

elseif ($method === 'DELETE') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['id'])) {
        echo json_encode(['success' => false, 'message' => 'Missing booking ID']);
        exit;
    }
    
    $id = intval($input['id']);
    
    try {
        $stmt = $pdo->prepare("UPDATE reservations SET status = 'cancelled' WHERE id = ?");
        $stmt->execute([$id]);
        
        echo json_encode(['success' => true, 'message' => 'Booking cancelled successfully']);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}
?>