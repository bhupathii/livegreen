// Test script to probe iCarry API and discover correct endpoints
// Run with: node scratch/test_icarry.mjs

const BASE_URL = 'https://www.icarry.in';
const USERNAME = 'ela39261';
const KEY = '5V1L5bJcLuBeiVRsWCwxRq5hYnYpxp4Fyi58GCVBqIPs2YSszBDe4HvAtGaQrhpAjv51SgiYXzIUBg8TJtZ6HWMlmpw0R9CZ3lmz6t08RR2nwWAYB0FFwtmLWtN4iEpS3YRbvGqxT7muZsIBfRM1NYBqRRMf0Qd4eAMVm4km4ytrS2XjnUJI53oL0jJ7fOWVG3LZFPRsyhTGBSwv2KfRsj0pDdMfhUPE2DmoFynzCtttqptxFqF1VjtqiJmV0A21';

function toFormBody(data) {
  return Object.entries(data)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
}

async function apiPost(path, data, tokenParam = 'api_token') {
  const url = `${BASE_URL}${path}`;
  console.log(`\n→ POST ${url}`);
  const body = toFormBody(data);
  console.log('  Body:', body.substring(0, 200));
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    const text = await res.text();
    console.log(`  Status: ${res.status}`);
    try {
      const json = JSON.parse(text);
      console.log('  Response:', JSON.stringify(json, null, 2).substring(0, 1000));
      return json;
    } catch {
      console.log('  Raw response:', text.substring(0, 500));
      return text;
    }
  } catch (e) {
    console.error('  Error:', e.message);
    return null;
  }
}

async function main() {
  console.log('=== iCarry API Discovery ===\n');

  // Step 1: Login
  console.log('--- Step 1: Login ---');
  const loginRes = await apiPost('/api_login', { username: USERNAME, key: KEY });
  
  if (!loginRes || !loginRes.api_token) {
    console.error('Login failed! Trying alternative token field names...');
    console.log('Got:', JSON.stringify(loginRes));
    return;
  }
  
  const token = loginRes.api_token;
  console.log('\n✓ Got token:', token.substring(0, 20) + '...');
  console.log('  Token expiry info:', loginRes);

  // Step 2: Get pickup addresses
  console.log('\n--- Step 2: Get Pickup Addresses ---');
  const endpoints_pickup = [
    '/api_get_pickup_address',
    '/api_get_addresses',
    '/api_pickup_addresses',
    '/api_get_pickup_addresses',
  ];
  for (const ep of endpoints_pickup) {
    await apiPost(ep, { api_token: token });
  }

  // Step 3: Try different tracking endpoint names
  console.log('\n--- Step 3: Track a test shipment (to discover endpoint) ---');
  // Try tracking with a known order ID
  const trackRes1 = await apiPost('/api_track_shipment', { api_token: token, shipment_id: 'TEST123' });
  const trackRes2 = await apiPost('/api_track_shipment', { api_token: token, awb: 'TEST123' });

  // Step 4: Get estimate to verify credentials work
  console.log('\n--- Step 4: Get Estimate (verify auth) ---');
  const estimateRes = await apiPost('/api_get_estimate', {
    api_token: token,
    origin_pincode: '534215',
    destination_pincode: '400001',
    weight: 500,
    length: 15,
    breadth: 15,
    height: 10,
    origin_country_code: 'IN',
    destination_country_code: 'IN',
    shipment_mode: 'S',
    shipment_type: 'P',
    shipment_value: 0
  });

  // Step 5: Try different booking endpoint names
  console.log('\n--- Step 5: Discover Booking Endpoints ---');
  const endpoints = [
    '/api_add_shipment_surface',
    '/api_add_shipment_single',
    '/api_add_shipment',
    '/api_book_shipment',
    '/api_create_shipment'
  ];
  
  for (const ep of endpoints) {
    const testBody = toFormBody({ api_token: token });
    const url = `${BASE_URL}${ep}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: testBody
      });
      const text = await res.text();
      console.log(`  ${ep}: HTTP ${res.status}, response: ${text.substring(0, 200)}`);
    } catch (e) {
      console.log(`  ${ep}: ERROR - ${e.message}`);
    }
  }
}

main().catch(console.error);
