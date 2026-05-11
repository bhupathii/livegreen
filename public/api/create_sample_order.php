<?php
/**
 * Script to create a real sample order and trigger iCarry shipment booking.
 * Usage: php create_sample_order.php
 */

require_once 'config.php';
require_once 'icarry.php';
require_once 'mailer.php';

// Sample Data
$orderId = "ORD-" . date('YmdHis') . "-" . rand(1000, 9999);
$email = "unknown84502@gmail.com";
$customerName = "Test User";
$phone = "8309554288";
$address = "13-6-3/1 RAMA CHANDRA RAO PETA, OPP : CHINNA VANTENA STREET, ELURU ROAD, TADEPALLIGUDEM TADEPALLIGUDEM WEST GODAVARI DISTRICT ANDHRA PRADESH";
$city = "TADEPALLIGUDEM";
$state = "ANDHRA PRADESH";
$zip = "534102";
$paymentMethod = "COD";
$date = date('Y-m-d H:i:s');

$items = [
    [
        'id' => 1,
        'name' => 'Sample Green Honey',
        'price' => 500,
        'quantity' => 1,
        'weight' => 500
    ]
];
$totalAmount = 500;

echo "--- STEP 1: Creating Order $orderId ---\n";

try {
    $pdo->beginTransaction();

    // 1. Create Customer
    $stmt = $pdo->prepare("SELECT * FROM customers WHERE email = ?");
    $stmt->execute([$email]);
    if (!$stmt->fetch()) {
        $insertCust = $pdo->prepare("INSERT INTO customers (name, email, phone, totalSpent, ordersCount, joinDate) VALUES (?, ?, ?, ?, ?, ?)");
        $insertCust->execute([$customerName, $email, $phone, $totalAmount, 1, $date]);
    } else {
        $updateCust = $pdo->prepare("UPDATE customers SET totalSpent = totalSpent + ?, ordersCount = ordersCount + 1 WHERE email = ?");
        $updateCust->execute([$totalAmount, $email]);
    }

    // 2. Insert Order
    $orderStmt = $pdo->prepare("INSERT INTO `orders` (`id`, `customerName`, `email`, `phone`, `address`, `city`, `state`, `zip`, `items`, `totalAmount`, `paymentMethod`, `status`, `date`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $orderStmt->execute([
        $orderId, $customerName, $email, $phone, $address, $city, $state, $zip, 
        json_encode($items), $totalAmount, $paymentMethod, 'pending', $date
    ]);

    $pdo->commit();
    echo "✔ Order created successfully in DB.\n";

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    die("✘ Error creating order: " . $e->getMessage() . "\n");
}

echo "\n--- STEP 2: Booking Real Shipment via iCarry ---\n";

try {
    // Re-fetch order for booking
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ?");
    $stmt->execute([$orderId]);
    $order = $stmt->fetch();
    
    // Add state code needed for iCarry
    $order['state_code'] = 'AP';

    $result = book_shipment($order, $items);
    
    if (isset($result['shipment_id'])) {
        echo "✅ Real Shipment booked successfully!\n";
        echo "   Shipment ID: " . $result['shipment_id'] . "\n";
        echo "   AWB: " . $result['awb'] . "\n";
        echo "   Tracking URL: " . $result['tracking_url'] . "\n";
        
        $trackingInfo = [
            'awb' => $result['awb'],
            'url' => $result['tracking_url']
        ];

        // Update status to shipped
        $pdo->prepare("UPDATE orders SET status = 'shipped' WHERE id = ?")->execute([$orderId]);

        echo "\n--- STEP 3: Sending Shipping Email ---\n";
        $mailSent = sendOrderStatusUpdate(
            $email,
            $customerName,
            $orderId,
            'shipped',
            $items,
            $totalAmount,
            $trackingInfo
        );

        if ($mailSent) {
            echo "✅ Shipping email sent to $email!\n";
        } else {
            echo "❌ Mail sending failed.\n";
        }
    } else {
        echo "❌ iCarry booking failed: " . json_encode($result) . "\n";
    }

} catch (Exception $e) {
    echo "✘ Error in shipment/email: " . $e->getMessage() . "\n";
}

echo "\n--- SUMMARY ---\n";
echo "Order ID: $orderId\n";
echo "Email: $email\n";
echo "Test this Order ID in the chatbot to verify real tracking display.\n";
