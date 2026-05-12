import { db } from '../src/lib/db.js';

async function checkProducts() {
  try {
    const [rows]: any = await db.query("SELECT * FROM products");
    console.log("Products in DB:", rows);
    console.log("Total Count:", rows.length);
  } catch (err) {
    console.error("Query failed:", err);
  }
}

checkProducts();
