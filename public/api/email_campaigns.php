<?php
/**
 * Email Campaigns & Abandoned Cart Recovery API
 */
require_once 'config.php';
require_once 'mailer.php';

header('Content-Type: application/json');

// Auto-create tables
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS email_campaigns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        subject VARCHAR(500) NOT NULL,
        body TEXT NOT NULL,
        type ENUM('newsletter','promo','abandoned_cart','custom') DEFAULT 'custom',
        status ENUM('draft','sending','sent','failed') DEFAULT 'draft',
        recipients_count INT DEFAULT 0,
        sent_count INT DEFAULT 0,
        open_count INT DEFAULT 0,
        scheduled_at DATETIME,
        sent_at DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    $pdo->exec("CREATE TABLE IF NOT EXISTS abandoned_carts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(255),
        email VARCHAR(255),
        cart_data TEXT,
        total_amount INT DEFAULT 0,
        reminder_sent TINYINT(1) DEFAULT 0,
        recovered TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");
} catch (Exception $e) {}

$method = $_SERVER['REQUEST_METHOD'];
$pathInfo = isset($_SERVER['PATH_INFO']) ? explode('/', trim($_SERVER['PATH_INFO'], '/')) : [];
$action = $pathInfo[0] ?? '';

if ($method === 'GET') {
    verifyAdmin();
    
    if ($action === 'abandoned') {
        // Get abandoned carts
        $stmt = $pdo->query("SELECT * FROM abandoned_carts WHERE recovered = 0 ORDER BY created_at DESC LIMIT 50");
        echo json_encode($stmt->fetchAll());
    } else {
        // Get campaigns
        $stmt = $pdo->query("SELECT * FROM email_campaigns ORDER BY created_at DESC");
        echo json_encode($stmt->fetchAll());
    }

} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if ($action === 'save-cart') {
        // Public: Save abandoned cart (called from frontend when user has items + email)
        $stmt = $pdo->prepare("INSERT INTO abandoned_carts (session_id, email, cart_data, total_amount) 
            VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE cart_data = VALUES(cart_data), total_amount = VALUES(total_amount), updated_at = NOW()");
        $stmt->execute([
            $data['sessionId'] ?? session_id(), $data['email'] ?? '',
            json_encode($data['items'] ?? []), $data['totalAmount'] ?? 0
        ]);
        echo json_encode(['success' => true]);
        
    } elseif ($action === 'campaign') {
        // Admin: Create campaign
        verifyAdmin();
        $stmt = $pdo->prepare("INSERT INTO email_campaigns (name, subject, body, type, status, scheduled_at) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['name'] ?? '', $data['subject'] ?? '', $data['body'] ?? '',
            $data['type'] ?? 'custom', 'draft', $data['scheduled_at'] ?? null
        ]);
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
        
    } elseif ($action === 'send') {
        // Admin: Send a campaign
        verifyAdmin();
        $campaignId = $data['campaignId'] ?? null;
        if (!$campaignId) { http_response_code(400); echo json_encode(['error' => 'Campaign ID required']); exit(); }
        
        $stmt = $pdo->prepare("SELECT * FROM email_campaigns WHERE id = ?");
        $stmt->execute([$campaignId]);
        $campaign = $stmt->fetch();
        if (!$campaign) { http_response_code(404); echo json_encode(['error' => 'Campaign not found']); exit(); }
        
        // Get ALL recipients: newsletter subscribers + customers (deduplicated)
        $emails = [];
        try {
            $nlStmt = $pdo->query("SELECT email FROM newsletter_emails");
            foreach ($nlStmt->fetchAll() as $row) { $emails[$row['email']] = true; }
        } catch (Exception $e) {}
        try {
            $custStmt = $pdo->query("SELECT email FROM customers WHERE email IS NOT NULL AND email != ''");
            foreach ($custStmt->fetchAll() as $row) { $emails[$row['email']] = true; }
        } catch (Exception $e) {}
        
        $allEmails = array_keys($emails);
        $sent = 0;
        
        $pdo->prepare("UPDATE email_campaigns SET status = 'sending', recipients_count = ? WHERE id = ?")
            ->execute([count($allEmails), $campaignId]);
        
        foreach ($allEmails as $email) {
            try {
                $result = sendEmail($email, $campaign['subject'], getEmailWrapper($campaign['body']));
                if ($result) {
                    $sent++;
                } else {
                    error_log("Campaign email SMTP failed for {$email} (returned false)");
                }
            } catch (Exception $e) {
                error_log("Campaign email exception for {$email}: " . $e->getMessage());
            }
        }
        
        $status = $sent > 0 ? 'sent' : 'failed';
        $pdo->prepare("UPDATE email_campaigns SET status = ?, sent_count = ?, sent_at = NOW() WHERE id = ?")
            ->execute([$status, $sent, $campaignId]);
        
        echo json_encode(['success' => true, 'sent' => $sent, 'total' => count($allEmails), 'failed' => count($allEmails) - $sent]);
        
    } elseif ($action === 'recover') {
        // Admin: Send recovery email for abandoned cart
        verifyAdmin();
        $cartId = $data['cartId'] ?? null;
        if (!$cartId) { http_response_code(400); echo json_encode(['error' => 'Cart ID required']); exit(); }
        
        $stmt = $pdo->prepare("SELECT * FROM abandoned_carts WHERE id = ?");
        $stmt->execute([$cartId]);
        $cart = $stmt->fetch();
        if (!$cart || !$cart['email']) { http_response_code(404); echo json_encode(['error' => 'Cart not found']); exit(); }
        
        try {
            $items = json_decode($cart['cart_data'], true);
            $itemNames = array_map(function($i) { return $i['name'] ?? 'Product'; }, $items);
            $subject = "🍯 You left some honey behind! Complete your order";
            $body = "<h2>Hi there! 👋</h2>
                <p>Looks like you left some items in your cart:</p>
                <ul>" . implode('', array_map(function($n) { return "<li>$n</li>"; }, $itemNames)) . "</ul>
                <p>Your total: ₹{$cart['total_amount']}</p>
                <p><a href='https://www.livegreenfarms.in/shop' style='background:#1B5E20;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold'>Complete Your Order</a></p>
                <p>This cart will expire soon — don't miss out on nature's best honey! 🐝</p>";
            sendEmail($cart['email'], $subject, getEmailWrapper($body));
            $pdo->prepare("UPDATE abandoned_carts SET reminder_sent = 1 WHERE id = ?")->execute([$cartId]);
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action']);
    }

} elseif ($method === 'PUT') {
    // Admin: Update campaign
    verifyAdmin();
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'] ?? null;
    if (!$id) { http_response_code(400); echo json_encode(['error' => 'Campaign ID required']); exit(); }
    
    $fields = [];
    $params = [];
    foreach (['name', 'subject', 'body', 'type', 'status'] as $f) {
        if (isset($data[$f])) { $fields[] = "$f = ?"; $params[] = $data[$f]; }
    }
    if (empty($fields)) { http_response_code(400); echo json_encode(['error' => 'Nothing to update']); exit(); }
    $params[] = $id;
    $pdo->prepare("UPDATE email_campaigns SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);
    echo json_encode(['success' => true]);

} elseif ($method === 'DELETE') {
    // Admin: Delete campaign
    verifyAdmin();
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'] ?? null;
    if (!$id) { http_response_code(400); echo json_encode(['error' => 'Campaign ID required']); exit(); }
    $pdo->prepare("DELETE FROM email_campaigns WHERE id = ?")->execute([$id]);
    echo json_encode(['success' => true]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
}

?>
