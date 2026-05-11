<?php
require_once 'config.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

function getSetting($pdo, $key) {
    $stmt = $pdo->prepare("SELECT key_value FROM app_settings WHERE key_name = ?");
    $stmt->execute([$key]);
    $row = $stmt->fetch();
    return $row ? $row['key_value'] : null;
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $hfKey = getSetting($pdo, 'hf_api_key');
    if (!$hfKey) {
        http_response_code(500);
        echo json_encode(["error" => "HF API Key not configured."]);
        exit();
    }

    $ch = curl_init("https://router.huggingface.co/v1/chat/completions");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer $hfKey",
        "Content-Type: application/json"
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode >= 400 || $response === false) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to communicate with AI provider"]);
    } else {
        echo $response;
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
}
?>
