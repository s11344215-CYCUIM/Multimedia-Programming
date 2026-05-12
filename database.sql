CREATE DATABASE IF NOT EXISTS drink_shop
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE drink_shop;

CREATE TABLE IF NOT EXISTS products (
  product_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  image_url VARCHAR(255),
  is_active TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

INSERT INTO products
  (product_id, name, description, price, stock, image_url, is_active)
VALUES
  (1, '莓你不行', '草莓的甜、山楂的酸、紅茶的香，加上綿密奶蓋，一杯喝得到戀愛感的酸甜滋味', 90.00, 100, 'images/莓你不行.png', 1),
  (2, '伯爵鮮奶茶', '伯爵茶的清雅果香，融合鮮奶的柔順，一口就是經典又不膩的英式風味。', 60.00, 100, 'images/伯爵鮮奶茶.png', 1),
  (3, '焙韻厚奶', '深焙茶香搭上厚實奶香，濃郁順口、回韻十足，適合喜歡重口味奶茶的人。', 80.00, 100, 'images/焙韻厚奶.png', 1),
  (4, '百香QQ綠', '百香果的酸甜遇上綠茶的清香，再加上QQ配料，清爽又有口感，一杯喝完超順口。', 75.00, 100, 'images/百香QQ綠.png', 1),
  (5, '青韻綠茶', '淡雅茶香、清爽回甘，一杯最純粹的綠茶風味，喝起來輕盈無負擔。', 50.00, 100, 'images/青韻綠茶.png', 1);
