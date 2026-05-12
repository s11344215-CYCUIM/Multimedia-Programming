CREATE DATABASE IF NOT EXISTS drink_shop
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE drink_shop;

CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  product_id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  image_url VARCHAR(255),
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  order_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  customer_name VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  pickup_date DATE NOT NULL,
  pickup_time TIME NOT NULL,
  payment_method VARCHAR(30) NOT NULL,
  note TEXT,
  total_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  order_item_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(100) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  quantity INT NOT NULL,
  size_name VARCHAR(30),
  sugar_level VARCHAR(30),
  ice_level VARCHAR(30),
  toppings VARCHAR(255),
  note TEXT,
  subtotal DECIMAL(10, 2) NOT NULL,
  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
  CONSTRAINT fk_order_items_product
    FOREIGN KEY (product_id) REFERENCES products(product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS comments (
  comment_id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  user_id INT NOT NULL,
  rating TINYINT NULL,
  content TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comments_product
    FOREIGN KEY (product_id) REFERENCES products(product_id),
  CONSTRAINT fk_comments_user
    FOREIGN KEY (user_id) REFERENCES users(user_id),
  INDEX idx_comments_product_date (product_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS visits (
  visit_id INT AUTO_INCREMENT PRIMARY KEY,
  visit_date DATE NOT NULL UNIQUE,
  visit_count INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO categories (category_id, name) VALUES
  (1, '飲品'),
  (2, '周邊商品')
ON DUPLICATE KEY UPDATE
  name = VALUES(name);

INSERT INTO products
  (product_id, category_id, name, description, price, stock, image_url, is_active)
VALUES
  (1, 1, '莓你不行', '草莓風味季節飲品。', 90.00, 100, 'images/莓你不行.png', 1),
  (2, 1, '伯爵鮮奶茶', '伯爵茶香搭配鮮奶。', 60.00, 100, 'images/伯爵鮮奶茶.png', 1),
  (3, 1, '焙韻厚奶', '焙茶香氣與厚奶口感。', 80.00, 100, 'images/焙韻厚奶.png', 1),
  (4, 1, '百香QQ綠', '百香果綠茶搭配 QQ 配料。', 75.00, 100, 'images/百香QQ綠.png', 1),
  (5, 1, '青韻綠茶', '清爽綠茶基本款。', 50.00, 100, 'images/青韻綠茶.png', 1),
  (6, 2, '環保杯', '品牌環保杯。', 799.00, 50, 'images/環保杯.png', 1),
  (7, 2, '保冰袋', '品牌保冰袋。', 179.00, 50, 'images/保冰袋.png', 1),
  (8, 2, '杯套', '品牌杯套。', 129.00, 50, 'images/杯套.png', 1)
ON DUPLICATE KEY UPDATE
  category_id = VALUES(category_id),
  name = VALUES(name),
  description = VALUES(description),
  price = VALUES(price),
  stock = VALUES(stock),
  image_url = VALUES(image_url),
  is_active = VALUES(is_active);
