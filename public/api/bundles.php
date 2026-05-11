<?php
/**
 * Product Bundles / Combos API
 * Manages bundle creation, retrieval, and combo pricing
 */
require_once 'config.php';

header('Content-Type: application/json');

// Auto-create tables
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS bundles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255),
        description TEXT,
        discount_percent DECIMAL(5,2) DEFAULT 0,
        discount_amount INT DEFAULT 0,
        image VARCHAR(500),
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    $pdo->exec("CREATE TABLE IF NOT EXISTS bundle_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bundle_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT DEFAULT 1,
        FOREIGN KEY (bundle_id) REFERENCES bundles(id) ON DELETE CASCADE
    )");
} catch (Exception $e) {}

$method = $_SERVER['REQUEST_METHOD'];
$pathInfo = isset($_SERVER['PATH_INFO']) ? explode('/', trim($_SERVER['PATH_INFO'], '/')) : [];
$bundleId = isset($pathInfo[0]) && is_numeric($pathInfo[0]) ? (int)$pathInfo[0] : null;

if ($method === 'GET') {
    if ($bundleId) {
        // Get single bundle with products
        $stmt = $pdo->prepare("SELECT * FROM bundles WHERE id = ?");
        $stmt->execute([$bundleId]);
        $bundle = $stmt->fetch();
        if (!$bundle) { http_response_code(404); echo json_encode(['error' => 'Not found']); exit(); }
        
        $itemStmt = $pdo->prepare("SELECT bi.*, p.name as product_name, p.price, p.image, p.stock 
            FROM bundle_items bi JOIN products p ON bi.product_id = p.id WHERE bi.bundle_id = ?");
        $itemStmt->execute([$bundleId]);
        $bundle['items'] = $itemStmt->fetchAll();
        
        $originalPrice = 0;
        foreach ($bundle['items'] as $item) {
            $originalPrice += $item['price'] * $item['quantity'];
        }
        $bundle['originalPrice'] = $originalPrice;
        $bundle['bundlePrice'] = $bundle['discount_percent'] > 0 
            ? round($originalPrice * (1 - $bundle['discount_percent'] / 100)) 
            : $originalPrice - $bundle['discount_amount'];
        $bundle['savings'] = $originalPrice - $bundle['bundlePrice'];
        
        echo json_encode($bundle);
    } else {
        // List all active bundles
        $activeOnly = !isset($_GET['all']);
        $query = $activeOnly ? "SELECT * FROM bundles WHERE is_active = 1 ORDER BY created_at DESC" : "SELECT * FROM bundles ORDER BY created_at DESC";
        $stmt = $pdo->query($query);
        $bundles = $stmt->fetchAll();
        
        foreach ($bundles as &$b) {
            $itemStmt = $pdo->prepare("SELECT bi.*, p.name as product_name, p.price, p.image 
                FROM bundle_items bi JOIN products p ON bi.product_id = p.id WHERE bi.bundle_id = ?");
            $itemStmt->execute([$b['id']]);
            $b['items'] = $itemStmt->fetchAll();
            $originalPrice = 0;
            foreach ($b['items'] as $item) { $originalPrice += $item['price'] * $item['quantity']; }
            $b['originalPrice'] = $originalPrice;
            $b['bundlePrice'] = $b['discount_percent'] > 0 
                ? round($originalPrice * (1 - $b['discount_percent'] / 100))
                : $originalPrice - $b['discount_amount'];
            $b['savings'] = $originalPrice - $b['bundlePrice'];
        }
        echo json_encode($bundles);
    }

} elseif ($method === 'POST') {
    verifyAdmin();
    $data = json_decode(file_get_contents("php://input"), true);
    
    $stmt = $pdo->prepare("INSERT INTO bundles (name, slug, description, discount_percent, discount_amount, image, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $slug = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', $data['name'] ?? ''));
    $stmt->execute([
        $data['name'] ?? '', $slug, $data['description'] ?? '',
        $data['discount_percent'] ?? 0, $data['discount_amount'] ?? 0,
        $data['image'] ?? '', $data['is_active'] ?? 1
    ]);
    $newId = $pdo->lastInsertId();
    
    if (isset($data['items']) && is_array($data['items'])) {
        $itemStmt = $pdo->prepare("INSERT INTO bundle_items (bundle_id, product_id, quantity) VALUES (?, ?, ?)");
        foreach ($data['items'] as $item) {
            $itemStmt->execute([$newId, $item['product_id'], $item['quantity'] ?? 1]);
        }
    }
    
    echo json_encode(['success' => true, 'id' => $newId]);

} elseif ($method === 'PUT') {
    verifyAdmin();
    if (!$bundleId) { http_response_code(400); echo json_encode(['error' => 'Bundle ID required']); exit(); }
    $data = json_decode(file_get_contents("php://input"), true);
    
    $stmt = $pdo->prepare("UPDATE bundles SET name=?, description=?, discount_percent=?, discount_amount=?, image=?, is_active=? WHERE id=?");
    $stmt->execute([
        $data['name'] ?? '', $data['description'] ?? '',
        $data['discount_percent'] ?? 0, $data['discount_amount'] ?? 0,
        $data['image'] ?? '', $data['is_active'] ?? 1, $bundleId
    ]);
    
    // Replace items
    $pdo->prepare("DELETE FROM bundle_items WHERE bundle_id = ?")->execute([$bundleId]);
    if (isset($data['items']) && is_array($data['items'])) {
        $itemStmt = $pdo->prepare("INSERT INTO bundle_items (bundle_id, product_id, quantity) VALUES (?, ?, ?)");
        foreach ($data['items'] as $item) {
            $itemStmt->execute([$bundleId, $item['product_id'], $item['quantity'] ?? 1]);
        }
    }
    
    echo json_encode(['success' => true]);

} elseif ($method === 'DELETE') {
    verifyAdmin();
    if (!$bundleId) { http_response_code(400); echo json_encode(['error' => 'Bundle ID required']); exit(); }
    $pdo->prepare("DELETE FROM bundles WHERE id = ?")->execute([$bundleId]);
    echo json_encode(['success' => true]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
}
?>
