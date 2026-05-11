<?php
/**
 * Dynamic Sitemap.xml Generator
 * Generates sitemap from database (products, blogs) + static pages.
 */
require_once 'config.php';

header('Content-Type: application/xml; charset=utf-8');

$baseUrl = 'https://www.livegreenfarms.in';

$xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
$xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

// Static pages
$staticPages = [
    ['/', '1.0', 'daily'],
    ['/shop', '0.9', 'daily'],
    ['/about', '0.7', 'monthly'],
    ['/contact', '0.6', 'monthly'],
    ['/blogs', '0.8', 'weekly'],
    ['/faq', '0.5', 'monthly'],
    ['/how-we-work', '0.6', 'monthly'],
    ['/recipes', '0.7', 'weekly'],
    ['/honey-map', '0.5', 'monthly'],
    ['/health-calculator', '0.5', 'monthly'],
    ['/compare', '0.5', 'monthly'],
    ['/gift-cards', '0.6', 'monthly'],
    ['/referral', '0.5', 'monthly'],
];

foreach ($staticPages as $page) {
    $xml .= "  <url>\n";
    $xml .= "    <loc>" . htmlspecialchars($baseUrl . $page[0]) . "</loc>\n";
    $xml .= "    <priority>{$page[1]}</priority>\n";
    $xml .= "    <changefreq>{$page[2]}</changefreq>\n";
    $xml .= "  </url>\n";
}

// Product pages
try {
    $stmt = $pdo->query("SELECT id, name FROM products");
    $products = $stmt->fetchAll();
    foreach ($products as $p) {
        $xml .= "  <url>\n";
        $xml .= "    <loc>" . htmlspecialchars($baseUrl . '/product/' . $p['id']) . "</loc>\n";
        $xml .= "    <priority>0.8</priority>\n";
        $xml .= "    <changefreq>weekly</changefreq>\n";
        $xml .= "  </url>\n";
    }
} catch (Exception $e) {}

// Blog pages
try {
    $stmt = $pdo->query("SELECT id, date FROM blogs ORDER BY date DESC");
    $blogs = $stmt->fetchAll();
    foreach ($blogs as $b) {
        $xml .= "  <url>\n";
        $xml .= "    <loc>" . htmlspecialchars($baseUrl . '/blog/' . $b['id']) . "</loc>\n";
        $xml .= "    <lastmod>" . date('Y-m-d', strtotime($b['date'])) . "</lastmod>\n";
        $xml .= "    <priority>0.6</priority>\n";
        $xml .= "    <changefreq>monthly</changefreq>\n";
        $xml .= "  </url>\n";
    }
} catch (Exception $e) {}

$xml .= "</urlset>\n";

echo $xml;
?>
