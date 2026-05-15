// Comprehensive iCarry API test — validates login, estimate, and booking endpoint formats
// Run with: node scratch/test_icarry2.mjs

const BASE_URL = 'https://www.icarry.in';
const USERNAME = 'ela39261';
const KEY = '5V1L5bJcLuBeiVRsWCwxRq5hYnYpxp4Fyi58GCVBqIPs2YSszBDe4HvAtGaQrhpAjv51SgiYXzIUBg8TJtZ6HWMlmpw0R9CZ3lmz6t08RR2nwWAYB0FFwtmLWtN4iEpS3YRbvGqxT7muZsIBfRM1NYBqRRMf0Qd4eAMVm4km4ytrS2XjnUJI53oL0jJ7fOWVG3LZFPRsyhTGBSwv2KfRsj0pDdMfhUPE2DmoFynzCtttqptxFqF1VjtqiJmV0A21';
const PICKUP_ADDRESS_ID = '84128';

function toFormBody(data) {
  return Object.entries(data)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
}

async function apiPost(urlPath, bodyData, label = '') {
  const url = `${BASE_URL}${urlPath}`;
  const body = toFormBody(bodyData);
  if (label) console.log(`\n→ [${label}] POST ${url}`);
  else console.log(`\n→ POST ${url}`);
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    const text = await res.text();
    console.log(`  HTTP: ${res.status}`);
    try {
      const json = JSON.parse(text);
      console.log('  Response:', JSON.stringify(json, null, 2).substring(0, 1500));
      return json;
    } catch {
      console.log('  Raw (first 300):', text.substring(0, 300));
      return null;
    }
  } catch (e) {
    console.error('  NETWORK ERROR:', e.message);
    return null;
  }
}

async function main() {
  console.log('=== iCarry API Full Test ===\n');

  // Step 1: Login — token MUST be used as URL query param in subsequent calls
  const loginRes = await apiPost('/api_login', { username: USERNAME, key: KEY }, 'Login');
  if (!loginRes?.api_token) {
    console.error('✗ Login failed:', loginRes);
    return;
  }
  const token = loginRes.api_token;
  console.log(`\n✓ Token: ${token}`);

  // Step 2: Get Estimate (token as query param)
  console.log('\n=== ESTIMATE (token as URL param) ===');
  await apiPost(`/api_get_estimate?api_token=${token}`, {
    origin_pincode: '534211',   // Tanuku, AP (Live Green pickup)
    destination_pincode: '400001',
    weight: 500,
    length: 15, breadth: 15, height: 10,
    origin_country_code: 'IN',
    destination_country_code: 'IN',
    shipment_mode: 'S',         // S=Surface, A=Air
    shipment_type: 'P',         // P=Prepaid, C=COD
    shipment_value: 0
  }, 'Estimate');

  // Step 3: Test Shipment Booking — flat params (not nested objects)
  console.log('\n=== BOOK SHIPMENT — FLAT PARAMS ===');
  const flatBookingBody = {
    pickup_address_id: PICKUP_ADDRESS_ID,
    client_order_id: `TEST_${Date.now()}`,
    consignee_name: 'Test Customer',
    consignee_mobile: '9876543210',
    consignee_address: '123 Test Street',
    consignee_city: 'Mumbai',
    consignee_pincode: '400001',
    consignee_state: 'MH',
    consignee_country_code: 'IN',
    parcel_type: 'Prepaid',
    parcel_value: 500,
    parcel_contents: 'Wild Forest Honey 350g',
    measurements_weight: 500,
    measurements_length: 15,
    measurements_breadth: 15,
    measurements_height: 10,
    measurements_unit: 'cm',
  };
  const bookRes1 = await apiPost(`/api_add_shipment_surface?api_token=${token}`, flatBookingBody, 'Book-Flat');

  // Step 4: Test Shipment Booking — bracket notation
  console.log('\n=== BOOK SHIPMENT — BRACKET PARAMS ===');
  const bracketBookingBody = {
    pickup_address_id: PICKUP_ADDRESS_ID,
    client_order_id: `TEST_${Date.now() + 1}`,
    'consignee[name]': 'Test Customer',
    'consignee[mobile]': '9876543210',
    'consignee[address]': '123 Test Street',
    'consignee[city]': 'Mumbai',
    'consignee[pincode]': '400001',
    'consignee[state]': 'MH',
    'consignee[country_code]': 'IN',
    'parcel[type]': 'Prepaid',
    'parcel[value]': 500,
    'parcel[contents]': 'Wild Forest Honey 350g',
    'measurements[weight]': 500,
    'measurements[length]': 15,
    'measurements[breadth]': 15,
    'measurements[height]': 10,
    'measurements[unit]': 'cm',
  };
  const bookRes2 = await apiPost(`/api_add_shipment_surface?api_token=${token}`, bracketBookingBody, 'Book-Bracket');

  // Step 5: Test Tracking
  console.log('\n=== TRACK SHIPMENT ===');
  await apiPost(`/api_track_shipment?api_token=${token}`, { shipment_id: '123456' }, 'Track');

  console.log('\n=== DONE ===');
}

main().catch(console.error);
