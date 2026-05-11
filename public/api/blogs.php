<?php
require_once 'config.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$pathInfo = isset($_SERVER['PATH_INFO']) ? explode('/', trim($_SERVER['PATH_INFO'], '/')) : [];
$id = isset($pathInfo[0]) && is_numeric($pathInfo[0]) ? (int)$pathInfo[0] : null;

if ($method === 'GET') {
    if ($id) {
        $stmt = $pdo->prepare("SELECT * FROM blogs WHERE id = ?");
        $stmt->execute([$id]);
        $blog = $stmt->fetch();
        echo json_encode($blog ?: null);
    } else {
        $stmt = $pdo->query("SELECT * FROM blogs ORDER BY date DESC");
        $blogs = $stmt->fetchAll();
        echo json_encode($blogs);
    }
} elseif ($method === 'POST') {
    verifyAdmin();
    $data = json_decode(file_get_contents("php://input"), true);
    
    $stmt = $pdo->prepare("INSERT INTO blogs (title, excerpt, content, author, date, image, category, seoTitle, seoDescription, seoKeywords) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $data['title'], 
        $data['excerpt'], 
        $data['content'], 
        $data['author'], 
        $data['date'], 
        $data['image'], 
        $data['category'], 
        $data['seoTitle'] ?? null, 
        $data['seoDescription'] ?? null, 
        $data['seoKeywords'] ?? null
    ]);
    
    echo json_encode(['id' => $pdo->lastInsertId()]);
    
} elseif ($method === 'PUT') {
    verifyAdmin();
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID required']);
        exit();
    }
    
    $data = json_decode(file_get_contents("php://input"), true);
    
    $stmt = $pdo->prepare("UPDATE blogs SET title = ?, excerpt = ?, content = ?, author = ?, date = ?, image = ?, category = ?, seoTitle = ?, seoDescription = ?, seoKeywords = ? WHERE id = ?");
    $stmt->execute([
        $data['title'], 
        $data['excerpt'], 
        $data['content'], 
        $data['author'], 
        $data['date'], 
        $data['image'], 
        $data['category'], 
        $data['seoTitle'] ?? null, 
        $data['seoDescription'] ?? null, 
        $data['seoKeywords'] ?? null,
        $id
    ]);
    
    echo json_encode(['success' => true]);

} elseif ($method === 'DELETE') {
    verifyAdmin();
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID required']);
        exit();
    }
    
    $stmt = $pdo->prepare("DELETE FROM blogs WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['success' => true]);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
}
?>
