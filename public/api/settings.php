<?php
require_once 'config.php';

header('Content-Type: application/json');
verifyAdmin();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT key_name, key_value FROM app_settings");
    $settings = $stmt->fetchAll();
    echo json_encode($settings);

} elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    $key_name = $data['key_name'] ?? null;
    $key_value = $data['key_value'] ?? '';

    if (!$key_name) {
        http_response_code(400);
        echo json_encode(['error' => 'key_name required']);
        exit();
    }

    $check = $pdo->prepare("SELECT COUNT(*) FROM app_settings WHERE key_name = ?");
    $check->execute([$key_name]);
    if ($check->fetchColumn() > 0) {
        $stmt = $pdo->prepare("UPDATE app_settings SET key_value = ? WHERE key_name = ?");
        $stmt->execute([$key_value, $key_name]);
    } else {
        $stmt = $pdo->prepare("INSERT INTO app_settings (key_name, key_value) VALUES (?, ?)");
        $stmt->execute([$key_name, $key_value]);
    }

    echo json_encode(['success' => true]);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
}
?>
