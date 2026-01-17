import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './Product.entity';

@Entity({ name: 'product_info' })
export class ProductInfo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'product_id' })
  product_id: number;

  @ManyToOne(() => Product, (product) => product.productInfos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ length: 10, nullable: true })
  size: string;

  @Column({ length: 30, nullable: true })
  color: string;

  @Column('int', { default: 0 })
  stock: number;
}
