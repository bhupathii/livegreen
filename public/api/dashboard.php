<?php
require_once 'config.php';

header('Content-Type: application/json');
verifyAdmin();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT SUM(totalAmount) as total FROM orders WHERE status != 'cancelled'");
    $revRow = $stmt->fetch();
    
    $stmt = $pdo->query("SELECT count(*) as count FROM orders");
    $ordRow = $stmt->fetch();
    
    $stmt = $pdo->query("SELECT count(*) as count FROM customers");
    $custRow = $stmt->fetch();
    
    $stmt = $pdo->query("SELECT count(*) as count FROM inquiries WHERE status = 'unread'");
    $inqRow = $stmt->fetch();
    
    $stmt = $pdo->query("SELECT count(*) as count FROM reviews WHERE status = 'pending'");
    $revwRow = $stmt->fetch();
    
    $stmt = $pdo->query("SELECT * FROM orders ORDER BY date DESC LIMIT 5");
    $recentOrders = $stmt->fetchAll();
    foreach ($recentOrders as &$o) {
        $o['items'] = json_decode($o['items'] ?: "[]", true);
    }
    
    echo json_encode([
        'totalRevenue' => $revRow['total'] ? (float)$revRow['total'] : 0,
        'totalOrders' => (int)$ordRow['count'],
        'totalCustomers' => (int)$custRow['count'],
        'unreadInquiries' => (int)$inqRow['count'],
        'pendingReviews' => (int)$revwRow['count'],
        'recentOrders' => $recentOrders
    ]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
}
?>
