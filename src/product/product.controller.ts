import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Res,
  Redirect,
  UseGuards,
  Request,
  Render,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Response } from 'express';
import { ProductService } from './product.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../entities/User.entity';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @Get('create')
  async getCreatePage(@Request() req, @Res() response: Response) {
    const html = await this.productService.getCreatePage(req.user);
    response.send(html);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @Post('create_process')
  async createProduct(@Body() body: any, @Request() req, @Res() response: Response) {
    // Seller Check: Can only create product for their brand
    if (req.user.role === UserRole.SELLER) {
        if (!req.user.brandId) throw new ForbiddenException('Seller has no brand assigned');
        // Force brand_id to be seller's brand
        body.brand_id = req.user.brandId;
    }
    const newProductId = await this.productService.createProduct(body);
    response.redirect(`/product/${newProductId}`);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @Get('update/:id')
  async getUpdatePage(@Param('id') id: string, @Request() req, @Res() response: Response) {
    // Ownership check done in service or here. 
    // It's cleaner to check permission before rendering form? 
    // For simplicity, let's pass user to service and let service check or return restricted UI.
    // Or we check here:
    // If Admin -> OK. If Seller -> Check if product.brand_id == user.brandId.
    // We'll delegate logic to service for better encapsulation.
    const html = await this.productService.getUpdatePage(Number(id), req.user);
    response.send(html);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @Post('update_process')
  async updateProduct(@Body() body: any, @Request() req, @Res() response: Response) {
    // Seller ownership validation inside Service recommended, or pre-check here.
    // Let's pass user info to service.
    const productId = await this.productService.updateProduct(body, req.user);
    response.redirect(`/product/${productId}`);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @Post('delete_process')
  async deleteProduct(@Body('id') id: string, @Request() req, @Res() response: Response) {
    await this.productService.deleteProduct(Number(id), req.user);
    response.redirect('/');
  }

  @UseGuards(JwtAuthGuard)
  @Post('like_process')
  async likeProduct(
    @Body('product_id') productId: string,
    @Res() response: Response,
  ) {
    await this.productService.likeProduct(Number(productId));
    response.redirect(`/product/${productId}`);
  }

  @UseGuards(JwtAuthGuard)
  @Post('review_process')
  async createReview(
    @Body() body: any,
    @Request() req,
    @Res() response: Response,
  ) {
    // Overwrite writer with logged in username
    body.writer = req.user.username;
    await this.productService.createReview(body);
    response.redirect(`/product/${body.product_id}`);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  async getProductDetail(@Param('id') id: string, @Request() req, @Res() response: Response) {
    const html = await this.productService.getProductDetail(Number(id), req.user);
    response.send(html);
  }
}
