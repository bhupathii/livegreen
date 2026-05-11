CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price INT NOT NULL,
  originalPrice INT,
  description TEXT,
  image TEXT,
  features TEXT,
  category VARCHAR(100),
  stock INT DEFAULT 100,
  seoTitle VARCHAR(255),
  seoDescription TEXT,
  seoKeywords TEXT
);

CREATE TABLE IF NOT EXISTS blogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  excerpt TEXT,
  content TEXT,
  author VARCHAR(100),
  date VARCHAR(100),
  image TEXT,
  category VARCHAR(100),
  seoTitle VARCHAR(255),
  seoDescription TEXT,
  seoKeywords TEXT
);

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(50) PRIMARY KEY,
  customerName VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  zip VARCHAR(20) NOT NULL,
  items TEXT NOT NULL,
  totalAmount INT NOT NULL,
  paymentMethod VARCHAR(50) NOT NULL,
  paymentId VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  is_subscription TINYINT(1) DEFAULT 0,
  date VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS newsletter_emails (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50) NOT NULL,
  totalSpent INT DEFAULT 0,
  ordersCount INT DEFAULT 0,
  joinDate VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  passwordHash VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS promo_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  discountType VARCHAR(50) NOT NULL,
  discountValue INT NOT NULL,
  minSpend INT DEFAULT 0,
  expiryDate VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS referrals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  referrerEmail VARCHAR(255) NOT NULL,
  referredEmail VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  rewardCode VARCHAR(100),
  date VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS inquiries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'unread',
  date VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  productId INT NOT NULL,
  customerName VARCHAR(255) NOT NULL,
  rating INT NOT NULL,
  comment TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  date VARCHAR(100) NOT NULL,
  FOREIGN KEY(productId) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS app_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  key_name VARCHAR(100) NOT NULL UNIQUE,
  key_value TEXT
);

INSERT IGNORE INTO app_settings (key_name, key_value) VALUES 
('razorpay_key', ''),
('razorpay_secret', ''),
('hf_api_key', '');

-- Default admin password is 'password' hashed with PHP bcrypt ($2y$12$UCyFzebQH6.ADGRrwf1KyO8GbgDiHAY79R4tv.ar1uT2sRJ9Bflm6)
INSERT IGNORE INTO admin_users (username, passwordHash) VALUES 
('admin', '$2y$12$UCyFzebQH6.ADGRrwf1KyO8GbgDiHAY79R4tv.ar1uT2sRJ9Bflm6');

-- Clear old products to ensure only the requested ones exist
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE products;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO products (id, name, price, originalPrice, description, image, features, category) VALUES 
(1, 'Multifloral Raw Honey (1kg)', 999, 1299, 'Our premium Multifloral Raw Honey is sourced from apiaries surrounded by diverse wildflowers. This family-size jar is perfect for daily use — in your tea, on toast, or as a natural sweetener in recipes.', '/images/multiflora-honey.png', '["Family Size 1kg", "Multi-Floral Blend", "Daily Use", "Rich in Enzymes"]', 'Multiflora'),
(2, 'Jamun Honey (500g)', 649, 849, 'Harvested during the Jamun (Indian Blackberry) flowering season, this honey has a rich, slightly tangy flavor and a dark color. Traditionally used in Ayurveda, it''s believed to support blood sugar management.', '/images/jamun-honey.png', '["Seasonal Harvest", "Ayurvedic Properties", "Low Glycemic Index", "Rich Dark Color"]', 'Specialty'),
(3, 'Tulsi Honey (500g)', 599, 799, 'Infused with the natural goodness of Tulsi (Holy Basil), this honey is a powerful immunity booster. Its herbal undertones make it perfect for soothing teas and home remedies.', '/images/tulsi-honey.png', '["Infused with Tulsi", "Immunity Booster", "Herbal Notes", "Cough & Cold Relief"]', 'Specialty'),
(4, 'Sesame Honey (500g)', 499, 649, 'Sourced from the nectar of sesame blossoms, this unique honey features a mild, nutty flavor profile. It is less sweet than traditional honey, making it excellent for baking and glazes.', '/images/sesame-honey.png', '["Nutty Flavor", "Mild Sweetness", "Baking Ideal", "Light Amber Color"]', 'Specialty'),
(5, 'Mustard Honey (1kg)', 849, 1099, 'Harvested from vivid yellow mustard fields during winter, this honey naturally crystallizes quickly into a creamy, smooth texture. It has a robust flavor and is packed with natural warmth.', '/images/multiflora-honey.png', '["Winter Harvest", "Creamy Texture", "Fast Crystallizing", "Bold Flavor"]', 'Specialty'),
(6, 'Bee Pollen (150g)', 899, 1149, 'Considered one of nature''s most completely nourishing foods, bee pollen contains nearly all nutrients required by humans. Sprinkle on yogurts, smoothies, or salads for an instant energy boost.', '/images/pollen-honey.png', '["Superfood", "Rich in Protein & Vitamins", "Natural Energy Boost", "Unprocessed"]', 'Other Products');

INSERT IGNORE INTO blogs (title, excerpt, content, author, date, image, category) VALUES 
('Why Crystallization is a Sign of Purity', 'Many people mistake crystallized honey for spoiled or fake honey. Here''s why it''s actually a good sign.', 'Honey crystallization is a natural process where glucose separates from water and forms crystals. It proves that the honey is raw and unprocessed.', 'Dr. Bee', '2026-02-25T01:50:00Z', '/images/multiflora-honey.png', 'Education');

INSERT INTO reviews (productId, customerName, rating, comment, status, date) VALUES 
(1, 'Amit Sharma', 5, 'Best multifloral honey I have ever had. Very pure.', 'approved', '2026-02-20T10:00:00Z'),
(1, 'Sita Verma', 4, 'Very good taste and fast delivery.', 'approved', '2026-02-21T12:00:00Z'),
(2, 'Rahul Gupta', 5, 'The Jamun honey is excellent for my morning tea.', 'approved', '2026-02-22T08:30:00Z');
