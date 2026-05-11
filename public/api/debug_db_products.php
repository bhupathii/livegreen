<?php
require_once 'config.php';
header('Content-Type: application/json');
$stmt = $pdo->query("SELECT * FROM products");
$products = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($products, JSON_PRETTY_PRINT);
?>
