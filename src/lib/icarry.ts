import axios from 'axios';

export class ICarryClient {
  private username: string;
  private key: string;
  private baseUrl: string;
  private token: string | null = null;
  private tokenExpiry: number = 0;

  constructor(username: string, key: string, baseUrl: string = 'https://www.icarry.in') {
    this.username = username;
    this.key = key;
    this.baseUrl = baseUrl;
  }

  private async login(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    try {
      const response = await axios.post(`${this.baseUrl}/api_login`, {
        username: this.username,
        key: this.key
      }, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        transformRequest: [(data) => {
          return Object.entries(data).map(([key, val]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(val))}`).join('&');
        }]
      });

      console.log('iCarry Login: token acquired successfully');

      if (response.data && response.data.api_token) {
        this.token = response.data.api_token;
        this.tokenExpiry = Date.now() + 55 * 60 * 1000; // 55 minutes
        return this.token!;
      } else {
        throw new Error('iCarry login failed: No token received');
      }
    } catch (error: any) {
      console.error('iCarry login error:', error.response?.data || error.message);
      throw new Error('iCarry login failed');
    }
  }

  public async getEstimate(params: {
    origin_pincode: string;
    destination_pincode: string;
    weight: number; // grams
    length: number;
    breadth: number;
    height: number;
    shipment_mode?: 'E' | 'S' | 'H';
    shipment_type?: 'C' | 'P';
    shipment_value?: number;
  }) {
    const token = await this.login();
    const url = `${this.baseUrl}/api_get_estimate?api_token=${token}`;
    
    try {
      const response = await axios.post(url, {
        ...params,
        origin_country_code: 'IN',
        destination_country_code: 'IN',
        shipment_mode: params.shipment_mode || 'S',
        shipment_type: params.shipment_type || 'P',
        shipment_value: params.shipment_value || 0
      }, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        transformRequest: [(data) => {
          return Object.entries(data).map(([key, val]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(val))}`).join('&');
        }]
      });

      return response.data;
    } catch (error: any) {
      console.error('iCarry estimate error:', error.response?.data || error.message);
      throw error;
    }
  }

  public async bookShipment(params: any, mode: 'air' | 'surface' | 'hyperlocal' = 'surface') {
    const token = await this.login();
    let endpoint = '/api_add_shipment_surface';
    if (mode === 'air') endpoint = '/api_add_shipment_air';
    
    const url = `${this.baseUrl}${endpoint}?api_token=${token}`;

    try {
      // Note: iCarry expects nested objects to be flat-key stringified for form-urlencoded
      // e.g. consignee[name]=John
      const flatParams = this.flattenObject(params);
      
      const response = await axios.post(url, flatParams, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        transformRequest: [(data) => {
          return Object.entries(data).map(([key, val]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(val))}`).join('&');
        }]
      });

      return response.data;
    } catch (error: any) {
      console.error('iCarry booking error:', error.response?.data || error.message);
      throw error;
    }
  }

  public async trackShipment(shipmentId: string) {
    const token = await this.login();
    // Documentation says POST to specific URL, let's use the one inferred or provided.
    // The snippet says "POST - use shipment_id from Book response."
    // It doesn't give a specific endpoint for tracking in the summary, but let's assume it follows the pattern.
    // Actually, common pattern is /api_track_shipment
    const url = `${this.baseUrl}/api_track_shipment?api_token=${token}`;

    try {
      const response = await axios.post(url, { shipment_id: shipmentId }, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        transformRequest: [(data) => {
          return Object.entries(data).map(([key, val]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(val))}`).join('&');
        }]
      });
      return response.data;
    } catch (error: any) {
      console.error('iCarry tracking error:', error.response?.data || error.message);
      throw error;
    }
  }

  private flattenObject(obj: any, prefix = ''): any {
    return Object.keys(obj).reduce((acc: any, k) => {
      const pre = prefix.length ? prefix + '[' : '';
      const suf = prefix.length ? ']' : '';
      if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
        Object.assign(acc, this.flattenObject(obj[k], pre + k + suf));
      } else if (Array.isArray(obj[k])) {
        obj[k].forEach((item: any, index: number) => {
          if (typeof item === 'object') {
            Object.assign(acc, this.flattenObject(item, `${pre}${k}${suf}[${index}]`));
          } else {
            acc[`${pre}${k}${suf}[${index}]`] = item;
          }
        });
      } else {
        acc[pre + k + suf] = obj[k];
      }
      return acc;
    }, {});
  }

  public static getStateCode(stateName: string): string {
    const states: { [key: string]: string } = {
      'Andaman and Nicobar Islands': 'AN',
      'Andhra Pradesh': 'AP',
      'Arunachal Pradesh': 'AR',
      'Assam': 'AS',
      'Bihar': 'BR',
      'Chandigarh': 'CH',
      'Chhattisgarh': 'CG',
      'Dadra and Nagar Haveli': 'DN',
      'Daman and Diu': 'DD',
      'Delhi': 'DL',
      'Goa': 'GA',
      'Gujarat': 'GJ',
      'Haryana': 'HR',
      'Himachal Pradesh': 'HP',
      'Jammu and Kashmir': 'JK',
      'Jharkhand': 'JH',
      'Karnataka': 'KA',
      'Kerala': 'KL',
      'Ladakh': 'LA',
      'Lakshadweep': 'LD',
      'Madhya Pradesh': 'MP',
      'Maharashtra': 'MH',
      'Manipur': 'MN',
      'Meghalaya': 'ML',
      'Mizoram': 'MZ',
      'Nagaland': 'NL',
      'Odisha': 'OR',
      'Puducherry': 'PY',
      'Punjab': 'PB',
      'Rajasthan': 'RJ',
      'Sikkim': 'SK',
      'Tamil Nadu': 'TN',
      'Telangana': 'TG',
      'Tripura': 'TR',
      'Uttar Pradesh': 'UP',
      'Uttarakhand': 'UK',
      'West Bengal': 'WB'
    };

    const normalized = stateName.trim();
    return states[normalized] || states[Object.keys(states).find(k => k.toLowerCase() === normalized.toLowerCase()) || ''] || normalized.substring(0, 2).toUpperCase();
  }
}
