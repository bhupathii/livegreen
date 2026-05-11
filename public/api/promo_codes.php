<?php
require_once 'config.php';

header('Content-Type: application/json');

// Ensure is_private column exists
try {
    $checkCol = $pdo->query("SHOW COLUMNS FROM promo_codes LIKE 'is_private'");
    if (!$checkCol->fetch()) {
        $pdo->exec("ALTER TABLE promo_codes ADD COLUMN is_private TINYINT(1) DEFAULT 0");
    }
} catch (Exception $e) {
    error_log("Promo code migration failed: " . $e->getMessage());
}

$method = $_SERVER['REQUEST_METHOD'];
$pathInfo = isset($_SERVER['PATH_INFO']) ? explode('/', trim($_SERVER['PATH_INFO'], '/')) : [];
$id = isset($pathInfo[0]) && is_numeric($pathInfo[0]) ? (int)$pathInfo[0] : null;

if ($method === 'GET') {
    verifyAdmin();
    $stmt = $pdo->query("SELECT * FROM promo_codes ORDER BY id DESC");
    $promos = $stmt->fetchAll();
    echo json_encode($promos);

} elseif ($method === 'POST') {
    if ($id === null && isset($pathInfo[0]) && $pathInfo[0] === 'validate') {
        // Validate Promo Code
        $data = json_decode(file_get_contents("php://input"), true);
        $code = strtoupper($data['code'] ?? '');
        $cartTotal = $data['cartTotal'] ?? 0;
        $email = $data['email'] ?? null;
        $phone = $data['phone'] ?? null;

        $stmt = $pdo->prepare("SELECT * FROM promo_codes WHERE code = ?");
        $stmt->execute([$code]);
        $promo = $stmt->fetch();

        if (!$promo) {
            http_response_code(404);
            echo json_encode(["error" => "Invalid promo code"]);
            exit();
        }
        if ($promo['status'] !== "active") {
            http_response_code(400);
            echo json_encode(["error" => "Promo code is no longer active"]);
            exit();
        }
        if ($promo['expiryDate'] && strtotime($promo['expiryDate']) < time()) {
            http_response_code(400);
            echo json_encode(["error" => "Promo code has expired"]);
            exit();
        }
        if ($promo['minSpend'] > 0 && $cartTotal < $promo['minSpend']) {
            http_response_code(400);
            echo json_encode(["error" => "Minimum spend of ₹" . $promo['minSpend'] . " required"]);
            exit();
        }
        
        // CHECK USAGE LIMITS
        if ($promo['totalLimit'] > 0 && $promo['usedCount'] >= $promo['totalLimit']) {
             http_response_code(400);
             echo json_encode(["error" => "Promo code usage limit exceeded"]);
             exit();
        }

        // CHECK ONE-TIME PER USER
        if ($promo['oneTimePerUser'] && ($email || $phone)) {
            $checkUsage = $pdo->prepare("SELECT COUNT(*) FROM promo_code_usage WHERE promo_code_id = ? AND (email = ? OR phone = ?)");
            $checkUsage->execute([$promo['id'], $email, $phone]);
            if ($checkUsage->fetchColumn() > 0) {
                http_response_code(400);
                echo json_encode(["error" => "You have already used this promo code"]);
                exit();
            }
        }

        echo json_encode([
            "success" => true, 
            "id" => $promo['id'],
            "discountType" => $promo['discountType'], 
            "discountValue" => $promo['discountValue']
        ]);
        exit();
    }

    // Create promo code
    verifyAdmin();
    $data = json_decode(file_get_contents("php://input"), true);
    
    try {
        $stmt = $pdo->prepare("INSERT INTO promo_codes (code, discountType, discountValue, minSpend, expiryDate, totalLimit, oneTimePerUser, is_private) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            strtoupper($data['code']), 
            $data['discountType'], 
            $data['discountValue'], 
            $data['minSpend'] ?? 0, 
            $data['expiryDate'] ?? null,
            $data['totalLimit'] ?? 0,
            $data['oneTimePerUser'] ? 1 : 0,
            isset($data['is_private']) ? ($data['is_private'] ? 1 : 0) : 0
        ]);
        echo json_encode(['id' => $pdo->lastInsertId()]);
    } catch (PDOException $e) {
        if ($e->errorInfo[1] == 1062) { // Duplicate entry
            http_response_code(400);
            echo json_encode(['error' => 'Promo code already exists']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
    }
    
} elseif ($method === 'PUT') {
    verifyAdmin();
    if ($id && !isset($pathInfo[1])) {
        // Full Update
        $data = json_decode(file_get_contents("php://input"), true);
        $stmt = $pdo->prepare("UPDATE promo_codes SET code = ?, discountType = ?, discountValue = ?, minSpend = ?, expiryDate = ?, totalLimit = ?, oneTimePerUser = ?, is_private = ? WHERE id = ?");
        $stmt->execute([
            strtoupper($data['code']),
            $data['discountType'],
            $data['discountValue'],
            $data['minSpend'] ?? 0,
            $data['expiryDate'] ?? null,
            $data['totalLimit'] ?? 0,
            isset($data['oneTimePerUser']) ? ($data['oneTimePerUser'] ? 1 : 0) : 0,
            isset($data['is_private']) ? ($data['is_private'] ? 1 : 0) : 0,
            $id
        ]);
        echo json_encode(['success' => true]);
        exit();
    }

    // Status Update: PUT /api/promo_codes.php/ID/status
    if (!$id || !isset($pathInfo[1]) || $pathInfo[1] !== 'status') {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid endpoint']);
        exit();
    }
    
    $data = json_decode(file_get_contents("php://input"), true);
    
    $stmt = $pdo->prepare("UPDATE promo_codes SET status = ? WHERE id = ?");
    $stmt->execute([$data['status'], $id]);
    
    echo json_encode(['success' => true]);

} elseif ($method === 'DELETE') {
    verifyAdmin();
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID is required']);
        exit();
    }
    
    try {
        // Delete usage history first (foreign key)
        $pdo->prepare("DELETE FROM promo_code_usage WHERE promo_code_id = ?")->execute([$id]);
        $stmt = $pdo->prepare("DELETE FROM promo_codes WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
}
?>
