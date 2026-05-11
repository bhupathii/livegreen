<?php
/**
 * Activity / Audit Log System
 * Tracks all admin actions for accountability.
 */
require_once 'config.php';

// Auto-create table
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS audit_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_user VARCHAR(100),
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50),
        entity_id VARCHAR(100),
        details TEXT,
        ip_address VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
} catch (Exception $e) {}

/**
 * Log an admin action
 */
function logAuditAction($pdo, $action, $entityType = null, $entityId = null, $details = null) {
    try {
        $admin = 'system';
        $token = get_bearer_token();
        if ($token) {
            global $JWT_SECRET;
            $decoded = verify_jwt($token, $JWT_SECRET);
            if ($decoded && isset($decoded['username'])) {
                $admin = $decoded['username'];
            }
        }
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $stmt = $pdo->prepare("INSERT INTO audit_log (admin_user, action, entity_type, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$admin, $action, $entityType, $entityId, is_string($details) ? $details : json_encode($details), $ip]);
    } catch (Exception $e) {
        error_log("Audit log failed: " . $e->getMessage());
    }
}

// Only run the API handler when this file is accessed directly (not via require_once)
if (basename($_SERVER['SCRIPT_FILENAME']) === 'audit_log.php') {
    header('Content-Type: application/json');
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        verifyAdmin();
        
        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? min(100, max(10, (int)$_GET['limit'])) : 50;
        $offset = ($page - 1) * $limit;
        $action = $_GET['action'] ?? '';
        $entity = $_GET['entity'] ?? '';
        
        $where = [];
        $params = [];
        if ($action) { $where[] = "action LIKE ?"; $params[] = "%$action%"; }
        if ($entity) { $where[] = "entity_type = ?"; $params[] = $entity; }
        
        $whereClause = count($where) > 0 ? ' WHERE ' . implode(' AND ', $where) : '';
        
        $countStmt = $pdo->prepare("SELECT COUNT(*) as total FROM audit_log" . $whereClause);
        $countStmt->execute($params);
        $total = (int)$countStmt->fetch()['total'];
        
        $stmt = $pdo->prepare("SELECT * FROM audit_log" . $whereClause . " ORDER BY created_at DESC LIMIT $limit OFFSET $offset");
        $stmt->execute($params);
        $logs = $stmt->fetchAll();
        
        echo json_encode([
            'logs' => $logs,
            'total' => $total,
            'page' => $page,
            'pages' => ceil($total / $limit)
        ]);
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method Not Allowed']);
    }
}
?>
