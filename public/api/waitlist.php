<?php
/**
 * Waitlist API Endpoint
 * Handles POST requests to add emails to a product's restock waitlist.
 */

header('Content-Type: application/json');
require_once 'config.php';

// Auto-migrate: ensure waitlist table exists
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS waitlist (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        email VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        notified TINYINT(1) DEFAULT 0,
        notified_at DATETIME NULL
    )");
} catch (PDOException $e) {
    // Ignore migration errors as it might be SQLite or already exists
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);
$productId = $data['product_id'] ?? null;
$email = $data['email'] ?? '';

if (!$productId || empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["error" => "Valid Product ID and Email are required"]);
    exit();
}

try {
    // Check if exactly this email is already waiting for this product
    $checkStmt = $pdo->prepare("SELECT id FROM waitlist WHERE product_id = ? AND email = ? AND notified = 0");
    $checkStmt->execute([$productId, $email]);
    if ($checkStmt->fetch()) {
        // Already waiting
        echo json_encode(["success" => true, "message" => "You are already on the waitlist!"]);
        exit();
    }

    $stmt = $pdo->prepare("INSERT INTO waitlist (product_id, email, created_at, notified) VALUES (?, ?, NOW(), 0)");
    $stmt->execute([$productId, $email]);

    echo json_encode(["success" => true, "message" => "You have been added to the waitlist. We'll email you when it's back!"]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
}
