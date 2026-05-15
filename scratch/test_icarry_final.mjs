// Live integration test for the fixed iCarry client
// Run: node --input-type=module < scratch/test_icarry_final.mjs

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Inline the fixed client logic directly to test without TS compilation
const BASE_URL = 'https://www.icarry.in';
const USERNAME = 'ela39261';
const KEY = '5V1L5bJcLuBeiVRsWCwxRq5hYnYpxp4Fyi58GCVBqIPs2YSszBDe4HvAtGaQrhpAjv51SgiYXzIUBg8TJtZ6HWMlmpw0R9CZ3lmz6t08RR2nwWAYB0FFwtmLWtN4iEpS3YRbvGqxT7muZsIBfRM1NYBqRRMf0Qd4eAMVm4km4ytrS2XjnUJI53oL0jJ7fOWVG3LZFPRsyhTGBSwv2KfRsj0pDdMfhUPE2DmoFynzCtttqptxFqF1VjtqiJmV0A21';
const PICKUP_ID = '84128';

function flattenToBrackets(obj, prefix = '') {
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(result, flattenToBrackets(v, key));
    } else {
      result[key] = String(v);
    }
  }
  return result;
}

async function login() {
  const res = await fetch(`${BASE_URL}/api_login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username: USERNAME, key: KEY }).toString()
  });
  const data = await res.json();
  if (!data.api_token) throw new Error('Login failed: ' + JSON.stringify(data));
  console.log('✓ Login OK — token:', data.api_token);
  return data.api_token;
}

async function post(endpoint, body, token) {
  const flat = flattenToBrackets(body);
  const url = `${BASE_URL}${endpoint}?api_token=${token}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(flat).toString()
  });
  return res.json();
}

async function main() {
  console.log('=== iCarry Final Integration Test ===\n');

  const token = await login();

  // Test Estimate
  console.log('\n--- Estimate ---');
  const est = await post('/api_get_estimate', {
    origin_pincode: '534211',
    destination_pincode: '400001',
    weight: 500,
    length: 15, breadth: 15, height: 10,
    origin_country_code: 'IN',
    destination_country_code: 'IN',
    shipment_mode: 'S',
    shipment_type: 'P',
    shipment_value: 500
  }, token);
  console.log('Estimate result:', JSON.stringify(est).substring(0, 400));

  // Test a real shipment booking  
  console.log('\n--- Book Shipment (will cancel after) ---');
  const booking = await post('/api_add_shipment_surface', {
    pickup_address_id: PICKUP_ID,
    client_order_id: `LIVEGREEN_TEST_${Date.now()}`,
    consignee: {
      name: 'Integration Test',
      mobile: '9876543210',
      address: '101 Marine Drive',
      city: 'Mumbai',
      pincode: '400001',
      state: 'MH',
      country_code: 'IN'
    },
    parcel: {
      type: 'Prepaid',
      value: 799,
      contents: 'Wild Forest Honey 350g'
    },
    measurements: {
      weight: 500,
      length: 15,
      breadth: 15,
      height: 10,
      unit: 'cm'
    }
  }, token);
  
  console.log('\nBooking response:');
  console.log(JSON.stringify(booking, null, 2));

  if (booking.shipment_id) {
    console.log(`\n✓ Shipment ID: ${booking.shipment_id}`);
    console.log(`✓ AWB: ${booking.awb}`);
    console.log(`✓ Courier: ${booking.courier_name_full || booking.courier_name}`);
    console.log(`✓ Tracking URL: ${booking.tracking_url}`);
    console.log(`✓ Cost: ₹${booking.cost_estimate}`);

    // Cancel the test shipment
    console.log('\n--- Cancelling test shipment ---');
    const cancel = await post('/api_cancel_shipment', { shipment_id: booking.shipment_id }, token);
    console.log('Cancel result:', JSON.stringify(cancel));

    // Test tracking (after cancel)
    console.log('\n--- Track Shipment ---');
    const track = await post('/api_track_shipment', { shipment_id: booking.shipment_id }, token);
    console.log('Track result:', JSON.stringify(track).substring(0, 500));
  } else {
    console.error('\n✗ Booking failed:', booking);
  }
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
