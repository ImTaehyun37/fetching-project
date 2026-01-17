import { Controller, Get, Query, Res, UseGuards, Request } from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';
import { OptionalJwtAuthGuard } from './auth/optional-jwt-auth.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  async getHome(
    @Query('brand_id') brandId: string,
    @Query('min_price') minPrice: string,
    @Query('max_price') maxPrice: string,
    @Query('qs') qs: string,
    @Query('sort') sort: string,
    @Request() req,
    @Res() response: Response,
  ) {
    const html = await this.appService.getHome(
      brandId,
      minPrice,
      maxPrice,
      qs,
      sort,
      req.user,
    );
    response.send(html);
  }
}
