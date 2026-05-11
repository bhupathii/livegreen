<?php
require_once 'config.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Return only active, non-expired, non-private promo codes (public-safe fields only)
    $stmt = $pdo->query("SELECT code, discountType, discountValue, minSpend, expiryDate FROM promo_codes WHERE status = 'active' AND is_private = 0 AND (expiryDate IS NULL OR expiryDate > NOW()) ORDER BY discountValue DESC LIMIT 5");
    $promos = $stmt->fetchAll();
    echo json_encode(['success' => true, 'promos' => $promos]);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
}
?>
