<?php
/**
 * Check Pincode Serviceability via iCarry API
 * POST /api/check_pincode.php
 * Body: { "pincode": "534102" }
 */
header('Content-Type: application/json');
require_once 'config.php';
require_once 'icarry.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

// Robust extraction: if json_decode failed, check if the raw input IS the pincode
$pincode = $input['pincode'] ?? (preg_match('/^[1-9][0-9]{5}$/', trim($rawInput)) ? trim($rawInput) : '');

if (empty($pincode)) {
    echo json_encode(['success' => false, 'serviceable' => false, 'error' => 'Invalid PIN code format or missing input', 'raw' => substr($rawInput, 0, 50)]);
    exit;
}

try {
    $result = check_serviceability($pincode);
    
    if (isset($result['error'])) {
        echo json_encode([
            'success' => false,
            'serviceable' => false,
            'error' => 'Shipping partner error: ' . $result['error'],
            'raw' => $result['raw'] ?? 'No raw response'
        ]);
        exit;
    }

    if (isset($result['success']) && ($result['success'] == 1 || $result['success'] === true) && !empty($result['msg'])) {
        $services = $result['msg'];
        $prepaid = false;
        $cod = false;
        
        foreach ($services as $svc) {
            if (($svc['prepaid'] ?? '') === 'Y') $prepaid = true;
            if (($svc['cod'] ?? '') === 'Y') $cod = true;
        }
        
        echo json_encode([
            'success' => true,
            'serviceable' => true,
            'prepaid' => $prepaid,
            'cod' => $cod,
            'services' => $services
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'serviceable' => false,
            'error' => 'Delivery not available to this PIN code',
            'debug' => $result // Help diagnose what iCarry actually returned
        ]);
    }
} catch (Exception $e) {
    error_log("Pincode check error: " . $e->getMessage());
    echo json_encode(['success' => false, 'serviceable' => false, 'error' => 'Internal service check failed: ' . $e->getMessage()]);
}
?>
