<?php
require_once 'config.php';
header('Content-Type: application/json');

// Ensure the subscriptions table exists
$pdo->exec("CREATE TABLE IF NOT EXISTS newsletter_emails (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Only allow admins to list subscriptions
    verifyAdmin();

    $stmt = $pdo->query("SELECT * FROM newsletter_emails ORDER BY created_at DESC");
    $subscriptions = $stmt->fetchAll();
    echo json_encode($subscriptions);
} elseif ($method === 'POST') {
    // Both form-data and JSON input support
    $data = json_decode(file_get_contents('php://input'), true);
    $email = $data['email'] ?? $_POST['email'] ?? '';

    $email = filter_var(trim($email), FILTER_SANITIZE_EMAIL);

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid email address']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO newsletter_emails (email) VALUES (?)");
        $stmt->execute([$email]);
        echo json_encode(['success' => true, 'message' => 'Successfully subscribed!']);
    } catch (PDOException $e) {
        // Handle duplicate email (MySQL error group 23000, specifically 1062)
        if ($e->getCode() == 23000) {
            echo json_encode(['success' => true, 'message' => 'You are already subscribed!']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Database error occurred']);
        }
    }
} elseif ($method === 'DELETE') {
    verifyAdmin();
    
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID is required']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM newsletter_emails WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete subscription']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
