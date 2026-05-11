<?php
require_once 'icarry.php';

$token = get_icarry_token();
echo "Using Token: $token\n";

// Andhra Pradesh zone_id is 1476 as per documentation page 43
$payload = [
    'nickname' => 'HomeTadepalligudem',
    'name' => 'Pindi Ananta Lakshmi',
    'email' => 'unknown84502@gmail.com',
    'phone' => '8309554288',
    'street1' => '13-6-3/1 RAMA CHANDRA RAO PETA',
    'street2' => 'OPP : CHINNA VANTENA STREET, ELURU ROAD',
    'city' => 'TADEPALLIGUDEM',
    'pincode' => '534102',
    'zone_id' => '1476',
    'country_id' => '99'
];

echo "Adding Pickup Address...\n";
$res = icarry_call('api_add_pickup_address', $payload);
echo "Response:\n";
print_r($res);

if (isset($res['warehouse_id'])) {
    echo "\nSuccess! New Warehouse ID: " . $res['warehouse_id'] . "\n";
    echo "Updating app_settings...\n";
    require_once 'config.php';
    $update = $pdo->prepare("UPDATE app_settings SET key_value = ? WHERE key_name = 'icarry_pickup_address_id'");
    $update->execute([$res['warehouse_id']]);
}
?>
