<?php
require_once 'config.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit();
}

try {
    // Only expose safe public settings here
    $safe_keys = [
        'show_ai_recommender',
        'chatbot_feature_products',
        'chatbot_feature_tracking',
        'chatbot_feature_offers',
        'chatbot_feature_recipes',
        'chatbot_feature_health',
        'chatbot_feature_subscriptions',
        'home_hero_title',
        'home_hero_subtitle',
        'home_hero_desc',
        'home_hero_image',
        'home_promise_title',
        'home_promise_subtitle',
        'home_promise_desc',
        'home_promise_2_title',
        'home_promise_2_desc',
        'home_trust_rating',
        'home_trust_count',
        'home_roadmap_json',
        'home_comparison_json',
        'home_testimonials_json',
        'shop_hero_title',
        'shop_hero_subtitle',
        'shop_hero_desc',
        'about_hero_title',
        'about_hero_subtitle',
        'about_hero_desc',
        'about_stats_json',
        'about_philosophy_json',
        'about_origin_json',
        'about_timeline_json',
        'about_team_json',
        'faq_json',
        'contact_info_json',
        'how_we_work_json',
        'recipes_json',
        'honey_map_json'
    ];
    $placeholders = implode(',', array_fill(0, count($safe_keys), '?'));
    
    $stmt = $pdo->prepare("SELECT key_name, key_value FROM app_settings WHERE key_name IN ($placeholders)");
    $stmt->execute($safe_keys);
    $settings = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $result = [];
    foreach ($settings as $s) {
        $result[$s['key_name']] = $s['key_value'];
    }
    
    // Default if not present
    if (!isset($result['show_ai_recommender'])) {
        $result['show_ai_recommender'] = '1';
    }
    
    echo json_encode($result);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Internal Server Error']);
}
?>
