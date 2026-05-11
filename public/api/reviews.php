<?php
require_once 'config.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$pathInfo = isset($_SERVER['PATH_INFO']) ? explode('/', trim($_SERVER['PATH_INFO'], '/')) : [];
$id = isset($pathInfo[0]) && is_numeric($pathInfo[0]) ? (int)$pathInfo[0] : null;

if ($method === 'GET') {
    verifyAdmin();
    $stmt = $pdo->query("
        SELECT reviews.*, products.name as productName 
        FROM reviews 
        JOIN products ON reviews.productId = products.id 
        ORDER BY date DESC
    ");
    $reviews = $stmt->fetchAll();
    echo json_encode($reviews);

} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $stmt = $pdo->prepare("INSERT INTO reviews (productId, customerName, rating, comment, date) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([
        $data['productId'], 
        $data['customerName'], 
        $data['rating'], 
        $data['comment'] ?? null, 
        date('c')
    ]);
    
    echo json_encode(['id' => $pdo->lastInsertId()]);
    
} elseif ($method === 'PUT') {
    verifyAdmin();
    if (!$id || !isset($pathInfo[1]) || $pathInfo[1] !== 'status') {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid endpoint']);
        exit();
    }
    
    $data = json_decode(file_get_contents("php://input"), true);
    
    $stmt = $pdo->prepare("UPDATE reviews SET status = ? WHERE id = ?");
    $stmt->execute([$data['status'], $id]);
    
    echo json_encode(['success' => true]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
}
?>
