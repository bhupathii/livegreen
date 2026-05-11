<?php
require_once 'config.php';
require_once 'mailer.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    verifyAdmin();
    $stmt = $pdo->query("SELECT * FROM referrals ORDER BY date DESC");
    $referrals = $stmt->fetchAll();
    echo json_encode($referrals);

} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $referrerEmail = $data['referrerEmail'] ?? '';
    $referredEmail = $data['referredEmail'] ?? '';
    
    $stmt = $pdo->prepare("INSERT INTO referrals (referrerEmail, referredEmail, date) VALUES (?, ?, ?)");
    $stmt->execute([$referrerEmail, $referredEmail, date('c')]);
    
    // Send emails
    try {
        if ($referredEmail) {
            sendReferralEmail($referredEmail, $referrerEmail);
        }
        if ($referrerEmail) {
            sendReferralThankYou($referrerEmail, $referredEmail);
        }
    } catch (Exception $e) {
        error_log("Referral email failed: " . $e->getMessage());
    }
    
    echo json_encode(['id' => $pdo->lastInsertId()]);
    
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
}
?>
