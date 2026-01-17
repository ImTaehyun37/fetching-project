-- 1. 기존 테이블 초기화
DROP TABLE IF EXISTS product_info;
DROP TABLE IF EXISTS product;
DROP TABLE IF EXISTS brand;

-- 2. Brand Table 생성
CREATE TABLE brand (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(30) NOT NULL,
    PRIMARY KEY(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Product Table 생성
CREATE TABLE product (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price INT NOT NULL,
    brand_id INT,
    PRIMARY KEY(id),
    CONSTRAINT fk_product_brand FOREIGN KEY (brand_id) REFERENCES brand(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Product Info Table 생성
CREATE TABLE product_info (
    id INT NOT NULL AUTO_INCREMENT,
    product_id INT NOT NULL,
    size VARCHAR(10),
    color VARCHAR(30),
    stock INT DEFAULT 0,
    PRIMARY KEY(id),
    CONSTRAINT fk_info_product FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Brand 데이터 삽입
INSERT INTO brand (name) VALUES 
('Nike'), ('Adidas'), ('New Balance'), ('Patagonia'), ('Musinsa Standard');

-- 6. Product 데이터 삽입
INSERT INTO product (name, description, price, brand_id) VALUES 
('에어포스 1', '클래식한 디자인의 화이트 스니커즈', 139000, 1),
('테크 플리스 조거 팬츠', '활동성이 뛰어난 슬림핏 조거 팬츠', 129000, 1),
('울트라부스트 22', '최상의 쿠셔닝을 제공하는 러닝화', 229000, 2),
('삼바 비건', '클래식한 축구화 스타일의 데일리 슈즈', 139000, 2),
('990v6 Made in USA', '뉴발란스의 기술력이 집약된 프리미엄 모델', 309000, 3),
('레트로 X 재킷', '보온성이 뛰어난 시그니처 플리스 재킷', 329000, 4),
('캐시미어 블렌드 오버사이즈 코트', '부드러운 터치감의 겨울용 코트', 159000, 5),
('릴렉스핏 슬랙스', '가성비 좋은 데일리 세미 와이드 슬랙스', 39000, 5);

-- 7. Product Info 데이터 삽입 (다양한 옵션 추가)
INSERT INTO product_info (product_id, size, color, stock) VALUES 
-- [Product 1] 에어포스 1: White와 Black 두 가지 색상, 다양한 사이즈
(1, '260', 'White', 10), 
(1, '270', 'White', 5), 
(1, '280', 'White', 0),
(1, '260', 'Black', 8),  -- Black 색상 추가
(1, '270', 'Black', 12),
(1, '280', 'Black', 3),

-- [Product 2] 테크 플리스 조거 팬츠: Black, Grey 색상
(2, 'M', 'Black', 20), 
(2, 'L', 'Black', 15),
(2, 'XL', 'Black', 5),
(2, 'M', 'Grey', 10),   -- Grey 색상 추가
(2, 'L', 'Grey', 8),

-- [Product 3] 울트라부스트 22
(3, '265', 'Core Black', 8), 
(3, '275', 'Core Black', 12),
(3, '285', 'Core Black', 4),

-- [Product 4] 삼바 비건: White/Black, Black/White
(4, '240', 'White/Black', 3), 
(4, '250', 'White/Black', 7),
(4, '240', 'Black/White', 5), -- 반전 색상 추가
(4, '250', 'Black/White', 2),

-- [Product 5] 990v6 Made in USA
(5, '270', 'Grey', 5),
(5, '280', 'Grey', 2),
(5, '270', 'Navy', 4), -- Navy 색상 추가

-- [Product 6] 레트로 X 재킷
(6, 'M', 'Natural', 5), 
(6, 'L', 'Natural', 4),
(6, 'L', 'Navy', 3), -- Navy 색상 추가

-- [Product 7] 캐시미어 블렌드 오버사이즈 코트
(7, 'L', 'Black', 5),
(7, 'XL', 'Black', 2),
(7, 'L', 'Navy', 10),

-- [Product 8] 릴렉스핏 슬랙스: 3가지 색상 (Dark Grey, Black, Beige)
(8, '30', 'Dark Grey', 25), 
(8, '32', 'Dark Grey', 30),
(8, '30', 'Black', 15), 
(8, '32', 'Black', 20),
(8, '34', 'Black', 10),
(8, '30', 'Beige', 12), 
(8, '32', 'Beige', 8);

-- 수정1) 상품별 이미지 추가
-- 1. image_url 컬럼 추가
ALTER TABLE product ADD COLUMN image_url VARCHAR(255) DEFAULT 'https://via.placeholder.com/300x300.png?text=No+Image';

-- 2. (선택사항) 예시 데이터에 그럴싸한 이미지 링크 업데이트
UPDATE product SET image_url = 'https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/b7d9211c-26e7-431a-ac24-b0540fb3c00f/air-force-1-07-easyon-shoes-lnQ1K5.png' WHERE id = 1; -- 에어포스
UPDATE product SET image_url = 'https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/69cbc73d0cb846889f89acbb011e68cb_9366/Samba_OG_Shoes_White_B75806_01_standard.jpg' WHERE id = 4; -- 삼바
-- 나머지는 기본 이미지가 나옵니다.

-- 수정2) Like, Review 기능 추가
-- 1. Product 테이블에 like_count 추가
ALTER TABLE product ADD COLUMN like_count INT DEFAULT 0;

-- 2. Review Table 생성
CREATE TABLE review (
    id INT NOT NULL AUTO_INCREMENT,
    product_id INT NOT NULL,
    writer VARCHAR(30) NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    CONSTRAINT fk_review_product FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
