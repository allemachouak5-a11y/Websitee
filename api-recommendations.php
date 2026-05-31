<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config/database.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

define('DEFAULT_LIMIT', 6);
define('SIMILARITY_THRESHOLD', 0.20);

$WEIGHTS = [
    'budget_match' => 0.35,
    'location_match' => 0.25,
    'capacity_match' => 0.15,
    'type_match' => 0.10,
    'rating_bonus' => 0.10,
    'featured_bonus' => 0.05
];

$LOCATION_MAP = [
    'seraidi' => 0.95, 'seraïdi' => 0.95,
    'el bouni' => 0.85, 'el-bouni' => 0.85, 'elbouni' => 0.85,
    'annaba centre' => 0.80, 'centre ville' => 0.80, 'annaba' => 0.80,
    'sidi amar' => 0.75, 'sidi-amar' => 0.75, 'sidiamar' => 0.75,
    'chetaibi' => 0.90, 'chetaïbi' => 0.90,
    'boulimat' => 0.70,
    'el hadjar' => 0.65, 'elhadjar' => 0.65,
    'ain berda' => 0.60, 'ainberda' => 0.60,
    'st cloud' => 0.78, 'saint cloud' => 0.78,
    'plateau' => 0.82,
    'berrahal' => 0.55,
    'oued el aneb' => 0.50
];

function getCurrentUserFromSession() {
    if (isset($_SESSION['user_id'])) {
        return ['id' => $_SESSION['user_id'], 'role' => $_SESSION['user_role'] ?? 'tenant'];
    }
    return null;
}

function calculateBudgetScore($propertyPrice, $userMaxPrice) {
    if (!$userMaxPrice || $userMaxPrice <= 0) return 0.5;
    if ($propertyPrice <= $userMaxPrice) {
        $ratio = $propertyPrice / $userMaxPrice;
        if ($ratio <= 0.5) return 1.0;
        if ($ratio <= 0.7) return 0.9;
        if ($ratio <= 0.9) return 0.8;
        return 0.7;
    }
    return 0;
}

function calculateLocationScore($propertyLocation, $userLocation, $locationMap) {
    if (empty($userLocation)) return 0.5;
    
    $propLoc = strtolower($propertyLocation ?? 'annaba');
    $userLoc = strtolower($userLocation);
    
    if ($propLoc === $userLoc) return 1.0;
    if (strpos($propLoc, $userLoc) !== false || strpos($userLoc, $propLoc) !== false) {
        return 0.9;
    }
    
    $bestScore = 0.3;
    foreach ($locationMap as $loc => $score) {
        if ((strpos($propLoc, $loc) !== false && strpos($userLoc, $loc) !== false) ||
            (strpos($userLoc, $loc) !== false && strpos($propLoc, $loc) !== false)) {
            $bestScore = max($bestScore, $score);
        }
    }
    
    similar_text($propLoc, $userLoc, $percent);
    $bestScore = max($bestScore, $percent / 100);
    
    return min(1.0, $bestScore);
}

function calculateCapacityScore($propertyGuests, $userGuests) {
    if (!$userGuests || $userGuests <= 0) return 0.5;
    if ($propertyGuests >= $userGuests) {
        if ($propertyGuests == $userGuests) return 1.0;
        if ($propertyGuests <= $userGuests + 2) return 0.9;
        if ($propertyGuests <= $userGuests * 1.5) return 0.8;
        return 0.7;
    }
    return max(0, 0.3 * ($propertyGuests / $userGuests));
}

function calculateTypeScore($propertyType, $userType) {
    if (empty($userType)) return 0.5;
    $propType = strtolower($propertyType ?? 'apartment');
    $userTypeLower = strtolower($userType);
    return $propType === $userTypeLower ? 1.0 : 0.3;
}

function calculateRatingBonus($rating, $reviewsCount) {
    $bonus = 0;
    if ($rating >= 4.9) $bonus = 0.15;
    elseif ($rating >= 4.7) $bonus = 0.12;
    elseif ($rating >= 4.5) $bonus = 0.10;
    elseif ($rating >= 4.0) $bonus = 0.05;
    
    if ($reviewsCount >= 50) $bonus += 0.05;
    elseif ($reviewsCount >= 20) $bonus += 0.03;
    elseif ($reviewsCount >= 10) $bonus += 0.02;
    
    return min(0.2, $bonus);
}

function calculateFeaturedBonus($isFeatured) {
    return $isFeatured ? 0.05 : 0;
}

function generateMatchReasons($property, $scores, $lang = 'en') {
    $reasons = [];
    
    if ($scores['budget'] >= 0.9) {
        $reasons[] = $lang === 'en' ? "💰 Excellent value within your budget" : "💰 قيمة ممتازة ضمن ميزانيتك";
    } elseif ($scores['budget'] >= 0.7) {
        $reasons[] = $lang === 'en' ? "💰 Fits your budget perfectly" : "💰 يناسب ميزانيتك تماماً";
    }
    
    if ($scores['location'] >= 0.9) {
        $reasons[] = $lang === 'en' ? "📍 Perfect location match" : "📍 موقع مثالي";
    } elseif ($scores['location'] >= 0.7) {
        $district = $property['district'] ?? $property['location'] ?? 'Annaba';
        $reasons[] = $lang === 'en' ? "📍 Located in " . $district : "📍 يقع في " . $district;
    }
    
    if ($scores['capacity'] >= 0.9) {
        $reasons[] = $lang === 'en' ? "👥 Perfect for your group size" : "👥 مثالي لمجموعتك";
    } elseif ($scores['capacity'] >= 0.7) {
        $reasons[] = $lang === 'en' ? "👥 Accommodates {$property['max_guests']} guests" : "👥 يتسع لـ {$property['max_guests']} أشخاص";
    }
    
    if ($scores['type'] >= 0.9) {
        $typeName = $lang === 'en' ? ucfirst($property['type']) : getTypeNameArabic($property['type']);
        $reasons[] = $lang === 'en' ? "🏠 " . $typeName . " style you wanted" : "🏠 نمط " . $typeName;
    }
    
    if (($property['rating'] ?? 0) >= 4.8) {
        $reasons[] = $lang === 'en' ? "⭐ Top-rated by guests (5★)" : "⭐ تقييم ممتاز من النزلاء";
    } elseif (($property['rating'] ?? 0) >= 4.5) {
        $reasons[] = $lang === 'en' ? "⭐ Highly rated property" : "⭐ عقار ذو تقييم عالي";
    }
    
    if (($property['featured'] ?? 0) == 1) {
        $reasons[] = $lang === 'en' ? "✨ Featured property" : "✨ عقار مميز";
    }
    
    return array_slice($reasons, 0, 4);
}

function getTypeNameArabic($type) {
    $types = [
        'villa' => 'فيلا',
        'apartment' => 'شقة',
        'studio' => 'ستوديو',
        'duplex' => 'دوبلكس',
        'penthouse' => 'بنتهاوس',
        'loft' => 'لوفت',
        'house' => 'منزل',
        'cabin' => 'كابينة'
    ];
    return $types[strtolower($type)] ?? $type;
}

function getDemoProperties() {
    return [
        ['id' => 1, 'name' => 'Luxury Villa Seraïdi', 'district' => 'SERAIDI', 'location' => 'seraidi', 'type' => 'villa', 'price_dzd' => 25000000, 'max_guests' => 10, 'bedrooms' => 5, 'bathrooms' => 4, 'area' => 380, 'rating' => 4.9, 'reviews_count' => 45, 'featured' => 1, 'main_image' => 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=600&auto=format'],
        ['id' => 2, 'name' => 'Modern Apartment El Bouni', 'district' => 'EL BOUNI', 'location' => 'el-bouni', 'type' => 'apartment', 'price_dzd' => 8500000, 'max_guests' => 6, 'bedrooms' => 3, 'bathrooms' => 2, 'area' => 120, 'rating' => 4.5, 'reviews_count' => 28, 'featured' => 1, 'main_image' => 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&auto=format'],
        ['id' => 3, 'name' => 'Cozy Studio Sidi Amar', 'district' => 'SIDI AMAR', 'location' => 'sidi-amar', 'type' => 'studio', 'price_dzd' => 3500000, 'max_guests' => 2, 'bedrooms' => 1, 'bathrooms' => 1, 'area' => 45, 'rating' => 4.2, 'reviews_count' => 15, 'featured' => 0, 'main_image' => 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&auto=format'],
        ['id' => 4, 'name' => 'Penthouse Annaba Center', 'district' => 'ANNABA CENTRE', 'location' => 'annaba', 'type' => 'penthouse', 'price_dzd' => 18500000, 'max_guests' => 8, 'bedrooms' => 4, 'bathrooms' => 3, 'area' => 220, 'rating' => 4.8, 'reviews_count' => 32, 'featured' => 1, 'main_image' => 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&auto=format'],
        ['id' => 5, 'name' => 'Beachfront Villa Chetaïbi', 'district' => 'CHETAIBI', 'location' => 'chetaibi', 'type' => 'villa', 'price_dzd' => 45000000, 'max_guests' => 12, 'bedrooms' => 6, 'bathrooms' => 5, 'area' => 450, 'rating' => 5.0, 'reviews_count' => 67, 'featured' => 1, 'main_image' => 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&auto=format'],
        ['id' => 6, 'name' => 'Family Home El Bouni', 'district' => 'EL BOUNI', 'location' => 'el-bouni', 'type' => 'villa', 'price_dzd' => 15000000, 'max_guests' => 8, 'bedrooms' => 4, 'bathrooms' => 3, 'area' => 250, 'rating' => 4.6, 'reviews_count' => 22, 'featured' => 0, 'main_image' => 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format'],
        ['id' => 7, 'name' => 'Downtown Loft Annaba', 'district' => 'ANNABA CENTRE', 'location' => 'annaba', 'type' => 'loft', 'price_dzd' => 12000000, 'max_guests' => 5, 'bedrooms' => 2, 'bathrooms' => 2, 'area' => 140, 'rating' => 4.7, 'reviews_count' => 19, 'featured' => 0, 'main_image' => 'https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?w=600&auto=format'],
        ['id' => 8, 'name' => 'Duplex Seraïdi', 'district' => 'SERAIDI', 'location' => 'seraidi', 'type' => 'duplex', 'price_dzd' => 22000000, 'max_guests' => 8, 'bedrooms' => 4, 'bathrooms' => 3, 'area' => 200, 'rating' => 4.9, 'reviews_count' => 41, 'featured' => 1, 'main_image' => 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=600&auto=format']
    ];
}

function getSmartRecommendations($allProperties, $criteria, $weights, $locationMap, $lang = 'en', $excludeId = null) {
    $recommendations = [];
    
    foreach ($allProperties as $property) {
        if ($excludeId && $property['id'] == $excludeId) {
            continue;
        }
        
        $budgetScore = calculateBudgetScore($property['price_dzd'], $criteria['max_price'] ?? 0);
        $locationScore = calculateLocationScore($property['district'] ?? $property['location'], $criteria['location'] ?? '', $locationMap);
        $capacityScore = calculateCapacityScore($property['max_guests'] ?? 2, $criteria['guests'] ?? 0);
        $typeScore = calculateTypeScore($property['type'] ?? 'apartment', $criteria['type'] ?? '');
        $ratingBonus = calculateRatingBonus($property['rating'] ?? 0, $property['reviews_count'] ?? 0);
        $featuredBonus = calculateFeaturedBonus($property['featured'] ?? 0);
        
        $scores = [
            'budget' => $budgetScore,
            'location' => $locationScore,
            'capacity' => $capacityScore,
            'type' => $typeScore
        ];
        
        $totalScore = 
            $budgetScore * $weights['budget_match'] +
            $locationScore * $weights['location_match'] +
            $capacityScore * $weights['capacity_match'] +
            $typeScore * $weights['type_match'] +
            $ratingBonus * $weights['rating_bonus'] +
            $featuredBonus * $weights['featured_bonus'];
        
        if ($totalScore >= SIMILARITY_THRESHOLD) {
            $recommendations[] = [
                'property' => $property,
                'total_score' => round($totalScore * 100, 1),
                'scores' => $scores,
                'match_reasons' => generateMatchReasons($property, $scores, $lang)
            ];
        }
    }
    
    usort($recommendations, function($a, $b) {
        return $b['total_score'] - $a['total_score'];
    });
    
    return $recommendations;
}

function getUserLastSearch($pdo, $userId) {
    if (!$userId) return null;
    
    try {
        $stmt = $pdo->prepare("
            SELECT property_id, action, created_at 
            FROM user_interactions 
            WHERE user_id = ? AND action IN ('search', 'click')
            ORDER BY created_at DESC 
            LIMIT 1
        ");
        $stmt->execute([$userId]);
        $lastInteraction = $stmt->fetch();
        
        if ($lastInteraction && $lastInteraction['property_id']) {
            $stmt = $pdo->prepare("
                SELECT district, type, price_dzd, max_guests 
                FROM properties 
                WHERE id = ?
            ");
            $stmt->execute([$lastInteraction['property_id']]);
            $property = $stmt->fetch();
            
            if ($property) {
                return [
                    'location' => $property['district'],
                    'type' => $property['type'],
                    'max_price' => $property['price_dzd'] * 1.2,
                    'guests' => $property['max_guests']
                ];
            }
        }
    } catch (Exception $e) {
    }
    
    return null;
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : DEFAULT_LIMIT;
    $lang = $_GET['lang'] ?? 'en';
    $excludeId = $_GET['property_id'] ?? null;
    
    $criteria = [
        'location' => $_GET['similar_location'] ?? $_GET['location'] ?? null,
        'type' => $_GET['similar_type'] ?? $_GET['type'] ?? null,
        'max_price' => isset($_GET['max_price']) ? intval($_GET['max_price']) : null,
        'guests' => isset($_GET['guests']) ? intval($_GET['guests']) : null
    ];
    
    $userId = null;
    if (isset($_GET['user_id'])) {
        $userId = intval($_GET['user_id']);
    } else {
        $user = getCurrentUserFromSession();
        $userId = $user['id'] ?? null;
    }
    
    try {
        $stmt = $pdo->query("
            SELECT p.*, 
                (SELECT image_url FROM property_images WHERE property_id = p.id AND is_primary = 1 LIMIT 1) as main_image,
                (SELECT COUNT(*) FROM reviews WHERE property_id = p.id) as reviews_count
            FROM properties p 
            WHERE p.admin_status = 'approved' AND p.status = 'available'
            ORDER BY p.featured DESC, p.rating DESC
        ");
        $allProperties = $stmt->fetchAll();
        
        if (empty($allProperties)) {
            $allProperties = getDemoProperties();
        }
        
        $recommendations = [];
        $recommendationType = 'default';
        
        if ($criteria['location'] || $criteria['type'] || ($criteria['max_price'] && $criteria['max_price'] < 50000000) || $criteria['guests']) {
            $recommendations = getSmartRecommendations($allProperties, $criteria, $WEIGHTS, $LOCATION_MAP, $lang, $excludeId);
            $recommendationType = 'search_based';
        }
        
        if (empty($recommendations) && $userId) {
            $lastSearch = getUserLastSearch($pdo, $userId);
            if ($lastSearch) {
                $recommendations = getSmartRecommendations($allProperties, $lastSearch, $WEIGHTS, $LOCATION_MAP, $lang, $excludeId);
                $recommendationType = 'history_based';
            }
        }
        
        if (empty($recommendations)) {
            usort($allProperties, function($a, $b) {
                $scoreA = ($a['featured'] ?? 0) * 0.4 + ($a['rating'] ?? 0) * 0.6;
                $scoreB = ($b['featured'] ?? 0) * 0.4 + ($b['rating'] ?? 0) * 0.6;
                return $scoreB <=> $scoreA;
            });
            
            foreach (array_slice($allProperties, 0, $limit + 2) as $prop) {
                if ($excludeId && $prop['id'] == $excludeId) continue;
                $recommendations[] = [
                    'property' => $prop,
                    'total_score' => round(65 + ($prop['rating'] ?? 4) * 7, 1),
                    'match_reasons' => [$lang === 'en' ? "🏆 Popular choice among guests" : "🏆 اختيار شائع بين النزلاء"]
                ];
            }
            $recommendationType = 'popular_based';
        }
        
        if ($excludeId) {
            $recommendations = array_filter($recommendations, function($rec) use ($excludeId) {
                return $rec['property']['id'] != $excludeId;
            });
        }
        
        $recommendations = array_slice($recommendations, 0, $limit);
        
        echo json_encode([
            'success' => true,
            'recommendations' => $recommendations,
            'recommendation_count' => count($recommendations),
            'recommendation_type' => $recommendationType,
            'criteria_used' => $criteria,
            'total_available' => count($allProperties)
        ]);
        
    } catch (PDOException $e) {
        error_log("Recommendation API Error: " . $e->getMessage());
        
        $demoProperties = getDemoProperties();
        $recommendations = [];
        
        foreach (array_slice($demoProperties, 0, $limit) as $prop) {
            if ($excludeId && $prop['id'] == $excludeId) continue;
            $recommendations[] = [
                'property' => $prop,
                'total_score' => 85,
                'match_reasons' => [$lang === 'en' ? "✨ Recommended for you" : "✨ موصى به لك"]
            ];
        }
        
        echo json_encode([
            'success' => true,
            'recommendations' => $recommendations,
            'recommendation_count' => count($recommendations),
            'recommendation_type' => 'fallback',
            'total_available' => count($demoProperties)
        ]);
    }
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data || !isset($data['user_id']) || !isset($data['property_id'])) {
        echo json_encode(['success' => false, 'message' => 'Missing required data']);
        exit();
    }
    
    $userId = intval($data['user_id']);
    $propertyId = intval($data['property_id']);
    $action = $data['action'] ?? 'view';
    
    $validActions = ['view', 'click', 'search', 'booking', 'contact'];
    if (!in_array($action, $validActions)) {
        $action = 'view';
    }
    
    try {
        $tableCheck = $pdo->query("SHOW TABLES LIKE 'user_interactions'");
        if ($tableCheck->rowCount() == 0) {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS user_interactions (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    property_id INT NOT NULL,
                    action VARCHAR(50) NOT NULL,
                    created_at DATETIME NOT NULL,
                    INDEX idx_user (user_id),
                    INDEX idx_property (property_id),
                    INDEX idx_action (action),
                    INDEX idx_created (created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            ");
        }
        
        $cleanupStmt = $pdo->prepare("
            DELETE FROM user_interactions 
            WHERE user_id = ? AND id NOT IN (
                SELECT id FROM (
                    SELECT id FROM user_interactions 
                    WHERE user_id = ? 
                    ORDER BY created_at DESC 
                    LIMIT 100
                ) AS tmp
            )
        ");
        $cleanupStmt->execute([$userId, $userId]);
        
        $checkStmt = $pdo->prepare("
            SELECT id FROM user_interactions 
            WHERE user_id = ? AND property_id = ? AND action = ? 
            AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
        ");
        $checkStmt->execute([$userId, $propertyId, $action]);
        
        if (!$checkStmt->fetch()) {
            $stmt = $pdo->prepare("
                INSERT INTO user_interactions (user_id, property_id, action, created_at) 
                VALUES (?, ?, ?, NOW())
            ");
            $stmt->execute([$userId, $propertyId, $action]);
        }
        
        echo json_encode(['success' => true, 'action' => $action]);
        
    } catch (PDOException $e) {
        error_log("Interaction error: " . $e->getMessage());
        echo json_encode(['success' => false, 'error' => 'Failed to record interaction']);
    }
    exit();
}

echo json_encode(['success' => false, 'message' => 'Method not allowed']);
?>