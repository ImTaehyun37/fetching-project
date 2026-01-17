import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Brand } from './Brand.entity';
import { ProductInfo } from './ProductInfo.entity';
import { Review } from './Review.entity';

@Entity({ name: 'product' })
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('int')
  price: number;

  @Column({ name: 'brand_id', nullable: true })
  brand_id: number;

  @ManyToOne(() => Brand, (brand) => brand.products, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'brand_id' })
  brand: Brand;

  @OneToMany(() => ProductInfo, (productInfo) => productInfo.product)
  productInfos: ProductInfo[];

  @OneToMany(() => Review, (review) => review.product)
  reviews: Review[];

  @Column({ length: 255, default: 'https://via.placeholder.com/300x300.png?text=No+Image' })
  image_url: string;

  @Column('int', { default: 0 })
  like_count: number;
}
