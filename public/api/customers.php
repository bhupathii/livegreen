<?php
/**
 * Customers API with Segmentation Support
 */
require_once 'config.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$pathInfo = isset($_SERVER['PATH_INFO']) ? explode('/', trim($_SERVER['PATH_INFO'], '/')) : [];
$id = isset($pathInfo[0]) && is_numeric($pathInfo[0]) ? (int)$pathInfo[0] : null;

if ($method === 'GET') {
    verifyAdmin();
    
    if (isset($_GET['segments'])) {
        // Return customers with segmentation tags
        $customers = $pdo->query("SELECT *, 
            CASE 
                WHEN totalSpent >= 5000 THEN 'vip'
                WHEN totalSpent >= 2000 THEN 'high_value'
                WHEN ordersCount >= 3 THEN 'repeat'
                WHEN ordersCount = 1 THEN 'one_time'
                ELSE 'new'
            END as segment,
            CASE
                WHEN totalSpent >= 5000 THEN '💎 VIP'
                WHEN totalSpent >= 2000 THEN '⭐ High Value'
                WHEN ordersCount >= 3 THEN '🔄 Repeat'
                WHEN ordersCount = 1 THEN '🛍️ One-Time'
                ELSE '🆕 New'
            END as segmentLabel
            FROM customers ORDER BY totalSpent DESC")->fetchAll();
        
        // Calculate segment counts
        $segments = [
            'vip' => 0, 'high_value' => 0, 'repeat' => 0, 'one_time' => 0, 'new' => 0
        ];
        foreach ($customers as $c) {
            $seg = $c['segment'];
            if (isset($segments[$seg])) $segments[$seg]++;
        }
        
        echo json_encode([
            'customers' => $customers,
            'segments' => $segments,
            'total' => count($customers)
        ]);
    } else {
        $stmt = $pdo->query("SELECT * FROM customers ORDER BY totalSpent DESC");
        $customers = $stmt->fetchAll();
        echo json_encode($customers);
    }

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
}
?>
