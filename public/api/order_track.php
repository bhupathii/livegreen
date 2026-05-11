<?php
require_once 'config.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $orderId = trim($data['orderId'] ?? '');
    $email = trim($data['email'] ?? '');

    // Lookup by Order ID
    if ($orderId) {
        $stmt = $pdo->prepare("SELECT id, customerName, status, date, items, totalAmount, city, state, icarry_shipment_id, icarry_awb, icarry_tracking_url, icarry_status FROM orders WHERE id = ?");
        $stmt->execute([$orderId]);
        $order = $stmt->fetch();

        if (!$order) {
            http_response_code(404);
            echo json_encode(['error' => 'Order not found. Please check your Order ID and try again.']);
            exit();
        }

        // Fetch live iCarry tracking if shipment exists
        $liveTracking = null;
        if (!empty($order['icarry_shipment_id']) || !empty($order['icarry_awb'])) {
            // Pre-fill with DB values as fallback in case API errors out (e.g. 'Awb not found' shortly after booking)
            $liveTracking = [
                'awb' => $order['icarry_awb'] ?? '',
                'tracking_url' => $order['icarry_tracking_url'] ?? '',
                'current_status' => $order['icarry_status'] ?: 'Pending',
                'courier_name' => '',
                'eta_datetime' => '',
                'picked_datetime' => '',
                'delivered_datetime' => '',
                'milestones' => []
            ];

            if (!empty($order['icarry_shipment_id'])) {
                require_once 'icarry.php';
                $trackRes = icarry_call('api_track_shipment', ['shipment_id' => $order['icarry_shipment_id']]);
                
                if (isset($trackRes['success']) && $trackRes['success'] == 1) {
                    $icarryStatus = $trackRes['status'] ?? $order['icarry_status'];
                    
                    // Update local DB to stay in sync
                    $upd = $pdo->prepare("UPDATE orders SET icarry_status = ? WHERE id = ?");
                    $upd->execute([$icarryStatus, $order['id']]);
                    $order['icarry_status'] = $icarryStatus;
    
                    // Sync main order status based on iCarry status
                $cleanStatus = strtoupper(trim($icarryStatus));
                if ($cleanStatus === 'DELIVERED') {
                    $pdo->prepare("UPDATE orders SET status = 'delivered' WHERE id = ?")->execute([$order['id']]);
                    $order['status'] = 'delivered';
                } elseif (strpos($cleanStatus, 'OUT FOR DELIVERY') !== false) {
                    $pdo->prepare("UPDATE orders SET status = 'out_for_delivery' WHERE id = ?")->execute([$order['id']]);
                    $order['status'] = 'out_for_delivery';
                } elseif (in_array($cleanStatus, ['SHIPPED', 'IN TRANSIT', 'CONNECTED TO DESTINATION'])) {
                    $pdo->prepare("UPDATE orders SET status = 'shipped' WHERE id = ?")->execute([$order['id']]);
                    $order['status'] = 'shipped';
                } elseif (in_array($cleanStatus, ['MANIFESTED', 'PICKED UP', 'PROCESSING'])) {
                    $pdo->prepare("UPDATE orders SET status = 'processing' WHERE id = ?")->execute([$order['id']]);
                    $order['status'] = 'processing';
                } elseif (in_array($cleanStatus, ['CANCELLED', 'CAN', 'CANCELED', 'VOIDED'])) {
                    $pdo->prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?")->execute([$order['id']]);
                    $order['status'] = 'cancelled';
                }
    
                    // Build live tracking milestones from iCarry's 'details' array
                    $milestones = [];
                    if (!empty($trackRes['details']) && is_array($trackRes['details'])) {
                        foreach ($trackRes['details'] as $event) {
                            $milestones[] = [
                                'datetime' => $event['datetime'] ?? '',
                                'location' => $event['location'] ?? '',
                                'notes' => $event['notes'] ?? ''
                            ];
                        }
                    }
    
                    $liveTracking['current_status'] = $icarryStatus;
                    $liveTracking['courier_name'] = $trackRes['courier_name'] ?? '';
                    $liveTracking['eta_datetime'] = $trackRes['eta_datetime'] ?? '';
                    $liveTracking['picked_datetime'] = $trackRes['picked_datetime'] ?? '';
                    $liveTracking['delivered_datetime'] = $trackRes['delivered_datetime'] ?? '';
                    $liveTracking['milestones'] = $milestones;
                }
            }
        }

        $items = json_decode($order['items'] ?: '[]', true);
        $safeItems = array_map(function($item) {
            return [
                'name' => $item['name'] ?? 'Product',
                'quantity' => $item['quantity'] ?? 1,
                'price' => $item['price'] ?? 0,
                'image' => $item['image'] ?? '',
            ];
        }, $items);

        echo json_encode([
            'success' => true,
            'order' => [
                'id' => $order['id'],
                'customerName' => $order['customerName'],
                'status' => $order['status'],
                'date' => $order['date'],
                'items' => $safeItems,
                'totalAmount' => $order['totalAmount'],
                'city' => $order['city'],
                'state' => $order['state'],
                'tracking' => $liveTracking
            ]
        ]);
        exit();
    }

    // Lookup by Email — returns all orders for that email
    if ($email) {
        $stmt = $pdo->prepare("SELECT id, customerName, status, date, items, totalAmount, city, state FROM orders WHERE email = ? ORDER BY date DESC LIMIT 10");
        $stmt->execute([$email]);
        $orders = $stmt->fetchAll();

        if (empty($orders)) {
            http_response_code(404);
            echo json_encode(['error' => 'No orders found for this email address.']);
            exit();
        }

        $safeOrders = array_map(function($order) {
            $items = json_decode($order['items'] ?: '[]', true);
            $safeItems = array_map(function($item) {
                return [
                    'name' => $item['name'] ?? 'Product',
                    'quantity' => $item['quantity'] ?? 1,
                    'price' => $item['price'] ?? 0,
                    'image' => $item['image'] ?? '',
                ];
            }, $items);

            return [
                'id' => $order['id'],
                'customerName' => $order['customerName'],
                'status' => $order['status'],
                'date' => $order['date'],
                'items' => $safeItems,
                'totalAmount' => $order['totalAmount'],
                'city' => $order['city'],
                'state' => $order['state'],
            ];
        }, $orders);

        echo json_encode([
            'success' => true,
            'orders' => $safeOrders,
        ]);
        exit();
    }

    http_response_code(400);
    echo json_encode(['error' => 'Please provide an Order ID or email address.']);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
}
?>
