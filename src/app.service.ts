import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from './entities/Brand.entity';
import { Product } from './entities/Product.entity';
import { Template } from './common/Template';

@Injectable()
export class AppService {
    constructor(
        @InjectRepository(Brand)
        private brandRepository: Repository<Brand>,
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
    ) { }

    async getHome(
        brandId: string,
        minPrice: string,
        maxPrice: string,
        qs: string,
        sort: string,
        user?: any,
    ): Promise<string> {
        // 1. Fetch all brands for filters
        const brandsData = await this.brandRepository.find();

        // 2. Build Dynamic Query
        const queryBuilder = this.productRepository
            .createQueryBuilder('p')
            .leftJoinAndSelect('p.brand', 'b')
            .select([
                'p.id',
                'p.name',
                'p.price',
                'p.image_url',
                'p.like_count',
                'b.name', // Select brand name
            ]);

        // Fix: In TypeORM, selected columns from joined tables are mapped to the property.
        // But the legacy code expects a flat object or uses p.brand_name.
        // We will need to map the result or adapt the template to use the nested object.
        // The Template.list (if used) and the grid rendering manually access properties.
        // Let's look at the grid rendering in routes/index.js:
        // var productCards = productsWithBrand.map((p) => ... p.brand_name ... );
        // The raw SQL returned `b.name AS brand_name`.
        // In TypeORM `leftJoinAndSelect` will put brand in `p.brand` object.
        // I will map it before rendering or adjust template logic.
        // Retaining template string logic in the service for now to match `routes/index.js` behavior exactly.

        if (brandId) {
            queryBuilder.andWhere('p.brand_id = :brandId', { brandId });
        }
        if (minPrice) {
            queryBuilder.andWhere('p.price >= :minPrice', { minPrice });
        }
        if (maxPrice) {
            queryBuilder.andWhere('p.price <= :maxPrice', { maxPrice });
        }
        if (qs) {
            queryBuilder.andWhere('p.name LIKE :qs', { qs: `%${qs}%` });
        }

        if (sort === 'price_asc') {
            queryBuilder.orderBy('p.price', 'ASC');
        } else if (sort === 'price_desc') {
            queryBuilder.orderBy('p.price', 'DESC');
        } else if (sort === 'like_desc') {
            queryBuilder.orderBy('p.like_count', 'DESC');
        } else {
            // Newest default (by ID desc)
            queryBuilder.orderBy('p.id', 'DESC');
        }

        const products = await queryBuilder.getMany();

        // Map to flat structure for template compatibility if needed,
        // OR simply adjust how we access it in the template generation below.
        // The existing code did: p.brand_name || 'No Brand'
        // Here `p.brand?.name`

        const title = 'Welcome to My Shop';
        const list = ''; // empty as per original

        // Generate Product Cards HTML
        const productCards =
            products.length > 0
                ? products
                    .map((p) => {
                        const formattedPrice = p.price.toLocaleString();
                        const brandName = p.brand ? p.brand.name : 'No Brand';
                        return `
              <div class="product-card" onclick="location.href='/product/${p.id}'">
                <div class="image-wrapper">
                  <img src="${p.image_url}" alt="${p.name}">
                </div>
                <div class="info-wrapper">
                  <div class="brand">${brandName}</div>
                  <div class="name">${p.name}</div>
                  <div class="price">${formattedPrice}원</div>
                  <div style="font-size:12px; color:#666; margin-top:5px;">🤍 ${p.like_count || 0
                            }</div>
                </div>
              </div>
              `;
                    })
                    .join('')
                : '<p style="grid-column: 1/-1; text-align: center; color: #888;">No products found.</p>';

        // Generate Filter UI HTML
        const brandOptions = brandsData
            .map(
                (b) =>
                    `<option value="${b.id}" ${brandId == String(b.id) ? 'selected' : ''
                    }>${b.name}</option>`,
            )
            .join('');

        const filterHtml = `
      <form action="/" method="get" class="filter-form">
        <div class="filter-group">
          <label>Search</label>
          <input type="text" name="qs" value="${qs || ''}" placeholder="Product name...">
        </div>
        <div class="filter-group">
          <label>Brand</label>
          <select name="brand_id">
            <option value="">All Brands</option>
            ${brandOptions}
          </select>
        </div>
        <div class="filter-group">
          <label>Price Range</label>
          <div style="display: flex; gap: 5px;">
            <input type="number" name="min_price" value="${minPrice || ''
            }" placeholder="Min">
            <span>~</span>
            <input type="number" name="max_price" value="${maxPrice || ''
            }" placeholder="Max">
          </div>
        </div>
        <div class="filter-group">
          <label>Sort By</label>
          <select name="sort">
            <option value="newest" ${sort === 'newest' ? 'selected' : ''
            }>Newest</option>
            <option value="price_asc" ${sort === 'price_asc' ? 'selected' : ''
            }>Price: Low to High</option>
            <option value="price_desc" ${sort === 'price_desc' ? 'selected' : ''
            }>Price: High to Low</option>
            <option value="like_desc" ${sort === 'like_desc' ? 'selected' : ''
            }>Most Liked</option>
          </select>
        </div>
        <button type="submit">Apply Filters</button> 
        ${brandId || minPrice || maxPrice || qs || sort
                ? '<a href="/" class="reset-link">Reset</a>'
                : ''
            }
      </form>
    `;

        const css = `
      <style>
        /* Filter Styles */
        .filter-form {
          background: #fff;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #eee;
          margin-bottom: 20px;
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          align-items: flex-end;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .filter-group label {
          font-size: 12px;
          font-weight: bold;
          color: #666;
        }
        .filter-form input, .filter-form select {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        .filter-form button {
          padding: 8px 16px;
          background: #333;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          height: 35px;
        }
        .filter-form button:hover {
          background: #555;
        }
        .reset-link {
          color: #888;
          text-decoration: underline;
          font-size: 14px;
          align-self: center;
          margin-left: 5px;
        }

        /* Existing Grid Styles */
        .product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        .product-card {
          border: 1px solid #eee;
          border-radius: 8px;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
          cursor: pointer;
          background: white;
        }
        .product-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        .image-wrapper {
          width: 100%;
          height: 200px;
          background: #f9f9f9;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .image-wrapper img {
          max-width: 100%;
          max-height: 100%;
          object-fit: cover;
        }
        .info-wrapper {
          padding: 15px;
        }
        .brand {
          font-size: 12px;
          color: #888;
          font-weight: bold;
          text-transform: uppercase;
          margin-bottom: 5px;
        }
        .name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 10px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .price {
          color: #333;
          font-size: 15px;
        }
        .banner {
          background-color: #333;
          color: white;
          padding: 40px 20px;
          text-align: center;
          border-radius: 8px;
          margin-bottom: 30px;
        }
      </style>
    `;

        const html = Template.HTML(
            title,
            list,
            `
      ${css}
      <div class="banner">
        <h2>Summer Collection 2026</h2>
        <p>Discover the best styles for you.</p>
        <a href="/product/create" style="color: yellow; text-decoration: underline;">+ Add New Product</a>
      </div>
      
      ${filterHtml}

      <div class="product-grid">
        ${productCards}
      </div>
      `,
            ``,
            user,
        );

        return html;
    }
}
