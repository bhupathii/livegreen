<?php
require_once 'config.php';
require_once 'mailer.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$pathInfo = isset($_SERVER['PATH_INFO']) ? explode('/', trim($_SERVER['PATH_INFO'], '/')) : [];
$id = isset($pathInfo[0]) ? $pathInfo[0] : null;

if ($method === 'GET') {
    $contact = $_GET['contact'] ?? null;
    $orderIdParam = $_GET['orderId'] ?? null;
    
    // Ensure subscriptions table exists to prevent 500 errors on first load
    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS subscriptions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id VARCHAR(50) NOT NULL,
            customer_name VARCHAR(255) NOT NULL,
            customer_email VARCHAR(255) NOT NULL,
            product_id INT NOT NULL,
            product_name VARCHAR(255) NOT NULL,
            frequency VARCHAR(50) NOT NULL,
            amount INT NOT NULL,
            status VARCHAR(50) DEFAULT 'active',
            next_billing_date DATE NOT NULL,
            last_billing_date DATE DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )");
    } catch (Exception $e) {
        error_log("Subscription table check failed: " . $e->getMessage());
    }

    try {
        if ($contact && $orderIdParam) {
            // Secure access for chatbot: verify Order ID + Email/Phone
            $stmt = $pdo->prepare("
                SELECT s.* 
                FROM subscriptions s 
                JOIN orders o ON s.order_id = o.id 
                WHERE s.order_id = ? 
                AND (s.customer_email = ? OR o.phone = ?)
                ORDER BY s.created_at DESC
            ");
            $stmt->execute([$orderIdParam, $contact, $contact]);
            echo json_encode($stmt->fetchAll());
        } elseif ($id) {
            verifyAdmin();
            $stmt = $pdo->prepare("SELECT * FROM subscriptions WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode($stmt->fetch());
        } else {
            verifyAdmin();
            $stmt = $pdo->query("SELECT * FROM subscriptions ORDER BY created_at DESC");
            echo json_encode($stmt->fetchAll());
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }

} elseif ($method === 'POST') {
    // Both form-data and JSON input support
    $data = json_decode(file_get_contents('php://input'), true);
    $subscriptionId = $data['subscriptionId'] ?? null;
    $action = $data['action'] ?? null;
    $orderId = $data['orderId'] ?? null;
    $contact = $data['contact'] ?? null; // Can be email or phone
    $frequency = $data['frequency'] ?? null;

    if ($subscriptionId && $action && $orderId && $contact) {
        try {
            // Secure Verification: Check that the provided orderId and contact match the subscription & original order
            $verifyStmt = $pdo->prepare("
                SELECT s.id 
                FROM subscriptions s 
                JOIN orders o ON s.order_id = o.id 
                WHERE s.id = ? AND s.order_id = ? AND (s.customer_email = ? OR o.phone = ?)
            ");
            $verifyStmt->execute([$subscriptionId, $orderId, $contact, $contact]);
            if (!$verifyStmt->fetch()) {
                http_response_code(403);
                echo json_encode(['success' => false, 'error' => 'Unauthorized: Invalid Order ID or Contact details.']);
                exit();
            }

            if (in_array($action, ['pause', 'resume', 'cancel'])) {
                $newStatus = ($action === 'pause') ? 'paused' : (($action === 'resume') ? 'active' : 'cancelled');
                $stmt = $pdo->prepare("UPDATE subscriptions SET status = ? WHERE id = ?");
                $stmt->execute([$newStatus, $subscriptionId]);
                echo json_encode(['success' => true, 'message' => "Subscription $action" . "d successfully."]);
                exit();
            } elseif ($action === 'change_frequency' && $frequency) {
                // Determine new next_billing_date based on frequency
                $stmt = $pdo->prepare("UPDATE subscriptions SET frequency = ? WHERE id = ?");
                $stmt->execute([$frequency, $subscriptionId]);
                echo json_encode(['success' => true, 'message' => "Subscription frequency updated to $frequency."]);
                exit();
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
            exit();
        }
    }

    // Cancellation via orderId (backward compatibility)
    if ($orderId && $action === 'cancel' && !$subscriptionId) {
        try {
            $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ?");
            $stmt->execute([$orderId]);
            $order = $stmt->fetch();

            if (!$order) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Order not found.']);
                exit();
            }

            $subStmt = $pdo->prepare("UPDATE subscriptions SET status = 'cancelled' WHERE order_id = ? AND status != 'cancelled'");
            $subStmt->execute([$orderId]);

            echo json_encode(['success' => true, 'message' => 'Subscription cancelled successfully.']);
            exit();
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
            exit();
        }
    }

    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid request parameters.']);
    exit();

}
 elseif ($method === 'PUT') {
    verifyAdmin();
    // PUT /api/subscriptions.php/ID/status
    if (!$id || !isset($pathInfo[1]) || $pathInfo[1] !== 'status') {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid endpoint']);
        exit();
    }
    
    $data = json_decode(file_get_contents("php://input"), true);
    $status = $data['status'] ?? null;

    if (!$status) {
        http_response_code(400);
        echo json_encode(['error' => 'Status is required']);
        exit();
    }

    try {
        $stmt = $pdo->prepare("UPDATE subscriptions SET status = ? WHERE id = ?");
        $stmt->execute([$status, $id]);
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
