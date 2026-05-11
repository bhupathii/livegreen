<?php
/**
 * Rate Limiter Middleware
 * Include at the top of any API file that needs rate limiting.
 * Usage: rateLimit('login', 5, 300); // 5 attempts per 300 seconds
 */

function rateLimit($action, $maxAttempts = 10, $windowSeconds = 60) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $key = md5($ip . ':' . $action);
    $file = sys_get_temp_dir() . '/rl_' . $key . '.json';
    
    $now = time();
    $data = ['attempts' => [], 'blocked_until' => 0];
    
    if (file_exists($file)) {
        $raw = file_get_contents($file);
        $data = json_decode($raw, true) ?: $data;
    }
    
    // Check if currently blocked
    if ($data['blocked_until'] > $now) {
        $retryAfter = $data['blocked_until'] - $now;
        http_response_code(429);
        header("Retry-After: $retryAfter");
        echo json_encode([
            'error' => 'Too many requests. Please try again later.',
            'retry_after' => $retryAfter
        ]);
        exit();
    }
    
    // Clean old attempts outside window
    $data['attempts'] = array_filter($data['attempts'], function($t) use ($now, $windowSeconds) {
        return ($now - $t) < $windowSeconds;
    });
    $data['attempts'] = array_values($data['attempts']);
    
    // Check if exceeds limit
    if (count($data['attempts']) >= $maxAttempts) {
        $data['blocked_until'] = $now + $windowSeconds;
        file_put_contents($file, json_encode($data));
        http_response_code(429);
        header("Retry-After: $windowSeconds");
        echo json_encode([
            'error' => 'Too many requests. Please try again later.',
            'retry_after' => $windowSeconds
        ]);
        exit();
    }
    
    // Record this attempt
    $data['attempts'][] = $now;
    file_put_contents($file, json_encode($data));
}

/**
 * CSRF Token Generation & Validation
 */
function generateCsrfToken() {
    if (session_status() === PHP_SESSION_NONE) session_start();
    $token = bin2hex(random_bytes(32));
    $_SESSION['csrf_token'] = $token;
    $_SESSION['csrf_token_time'] = time();
    return $token;
}

function validateCsrfToken($token) {
    if (session_status() === PHP_SESSION_NONE) session_start();
    if (!isset($_SESSION['csrf_token'])) return false;
    // Token valid for 1 hour
    if (time() - ($_SESSION['csrf_token_time'] ?? 0) > 3600) return false;
    return hash_equals($_SESSION['csrf_token'], $token);
}
?>
