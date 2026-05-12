import { db } from '../src/lib/db.js';

async function debugProductInsert() {
  const product = {
    name: "Test Product",
    price: 100,
    originalPrice: 150,
    description: "Debug description",
    image: "test.jpg",
    features: ["f1"],
    category: "Test",
    stock: 50,
    seoTitle: "SEO",
    seoDescription: "Desc",
    seoKeywords: "key",
    subtitle: "sub",
    rating_override: 4.5,
    bought_count: "10+",
    about_items: ["item1"],
    purity_profile: { test: "pure" },
    product_info: { brand: "test" }
  };

  try {
    const sql = "INSERT INTO products (name, price, originalPrice, description, image, features, category, stock, seoTitle, seoDescription, seoKeywords, subtitle, rating_override, bought_count, about_items, purity_profile, product_info) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    const params = [
      product.name, product.price, product.originalPrice, product.description, product.image, 
      JSON.stringify(product.features), product.category, product.stock, product.seoTitle, 
      product.seoDescription, product.seoKeywords, product.subtitle, product.rating_override, 
      product.bought_count, JSON.stringify(product.about_items), 
      JSON.stringify(product.purity_profile), JSON.stringify(product.product_info)
    ];

    console.log("Attempting debug insert...");
    const result = await db.query(sql, params);
    console.log("Insert Success:", result);
  } catch (err) {
    console.error("Insert Failed with Error:", err);
  }
}

debugProductInsert();
