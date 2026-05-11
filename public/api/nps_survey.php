<?php
require_once 'config.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    // Public endpoint: collect NPS response
    $data = json_decode(file_get_contents('php://input'), true);
    $email = $data['email'] ?? '';
    $score = isset($data['score']) ? (int)$data['score'] : -1;
    $comment = $data['comment'] ?? '';

    if ($score < 0 || $score > 10) {
        http_response_code(400);
        echo json_encode(['error' => 'Score must be between 0 and 10']);
        exit();
    }

    $stmt = $pdo->prepare("INSERT INTO nps_responses (email, score, comment, date) VALUES (?, ?, ?, ?)");
    $stmt->execute([$email, $score, $comment, date('Y-m-d\TH:i:s\Z')]);

    echo json_encode(['success' => true, 'message' => 'Thank you for your feedback!']);

} elseif ($method === 'GET') {
    // Admin endpoint: get NPS data
    verifyAdmin();

    $from = $_GET['from'] ?? date('Y-m-d', strtotime('-90 days'));
    $to = $_GET['to'] ?? date('Y-m-d');

    $stmt = $pdo->prepare("SELECT * FROM nps_responses WHERE date >= ? AND date <= ? ORDER BY date DESC");
    $stmt->execute([$from, $to . 'T23:59:59Z']);
    $responses = $stmt->fetchAll();

    $promoters = 0;
    $passives = 0;
    $detractors = 0;
    foreach ($responses as $r) {
        $s = (int)$r['score'];
        if ($s >= 9) $promoters++;
        elseif ($s >= 7) $passives++;
        else $detractors++;
    }
    $total = count($responses);
    $nps = $total > 0 ? round(($promoters / $total * 100) - ($detractors / $total * 100)) : 0;

    echo json_encode([
        'responses' => $responses,
        'summary' => [
            'total' => $total,
            'promoters' => $promoters,
            'passives' => $passives,
            'detractors' => $detractors,
            'nps' => $nps
        ]
    ]);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
}
?>
