<?php
require_once 'config.php';
require_once 'mailer.php';

// This script should be run daily via a cron job
// For manual testing, access it via browser or CLI
/**
 * CRON JOB SETUP INSTRUCTIONS (HOSTINGER):
 * 1. Go to your Hostinger hPanel -> Advanced -> Cron Jobs
 * 2. Set the frequency to Once a day (e.g., 00:00)
 * 3. Command type: wget
 * 4. Command to run:
 *    wget -q -O /dev/null "https://livegreenhoney.com/api/cron_subscriptions.php"
 * 
 * NOTE: Ensure the URL matches your actual live production domain.
 */

header('Content-Type: application/json');

try {
    // Find all active subscriptions due for billing today or earlier
    $today = date('Y-m-d');
    $stmt = $pdo->prepare("SELECT * FROM subscriptions WHERE status = 'active' AND next_billing_date <= ?");
    $stmt->execute([$today]);
    $subscriptions = $stmt->fetchAll();

    $processedCount = 0;
    foreach ($subscriptions as $sub) {
        // Start transaction for each subscription to ensure data integrity
        $pdo->beginTransaction();

        try {
            // Get original order details to copy customer information
            $origOrderStmt = $pdo->prepare("SELECT * FROM orders WHERE id = ?");
            $origOrderStmt->execute([$sub['order_id']]);
            $origOrder = $origOrderStmt->fetch();

            if (!$origOrder) {
                throw new Exception("Original order {$sub['order_id']} not found.");
            }

            // Generate new Order ID (Recurring)
            $newOrderId = 'SUB-' . time() . '-' . mt_rand(1000, 9999);
            
            // Prepare items (only the subscribed item)
            $items = [[
                'id' => $sub['product_id'],
                'name' => $sub['product_name'],
                'price' => $sub['amount'],
                'quantity' => 1, // Assuming 1 for simplicity, can be expanded
                'isSubscription' => true,
                'frequency' => $sub['frequency']
            ]];

            // Create new order
            $orderStmt = $pdo->prepare("INSERT INTO orders (id, customerName, email, phone, address, city, state, zip, items, totalAmount, paymentMethod, paymentId, status, is_subscription, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $orderStmt->execute([
                $newOrderId, 
                $origOrder['customerName'], 
                $origOrder['email'], 
                $origOrder['phone'], 
                $origOrder['address'], 
                $origOrder['city'], 
                $origOrder['state'], 
                $origOrder['zip'], 
                json_encode($items), 
                $sub['amount'], 
                'Subscription', 
                'RECURRING-' . $sub['id'], 
                'processing', 
                1, 
                date('Y-m-d H:i:s')
            ]);

            // Update subscription schedule
            $frequency = $sub['frequency'];
            $nextBillingDate = date('Y-m-d', strtotime('+1 month', strtotime($sub['next_billing_date'])));
            if ($frequency === 'Daily') $nextBillingDate = date('Y-m-d', strtotime('+1 day', strtotime($sub['next_billing_date'])));
            elseif ($frequency === 'Weekly') $nextBillingDate = date('Y-m-d', strtotime('+1 week', strtotime($sub['next_billing_date'])));
            elseif ($frequency === 'Every 2 Weeks') $nextBillingDate = date('Y-m-d', strtotime('+2 weeks', strtotime($sub['next_billing_date'])));
            elseif ($frequency === 'Every 2 Months') $nextBillingDate = date('Y-m-d', strtotime('+2 months', strtotime($sub['next_billing_date'])));
            elseif ($frequency === 'Quarterly') $nextBillingDate = date('Y-m-d', strtotime('+3 months', strtotime($sub['next_billing_date'])));

            $updateSub = $pdo->prepare("UPDATE subscriptions SET last_billing_date = ?, next_billing_date = ? WHERE id = ?");
            $updateSub->execute([$sub['next_billing_date'], $nextBillingDate, $sub['id']]);

            $pdo->commit();

            // Send confirmation email for the recurring delivery
            try {
                sendOrderConfirmation(
                    $origOrder['email'], 
                    $origOrder['customerName'], 
                    $newOrderId, 
                    $items, 
                    $sub['amount'], 
                    'Recurring Subscription', 
                    $origOrder['address'], 
                    $origOrder['city'], 
                    $origOrder['state'], 
                    $origOrder['zip']
                );
            } catch (Exception $e) {
                error_log("Failed to send subscription confirmation email: " . $e->getMessage());
            }

            $processedCount++;

        } catch (Exception $e) {
            $pdo->rollBack();
            error_log("Failed to process subscription ID {$sub['id']}: " . $e->getMessage());
        }
    }

    echo json_encode([
        'success' => true, 
        'message' => "Processed $processedCount subscription renewals.",
        'date' => $today
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
