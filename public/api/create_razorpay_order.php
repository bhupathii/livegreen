<?php
/**
 * Create Razorpay Order API Endpoint (SERVER-SIDE PRICE VALIDATION)
 * 
 * Modeled after Manscara's create-razorpay-order.php
 * Prices are fetched from the database, not trusted from client.
 * 
 * POST /api/create_razorpay_order.php
 * 
 * Request Body:
 * {
 *   "items": [{ "id": 1, "quantity": 2 }, ...],
 *   "promoCode": "SAVE20",  // Optional
 *   "customerInfo": {
 *     "name": "John Doe",
 *     "email": "john@example.com",
 *     "phone": "9999999999",
 *     "address": "123 Street",
 *     "city": "Mumbai",
 *     "state": "Maharashtra",
 *     "zip": "400001"
 *   }
 * }
 */

header('Content-Type: application/json');
require_once 'config.php';

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Get request body
$input = json_decode(file_get_contents('php://input'), true);

// Validate required fields
if (empty($input['items']) || !is_array($input['items'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Items array is required']);
    exit;
}

$items = $input['items'];
$promoCode = $input['promoCode'] ?? null;
$customerInfo = $input['customerInfo'] ?? [];
$currency = 'INR';

try {
    // STEP 1: Fetch product prices from database (SERVER-SIDE SOURCE OF TRUTH)
    $baseAmount = 0;
    $validatedItems = [];

    foreach ($items as $item) {
        $productId = $item['id'] ?? null;
        $quantity = intval($item['quantity'] ?? 1);

        if (!$productId || $quantity < 1 || $quantity > 50) {
            http_response_code(400);
            echo json_encode(['error' => "Invalid item: product ID {$productId}, quantity {$quantity}"]);
            exit;
        }

        $stmt = $pdo->prepare("SELECT id, name, price, stock FROM products WHERE id = ?");
        $stmt->execute([$productId]);
        $product = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$product) {
            http_response_code(404);
            echo json_encode(['error' => "Product not found: ID {$productId}"]);
            exit;
        }

        $itemTotal = intval($product['price']) * $quantity;
        $baseAmount += $itemTotal;

        $validatedItems[] = [
            'id' => $product['id'],
            'name' => $product['name'],
            'price' => intval($product['price']),
            'quantity' => $quantity,
            'subtotal' => $itemTotal
        ];
    }

    // STEP 2: Validate and apply promo code (SERVER-SIDE)
    $discount = 0;
    if ($promoCode) {
        $couponStmt = $pdo->prepare("
            SELECT * FROM promo_codes 
            WHERE code = ? 
            AND status = 'active'
            AND (expiryDate IS NULL OR expiryDate = '' OR expiryDate > NOW())
        ");
        $couponStmt->execute([strtoupper($promoCode)]);
        $coupon = $couponStmt->fetch(PDO::FETCH_ASSOC);

        if ($coupon) {
            // Check usage limits
            $totalLimit = intval($coupon['totalLimit'] ?? 0);
            $usedCount = intval($coupon['usedCount'] ?? 0);
            
            if ($totalLimit === 0 || $usedCount < $totalLimit) {
                // Check minimum spend
                $minSpend = intval($coupon['minSpend'] ?? 0);
                if ($baseAmount >= $minSpend) {
                    if ($coupon['discountType'] === 'fixed') {
                        $discount = intval($coupon['discountValue']);
                    } else { // percentage
                        $discount = intval(($baseAmount * intval($coupon['discountValue'])) / 100);
                    }
                    // Ensure discount doesn't exceed base amount
                    $discount = min($discount, $baseAmount);
                    error_log("✅ Promo '{$promoCode}' applied: -₹{$discount}");
                } else {
                    error_log("⚠️ Promo '{$promoCode}' requires min spend ₹{$minSpend}, cart is ₹{$baseAmount}");
                }
            } else {
                error_log("⚠️ Promo '{$promoCode}' usage limit reached");
            }
        } else {
            error_log("⚠️ Invalid or expired promo: {$promoCode}");
        }
    }

    // STEP 3: Calculate final amount
    $finalAmount = max(0, $baseAmount - $discount);
    $amountInPaise = intval($finalAmount * 100);

    // Validate minimum amount
    if ($amountInPaise < 100) {
        http_response_code(400);
        echo json_encode(['error' => 'Amount must be at least ₹1.00']);
        exit;
    }

    // STEP 4: Get Razorpay credentials from app_settings
    $rzpKeyStmt = $pdo->query("SELECT key_name, key_value FROM app_settings WHERE key_name IN ('razorpay_key', 'razorpay_secret')");
    $rzpSettings = [];
    foreach ($rzpKeyStmt->fetchAll() as $row) {
        $rzpSettings[$row['key_name']] = $row['key_value'];
    }

    $razorpayKeyId = $rzpSettings['razorpay_key'] ?? '';
    $razorpayKeySecret = $rzpSettings['razorpay_secret'] ?? '';

    if (empty($razorpayKeyId) || empty($razorpayKeySecret)) {
        error_log("❌ Razorpay credentials not configured in app_settings");
        http_response_code(500);
        echo json_encode(['error' => 'Payment gateway not configured']);
        exit;
    }

    // Build notes
    $notes = [
        'customer_name' => $customerInfo['name'] ?? '',
        'email' => $customerInfo['email'] ?? '',
        'phone' => $customerInfo['phone'] ?? '',
        'address' => $customerInfo['address'] ?? '',
        'city' => $customerInfo['city'] ?? '',
        'state' => $customerInfo['state'] ?? '',
        'zip' => $customerInfo['zip'] ?? '',
        'base_amount' => $baseAmount,
        'discount' => $discount,
        'final_amount' => $finalAmount
    ];
    if ($promoCode) {
        $notes['promo_code'] = $promoCode;
    }

    // STEP 5: Create Razorpay Order
    $orderData = [
        'amount' => $amountInPaise,
        'currency' => $currency,
        'notes' => $notes
    ];

    $url = 'https://api.razorpay.com/v1/orders';
    $auth = base64_encode($razorpayKeyId . ':' . $razorpayKeySecret);

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($orderData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Basic ' . $auth
    ]);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        error_log("❌ Razorpay CURL error: {$curlError}");
        http_response_code(500);
        echo json_encode(['error' => 'Payment gateway connection failed']);
        exit;
    }

    if ($httpCode === 200) {
        $order = json_decode($response, true);

        error_log("✅ Razorpay Order Created: ID={$order['id']}, Base=₹{$baseAmount}, Discount=₹{$discount}, Final=₹{$finalAmount}");

        echo json_encode([
            'success' => true,
            'order_id' => $order['id'],
            'amount' => $amountInPaise,
            'currency' => $currency,
            'razorpay_key' => $razorpayKeyId,
            'final_amount' => $finalAmount,
            'discount' => $discount,
            'items' => $validatedItems
        ]);
    } else {
        error_log("❌ Razorpay Order Creation Failed: HTTP {$httpCode} - {$response}");
        http_response_code(500);

        $errorData = json_decode($response, true);
        echo json_encode([
            'error' => 'Failed to create payment order',
            'details' => $errorData['error']['description'] ?? 'Unknown error'
        ]);
    }

} catch (Exception $e) {
    error_log("❌ Exception during Razorpay order creation: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Server error',
        'message' => $e->getMessage()
    ]);
}
?>
