<?php
require_once 'config.php';
header('Content-Type: application/json');

try {
    // Create NPS responses table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS nps_responses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255),
            score INT NOT NULL CHECK (score >= 0 AND score <= 10),
            comment TEXT,
            date VARCHAR(100) NOT NULL
        )
    ");

    // Create site_visits table for future real traffic tracking
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS site_visits (
            id INT AUTO_INCREMENT PRIMARY KEY,
            source VARCHAR(100) DEFAULT 'direct',
            page VARCHAR(255),
            session_id VARCHAR(100),
            date VARCHAR(100) NOT NULL
        )
    ");

    // Seed sample NPS responses so dashboard isn't empty
    $stmt = $pdo->query("SELECT COUNT(*) as c FROM nps_responses");
    $row = $stmt->fetch();
    if ((int)$row['c'] === 0) {
        $sampleScores = [
            ['test1@example.com', 9, 'Love the honey!'],
            ['test2@example.com', 10, 'Best organic honey ever'],
            ['test3@example.com', 8, 'Good quality'],
            ['test4@example.com', 7, 'Pretty good'],
            ['test5@example.com', 10, 'Amazing!'],
            ['test6@example.com', 6, 'Average experience'],
            ['test7@example.com', 9, 'Will recommend'],
            ['test8@example.com', 3, 'Delivery was slow'],
            ['test9@example.com', 10, 'Perfect!'],
            ['test10@example.com', 8, 'Great taste'],
            ['test11@example.com', 9, 'Fantastic product'],
            ['test12@example.com', 5, 'Okay'],
            ['test13@example.com', 10, 'Pure and natural'],
            ['test14@example.com', 2, 'Not for me'],
            ['test15@example.com', 9, 'Highly recommended'],
        ];
        $stmt = $pdo->prepare("INSERT INTO nps_responses (email, score, comment, date) VALUES (?, ?, ?, ?)");
        foreach ($sampleScores as $s) {
            $date = date('Y-m-d\TH:i:s\Z', strtotime('-' . rand(1, 90) . ' days'));
            $stmt->execute([$s[0], $s[1], $s[2], $date]);
        }
    }

    // Seed sample site visits
    $stmt = $pdo->query("SELECT COUNT(*) as c FROM site_visits");
    $row = $stmt->fetch();
    if ((int)$row['c'] === 0) {
        $sources = ['direct', 'organic', 'social', 'referral', 'paid'];
        $pages = ['/', '/products', '/product/1', '/checkout', '/blog', '/about', '/contact'];
        $stmt = $pdo->prepare("INSERT INTO site_visits (source, page, session_id, date) VALUES (?, ?, ?, ?)");
        for ($i = 0; $i < 200; $i++) {
            $source = $sources[array_rand($sources)];
            $page = $pages[array_rand($pages)];
            $sessionId = 'sess_' . bin2hex(random_bytes(8));
            $date = date('Y-m-d\TH:i:s\Z', strtotime('-' . rand(0, 90) . ' days'));
            $stmt->execute([$source, $page, $sessionId, $date]);
        }
    }

    echo json_encode(['success' => true, 'message' => 'Dashboard migration completed successfully']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
