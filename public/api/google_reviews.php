<?php
/**
 * Google Reviews API
 * GET (public) - Returns visible reviews + aggregate rating
 * POST (admin) - Add a review
 * PUT (admin) - Update a review
 * DELETE (admin) - Delete a review
 */
require_once 'config.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$pathInfo = isset($_SERVER['PATH_INFO']) ? explode('/', trim($_SERVER['PATH_INFO'], '/')) : [];
$id = isset($pathInfo[0]) && is_numeric($pathInfo[0]) ? (int)$pathInfo[0] : null;

if ($method === 'GET') {
    // Public: return visible reviews + aggregate stats
    $isAdmin = false;
    try {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if ($authHeader) { verifyAdmin(); $isAdmin = true; }
    } catch (Exception $e) { /* Not admin, that's fine */ }

    if ($isAdmin) {
        // Admin sees all reviews
        $stmt = $pdo->query("SELECT * FROM google_reviews ORDER BY createdAt DESC");
    } else {
        // Public sees only visible reviews
        $stmt = $pdo->query("SELECT id, reviewerName, rating, reviewText, reviewDate, profilePhoto, product_id FROM google_reviews WHERE isVisible = 1 ORDER BY createdAt DESC");
    }
    $reviews = $stmt->fetchAll();

    // Get aggregate settings
    $stmtR = $pdo->prepare("SELECT key_value FROM app_settings WHERE key_name = ?");
    
    $stmtR->execute(['google_rating']);
    $rating = $stmtR->fetch();
    
    $stmtR->execute(['google_total_reviews']);
    $totalReviews = $stmtR->fetch();
    
    $stmtR->execute(['google_maps_url']);
    $mapsUrl = $stmtR->fetch();

    echo json_encode([
        'reviews' => $reviews,
        'aggregate' => [
            'rating' => $rating ? $rating['key_value'] : '4.9',
            'totalReviews' => $totalReviews ? $totalReviews['key_value'] : '0',
            'mapsUrl' => $mapsUrl ? $mapsUrl['key_value'] : '',
        ]
    ]);

} elseif ($method === 'POST') {
    verifyAdmin();
    $data = json_decode(file_get_contents("php://input"), true);

    $stmt = $pdo->prepare("INSERT INTO google_reviews (reviewerName, rating, reviewText, reviewDate, profilePhoto, isVisible, product_id) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $data['reviewerName'] ?? 'Anonymous',
        $data['rating'] ?? 5,
        $data['reviewText'] ?? '',
        $data['reviewDate'] ?? 'Recently',
        $data['profilePhoto'] ?? '',
        isset($data['isVisible']) ? ($data['isVisible'] ? 1 : 0) : 1,
        isset($data['product_id']) ? $data['product_id'] : null,
    ]);

    echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);

} elseif ($method === 'PUT') {
    verifyAdmin();
    if (!$id) { http_response_code(400); echo json_encode(['error' => 'ID required']); exit; }

    $data = json_decode(file_get_contents("php://input"), true);

    // Toggle visibility
    if (isset($data['isVisible']) && count($data) === 1) {
        $stmt = $pdo->prepare("UPDATE google_reviews SET isVisible = ? WHERE id = ?");
        $stmt->execute([$data['isVisible'] ? 1 : 0, $id]);
    } else {
        $stmt = $pdo->prepare("UPDATE google_reviews SET reviewerName = ?, rating = ?, reviewText = ?, reviewDate = ?, isVisible = ?, product_id = ? WHERE id = ?");
        $stmt->execute([
            $data['reviewerName'] ?? 'Anonymous',
            $data['rating'] ?? 5,
            $data['reviewText'] ?? '',
            $data['reviewDate'] ?? 'Recently',
            isset($data['isVisible']) ? ($data['isVisible'] ? 1 : 0) : 1,
            isset($data['product_id']) ? $data['product_id'] : null,
            $id,
        ]);
    }

    echo json_encode(['success' => true]);

} elseif ($method === 'DELETE') {
    verifyAdmin();
    if (!$id) { http_response_code(400); echo json_encode(['error' => 'ID required']); exit; }

    $stmt = $pdo->prepare("DELETE FROM google_reviews WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode(['success' => true]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
}
?>
