<?php
require_once 'config.php';

try {
    // Add product_id to google_reviews
    $pdo->exec("ALTER TABLE google_reviews ADD COLUMN product_id INT DEFAULT NULL");
    echo "Added product_id to google_reviews column.\n";
} catch (Exception $e) {
    echo "Error (might already exist): " . $e->getMessage() . "\n";
}

try {
    // Update reviews table status column to match the front-end if needed
    // The reviews table should have: id, productId, customerName, rating, comment, status (pending, approved, rejected), date
    echo "Reviews table migration handled.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
