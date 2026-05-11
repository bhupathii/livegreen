<?php
require_once 'config.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$pathInfo = isset($_SERVER['PATH_INFO']) ? explode('/', trim($_SERVER['PATH_INFO'], '/')) : [];
$id = isset($pathInfo[0]) && is_numeric($pathInfo[0]) ? (int)$pathInfo[0] : null;

// Ensure table has new columns
try { $pdo->exec("ALTER TABLE products ADD COLUMN allow_subscription BOOLEAN DEFAULT 0"); } catch (Exception $e) {}
try { $pdo->exec("ALTER TABLE products ADD COLUMN subscription_discount INT DEFAULT 0"); } catch (Exception $e) {}
try { $pdo->exec("ALTER TABLE products ADD COLUMN ribbon VARCHAR(100) DEFAULT NULL"); } catch (Exception $e) {}
try { $pdo->exec("ALTER TABLE products ADD COLUMN about_items TEXT DEFAULT NULL"); } catch (Exception $e) {}
try { $pdo->exec("ALTER TABLE products ADD COLUMN purity_profile TEXT DEFAULT NULL"); } catch (Exception $e) {}
try { $pdo->exec("ALTER TABLE products ADD COLUMN product_info TEXT DEFAULT NULL"); } catch (Exception $e) {}
try { $pdo->exec("ALTER TABLE products ADD COLUMN rating_override DECIMAL(3,2) DEFAULT NULL"); } catch (Exception $e) {}
try { $pdo->exec("ALTER TABLE products ADD COLUMN bought_count VARCHAR(255) DEFAULT NULL"); } catch (Exception $e) {}
try { $pdo->exec("ALTER TABLE products ADD COLUMN subtitle VARCHAR(255) DEFAULT NULL"); } catch (Exception $e) {}

if ($method === 'GET') {
    if ($id) {
        if (isset($pathInfo[1]) && $pathInfo[1] === 'reviews') {
            $stmt = $pdo->prepare("SELECT * FROM reviews WHERE productId = ? AND status IN ('approved', 'pending') ORDER BY date DESC");
            $stmt->execute([$id]);
            $reviews = $stmt->fetchAll();
            echo json_encode($reviews);
            exit();
        }

        $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
        $stmt->execute([$id]);
        $product = $stmt->fetch();
        if ($product) {
            $product['features'] = json_decode($product['features'] ?: "[]", true);
            $product['about_items'] = json_decode($product['about_items'] ?: "[]", true);
            $product['purity_profile'] = json_decode($product['purity_profile'] ?: "{}", true);
            $product['product_info'] = json_decode($product['product_info'] ?: "{}", true);
            echo json_encode($product);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Product not found']);
        }
    } else {
        $stmt = $pdo->query("SELECT p.*, 
            (SELECT COUNT(*) FROM reviews WHERE productId = p.id AND status IN ('approved', 'pending')) + 
            (SELECT COUNT(*) FROM google_reviews WHERE product_id = p.id AND isVisible = 1) as reviewCount,
            (SELECT SUM(rating) FROM reviews WHERE productId = p.id AND status IN ('approved', 'pending')) as sumNative,
            (SELECT SUM(rating) FROM google_reviews WHERE product_id = p.id AND isVisible = 1) as sumGoogle
            FROM products p");
        $products = $stmt->fetchAll();
        foreach ($products as &$p) {
            $p['features'] = json_decode($p['features'] ?: "[]", true);
            $p['about_items'] = json_decode($p['about_items'] ?: "[]", true);
            $p['purity_profile'] = json_decode($p['purity_profile'] ?: "{}", true);
            $p['product_info'] = json_decode($p['product_info'] ?: "{}", true);
            $totalReviews = (int)$p['reviewCount'];
            $sumNative = (float)$p['sumNative'];
            $sumGoogle = (float)$p['sumGoogle'];
            if ($totalReviews > 0) {
                $p['rating'] = round(($sumNative + $sumGoogle) / $totalReviews, 1);
            } else {
                $p['rating'] = 5.0; // Default if no reviews
            }
        }
        echo json_encode($products);
    }
} elseif ($method === 'POST') {
    verifyAdmin();
    $data = json_decode(file_get_contents("php://input"), true);
    
    $stmt = $pdo->prepare("INSERT INTO products (name, price, originalPrice, description, image, features, category, stock, seoTitle, seoDescription, seoKeywords, allow_subscription, subscription_discount, ribbon, about_items, purity_profile, product_info, rating_override, bought_count, subtitle) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $data['name'], 
        $data['price'], 
        $data['originalPrice'] ?? null, 
        $data['description'] ?? null, 
        $data['image'] ?? null, 
        json_encode($data['features'] ?? []), 
        $data['category'] ?? null, 
        $data['stock'] ?? 100, 
        $data['seoTitle'] ?? null, 
        $data['seoDescription'] ?? null, 
        $data['seoKeywords'] ?? null,
        $data['allow_subscription'] ? 1 : 0,
        $data['subscription_discount'] ?? 0,
        $data['ribbon'] ?? null,
        json_encode($data['about_items'] ?? []),
        json_encode($data['purity_profile'] ?? (object)[]),
        json_encode($data['product_info'] ?? (object)[]),
        $data['rating_override'] ?? null,
        $data['bought_count'] ?? null,
        $data['subtitle'] ?? null
    ]);
    
    echo json_encode(['id' => $pdo->lastInsertId()]);
    
} elseif ($method === 'PUT') {
    verifyAdmin();
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID required']);
        exit();
    }
    
    $data = json_decode(file_get_contents("php://input"), true);
    
    // FETCH OLD STOCK
    $oldStockStmt = $pdo->prepare("SELECT stock, name FROM products WHERE id = ?");
    $oldStockStmt->execute([$id]);
    $oldProduct = $oldStockStmt->fetch();
    $oldStock = $oldProduct ? (int)$oldProduct['stock'] : 0;
    $productName = $oldProduct ? $oldProduct['name'] : 'Product';
    $newStock = isset($data['stock']) ? (int)$data['stock'] : 100;
    
    $stmt = $pdo->prepare("UPDATE products SET name = ?, price = ?, originalPrice = ?, description = ?, image = ?, features = ?, category = ?, stock = ?, seoTitle = ?, seoDescription = ?, seoKeywords = ?, allow_subscription = ?, subscription_discount = ?, ribbon = ?, about_items = ?, purity_profile = ?, product_info = ?, rating_override = ?, bought_count = ?, subtitle = ? WHERE id = ?");
    $stmt->execute([
        $data['name'], 
        $data['price'], 
        $data['originalPrice'] ?? null, 
        $data['description'] ?? null, 
        $data['image'] ?? null, 
        json_encode($data['features'] ?? []), 
        $data['category'] ?? null, 
        $data['stock'] ?? 100, 
        $data['seoTitle'] ?? null, 
        $data['seoDescription'] ?? null, 
        $data['seoKeywords'] ?? null,
        $data['allow_subscription'] ? 1 : 0,
        $data['subscription_discount'] ?? 0,
        $data['ribbon'] ?? null,
        json_encode($data['about_items'] ?? []),
        json_encode($data['purity_profile'] ?? (object)[]),
        json_encode($data['product_info'] ?? (object)[]),
        $data['rating_override'] ?? null,
        $data['bought_count'] ?? null,
        $data['subtitle'] ?? null,
        $id
    ]);
    
    // TRIGGER BACK-IN-STOCK ALERTS
    if ($oldStock <= 0 && $newStock > 0) {
        require_once 'mailer.php';
        try {
            $pdo->exec("CREATE TABLE IF NOT EXISTS waitlist (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_id INT NOT NULL,
                email VARCHAR(255) NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                notified TINYINT(1) DEFAULT 0,
                notified_at DATETIME NULL
            )");
            $waitStmt = $pdo->prepare("SELECT id, email FROM waitlist WHERE product_id = ? AND notified = 0");
            $waitStmt->execute([$id]);
            $waiters = $waitStmt->fetchAll();
            
            $notifiedIds = [];
            foreach ($waiters as $waiter) {
                if (filter_var($waiter['email'], FILTER_VALIDATE_EMAIL)) {
                    sendWaitlistNotification($waiter['email'], $data['name'] ?? $productName, $id);
                    $notifiedIds[] = $waiter['id'];
                }
            }
            
            if (!empty($notifiedIds)) {
                $inQuery = implode(',', array_fill(0, count($notifiedIds), '?'));
                $updateWaitlist = $pdo->prepare("UPDATE waitlist SET notified = 1, notified_at = NOW() WHERE id IN ($inQuery)");
                $updateWaitlist->execute($notifiedIds);
            }
        } catch (Exception $e) {
            error_log("Waitlist Notification Error: " . $e->getMessage());
        }
    }

    echo json_encode(['success' => true]);

} elseif ($method === 'DELETE') {
    verifyAdmin();
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID required']);
        exit();
    }
    
    $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['success' => true]);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
}
?>
