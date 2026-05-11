<?php
require_once 'config.php';

function debug_icarry_login() {
    global $pdo;
    $stmt = $pdo->query("SELECT key_name, key_value FROM app_settings WHERE key_name IN ('icarry_username', 'icarry_key')");
    $config = [];
    foreach ($stmt->fetchAll() as $row) {
        $config[$row['key_name']] = $row['key_value'];
    }

    echo "Logging in as: " . $config['icarry_username'] . "...\n";
    $ch = curl_init('https://www.icarry.in/api_login');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, [
        'username' => $config['icarry_username'],
        'key' => $config['icarry_key']
    ]);
    
    $response = curl_exec($ch);
    $info = curl_getinfo($ch);
    curl_close($ch);
    
    echo "Login Response Code: " . $info['http_code'] . "\n";
    echo "Login Raw Response: " . $response . "\n";
    
    $data = json_decode($response, true);
    return $data['api_token'] ?? null;
}

$token = debug_icarry_login();
if ($token) {
    echo "Token received: $token\n\n";
    
    $endpoints = [
        'api_get_pickup_address',
        'api_list_pickup_address',
        'api_get_pickup_locations'
    ];
    
    foreach ($endpoints as $ep) {
        echo "--- Testing $ep ---\n";
        $url = "https://www.icarry.in/$ep&api_token=$token";
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true); // Some GET endpoints might require POST in iCarry?
        $response = curl_exec($ch);
        $info = curl_getinfo($ch);
        curl_close($ch);
        
        echo "Response Code: " . $info['http_code'] . "\n";
        echo "Raw Response: " . $response . "\n\n";
    }
} else {
    echo "Failed to get token.\n";
}
?>
