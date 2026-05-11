<?php
/**
 * Automated Database Backup Script
 * Run via cron: 0 2 * * * php /path/to/backup.php
 * Or trigger manually from admin panel.
 */
require_once 'config.php';
header('Content-Type: application/json');

// Only allow admin or CLI
if (php_sapi_name() !== 'cli') {
    verifyAdmin();
}

$backupDir = __DIR__ . '/../../backups';
if (!is_dir($backupDir)) {
    mkdir($backupDir, 0755, true);
}

$tables = [
    'products', 'blogs', 'orders', 'newsletter_emails', 'customers',
    'admin_users', 'promo_codes', 'referrals', 'inquiries', 'reviews',
    'app_settings', 'nps_responses', 'site_visits', 'audit_log',
    'subscriptions', 'google_reviews', 'video_testimonials', 'promo_code_usage'
];

$timestamp = date('Y-m-d_His');
$filename = "backup_{$timestamp}.sql";
$filepath = $backupDir . '/' . $filename;

$output = "-- LiveGreen Honey Database Backup\n";
$output .= "-- Generated: " . date('Y-m-d H:i:s') . "\n";
$output .= "-- Database: {$db}\n\n";
$output .= "SET FOREIGN_KEY_CHECKS = 0;\n\n";

$tablesDumped = 0;
$totalRows = 0;

foreach ($tables as $table) {
    try {
        // Check if table exists
        $check = $pdo->query("SHOW TABLES LIKE '$table'");
        if ($check->rowCount() === 0) continue;
        
        // Get CREATE TABLE
        $createStmt = $pdo->query("SHOW CREATE TABLE `$table`");
        $createRow = $createStmt->fetch(PDO::FETCH_NUM);
        $output .= "DROP TABLE IF EXISTS `$table`;\n";
        $output .= $createRow[1] . ";\n\n";
        
        // Get data
        $dataStmt = $pdo->query("SELECT * FROM `$table`");
        $rows = $dataStmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($rows) > 0) {
            $columns = array_keys($rows[0]);
            $colNames = implode('`, `', $columns);
            
            foreach ($rows as $row) {
                $values = array_map(function($v) use ($pdo) {
                    if ($v === null) return 'NULL';
                    return $pdo->quote($v);
                }, array_values($row));
                $output .= "INSERT INTO `$table` (`$colNames`) VALUES (" . implode(', ', $values) . ");\n";
                $totalRows++;
            }
            $output .= "\n";
        }
        $tablesDumped++;
    } catch (Exception $e) {
        $output .= "-- Error dumping table $table: " . $e->getMessage() . "\n\n";
    }
}

$output .= "SET FOREIGN_KEY_CHECKS = 1;\n";

file_put_contents($filepath, $output);

// Clean old backups (keep last 7)
$backups = glob($backupDir . '/backup_*.sql');
usort($backups, function($a, $b) { return filemtime($b) - filemtime($a); });
foreach (array_slice($backups, 7) as $old) {
    unlink($old);
}

// Log the backup
try {
    require_once 'audit_log.php';
    logAuditAction($pdo, 'database_backup', 'system', null, "Backup: $filename, Tables: $tablesDumped, Rows: $totalRows");
} catch (Exception $e) {}

echo json_encode([
    'success' => true,
    'filename' => $filename,
    'tables' => $tablesDumped,
    'rows' => $totalRows,
    'size' => filesize($filepath),
    'path' => $filepath
]);
?>
