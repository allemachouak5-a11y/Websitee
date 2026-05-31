<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

function getUserId() { 
    return $_SESSION['user_id'] ?? null; 
}

function getUserFromSession() {
    $session = $_SESSION['user_id'] ?? null;
    if ($session) return $session;
    return null;
}

switch ($method) {
    case 'GET':
        $userId = getUserId();
        $type = $_GET['type'] ?? 'conversations';
        
        if (!$userId) { 
            echo json_encode(['success' => false, 'message' => 'Unauthorized - Please login']); 
            exit; 
        }
        
        if ($type === 'conversations') {
            $sql = "SELECT 
                        CASE 
                            WHEN m.sender_id = ? THEN m.receiver_id 
                            ELSE m.sender_id 
                        END as other_user_id, 
                        u.id as other_id, 
                        u.first_name, 
                        u.last_name, 
                        u.email, 
                        u.phone,
                        u.role as other_role, 
                        MAX(m.created_at) as last_message_time,
                        (SELECT message FROM messages m2 
                         WHERE ((m2.sender_id = m.sender_id AND m2.receiver_id = m.receiver_id) 
                                OR (m2.sender_id = m.receiver_id AND m2.receiver_id = m.sender_id))
                         AND ((m2.sender_id = ? AND m2.is_deleted_sender = 0) 
                              OR (m2.receiver_id = ? AND m2.is_deleted_receiver = 0))
                         ORDER BY m2.created_at DESC LIMIT 1) as last_message,
                        (SELECT COUNT(*) FROM messages m3 
                         WHERE m3.receiver_id = ? 
                         AND m3.sender_id = other_user_id 
                         AND m3.is_read = 0) as unread_count,
                        p.id as property_id,
                        p.name as property_name
                    FROM messages m 
                    JOIN users u ON u.id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
                    LEFT JOIN properties p ON m.property_id = p.id
                    WHERE (m.sender_id = ? OR m.receiver_id = ?)
                    AND ((m.sender_id = ? AND m.is_deleted_sender = 0) OR (m.receiver_id = ? AND m.is_deleted_receiver = 0))
                    GROUP BY other_user_id, p.id
                    ORDER BY last_message_time DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$userId, $userId, $userId, $userId, $userId, $userId, $userId, $userId, $userId]);
            $conversations = $stmt->fetchAll();
            echo json_encode(['success' => true, 'conversations' => $conversations]);
            
        } elseif ($type === 'messages') {
            $otherUserId = $_GET['other_user_id'] ?? 0;
            $propertyId = $_GET['property_id'] ?? null;
            
            if (!$otherUserId) { 
                echo json_encode(['success' => false, 'message' => 'Other user ID required']); 
                exit; 
            }
            
            $stmt = $pdo->prepare("UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0");
            $stmt->execute([$otherUserId, $userId]);
            
            $sql = "SELECT m.*, 
                        u_sender.first_name as sender_first_name, 
                        u_sender.last_name as sender_last_name,
                        u_receiver.first_name as receiver_first_name, 
                        u_receiver.last_name as receiver_last_name,
                        p.name as property_name
                    FROM messages m 
                    JOIN users u_sender ON m.sender_id = u_sender.id 
                    JOIN users u_receiver ON m.receiver_id = u_receiver.id 
                    LEFT JOIN properties p ON m.property_id = p.id
                    WHERE ((m.sender_id = ? AND m.receiver_id = ?) 
                        OR (m.sender_id = ? AND m.receiver_id = ?))
                    AND ((m.sender_id = ? AND m.is_deleted_sender = 0) OR (m.receiver_id = ? AND m.is_deleted_receiver = 0))
                    ORDER BY m.created_at ASC";
            
            if ($propertyId) {
                $sql .= " AND m.property_id = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$userId, $otherUserId, $otherUserId, $userId, $userId, $userId, $propertyId]);
            } else {
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$userId, $otherUserId, $otherUserId, $userId, $userId, $userId]);
            }
            
            $messages = $stmt->fetchAll();
            echo json_encode(['success' => true, 'messages' => $messages]);
        }
        break;
        
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        $senderId = $data['sender_id'] ?? $_SESSION['user_id'] ?? null;
        $receiverId = $data['receiver_id'] ?? null;
        $propertyId = $data['property_id'] ?? null;
        $subject = $data['subject'] ?? 'New Message';
        $message = trim($data['message'] ?? '');
        $parentId = $data['parent_id'] ?? null;
        
        if (!$senderId) {
            echo json_encode(['success' => false, 'message' => 'You must be logged in to send messages']); 
            exit;
        }
        
        if (!$receiverId) { 
            echo json_encode(['success' => false, 'message' => 'Receiver ID is required']); 
            exit; 
        }
        
        if (empty($message)) { 
            echo json_encode(['success' => false, 'message' => 'Message cannot be empty']); 
            exit; 
        }
        
        if ($senderId == $receiverId) {
            echo json_encode(['success' => false, 'message' => 'Cannot send message to yourself']); 
            exit;
        }
        
        $stmt = $pdo->prepare("SELECT id FROM users WHERE id = ?");
        $stmt->execute([$receiverId]);
        if (!$stmt->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Receiver not found']); 
            exit;
        }
        
        $stmt = $pdo->prepare("INSERT INTO messages (sender_id, receiver_id, property_id, subject, message, parent_id, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())");
        $result = $stmt->execute([$senderId, $receiverId, $propertyId, $subject, $message, $parentId]);
        
        if ($result) {
            $messageId = $pdo->lastInsertId();
            echo json_encode([
                'success' => true, 
                'message_id' => $messageId,
                'message' => 'Message sent successfully'
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to send message']);
        }
        break;
        
    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        $userId = $_SESSION['user_id'] ?? null;
        $senderId = $data['sender_id'] ?? null;
        
        if (!$userId || !$senderId) { 
            echo json_encode(['success' => false, 'message' => 'Unauthorized']); 
            exit; 
        }
        
        $stmt = $pdo->prepare("UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0");
        $result = $stmt->execute([$senderId, $userId]);
        echo json_encode(['success' => $result]);
        break;
        
    case 'DELETE':
        $userId = $_SESSION['user_id'] ?? null;
        $data = json_decode(file_get_contents('php://input'), true);
        $messageId = $data['message_id'] ?? null;
        
        if (!$userId || !$messageId) {
            echo json_encode(['success' => false, 'message' => 'Invalid request']);
            exit;
        }
        
        $stmt = $pdo->prepare("SELECT sender_id, receiver_id FROM messages WHERE id = ?");
        $stmt->execute([$messageId]);
        $message = $stmt->fetch();
        
        if (!$message) {
            echo json_encode(['success' => false, 'message' => 'Message not found']);
            exit;
        }
        
        if ($message['sender_id'] == $userId) {
            $stmt = $pdo->prepare("UPDATE messages SET is_deleted_sender = 1 WHERE id = ?");
            $result = $stmt->execute([$messageId]);
        } elseif ($message['receiver_id'] == $userId) {
            $stmt = $pdo->prepare("UPDATE messages SET is_deleted_receiver = 1 WHERE id = ?");
            $result = $stmt->execute([$messageId]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Unauthorized']);
            exit;
        }
        
        echo json_encode(['success' => $result, 'message' => 'Message deleted']);
        break;
        
    default: 
        echo json_encode(['success' => false, 'message' => 'Method not allowed']); 
        break;
}
?>