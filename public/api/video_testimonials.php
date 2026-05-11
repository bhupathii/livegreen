<?php
require_once 'config.php';
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Ensure the videos directory exists
$upload_dir = __DIR__ . '/../videos';
if (!file_exists($upload_dir)) {
    mkdir($upload_dir, 0777, true);
}

// Create table if not exists
$pdo->exec("CREATE TABLE IF NOT EXISTS video_testimonials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    duration VARCHAR(50),
    video_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM video_testimonials ORDER BY created_at DESC");
    $videos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($videos);
} elseif ($method === 'POST') {
    verifyAdmin();

    $id = $_POST['id'] ?? null;
    $name = $_POST['name'] ?? '';
    $location = $_POST['location'] ?? '';
    $title = $_POST['title'] ?? '';
    $duration = $_POST['duration'] ?? '';
    $thumbnail_url = $_POST['thumbnail_url'] ?? $_POST['thumbnail'] ?? '';

    // Handle file upload (optional if updating)
    $video_url = null;
    if (isset($_FILES['video']) && $_FILES['video']['error'] === UPLOAD_ERR_OK) {
        $tmpName = $_FILES['video']['tmp_name'];
        $fileName = time() . '_' . basename($_FILES['video']['name']);
        $destination = $upload_dir . '/' . $fileName;
        
        if (move_uploaded_file($tmpName, $destination)) {
            $video_url = '/videos/' . $fileName;
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to upload video']);
            exit;
        }
    } elseif (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'No video file provided']);
        exit;
    }

    if ($id) {
        if ($video_url) {
            $stmt = $pdo->prepare("UPDATE video_testimonials SET name = ?, location = ?, title = ?, duration = ?, thumbnail_url = ?, video_url = ? WHERE id = ?");
            $success = $stmt->execute([$name, $location, $title, $duration, $thumbnail_url, $video_url, $id]);
        } else {
            $stmt = $pdo->prepare("UPDATE video_testimonials SET name = ?, location = ?, title = ?, duration = ?, thumbnail_url = ? WHERE id = ?");
            $success = $stmt->execute([$name, $location, $title, $duration, $thumbnail_url, $id]);
        }
        if ($success) {
            echo json_encode(['success' => true, 'id' => $id]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update record']);
        }
    } else {
        $stmt = $pdo->prepare("INSERT INTO video_testimonials (name, location, title, duration, thumbnail_url, video_url) VALUES (?, ?, ?, ?, ?, ?)");
        if ($stmt->execute([$name, $location, $title, $duration, $thumbnail_url, $video_url])) {
            $new_id = $pdo->lastInsertId();
            echo json_encode(['success' => true, 'id' => $new_id, 'video_url' => $video_url]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to attach video to database']);
        }
    }
} elseif ($method === 'DELETE') {
    verifyAdmin();
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    
    // Find the file to delete
    $stmt = $pdo->prepare("SELECT video_url FROM video_testimonials WHERE id = ?");
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($row) {
        $video_path = __DIR__ . '/..' . $row['video_url'];
        if (file_exists($video_path)) {
            unlink($video_path);
        }
        
        $deleteStmt = $pdo->prepare("DELETE FROM video_testimonials WHERE id = ?");
        
        if ($deleteStmt->execute([$id])) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete record']);
        }
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Video not found']);
    }
}
