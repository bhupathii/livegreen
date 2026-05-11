<?php
require_once 'config.php';
require_once 'rate_limiter.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    rateLimit('login', 5, 300); // 5 attempts per 5 minutes
    $data = json_decode(file_get_contents("php://input"));
    $username = $data->username ?? '';
    $password = $data->password ?? '';

    $stmt = $pdo->prepare('SELECT * FROM admin_users WHERE username = ?');
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['passwordHash'])) {
        $payload = [
            'username' => $user['username'],
            'id' => $user['id'],
            'iat' => time(),
            'exp' => time() + (12 * 60 * 60) // 12 hours
        ];
        $token = create_jwt($payload, $JWT_SECRET);
        echo json_encode(['success' => true, 'token' => $token]);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid credentials']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
}
?>
