import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import sanitizeHtml = require('sanitize-html');
import { Product } from '../entities/Product.entity';
import { ProductInfo } from '../entities/ProductInfo.entity';
import { Brand } from '../entities/Brand.entity';
import { Review } from '../entities/Review.entity';
import { Template } from '../common/Template';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductInfo)
    private productInfoRepository: Repository<ProductInfo>,
    @InjectRepository(Brand)
    private brandRepository: Repository<Brand>,
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
  ) {}

  async getCreatePage(user?: any): Promise<string> {
    const allBrands = await this.brandRepository.find();
    let brandOptions = '';
    
    // If user is Seller, limit brand selection? 
    // Or simpler: Just render the page, we force brand_id in controller/service logic.
    // But better UI: select user's brand by default or hide selector.
    if (user && user.role === 'SELLER' && user.brandId) {
        // Find specific brand
        const myBrand = allBrands.find(b => b.id === user.brandId);
        if (myBrand) {
             brandOptions = `<option value="${myBrand.id}" selected>${myBrand.name}</option>`;
        }
    } else {
        brandOptions = allBrands
            .map((brand) => `<option value="${brand.id}">${brand.name}</option>`)
            .join('');
    }

    const title = 'Create Product';

    const html = Template.HTML(
      title,
      '',
      `
      <form action="/product/create_process" method="post">
        <h3>1. Basic Info</h3>
        <p>
          <select name="brand_id">
            ${brandOptions}
          </select> 
        </p>
        <p>
          <input type="text" name="product_name" placeholder="Product Name" required>
        </p>
        <p>
          <input type="number" name="price" placeholder="Price" required>
        </p>
        <p>
          <textarea name="description" placeholder="Description" rows="4" cols="50"></textarea>
        </p>
        <p><input type="text" name="image_url" placeholder="Image URL"></p>

        <hr>

        <h3>2. Initial Option Info</h3>
        <p style="color:gray; font-size:0.9em;">새로운 상품의 첫번째 색상/사이즈/재고 옵션을 입력해주세요.</p>
        <p>
          <input type="text" name="color" placeholder="Color (e.g. White)" required>
        </p>
        <p>
          <input type="text" name="size" placeholder="Size (e.g. 270, L)" required>
        </p>
        <p>
          <input type="number" name="stock" placeholder="Initial Stock" value="0">
        </p>
        
        <p>
          <input type="submit" value="Create Product">
        </p>
      </form>
      `,
      `<a href="/">Back to Home</a>`,
      user
    );

    return html;
  }

  async createProduct(body: any): Promise<number> {
    const {
      product_name,
      price,
      description,
      brand_id,
      image_url,
      size,
      color,
      stock,
    } = body;

    const newProduct = this.productRepository.create({
      name: product_name,
      price: Number(price),
      description: description,
      image_url: image_url,
      brand_id: Number(brand_id),
    });

    const savedProduct = await this.productRepository.save(newProduct);

    const newInfo = this.productInfoRepository.create({
      product_id: savedProduct.id,
      size: size,
      color: color,
      stock: Number(stock),
    });

    await this.productInfoRepository.save(newInfo);

    return savedProduct.id;
  }

  async getProductDetail(productId: number, user?: any): Promise<string> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['brand'], // Join logic
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const options = await this.productInfoRepository.find({
      where: { product_id: productId },
    });

    const reviews = await this.reviewRepository.find({
      where: { product_id: productId },
      order: { created_at: 'DESC' },
    });

    const uniqueColors = [...new Set(options.map((opt) => opt.color))];
    const colorButtons = uniqueColors
      .map(
        (color) =>
          `<button onclick="showOptions('${color}')" style="margin-right:5px; cursor:pointer; padding:5px 10px;">${color}</button>`,
      )
      .join('');

    const optionsJson = JSON.stringify(options);

    const reviewsHtml = reviews
      .map((review) => {
        return `
        <div style="border-bottom:1px solid #eee; padding: 10px 0;">
          <p style="margin:0; font-weight:bold;">${sanitizeHtml(
            review.writer,
          )} <span style="font-weight:normal; font-size:0.8em; color:gray;">${review.created_at.toLocaleString()}</span></p>
          <p style="margin:5px 0 0 0;">${sanitizeHtml(review.content)}</p>
        </div>
      `;
      })
      .join('');

    let isAuthorized = false;
    if (user) {
        if (user.role === 'ADMIN') {
            isAuthorized = true;
        } else if (user.role === 'SELLER' && product.brand_id === user.brandId) {
            isAuthorized = true;
        }
    }

    const html = Template.HTML(
      product.name,
      '',
      `
      <div style="display: flex; gap: 30px;">
        <div style="flex: 1;">
           <img src="${product.image_url}" alt="${sanitizeHtml(
        product.name,
      )}" 
                style="width:100%; max-width:500px; border-radius:10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
        </div>

        <div style="flex: 1;">
          <h2 style="margin-top:0;">${sanitizeHtml(product.name)}</h2>
          <p style="color:gray; font-weight:bold;">Brand: ${sanitizeHtml(
            product.brand ? product.brand.name : 'No Brand',
          )}</p>
          <p style="line-height: 1.6;">${sanitizeHtml(
            product.description,
          )}</p>
          
          <div style="display:flex; align-items:center; gap:10px; margin: 10px 0;">
             <h3 style="color:#333; font-size:24px; margin:0;">${product.price.toLocaleString()}원</h3>
             <form action="/product/like_process" method="post" style="margin-left:auto;">
               <input type="hidden" name="product_id" value="${productId}">
               <button type="submit" style="background:none; border:1px solid #ddd; cursor:pointer; padding:5px 10px; border-radius:5px;">
                 🤍 Like <span style="font-weight:bold;">${
                   product.like_count || 0
                 }</span>
               </button>
             </form>
          </div>
          
          <hr style="border:0; border-top:1px solid #eee; margin: 20px 0;">
          
          <h4>Select Color:</h4>
          <div style="margin-bottom: 20px;">
            ${colorButtons}
          </div>

          <div id="size-container" style="background:#f9f9f9; padding:15px; border-radius:5px; display:none;">
            <h4 id="selected-color-title" style="margin-top:0;"></h4>
            <ul id="size-list" style="padding-left:20px;"></ul>
          </div>

          <div style="margin-top: 30px;">
           ${
             isAuthorized
               ? `
             <a href="/product/create" style="margin-right:10px;">create</a>
             <a href="/product/update/${productId}" style="margin-right:10px;">update</a>
             <form action="/product/delete_process" method="post" style="display:inline;">
               <input type="hidden" name="id" value="${productId}">
               <input type="submit" value="delete" onclick="return confirm('정말 삭제하시겠습니까?');">
             </form>
             `
               : ''
           }
          </div>
        </div>
      </div>

      <div style="margin-top:50px;">
        <h3>Reviews</h3>
        <div style="background:#f9f9f9; padding:20px; border-radius:10px; margin-bottom:20px;">
          <form action="/product/review_process" method="post">
            <input type="hidden" name="product_id" value="${productId}">
            <div style="display:flex; gap:10px; margin-bottom:10px;">
              <input type="text" name="writer" placeholder="Name" required style="padding:5px;">
            </div>
            <div style="margin-bottom:10px;">
              <textarea name="content" placeholder="Leave a review..." style="width:100%; height:80px; padding:5px;"></textarea>
            </div>
            <input type="submit" value="Submit Review" style="padding:5px 15px; cursor:pointer;">
          </form>
        </div>
        <div>
          ${reviewsHtml}
        </div>
      </div>

      <script>
        var allOptions = ${optionsJson};

        function showOptions(color) {
          var container = document.getElementById('size-container');
          var list = document.getElementById('size-list');
          var title = document.getElementById('selected-color-title');

          title.innerText = color + ' Size Info:';
          
          var filtered = allOptions.filter(function(opt) {
            return opt.color === color;
          });

          list.innerHTML = '';
          filtered.forEach(function(opt) {
            var item = document.createElement('li');
            item.style.marginBottom = "5px";
            
            var stockText = opt.stock > 0 
              ? '<span style="color:green; font-weight:bold;">Stock: ' + opt.stock + '</span>' 
              : '<span style="color:red; font-weight:bold;">Sold Out</span>';
              
            item.innerHTML = 'Size: <strong>' + opt.size + '</strong> / ' + stockText;
            list.appendChild(item);
          });

          container.style.display = 'block';
        }
      </script>
      `,

      '',
      user,
    );
    return html;
  }

  async getUpdatePage(productId: number, user?: any): Promise<string> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });
    const brands = await this.brandRepository.find();
    const options = await this.productInfoRepository.find({
      where: { product_id: productId },
      order: { id: 'ASC' },
    });

    if (!product) throw new NotFoundException('Product not found');

    const title = `Update ${product.name}`;
    let brandSelect = '';
    if (user && user.role === 'SELLER' && user.brandId) {
        const myBrand = brands.find(b => b.id === user.brandId);
        if (myBrand) {
             brandSelect = `<select name="brand_id"><option value="${myBrand.id}" selected>${myBrand.name}</option></select>`;
        }
    } else {
        brandSelect = Template.brandSelect(brands, product.brand_id);
    }

    const optionInputs = options
      .map(
        (opt) => `
      <div id="option-row-${opt.id}" style="display:flex; gap:10px; margin-bottom:10px; align-items:center; padding: 5px; border-bottom: 1px solid #eee;">
        <input type="hidden" name="info_id" value="${opt.id}">
        
        <span style="width:200px;">Color: <strong>${opt.color}</strong> / Size: <strong>${opt.size}</strong></span>
        
        <label>Stock: </label>
        <input type="number" name="info_stock" value="${opt.stock}" style="width:60px;">

        <label style="margin-left:auto; color:red; cursor:pointer; font-weight:bold;">
          <input type="checkbox" name="delete_ids" value="${opt.id}" 
            onchange="document.getElementById('option-row-${opt.id}').style.opacity = this.checked ? '0.3' : '1';
                      document.getElementById('option-row-${opt.id}').style.textDecoration = this.checked ? 'line-through' : 'none';">
          X (Delete)
        </label>
      </div>
    `,
      )
      .join('');

    const html = Template.HTML(
      title,
      '',
      `
      <form action="/product/update_process" method="post">
        <input type="hidden" name="id" value="${product.id}">
        
        <h3>1. Basic Info</h3>
        <p><input type="text" name="product_name" value="${sanitizeHtml(
          product.name,
        )}"></p>
        <p><input type="number" name="price" value="${product.price}"></p>
        <p><textarea name="description">${sanitizeHtml(
          product.description,
        )}</textarea></p>
        <p><input type="text" name="image_url" value="${product.image_url || ''}" placeholder="Image URL"></p>
        <p>${brandSelect}</p>

        <hr>

        <h3>2. Manage Existing Options</h3>
        <p style="font-size:0.9em; color:gray;">삭제하려면 우측의 'X'를 체크하고 하단의 Update 버튼을 누르세요.</p>
        <div style="background:#f9f9f9; padding:15px; border-radius:5px;">
           ${optionInputs}
        </div>

        <hr>

        <h3>3. Add New Options (Dynamic)</h3>
        <div id="new-options-container">
          <div class="new-option-row" style="display:flex; gap:10px; margin-bottom:10px;">
            <input type="text" name="new_color" placeholder="New Color" oninput="checkAndAddRow(this)">
            <input type="text" name="new_size" placeholder="New Size" oninput="checkAndAddRow(this)">
            <input type="number" name="new_stock" placeholder="Stock" oninput="checkAndAddRow(this)">
          </div>
        </div>

        <p style="margin-top:20px;">
          <input type="submit" value="Update Product" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">
        </p>
      </form>

      <script>
        function checkAndAddRow(inputElement) {
          var currentRow = inputElement.parentElement;
          var container = document.getElementById('new-options-container');
          if (currentRow === container.lastElementChild) {
            var inputs = currentRow.querySelectorAll('input');
            var hasValue = false;
            inputs.forEach(function(inp) { if(inp.value.trim() !== '') hasValue = true; });
            if (hasValue) {
              var newRow = document.createElement('div');
              newRow.className = 'new-option-row';
              newRow.style.cssText = 'display:flex; gap:10px; margin-bottom:10px;';
              newRow.innerHTML = 
                '<input type="text" name="new_color" placeholder="New Color" oninput="checkAndAddRow(this)">' +
                '<input type="text" name="new_size" placeholder="New Size" oninput="checkAndAddRow(this)">' +
                '<input type="number" name="new_stock" placeholder="Stock" oninput="checkAndAddRow(this)">';
              container.appendChild(newRow);
            }
          }
        }
      </script>
      `,
      ``,
      user
    );
    return html;
  }

  async updateProduct(body: any, user?: any): Promise<number> {
    const productId = body.id;
    
    if (user && user.role === 'SELLER') {
        const product = await this.productRepository.findOne({ where: { id: productId } });
        if (product && product.brand_id !== user.brandId) {
             throw new Error('You do not own this product');
        }
    }

    let updateData: any = {
      name: body.product_name,
      description: body.description,
      price: Number(body.price),
      image_url: body.image_url,
      brand_id: Number(body.brand_id),
    };

    if (user && user.role === 'SELLER') {
       updateData.brand_id = user.brandId;
    }

    await this.productRepository.update(productId, updateData);

    // Delete handling
    let deleteIds: number[] = [];
    if (body.delete_ids) {
      deleteIds = Array.isArray(body.delete_ids)
        ? body.delete_ids.map(Number)
        : [Number(body.delete_ids)];
      await this.productInfoRepository.delete({ id: In(deleteIds) });
    }

    // Update stocks
    if (body.info_id) {
      const infoIds = Array.isArray(body.info_id)
        ? body.info_id
        : [body.info_id];
      const infoStocks = Array.isArray(body.info_stock)
        ? body.info_stock
        : [body.info_stock];

      const updatePromises = [];
      for (let i = 0; i < infoIds.length; i++) {
        if (!deleteIds.includes(Number(infoIds[i]))) {
          updatePromises.push(
            this.productInfoRepository.update(infoIds[i], {
              stock: Number(infoStocks[i]),
            }),
          );
        }
      }
      await Promise.all(updatePromises);
    }

    // Insert new options
    const newColors = body.new_color
      ? Array.isArray(body.new_color)
        ? body.new_color
        : [body.new_color]
      : [];
    const newSizes = body.new_size
      ? Array.isArray(body.new_size)
        ? body.new_size
        : [body.new_size]
      : [];
    const newStocks = body.new_stock
      ? Array.isArray(body.new_stock)
        ? body.new_stock
        : [body.new_stock]
      : [];

    const insertPromises = [];
    for (let i = 0; i < newColors.length; i++) {
      const color = newColors[i];
      const size = newSizes[i];
      const stock = newStocks[i] || 0;

      if (color && size) {
        insertPromises.push(
            this.productInfoRepository.save({
                product_id: productId,
                size: size,
                color: color,
                stock: Number(stock)
            })
        );
      }
    }
    await Promise.all(insertPromises);

    return productId;
  }

  async deleteProduct(id: number, user?: any): Promise<void> {
    if (user && user.role === 'SELLER') {
        const product = await this.productRepository.findOne({ where: { id } });
        if (product && product.brand_id !== user.brandId) {
             throw new Error('You do not own this product');
        }
    }
    await this.productRepository.delete(id);
  }

  async likeProduct(productId: number): Promise<void> {
    await this.productRepository.increment({ id: productId }, 'like_count', 1);
  }

  async createReview(body: any): Promise<void> {
    const { product_id, writer, content } = body;
    await this.reviewRepository.save({
      product_id: Number(product_id),
      writer,
      content,
    });
  }
}
