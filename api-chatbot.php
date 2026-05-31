<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config/database.php';
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);
$userMessage = trim($data['message'] ?? '');
$userId = $data['user_id'] ?? $_SESSION['user_id'] ?? null;
$propertyId = $data['property_id'] ?? null;

if (empty($userMessage)) {
    echo json_encode(['success' => false, 'message' => 'Message requis']);
    exit();
}

$allProperties = [];
$propertyInfo = null;

try {
    $stmt = $pdo->query(
        "SELECT p.*, 
            (SELECT image_url FROM property_images WHERE property_id = p.id AND is_primary = 1 LIMIT 1) as main_image,
            (SELECT COUNT(*) FROM reviews WHERE property_id = p.id) as reviews_count,
            u.first_name as owner_first_name,
            u.last_name as owner_last_name
         FROM properties p 
         LEFT JOIN users u ON p.owner_id = u.id
         WHERE p.admin_status = 'approved' AND p.status = 'available'
         ORDER BY p.featured DESC, p.rating DESC"
    );
    $allProperties = $stmt->fetchAll();
    
    if ($propertyId) {
        $stmt = $pdo->prepare(
            "SELECT p.*, 
                (SELECT image_url FROM property_images WHERE property_id = p.id AND is_primary = 1 LIMIT 1) as main_image,
                u.first_name as owner_first_name,
                u.last_name as owner_last_name
             FROM properties p 
             LEFT JOIN users u ON p.owner_id = u.id
             WHERE p.id = ? AND p.admin_status = 'approved'"
        );
        $stmt->execute([$propertyId]);
        $propertyInfo = $stmt->fetch();
    }
} catch (Exception $e) {
    error_log("Chatbot DB Error: " . $e->getMessage());
    $allProperties = getDemoProperties();
}

function cleanText($text) {
    $text = mb_strtolower($text, 'UTF-8');
    $search = ['é','è','ê','ë','à','â','ä','î','ï','ô','ö','ù','û','ü','ç','œ','æ'];
    $replace = ['e','e','e','e','a','a','a','i','i','o','o','u','u','u','c','oe','ae'];
    $text = str_replace($search, $replace, $text);
    $text = preg_replace('/[^\p{L}\p{N}\s]/u', '', $text);
    return trim($text);
}

function extractNumbers($text) {
    preg_match_all('/\d+/', $text, $matches);
    return $matches[0] ?? [];
}

function formatPrice($price) {
    return number_format($price, 0, ',', ' ') . ' DA';
}

function getDemoProperties() {
    return [
        ['id' => 1, 'name' => 'Luxury Villa Seraïdi', 'district' => 'SERAÏDI', 'type' => 'villa', 'price_dzd' => 25000000, 'bedrooms' => 5, 'bathrooms' => 4, 'area' => 380, 'max_guests' => 10, 'rating' => 4.9, 'reviews_count' => 45],
        ['id' => 2, 'name' => 'Modern Apartment El Bouni', 'district' => 'EL BOUNI', 'type' => 'apartment', 'price_dzd' => 8500000, 'bedrooms' => 3, 'bathrooms' => 2, 'area' => 120, 'max_guests' => 6, 'rating' => 4.5, 'reviews_count' => 28],
        ['id' => 3, 'name' => 'Cozy Studio Sidi Amar', 'district' => 'SIDI AMAR', 'type' => 'studio', 'price_dzd' => 3500000, 'bedrooms' => 1, 'bathrooms' => 1, 'area' => 45, 'max_guests' => 2, 'rating' => 4.2, 'reviews_count' => 15],
    ];
}

function searchProperties($allProperties, $criteria) {
    $results = [];
    foreach ($allProperties as $prop) {
        $score = 0;
        $matchReasons = [];
        
        if (!empty($criteria['location'])) {
            if (stripos($prop['district'], $criteria['location']) !== false) {
                $score += 10;
                $matchReasons[] = "📍 Dans " . $prop['district'];
            }
        }
        if (!empty($criteria['type'])) {
            if (stripos($prop['type'], $criteria['type']) !== false) {
                $score += 10;
                $matchReasons[] = "🏠 Type: " . $prop['type'];
            }
        }
        if (!empty($criteria['max_price']) && $prop['price_dzd'] <= $criteria['max_price']) {
            $score += 8;
            $matchReasons[] = "💰 Dans votre budget";
        }
        if (!empty($criteria['min_price']) && $prop['price_dzd'] >= $criteria['min_price']) {
            $score += 5;
        }
        if (!empty($criteria['bedrooms']) && $prop['bedrooms'] >= $criteria['bedrooms']) {
            $score += 5;
            $matchReasons[] = "🛏️ " . $prop['bedrooms'] . " chambres";
        }
        if (!empty($criteria['guests']) && $prop['max_guests'] >= $criteria['guests']) {
            $score += 7;
            $matchReasons[] = "👥 Jusqu'à " . $prop['max_guests'] . " personnes";
        }
        
        if ($score > 0) {
            $results[] = ['property' => $prop, 'score' => $score, 'reasons' => $matchReasons];
        }
    }
    usort($results, function($a, $b) { return $b['score'] - $a['score']; });
    return array_slice($results, 0, 5);
}

function checkAvailability($propertyId, $startDate, $endDate, $pdo) {
    try {
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count FROM reservations 
            WHERE property_id = ? AND status != 'cancelled'
            AND ((start_date <= ? AND end_date >= ?) OR (start_date <= ? AND end_date >= ?) OR (start_date BETWEEN ? AND ?))
        ");
        $stmt->execute([$propertyId, $startDate, $startDate, $endDate, $endDate, $startDate, $endDate]);
        $result = $stmt->fetch();
        return $result['count'] == 0;
    } catch (Exception $e) {
        return true;
    }
}

function createTransformationRequest($userId, $propertyId, $roomName, $transformationType, $durationHours, $pdo) {
    try {
        $stmt = $pdo->prepare("
            INSERT INTO transformation_requests (user_id, property_id, room_name, transformation_type, duration_hours, status, created_at)
            VALUES (?, ?, ?, ?, ?, 'pending', NOW())
        ");
        return $stmt->execute([$userId, $propertyId, $roomName, $transformationType, $durationHours]);
    } catch (Exception $e) {
        return false;
    }
}

$originalMessage = $userMessage;
$message = cleanText($userMessage);
$numbers = extractNumbers($originalMessage);

$searchCriteria = [];

$locations = ['seraidi', 'bouni', 'sidi amar', 'centre ville', 'annaba', 'chetaibi', 'el bouni', 'el hadjar', 'ain berda'];
foreach ($locations as $loc) {
    if (strpos($message, $loc) !== false) {
        $searchCriteria['location'] = $loc;
        break;
    }
}

$types = ['villa', 'appartement', 'studio', 'duplex', 'penthouse', 'loft', 'maison', 'chalet'];
foreach ($types as $type) {
    if (strpos($message, $type) !== false) {
        $searchCriteria['type'] = $type;
        break;
    }
}

foreach ($numbers as $num) {
    $numInt = intval($num);
    if ($numInt >= 5000 && $numInt <= 500000) {
        if (strpos($message, 'moins') !== false || strpos($message, 'max') !== false || strpos($message, 'budget') !== false) {
            $searchCriteria['max_price'] = $numInt;
        } else {
            $searchCriteria['max_price'] = $numInt;
        }
    } elseif ($numInt >= 1 && $numInt <= 20) {
        if (strpos($message, 'chambre') !== false || strpos($message, 'bed') !== false) {
            $searchCriteria['bedrooms'] = $numInt;
        } elseif (strpos($message, 'personne') !== false || strpos($message, 'voyageur') !== false) {
            $searchCriteria['guests'] = $numInt;
        }
    }
}

$searchResults = [];
if (!empty($searchCriteria) && !empty($allProperties)) {
    $searchResults = searchProperties($allProperties, $searchCriteria);
}

if (preg_match('/\b(bonjour|salut|coucou|hello|hi|salam|bjr)\b/', $message)) {
    $count = count($allProperties);
    $userInfo = $userId ? "Content de vous revoir ! " : "";
    $reply = "Bonjour ! 👋 " . $userInfo . "Je suis l'assistant DreamHome.\n\n";
    $reply .= "🏠 Nous avons actuellement **" . $count . " propriétés disponibles** à Annaba et ses environs.\n\n";
    $reply .= "📌 Voici ce que je peux faire pour vous :\n";
    $reply .= "• 🔍 **Trouver** une propriété selon vos critères\n";
    $reply .= "• 💰 **Budget** : propriétés dans votre budget\n";
    $reply .= "• 📍 **Quartier** : Seraïdi, El Bouni, Sidi Amar...\n";
    $reply .= "• 📝 **Réserver** : comment réserver une propriété\n";
    $reply .= "• 🎬 **Transformation** : studio photo, cuisine pro, etc.\n\n";
    $reply .= "Que souhaitez-vous faire ?";
    echo json_encode(['success' => true, 'reply' => $reply, 'show_suggestions' => true]);
    exit();
}

if (preg_match('/\b(liste|propriete|propriétés|tous les|affiche|montre|que proposez|disponible)\b/', $message) && 
    (strpos($message, 'disponible') !== false || strpos($message, 'propriete') !== false || strlen($message) < 30)) {
    
    if (count($allProperties) > 0) {
        $reply = "🏠 **Voici nos propriétés disponibles** :\n\n";
        foreach (array_slice($allProperties, 0, 5) as $prop) {
            $reply .= "• **{$prop['name']}**\n";
            $reply .= "  📍 {$prop['district']} | 💰 " . formatPrice($prop['price_dzd']) . "/nuit\n";
            $reply .= "  🛏️ {$prop['bedrooms']} ch | 🛁 {$prop['bathrooms']} sb | 👥 {$prop['max_guests']} pers\n";
            $reply .= "  ⭐ " . ($prop['rating'] ?? '4.5') . "/5 (" . ($prop['reviews_count'] ?? 0) . " avis)\n\n";
        }
        if (count($allProperties) > 5) {
            $reply .= "✨ Et " . (count($allProperties) - 5) . " autres propriétés sur notre site !\n\n";
        }
        $reply .= "Souhaitez-vous affiner votre recherche par quartier, budget ou nombre de personnes ?";
    } else {
        $reply = "🏠 Nous avons plusieurs propriétés disponibles à Annaba (Seraïdi, El Bouni, Sidi Amar). Quel quartier ou type de bien vous intéresse ?";
    }
    echo json_encode(['success' => true, 'reply' => $reply]);
    exit();
}

if (!empty($searchResults)) {
    $reply = "🔍 **Voici les propriétés qui correspondent à votre recherche** :\n\n";
    foreach ($searchResults as $idx => $result) {
        $prop = $result['property'];
        $reply .= ($idx + 1) . "️⃣ **{$prop['name']}**\n";
        $reply .= "   📍 {$prop['district']}\n";
        $reply .= "   💰 " . formatPrice($prop['price_dzd']) . " /nuit\n";
        $reply .= "   🛏️ {$prop['bedrooms']} chambres | 👥 {$prop['max_guests']} personnes\n";
        $reply .= "   ⭐ " . ($prop['rating'] ?? '4.5') . "/5 (" . ($prop['reviews_count'] ?? 0) . " avis)\n";
        if (!empty($result['reasons'])) {
            $reply .= "   ✓ " . implode(" • ", $result['reasons']) . "\n";
        }
        $reply .= "\n";
    }
    $reply .= "💡 Pour voir les détails d'une propriété, cliquez sur son nom sur notre site.\n\n";
    $reply .= "Souhaitez-vous plus d'informations sur l'une d'elles ?\n";
    $reply .= "Ou souhaitez-vous vérifier les disponibilités ?";
    echo json_encode(['success' => true, 'reply' => $reply]);
    exit();
}

if (preg_match('/\b(prix|combien|coute|tarif|price|budget)\b/', $message)) {
    if ($propertyInfo) {
        $nightPrice = $propertyInfo['price_dzd'];
        $weekPrice = $nightPrice * 7 * 0.95;
        $monthPrice = $nightPrice * 30 * 0.85;
        
        $reply = "💰 **Tarifs pour {$propertyInfo['name']}** :\n\n";
        $reply .= "• Prix par nuit : " . formatPrice($nightPrice) . "\n";
        $reply .= "• Prix par semaine : " . formatPrice($weekPrice) . " (📉 -5%)\n";
        $reply .= "• Prix par mois : " . formatPrice($monthPrice) . " (📉 -15%)\n\n";
        $reply .= "Le prix inclut : eau, électricité, WiFi.\n";
        $reply .= "Voulez-vous vérifier les disponibilités ou procéder à une réservation ?";
    } elseif (!empty($numbers)) {
        $budget = $numbers[0];
        $affordable = [];
        foreach ($allProperties as $prop) {
            if ($prop['price_dzd'] <= $budget) {
                $affordable[] = $prop;
            }
        }
        if (count($affordable) > 0) {
            $reply = "💰 Avec un budget de **" . formatPrice($budget) . "** par nuit, voici les propriétés disponibles :\n\n";
            foreach (array_slice($affordable, 0, 3) as $prop) {
                $reply .= "• **{$prop['name']}** - {$prop['district']}\n";
                $reply .= "  💰 " . formatPrice($prop['price_dzd']) . "/nuit | ⭐ {$prop['rating']}/5\n\n";
            }
            $reply .= "Souhaitez-vous plus de détails sur l'une d'elles ?";
        } else {
            $prices = array_column($allProperties, 'price_dzd');
            $minPrice = min($prices);
            $reply = "💰 Avec un budget de " . formatPrice($budget) . ", nous n'avons pas de propriété dans cette gamme.\n";
            $reply .= "📊 Le prix minimum est de " . formatPrice($minPrice) . "/nuit.\n";
            $reply .= "Voulez-vous augmenter votre budget ou voir nos propriétés les moins chères ?";
        }
    } else {
        $prices = array_column($allProperties, 'price_dzd');
        $minPrice = min($prices);
        $maxPrice = max($prices);
        $avgPrice = array_sum($prices) / count($prices);
        $reply = "💰 **Fourchette de prix de nos propriétés** :\n\n";
        $reply .= "• Minimum : " . formatPrice($minPrice) . "/nuit\n";
        $reply .= "• Moyenne : " . formatPrice($avgPrice) . "/nuit\n";
        $reply .= "• Maximum : " . formatPrice($maxPrice) . "/nuit\n\n";
        $reply .= "Quel est votre budget ? Je peux vous trouver les meilleures options !";
    }
    echo json_encode(['success' => true, 'reply' => $reply]);
    exit();
}

if (preg_match('/\b(quartier|seraidi|bouni|sidi|amar|annaba|el bouni|el hadjar|ou se trouve|localisation)\b/', $message)) {
    $districtInfo = [
        'seraidi' => "🏔️ **Seraïdi** : Quartier résidentiel perché sur les hauteurs d'Annaba.\n✨ Vue panoramique sur la mer, calme absolu, villas de luxe.\n📍 À 10 min du centre-ville.",
        'bouni' => "🏙️ **El Bouni** : Quartier moderne et dynamique.\n✨ Nombreux commerces, restaurants, écoles.\n📍 Idéal pour les familles et jeunes actifs.",
        'sidi' => "🌳 **Sidi Amar** : Quartier familial et paisible.\n✨ Calme, espaces verts, maisons individuelles.\n📍 À 15 min du centre d'Annaba.",
        'centre ville' => "🏛️ **Centre-ville d'Annaba** : Cœur vibrant de la ville.\n✨ Commerces, restaurants, vie nocturne.\n📍 Proche de la gare et du front de mer.",
        'el hadjar' => "🏭 **El Hadjar** : Zone industrielle avec quartiers résidentiels.\n✨ Idéal pour les travailleurs de l'industrie.\n📍 À 15 min du centre-ville."
    ];
    
    foreach ($districtInfo as $key => $info) {
        if (strpos($message, $key) !== false) {
            $reply = $info . "\n\n";
            $count = 0;
            $propertiesList = [];
            foreach ($allProperties as $prop) {
                if (stripos($prop['district'], $key) !== false || stripos($prop['location'], $key) !== false) {
                    $count++;
                    $propertiesList[] = $prop['name'];
                }
            }
            if ($count > 0) {
                $reply .= "🏠 Nous avons **$count propriété(s)** disponible(s) dans ce quartier :\n";
                $reply .= implode(", ", array_slice($propertiesList, 0, 5));
                if ($count > 5) $reply .= " et " . ($count - 5) . " autres...\n";
                $reply .= "\n\nSouhaitez-vous les voir en détail ?";
            } else {
                $reply .= "🏠 Aucune propriété n'est actuellement disponible dans ce quartier.\n";
                $reply .= "Voulez-vous voir les propriétés dans les quartiers voisins ?";
            }
            echo json_encode(['success' => true, 'reply' => $reply]);
            exit();
        }
    }
}

if (preg_match('/\b(transformation|studio photo|cuisine pro|espace de travail|photo studio|professional|equipement|salle de reunion)\b/', $message)) {
    if (!$userId) {
        $reply = "🎬 **Transformation d'espace**\n\n";
        $reply .= "Nous proposons des espaces transformables pour :\n";
        $reply .= "• 📸 **Studio photo** - Éclairage professionnel, fonds neutres\n";
        $reply .= "• 🍳 **Cuisine professionnelle** - Équipements haut de gamme\n";
        $reply .= "• 💼 **Espace de travail** - Salles de réunion, bureaux\n";
        $reply .= "• 🎥 **Tournage vidéo** - Espaces adaptés\n\n";
        $reply .= "🔐 Veuillez vous connecter pour faire une demande de transformation.";
        echo json_encode(['success' => true, 'reply' => $reply]);
        exit();
    }
    
    $transformationType = null;
    $roomName = null;
    $durationHours = 4;
    
    if (strpos($message, 'photo') !== false || strpos($message, 'studio photo') !== false) {
        $transformationType = 'photo_studio';
        $roomName = 'photo_studio';
        $reply = "📸 **Demande de studio photo**\n\n";
    } elseif (strpos($message, 'cuisine') !== false || strpos($message, 'pro cuisine') !== false) {
        $transformationType = 'professional_kitchen';
        $roomName = 'kitchen';
        $reply = "🍳 **Demande de cuisine professionnelle**\n\n";
    } elseif (strpos($message, 'reunion') !== false || strpos($message, 'salle') !== false) {
        $transformationType = 'meeting_room';
        $roomName = 'meeting_room';
        $reply = "💼 **Demande de salle de réunion**\n\n";
    } elseif (strpos($message, 'travail') !== false || strpos($message, 'bureau') !== false) {
        $transformationType = 'workspace';
        $roomName = 'workspace';
        $reply = "💻 **Demande d'espace de travail**\n\n";
    } else {
        $reply = "🎬 **Transformations disponibles**\n\n";
        $reply .= "Quel type de transformation vous intéresse ?\n";
        $reply .= "• 📸 Studio photo\n";
        $reply .= "• 🍳 Cuisine professionnelle\n";
        $reply .= "• 💼 Salle de réunion\n";
        $reply .= "• 💻 Espace de travail\n\n";
        $reply .= "Précisez votre demande (ex: 'Je veux louer un studio photo pour 4 heures')";
        echo json_encode(['success' => true, 'reply' => $reply]);
        exit();
    }
    
    foreach ($numbers as $num) {
        if ($num >= 1 && $num <= 24) {
            $durationHours = $num;
            break;
        }
    }
    
    if ($propertyId) {
        $result = createTransformationRequest($userId, $propertyId, $roomName, $transformationType, $durationHours, $pdo);
        if ($result) {
            $reply .= "✅ Votre demande de transformation a été envoyée au propriétaire !\n\n";
            $reply .= "Détails de votre demande :\n";
            $reply .= "• Type : " . ($transformationType == 'photo_studio' ? 'Studio photo' : ($transformationType == 'professional_kitchen' ? 'Cuisine professionnelle' : ($transformationType == 'meeting_room' ? 'Salle de réunion' : 'Espace de travail'))) . "\n";
            $reply .= "• Durée : $durationHours heure(s)\n";
            $reply .= "• Statut : En attente de validation\n\n";
            $reply .= "Le propriétaire vous contactera sous 24h pour confirmer la disponibilité et le prix.\n";
            $reply .= "📞 Vous pouvez aussi le contacter directement via la messagerie.";
        } else {
            $reply .= "❌ Une erreur est survenue. Veuillez réessayer ou contacter le support.";
        }
    } else {
        $reply .= "🔍 Veuillez d'abord sélectionner une propriété sur notre site.\n";
        $reply .= "Consultez nos propriétés et choisissez celle qui correspond à vos besoins.";
    }
    echo json_encode(['success' => true, 'reply' => $reply]);
    exit();
}

if (preg_match('/\b(reserver|reservation|comment reserver|disponibilite|disponible date|calendrier)\b/', $message)) {
    $reply = "📝 **Comment réserver sur DreamHome** :\n\n";
    $reply .= "1️⃣ Trouvez la propriété qui vous plaît\n";
    $reply .= "2️⃣ Vérifiez les dates disponibles dans le calendrier\n";
    $reply .= "3️⃣ Cliquez sur \"Réserver maintenant\"\n";
    $reply .= "4️⃣ Remplissez vos coordonnées\n";
    $reply .= "5️⃣ Choisissez votre mode de paiement\n";
    $reply .= "6️⃣ Validez - confirmation immédiate !\n\n";
    $reply .= "✅ **Avantages** :\n";
    $reply .= "• Annulation gratuite jusqu'à 7 jours avant\n";
    $reply .= "• Support client 24/7\n";
    $reply .= "• Paiement sécurisé\n\n";
    
    if ($propertyId && $propertyInfo) {
        $reply .= "🏠 Pour **{$propertyInfo['name']}**, souhaitez-vous :\n";
        $reply .= "• Vérifier les disponibilités ?\n";
        $reply .= "• Procéder directement à la réservation ?\n\n";
        $reply .= "Cliquez sur 'Réserver maintenant' sur la page de la propriété.";
    } else {
        $reply .= "Vous avez déjà une propriété en tête ? Dites-moi son nom ou son quartier !";
    }
    echo json_encode(['success' => true, 'reply' => $reply]);
    exit();
}

if (preg_match('/\b(wifi|clim|parking|piscine|cuisine|tv|equipement|machine|lave linge|seche linge)\b/', $message)) {
    $reply = "🛋️ **Équipements standards dans nos propriétés** :\n\n";
    $reply .= "✓ WiFi haut débit\n";
    $reply .= "✓ Climatisation réversible\n";
    $reply .= "✓ Cuisine équipée (frigo, plaques, four)\n";
    $reply .= "✓ Machine à laver\n";
    $reply .= "✓ Smart TV\n";
    $reply .= "✓ Parking privé\n";
    $reply .= "✓ Eau chaude 24/7\n\n";
    $reply .= "✨ **Équipements premium disponibles** :\n";
    $reply .= "• Piscine privée\n";
    $reply .= "• Jacuzzi\n";
    $reply .= "• Salle de sport\n";
    $reply .= "• Terrasse avec vue\n\n";
    $reply .= "Vous cherchez un équipement spécifique ? Dites-le moi, je trouverai la propriété idéale !";
    echo json_encode(['success' => true, 'reply' => $reply]);
    exit();
}

if (preg_match('/\b(personne|voyageur|capacite|famille|groupe|amis|enfant)\b/', $message) && !empty($numbers)) {
    $guests = intval($numbers[0]);
    $suitable = [];
    foreach ($allProperties as $prop) {
        if ($prop['max_guests'] >= $guests) {
            $suitable[] = $prop;
        }
    }
    if (count($suitable) > 0) {
        $reply = "👥 Pour **$guests personnes**, voici les propriétés recommandées :\n\n";
        foreach (array_slice($suitable, 0, 3) as $prop) {
            $reply .= "• **{$prop['name']}** - {$prop['district']}\n";
            $reply .= "  Capacité : {$prop['max_guests']} personnes | 💰 " . formatPrice($prop['price_dzd']) . "/nuit\n";
            $reply .= "  ⭐ {$prop['rating']}/5\n\n";
        }
        $reply .= "Souhaitez-vous plus de détails sur l'une d'elles ou vérifier les disponibilités ?";
    } else {
        $reply = "👥 Pour $guests personnes, je vous recommande nos plus grandes propriétés.\n";
        $reply .= "Notre villa à Seraïdi peut accueillir jusqu'à 10 personnes !\n";
        $reply .= "Voulez-vous la voir en détail ?";
    }
    echo json_encode(['success' => true, 'reply' => $reply]);
    exit();
}

if (preg_match('/\b(aide|help|support|que faire|comment utiliser|guide)\b/', $message)) {
    $reply = "🆘 **Guide d'utilisation - Assistant DreamHome**\n\n";
    $reply .= "📌 **Recherche de propriétés**\n";
    $reply .= "• \"Cherche villa à Seraïdi\"\n";
    $reply .= "• \"Appartement pas cher El Bouni\"\n";
    $reply .= "• \"Logement pour 6 personnes\"\n\n";
    $reply .= "💰 **Budget et prix**\n";
    $reply .= "• \"Quel est le prix moyen ?\"\n";
    $reply .= "• \"Propriétés à moins de 15000 DA\"\n\n";
    $reply .= "📍 **Informations sur les quartiers**\n";
    $reply .= "• \"C'est comment Seraïdi ?\"\n";
    $reply .= "• \"Info sur El Bouni\"\n\n";
    $reply .= "📝 **Réservation**\n";
    $reply .= "• \"Comment réserver ?\"\n";
    $reply .= "• \"Politique d'annulation\"\n\n";
    $reply .= "🎬 **Transformations d'espace**\n";
    $reply .= "• \"Studio photo pour 4h\"\n";
    $reply .= "• \"Cuisine professionnelle\"\n\n";
    $reply .= "Que souhaitez-vous faire ? Je suis là pour vous aider ! 💫";
    echo json_encode(['success' => true, 'reply' => $reply]);
    exit();
}

if (preg_match('/\b(contact|joindre|telephone|email|support|assistance)\b/', $message)) {
    $reply = "📞 **Contactez-nous**\n\n";
    $reply .= "📧 Email : info@dreamhome.com\n";
    $reply .= "📱 Téléphone : +213 123 456 789\n";
    $reply .= "📍 Adresse : Annaba, Algérie\n\n";
    $reply .= "⏰ **Horaires d'ouverture** :\n";
    $reply .= "• Lundi - Vendredi : 9h - 18h\n";
    $reply .= "• Samedi : 10h - 14h\n";
    $reply .= "• Dimanche : Fermé\n\n";
    $reply .= "💬 Vous pouvez aussi utiliser notre formulaire de contact sur le site.\n";
    $reply .= "Une question spécifique ? Je peux peut-être vous aider !";
    echo json_encode(['success' => true, 'reply' => $reply]);
    exit();
}

$reply = "🤔 Je n'ai pas bien compris : \"{$originalMessage}\"\n\n";

if (!empty($allProperties)) {
    $reply .= "🏠 **Propriétés populaires** :\n";
    foreach (array_slice($allProperties, 0, 3) as $prop) {
        $reply .= "• {$prop['name']} - {$prop['district']} - " . formatPrice($prop['price_dzd']) . "/nuit\n";
    }
    $reply .= "\n";
}

$reply .= "💡 **Essayez plutôt** :\n";
$reply .= "• \"Liste des propriétés\"\n";
$reply .= "• \"Villa à Seraïdi\"\n";
$reply .= "• \"Appartement moins de 15000 DA\"\n";
$reply .= "• \"Logement pour 4 personnes\"\n";
$reply .= "• \"Quartier El Bouni\"\n";
$reply .= "• \"Comment réserver ?\"\n";
$reply .= "• \"Studio photo\"\n\n";
$reply .= "📌 Tapez \"aide\" pour voir toutes les commandes disponibles.";

echo json_encode(['success' => true, 'reply' => $reply]);
?>