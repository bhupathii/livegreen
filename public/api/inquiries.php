<?php
require_once 'config.php';
require_once 'mailer.php';
require_once 'rate_limiter.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$pathInfo = isset($_SERVER['PATH_INFO']) ? explode('/', trim($_SERVER['PATH_INFO'], '/')) : [];
$id = isset($pathInfo[0]) && is_numeric($pathInfo[0]) ? (int)$pathInfo[0] : null;

if ($method === 'GET') {
    verifyAdmin();
    $stmt = $pdo->query("SELECT * FROM inquiries ORDER BY date DESC");
    $inqs = $stmt->fetchAll();
    echo json_encode($inqs);

} elseif ($method === 'POST') {
    rateLimit('inquiry', 10, 60); // 10 per minute
    $data = json_decode(file_get_contents("php://input"), true);
    
    $name = $data['name'] ?? '';
    $email = $data['email'] ?? '';
    $subject = $data['subject'] ?? '';
    $message = $data['message'] ?? '';
    
    $stmt = $pdo->prepare("INSERT INTO inquiries (name, email, subject, message, date) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$name, $email, $subject, $message, date('c')]);
    
    // Send emails
    try {
        if ($email) {
            sendInquiryConfirmation($email, $name, $subject);
        }
        sendInquiryAdminNotify($name, $email, $subject, $message);
    } catch (Exception $e) {
        error_log("Inquiry email failed: " . $e->getMessage());
    }
    
    echo json_encode(['id' => $pdo->lastInsertId()]);
    
} elseif ($method === 'PUT') {
    verifyAdmin();
    if (!$id || !isset($pathInfo[1]) || $pathInfo[1] !== 'status') {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid endpoint']);
        exit();
    }
    
    $data = json_decode(file_get_contents("php://input"), true);
    
    $stmt = $pdo->prepare("UPDATE inquiries SET status = ? WHERE id = ?");
    $stmt->execute([$data['status'], $id]);
    
    echo json_encode(['success' => true]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
}
?>
