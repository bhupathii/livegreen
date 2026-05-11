<?php
require_once 'config.php';
require_once 'mailer.php';
require_once 'rate_limiter.php';
require_once 'audit_log.php';
require_once 'icarry.php';


header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$pathInfo = isset($_SERVER['PATH_INFO']) ? explode('/', trim($_SERVER['PATH_INFO'], '/')) : [];
$id = isset($pathInfo[0]) ? $pathInfo[0] : null; // Can be string for orders

if ($method === 'GET') {
    verifyAdmin();
    
    // Sync live iCarry status (with 5-min cooldown handled inside)
    try {
        sync_icarry_orders();
    } catch (Exception $e) {
        error_log("iCarry sync failed: " . $e->getMessage());
    }

    $stmt = $pdo->query("SELECT *, icarry_awb, icarry_tracking_url FROM orders ORDER BY date DESC");
    $orders = $stmt->fetchAll();
    foreach ($orders as &$o) {
        $o['items'] = json_decode($o['items'] ?: "[]", true);
    }
    echo json_encode($orders);

} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Required fields mapping
    $id = $data['id'] ?? null;
    $customerName = $data['customerName'] ?? null;
    $email = $data['email'] ?? null;
    $phone = $data['phone'] ?? null;
    $address = $data['address'] ?? null;
    $city = $data['city'] ?? null;
    $state = $data['state'] ?? null;
    $zip = $data['zip'] ?? null;
    $items = $data['items'] ?? [];
    $totalAmount = (int)round($data['totalAmount'] ?? 0);
    $paymentMethod = $data['paymentMethod'] ?? null;
    $paymentId = $data['paymentId'] ?? null;
    $isSubscriptionOrder = isset($data['isSubscription']) && $data['isSubscription'] ? 1 : 0;
    $date = $data['date'] ?? null;

    if (!$id || !$email) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        exit();
    }

    // Ensure is_subscription column exists (DDL outside transaction to avoid implicit commits)
    try {
        $checkCol = $pdo->query("SHOW COLUMNS FROM orders LIKE 'is_subscription'");
        if (!$checkCol->fetch()) {
            $pdo->exec("ALTER TABLE orders ADD COLUMN is_subscription TINYINT(1) DEFAULT 0");
        }
    } catch (Exception $e) {
        error_log("Migration failed: " . $e->getMessage());
    }

    // Ensure subscriptions table exists (DDL outside transaction to avoid implicit commits)
    if ($isSubscriptionOrder) {
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
            error_log("Subscription table migration failed: " . $e->getMessage());
        }
    }

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare("SELECT * FROM customers WHERE email = ?");
        $stmt->execute([$email]);
        $existingCust = $stmt->fetch();
        $isNewCustomer = !$existingCust;

        if ($existingCust) {
            $updateCust = $pdo->prepare("UPDATE customers SET totalSpent = totalSpent + ?, ordersCount = ordersCount + 1 WHERE email = ?");
            $updateCust->execute([$totalAmount, $email]);
        } else {
            $insertCust = $pdo->prepare("INSERT INTO customers (name, email, phone, totalSpent, ordersCount, joinDate) VALUES (?, ?, ?, ?, ?, ?)");
            $insertCust->execute([$customerName, $email, $phone, $totalAmount, 1, $date]);
        }

        $stockStmt = $pdo->prepare("UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?");
        foreach ($items as $item) {
            $stockStmt->execute([$item['quantity'], $item['id']]);
        }

        $orderStmt = $pdo->prepare("INSERT INTO `orders` (`id`, `customerName`, `email`, `phone`, `address`, `city`, `state`, `zip`, `items`, `totalAmount`, `paymentMethod`, `paymentId`, `status`, `is_subscription`, `date`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $orderStmt->execute([
            $id, $customerName, $email, $phone, $address, $city, $state, $zip, 
            json_encode($items, JSON_UNESCAPED_UNICODE), $totalAmount, $paymentMethod, $paymentId, 'pending', $isSubscriptionOrder, $date
        ]);

        // If it's a subscription order, add to the subscriptions table
        if ($isSubscriptionOrder) {
            $subStmt = $pdo->prepare("INSERT INTO subscriptions (order_id, customer_name, customer_email, product_id, product_name, frequency, amount, status, next_billing_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($items as $item) {
                if (isset($item['isSubscription']) && $item['isSubscription']) {
                    $frequency = $item['frequency'] ?? 'Monthly';
                    $nextBillingDate = date('Y-m-d', strtotime('+1 month')); // Default to 1 month
                    if ($frequency === 'Daily') $nextBillingDate = date('Y-m-d', strtotime('+1 day'));
                    elseif ($frequency === 'Weekly') $nextBillingDate = date('Y-m-d', strtotime('+1 week'));
                    elseif ($frequency === 'Every 2 Weeks') $nextBillingDate = date('Y-m-d', strtotime('+2 weeks'));
                    elseif ($frequency === 'Every 2 Months') $nextBillingDate = date('Y-m-d', strtotime('+2 months'));
                    elseif ($frequency === 'Quarterly') $nextBillingDate = date('Y-m-d', strtotime('+3 months'));

                    $subStmt->execute([
                        $id, $customerName, $email, $item['id'], $item['name'], $frequency, $item['price'], 'active', $nextBillingDate
                    ]);
                }
            }
        }

        $pdo->commit();

        // --- iCarry Shipment Booking (Auto-book immediately like Manscara) ---
        $trackingInfo = [];
        $icarryError = null;
        try {
            if (!empty($zip)) {
                $orderForShipment = [
                    'id' => $id,
                    'customerName' => $customerName,
                    'phone' => $phone,
                    'address' => $address,
                    'city' => $city,
                    'state' => $state ?? '',
                    'zip' => $zip,
                    'totalAmount' => $totalAmount,
                    'paymentMethod' => $paymentMethod
                ];
                $shipmentResult = book_shipment($orderForShipment, $items);
                if (isset($shipmentResult['shipment_id'])) {
                    error_log("✅ iCarry shipment auto-booked for order {$id}: " . $shipmentResult['shipment_id']);
                    $trackingInfo = [
                        'awb' => $shipmentResult['awb'] ?? '',
                        'tracking_url' => $shipmentResult['tracking_url'] ?? '',
                        'courier_name' => $shipmentResult['courier_name'] ?? ''
                    ];
                } else {
                    $icarryError = $shipmentResult['error'] ?? 'Unknown error';
                    error_log("⚠️ iCarry shipment booking returned no shipment_id for order {$id}: " . json_encode($shipmentResult));
                }
            }
        } catch (Exception $icarryErr) {
            $icarryError = $icarryErr->getMessage();
            error_log("iCarry auto-booking failed for order {$id}: " . $icarryErr->getMessage());
        }

        // Record Promo Code Usage if applicable
        if (isset($data['promoCodeId']) && $data['promoCodeId']) {
            try {
                $usageStmt = $pdo->prepare("INSERT INTO promo_code_usage (promo_code_id, email, phone) VALUES (?, ?, ?)");
                $usageStmt->execute([$data['promoCodeId'], $email, $phone]);

                $updatePromo = $pdo->prepare("UPDATE promo_codes SET usedCount = usedCount + 1 WHERE id = ?");
                $updatePromo->execute([$data['promoCodeId']]);
            } catch (Exception $e) {
                error_log("Failed to record promo usage: " . $e->getMessage());
            }
        }

        // Send emails (non-blocking — errors logged but don't fail the order)
        try {
            // Send welcome email for first-time customers
            if ($isNewCustomer) {
                sendWelcomeEmail($email, $customerName);
            }
            // Send order confirmation with tracking info
            sendOrderConfirmation($email, $customerName, $id, $items, $totalAmount, $paymentMethod, $address, $city, $state, $zip, $trackingInfo);
        } catch (Exception $emailErr) {
            error_log("Email send failed for order {$id}: " . $emailErr->getMessage());
        }

        echo json_encode([
            'success' => true, 
            'orderId' => $id,
            'icarry_booked' => empty($icarryError),
            'icarry_error' => $icarryError
        ]);

    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(500);
        echo json_encode(['error' => 'Failed to process order', 'details' => $e->getMessage()]);
    }

} elseif ($method === 'PUT') {
    verifyAdmin();
    // PUT /api/orders.php/ORDER_ID/status
    if (!$id || !isset($pathInfo[1]) || $pathInfo[1] !== 'status') {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid endpoint']);
        exit();
    }
    
    $data = json_decode(file_get_contents("php://input"), true);
    $status = $data['status'] ?? null;

    // Fetch order details for the email
    $orderStmt = $pdo->prepare("SELECT * FROM orders WHERE id = ?");
    $orderStmt->execute([$id]);
    $order = $orderStmt->fetch();

    $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
    $stmt->execute([$status, $id]);

    // Handle iCarry booking if status changed to 'processing'
    if ($status === 'processing') {
        try {
            if ($order && empty($order['icarry_shipment_id'])) {
                $items = json_decode($order['items'] ?: '[]', true);
                book_shipment($order, $items);
                // Re-fetch order to get updated icarry info
                $orderStmt->execute([$id]);
                $order = $orderStmt->fetch();
            }
        } catch (Exception $e) {
            error_log("iCarry booking failed for order {$id}: " . $e->getMessage());
        }
    }

    // Send status update email
    if ($order && $order['email'] && $status) {
        try {
            $items = json_decode($order['items'] ?: '[]', true);
            sendOrderStatusUpdate(
                $order['email'],
                $order['customerName'],
                $id,
                $status,
                $items,
                $order['totalAmount'],
                [
                    'awb' => $order['icarry_awb'] ?? null,
                    'url' => $order['icarry_tracking_url'] ?? null
                ]
            );
        } catch (Exception $emailErr) {
            error_log("Status email failed for order {$id}: " . $emailErr->getMessage());
        }
    }
    
    echo json_encode(['success' => true]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
}
?>
