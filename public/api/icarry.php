<?php
require_once 'config.php';

// Migration: Ensure necessary columns exist in orders table
try {
    $columns = [
        'icarry_shipment_id' => 'VARCHAR(50)',
        'icarry_awb' => 'VARCHAR(50)',
        'icarry_tracking_url' => 'TEXT',
        'icarry_status' => 'VARCHAR(50)'
    ];

    foreach ($columns as $col => $type) {
        $check = $pdo->query("SHOW COLUMNS FROM orders LIKE '$col'");
        if (!$check->fetch()) {
            $pdo->exec("ALTER TABLE orders ADD COLUMN $col $type");
        }
    }

    // Ensure app_settings has iCarry keys
    $settings = [
        'icarry_username' => 'ela39261',
        'icarry_key' => '5V1L5bJcLuBeiVRsWCwxRq5hYnYpxp4Fyi58GCVBqIPs2YSszBDe4HvAtGaQrhpAjv51SgiYXzIUBg8TJtZ6HWMlmpw0R9CZ3lmz6t08RR2nwWAYB0FFwtmLWtN4iEpS3YRbvGqxT7muZsIBfRM1NYBqRRMf0Qd4eAMVm4km4ytrS2XjnUJI53oL0jJ7fOWVG3LZFPRsyhTGBSwv2KfRsj0pDdMfhUPE2DmoFynzCtttqptxFqF1VjtqiJmV0A21',
        'icarry_token' => '',
        'icarry_token_expiry' => '0',
        'icarry_pickup_address_id' => '87327' // Registered valid pickup address for ela39261
    ];

    // Force update if currently 83711
    $checkCurrent = $pdo->prepare("SELECT key_value FROM app_settings WHERE key_name = 'icarry_pickup_address_id'");
    $checkCurrent->execute();
    $currentVal = $checkCurrent->fetchColumn();
    if ($currentVal === '83711' || $currentVal === '83805') {
        $pdo->prepare("UPDATE app_settings SET key_value = '87327' WHERE key_name = 'icarry_pickup_address_id'")->execute();
    }

    foreach ($settings as $key => $val) {
        $check = $pdo->prepare("SELECT 1 FROM app_settings WHERE key_name = ?");
        $check->execute([$key]);
        if (!$check->fetch()) {
            $insert = $pdo->prepare("INSERT INTO app_settings (key_name, key_value) VALUES (?, ?)");
            $insert->execute([$key, $val]);
        }
    }
} catch (Exception $e) {
    error_log("iCarry migration failed: " . $e->getMessage());
}

function get_icarry_token() {
    global $pdo;
    
    // Check if we have a valid cached token
    $stmt = $pdo->query("SELECT key_name, key_value FROM app_settings WHERE key_name IN ('icarry_token', 'icarry_token_expiry', 'icarry_username', 'icarry_key')");
    $config = [];
    foreach ($stmt->fetchAll() as $row) {
        $config[$row['key_name']] = $row['key_value'];
    }

    if (!empty($config['icarry_token']) && $config['icarry_token_expiry'] > (time() + 300)) {
        return $config['icarry_token'];
    }

    // Login for new token
    $ch = curl_init('https://www.icarry.in/api_login');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 60);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); 
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0); 
    curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
    curl_setopt($ch, CURLOPT_ENCODING, '');
    curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);

    $commonHeaders = [
        'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept: */*',
        'Accept-Language: en-US,en;q=0.9',
        'Connection: keep-alive',
        'Cache-Control: no-cache',
        'Pragma: no-cache',
        'Content-Type: application/x-www-form-urlencoded'
    ];
    curl_setopt($ch, CURLOPT_HTTPHEADER, $commonHeaders);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
        'username' => $config['icarry_username'],
        'key' => $config['icarry_key']
    ]));
    
    $response = curl_exec($ch);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        error_log("iCarry login CURL error: " . $error);
        return null;
    }

    error_log("iCarry login raw response: " . $response);
    
    $data = json_decode($response, true);
    
    if (isset($data['api_token'])) {
        $token = $data['api_token'];
        $expiry = time() + 3600; // 60 minutes
        
        $updateToken = $pdo->prepare("UPDATE app_settings SET key_value = ? WHERE key_name = 'icarry_token'");
        $updateToken->execute([$token]);
        
        $updateExpiry = $pdo->prepare("UPDATE app_settings SET key_value = ? WHERE key_name = 'icarry_token_expiry'");
        $updateExpiry->execute([$expiry]);
        
        return $token;
    }
    
    return null;
}

function icarry_call($endpoint, $payload) {
    if (!$endpoint || !$payload) return ['error' => 'Invalid request'];
    
    $token = get_icarry_token();
    if (!$token) return ['error' => 'Authentication failed'];

    // Align with iCarry API v14.0 docs
    // Using ? to ensure WAF doesn't flag & as non-parameterized query
    $url = "https://www.icarry.in/$endpoint?api_token=$token";
    $postData = http_build_query($payload);
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 60);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); 
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0); 
    curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
    curl_setopt($ch, CURLOPT_ENCODING, '');
    curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);

    $commonHeaders = [
        'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept: */*',
        'Accept-Language: en-US,en;q=0.9',
        'Connection: keep-alive',
        'Cache-Control: no-cache',
        'Pragma: no-cache',
        'Content-Type: application/x-www-form-urlencoded'
    ];
    curl_setopt($ch, CURLOPT_HTTPHEADER, $commonHeaders);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
    
    $response = curl_exec($ch);
    $error = curl_error($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($error) return ['error' => "CURL Error: $error"];
    
    // Try direct JSON decode first
    $result = json_decode($response, true);
    
    // If JSON decode fails, iCarry may have PHP notices mixed with JSON
    if (json_last_error() !== JSON_ERROR_NONE && $response) {
        if (preg_match('/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}\s*$/', $response, $matches)) {
            $result = json_decode($matches[0], true);
        }
    }
    
    if (!isset($result['success'])) {
        error_log("iCarry response missing success key: " . substr($response, 0, 300));
        return ['success' => 0, 'error' => $result['error'] ?? 'API response format error', 'raw' => substr($response, 0, 500)];
    }
    
    return $result;
}

function check_serviceability($pincode) {
    return icarry_call('api_check_pincode', ['pincode' => $pincode]);
}

function get_shipping_estimate($data) {
    return icarry_call('api_get_estimate', $data);
}

function sync_icarry_orders() {
    global $pdo;
    
    // Cooldown check: 5 minutes
    $lastSync = $pdo->query("SELECT key_value FROM app_settings WHERE key_name = 'last_icarry_sync'")->fetchColumn();
    if ($lastSync && (time() - $lastSync < 300)) return; 

    // We only sync orders that are not 'delivered' or 'cancelled' in our DB
    // Get up to 50 active shipment IDs
    $stmt = $pdo->query("SELECT id, icarry_shipment_id FROM orders WHERE icarry_shipment_id IS NOT NULL AND icarry_shipment_id != '' AND status NOT IN ('delivered', 'cancelled') LIMIT 50");
    $activeOrders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($activeOrders)) return;

    $shipmentIds = array_column($activeOrders, 'icarry_shipment_id');
    $orderMap = [];
    foreach ($activeOrders as $o) {
        $orderMap[$o['icarry_shipment_id']] = $o['id'];
    }

    // Build array payload for shipment_ids[]
    $payload = [];
    foreach ($shipmentIds as $index => $id) {
        $payload["shipment_ids[$index]"] = $id;
    }

    $trackRes = icarry_call('api_shipment_status_sync', $payload);

    if (isset($trackRes['msg']) && is_array($trackRes['msg'])) {
        // Status code map based on user documentation
        $statusMap = [
            '1' => 'Pending Pickup',
            '2' => 'Processing',
            '3' => 'Shipped',
            '7' => 'Canceled',
            '12' => 'Damaged',
            '14' => 'Lost',
            '16' => 'Voided',
            '21' => 'Delivered',
            '22' => 'In Transit',
            '23' => 'Returned to Origin',
            '24' => 'Manifested',
            '25' => 'Pickup Scheduled',
            '26' => 'Out For Delivery',
            '27' => 'Pending Return'
        ];

        foreach ($trackRes['msg'] as $item) {
            $sid = $item['shipment_id'] ?? null;
            $statusCode = $item['status'] ?? null;
            
            if ($sid && isset($orderMap[$sid]) && $statusCode) {
                $orderId = $orderMap[$sid];
                $icarryStatusStr = $statusMap[$statusCode] ?? "Unknown Code ($statusCode)";
                
                $update = $pdo->prepare("UPDATE orders SET icarry_status = ? WHERE id = ?");
                $update->execute([$icarryStatusStr, $orderId]);
                
                // Sync main order status based on iCarry status mapping
                if ($statusCode == '21') {
                    $pdo->prepare("UPDATE orders SET status = 'delivered' WHERE id = ?")->execute([$orderId]);
                } elseif (in_array($statusCode, ['3', '22'])) {
                    $pdo->prepare("UPDATE orders SET status = 'shipped' WHERE id = ?")->execute([$orderId]);
                } elseif ($statusCode == '26') {
                    $pdo->prepare("UPDATE orders SET status = 'out_for_delivery' WHERE id = ?")->execute([$orderId]);
                } elseif (in_array($statusCode, ['7', '14', '16'])) {
                    $pdo->prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?")->execute([$orderId]);
                }
            }
        }
    }

    // Update last sync time
    $stmt = $pdo->prepare("INSERT INTO app_settings (key_name, key_value) VALUES ('last_icarry_sync', ?) ON DUPLICATE KEY UPDATE key_value = ?");
    $stmt->execute([time(), time()]);
}

function book_shipment($order, $items) {
    global $pdo;
    
    $pickup_id = $pdo->query("SELECT key_value FROM app_settings WHERE key_name = 'icarry_pickup_address_id'")->fetchColumn();
    if (!$pickup_id) $pickup_id = '87327'; // Registered valid pickup address for ela39261

    // State code mapping (from official iCarry API v14.0 Appendix)
    $stateMap = [
        'andhra pradesh' => 'AP', 'ap' => 'AP',
        'arunachal pradesh' => 'AR', 'ar' => 'AR',
        'assam' => 'AS', 'as' => 'AS',
        'bihar' => 'BI', 'bi' => 'BI', 'br' => 'BI',
        'chhattisgarh' => 'CG', 'chattisgarh' => 'CG', 'cg' => 'CG',
        'goa' => 'GO', 'go' => 'GO', 'ga' => 'GO',
        'gujarat' => 'GU', 'gu' => 'GU',
        'haryana' => 'HA', 'ha' => 'HA', 'hr' => 'HA',
        'himachal pradesh' => 'HP', 'hp' => 'HP',
        'jharkhand' => 'JH', 'jh' => 'JH',
        'karnataka' => 'KA', 'ka' => 'KA', 'bangalore' => 'KA', 'bengaluru' => 'KA',
        'kerala' => 'KE', 'ke' => 'KE', 'kl' => 'KE',
        'madhya pradesh' => 'MP', 'mp' => 'MP',
        'maharashtra' => 'MA', 'mh' => 'MA', 'mumbai' => 'MA',
        'manipur' => 'MN', 'mn' => 'MN',
        'meghalaya' => 'ME', 'ml' => 'ME',
        'mizoram' => 'MI', 'mz' => 'MI',
        'nagaland' => 'NA', 'nl' => 'NA',
        'odisha' => 'OD', 'od' => 'OD', 'or' => 'OD', 'orissa' => 'OD',
        'punjab' => 'PU', 'pu' => 'PU', 'pb' => 'PU',
        'rajasthan' => 'RA', 'ra' => 'RA', 'rj' => 'RA',
        'sikkim' => 'SI', 'si' => 'SI', 'sk' => 'SI',
        'tamil nadu' => 'TN', 'tn' => 'TN', 'chennai' => 'TN',
        'telangana' => 'TS', 'ts' => 'TS', 'hyderabad' => 'TS', 'tg' => 'TS',
        'tripura' => 'TR', 'tr' => 'TR',
        'uttar pradesh' => 'UP', 'up' => 'UP',
        'uttarakhand' => 'UK', 'uk' => 'UK', 'ua' => 'UK',
        'west bengal' => 'WB', 'wb' => 'WB', 'kolkata' => 'WB',
        'delhi' => 'DE', 'de' => 'DE', 'dl' => 'DE', 'new delhi' => 'DE',
        'jammu and kashmir' => 'JA', 'ja' => 'JA', 'jk' => 'JA', 'jammu & kashmir' => 'JA',
        'ladakh' => 'LA', 'la' => 'LA',
        'chandigarh' => 'CH', 'ch' => 'CH',
        'puducherry' => 'PO', 'po' => 'PO', 'pondicherry' => 'PO', 'py' => 'PO',
        'andaman and nicobar' => 'AN', 'andaman and nicobar islands' => 'AN', 'an' => 'AN',
        'dadra and nagar haveli' => 'DA', 'da' => 'DA', 'dn' => 'DA',
        'daman and diu' => 'DM', 'dm' => 'DM', 'dd' => 'DM',
        'lakshadweep' => 'LI', 'lakshadweep islands' => 'LI', 'li' => 'LI', 'ld' => 'LI'
    ];
    
    // Derive state code from full state name
    $stateInput = strtolower(trim($order['state'] ?? $order['state_code'] ?? ''));
    $stateCode = $stateMap[$stateInput] ?? 'AP'; // Default to AP for Andhra Pradesh
    
    // Phone sanitization (matching Manscara)
    $phone = preg_replace('/[^0-9]/', '', $order['phone'] ?? '');
    if (strlen($phone) > 10) $phone = substr($phone, -10);
    
    if (!preg_match('/^[6-9]/', $phone) || strlen($phone) !== 10) {
        error_log("⚠️ book_shipment: Invalid phone number '$phone' (must be 10 digits starting with 6-9). Falling back to 9999999999 for iCarry API.");
        $phone = '9999999999';
    }

    // Prepare parcel data
    $totalWeight = 0;
    $contents = [];
    foreach ($items as $item) {
        $totalWeight += ($item['weight'] ?? 500) * ($item['quantity'] ?? 1);
        $contents[] = ($item['quantity'] ?? 1) . " x " . ($item['name'] ?? 'Item');
    }
    $contentsStr = substr(implode(", ", $contents), 0, 255);

    // BUILD FLAT BRACKET-NOTATION PAYLOAD (matching Manscara's working format)
    // iCarry expects flat keys like "consignee[name]", NOT nested arrays
    $payload = [];
    $payload['pickup_address_id'] = $pickup_id;
    $payload['client_order_id'] = (string)($order['id'] ?? time());

    $payload['consignee[name]'] = $order['customerName'];
    $payload['consignee[mobile]'] = $phone;
    $payload['consignee[address]'] = $order['address'];
    $payload['consignee[city]'] = $order['city'];
    $payload['consignee[pincode]'] = $order['zip'];
    $payload['consignee[state]'] = $stateCode;
    $payload['consignee[country_code]'] = 'IN';

    $payload['parcel[type]'] = (strtolower($order['paymentMethod'] ?? '') === 'cod') ? 'COD' : 'Prepaid';
    $payload['parcel[value]'] = (string)max(1, $order['totalAmount']);
    $payload['parcel[currency]'] = 'INR';
    $payload['parcel[contents]'] = $contentsStr;
    $payload['parcel[weight][weight]'] = (string)$totalWeight;
    $payload['parcel[weight][unit]'] = 'gm';
    $payload['parcel[dimensions][length]'] = '10';
    $payload['parcel[dimensions][breadth]'] = '10';
    $payload['parcel[dimensions][height]'] = '10';
    $payload['parcel[dimensions][unit]'] = 'cm';

    // Detailed logging
    error_log("📦 iCarry Booking Data:");
    error_log("  - Pickup Address ID: " . $payload['pickup_address_id']);
    error_log("  - Client Order ID: " . $payload['client_order_id']);
    error_log("  - Consignee Name: " . $payload['consignee[name]']);
    error_log("  - Consignee Mobile: " . $payload['consignee[mobile]']);
    error_log("  - Consignee Pincode: " . $payload['consignee[pincode]']);
    error_log("  - Consignee State: $stateInput → " . $payload['consignee[state]']);
    error_log("  - Parcel Type: " . $payload['parcel[type]']);
    error_log("  - Parcel Value: ₹" . $payload['parcel[value]']);

    // Call iCarry API directly (NOT via icarry_call, to avoid http_build_query on nested arrays)
    $token = get_icarry_token();
    if (!$token) return ['error' => 'Authentication failed'];

    $url = "https://www.icarry.in/api_add_shipment_surface?api_token=$token";

    error_log("iCarry Shipment API Call: $url");
    error_log("iCarry Shipment POST Data: " . json_encode($payload));

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 60);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); 
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0); 
    curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
    curl_setopt($ch, CURLOPT_ENCODING, '');
    curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);

    $commonHeaders = [
        'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept: application/json, */*',
        'Accept-Language: en-US,en;q=0.9',
        'Connection: keep-alive',
        'Cache-Control: no-cache',
        'Pragma: no-cache',
        'Content-Type: application/x-www-form-urlencoded'
    ];
    curl_setopt($ch, CURLOPT_HTTPHEADER, $commonHeaders);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($payload));

    $response = curl_exec($ch);
    $error = curl_error($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    error_log("iCarry Shipment Response (HTTP $httpCode): " . substr($response, 0, 500));

    if ($error) {
        error_log("iCarry Shipment CURL Error: $error");
        return ['error' => $error];
    }

    $result = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        // Try to extract JSON from mixed response
        if (preg_match('/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}\s*$/', $response, $matches)) {
            $result = json_decode($matches[0], true);
        }
        if (!$result) {
            error_log("iCarry Shipment Non-JSON Response: " . substr($response, 0, 300));
            return ['error' => 'Non-JSON response from iCarry', 'raw' => substr($response, 0, 500)];
        }
    }
    
    error_log("📥 iCarry Booking Response: " . json_encode($result));
    
    // A successful booking returns: shipment_id, awb, tracking_url, courier_name, pickup_id
    if (!empty($result['success']) && isset($result['shipment_id']) && !empty($result['awb'])) {
        error_log("✅ iCarry Shipment Fully Booked: ID=" . $result['shipment_id'] . ", AWB=" . $result['awb']);
        $stmt = $pdo->prepare("UPDATE orders SET icarry_shipment_id = ?, icarry_awb = ?, icarry_tracking_url = ?, icarry_status = 'Manifested' WHERE id = ?");
        $stmt->execute([
            $result['shipment_id'],
            $result['awb'] ?? '',
            $result['tracking_url'] ?? '',
            $order['id']
        ]);
    } elseif (isset($result['shipment_id']) && empty($result['awb'])) {
        // Partial creation — shipment saved but courier not assigned (usually pickup address issue)
        error_log("⚠️ iCarry Shipment PARTIAL: ID=" . $result['shipment_id'] . " but no AWB assigned. Error: " . ($result['error'] ?? 'none'));
        $stmt = $pdo->prepare("UPDATE orders SET icarry_shipment_id = ?, icarry_status = 'Error - No courier assigned' WHERE id = ?");
        $stmt->execute([$result['shipment_id'], $order['id']]);
    } else {
        error_log("❌ iCarry Booking FAILED: " . json_encode($result));
    }
    
    return $result;
}
?>
