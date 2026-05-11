import { ICarryClient } from '../src/lib/icarry.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function check() {
  const username = process.env.ICARRY_USERNAME!;
  const key = process.env.ICARRY_KEY!;
  console.log("Using Username:", username);
  const client = new ICarryClient(username, key);
  
  try {
    const token = await (client as any).login();
    console.log("Login successful. Token:", token);
  } catch (e: any) {
    console.error("Login failed:", e.message);
  }
}
check();
