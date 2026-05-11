<?php
/**
 * Admin Notifications API
 * Provides real-time notification data for the admin panel.
 */
require_once 'config.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

// Auto-create table
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS admin_notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        entity_type VARCHAR(50),
        entity_id VARCHAR(100),
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
} catch (Exception $e) {}

if ($method === 'GET') {
    verifyAdmin();
    
    $unreadOnly = isset($_GET['unread']);
    $limit = isset($_GET['limit']) ? min(50, max(5, (int)$_GET['limit'])) : 20;
    
    // Generate real-time notifications from DB state
    $notifications = [];
    
    // Pending orders count
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as c FROM orders WHERE status = 'pending'");
        $pending = (int)$stmt->fetch()['c'];
        if ($pending > 0) {
            $notifications[] = [
                'id' => 'pending_orders',
                'type' => 'order',
                'title' => "$pending pending orders",
                'message' => "You have $pending orders waiting to be processed.",
                'is_read' => 0,
                'created_at' => date('c'),
                'priority' => 'high'
            ];
        }
    } catch (Exception $e) {}
    
    // Low stock products (< 10)
    try {
        $stmt = $pdo->query("SELECT id, name, stock FROM products WHERE stock < 10 AND stock > 0");
        $lowStock = $stmt->fetchAll();
        if (count($lowStock) > 0) {
            $names = array_map(function($p) { return $p['name'] . ' (' . $p['stock'] . ')'; }, $lowStock);
            $notifications[] = [
                'id' => 'low_stock',
                'type' => 'stock',
                'title' => count($lowStock) . " products low on stock",
                'message' => implode(', ', $names),
                'is_read' => 0,
                'created_at' => date('c'),
                'priority' => 'high'
            ];
        }
    } catch (Exception $e) {}
    
    // Out of stock products
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as c FROM products WHERE stock = 0");
        $oos = (int)$stmt->fetch()['c'];
        if ($oos > 0) {
            $notifications[] = [
                'id' => 'out_of_stock',
                'type' => 'stock',
                'title' => "$oos products out of stock",
                'message' => "These products cannot be ordered until restocked.",
                'is_read' => 0,
                'created_at' => date('c'),
                'priority' => 'critical'
            ];
        }
    } catch (Exception $e) {}
    
    // Unread inquiries
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as c FROM inquiries WHERE status IS NULL OR status = 'new'");
        $unreadInq = (int)$stmt->fetch()['c'];
        if ($unreadInq > 0) {
            $notifications[] = [
                'id' => 'unread_inquiries',
                'type' => 'inquiry',
                'title' => "$unreadInq unread inquiries",
                'message' => "Customer inquiries need your attention.",
                'is_read' => 0,
                'created_at' => date('c'),
                'priority' => 'medium'
            ];
        }
    } catch (Exception $e) {}
    
    // Recent orders (last 24 hrs)
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as c FROM orders WHERE date >= DATE_SUB(NOW(), INTERVAL 24 HOUR)");
        $recent = (int)$stmt->fetch()['c'];
        if ($recent > 0) {
            $notifications[] = [
                'id' => 'recent_orders',
                'type' => 'info',
                'title' => "$recent orders in last 24 hours",
                'message' => "Your store received $recent new orders today.",
                'is_read' => 1,
                'created_at' => date('c'),
                'priority' => 'low'
            ];
        }
    } catch (Exception $e) {}
    
    // Stored notifications
    try {
        $where = $unreadOnly ? " WHERE is_read = 0" : "";
        $stmt = $pdo->query("SELECT * FROM admin_notifications $where ORDER BY created_at DESC LIMIT $limit");
        $stored = $stmt->fetchAll();
        $notifications = array_merge($notifications, $stored);
    } catch (Exception $e) {}
    
    $unreadCount = count(array_filter($notifications, function($n) { return !$n['is_read']; }));
    
    echo json_encode([
        'notifications' => array_slice($notifications, 0, $limit),
        'unreadCount' => $unreadCount
    ]);

} elseif ($method === 'PUT') {
    verifyAdmin();
    // Mark all as read or specific one
    $data = json_decode(file_get_contents("php://input"), true);
    if (isset($data['markAllRead']) && $data['markAllRead']) {
        $pdo->exec("UPDATE admin_notifications SET is_read = 1");
    } elseif (isset($data['id'])) {
        $stmt = $pdo->prepare("UPDATE admin_notifications SET is_read = 1 WHERE id = ?");
        $stmt->execute([$data['id']]);
    }
    echo json_encode(['success' => true]);

} elseif ($method === 'POST') {
    // Create a notification (internal use)
    $data = json_decode(file_get_contents("php://input"), true);
    $stmt = $pdo->prepare("INSERT INTO admin_notifications (type, title, message, entity_type, entity_id) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([
        $data['type'] ?? 'info', $data['title'] ?? '', $data['message'] ?? '',
        $data['entity_type'] ?? null, $data['entity_id'] ?? null
    ]);
    echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
}
?>
