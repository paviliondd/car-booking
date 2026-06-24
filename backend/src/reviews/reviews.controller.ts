import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Req() req: any,
    @Body('vehicleId') vehicleId: string,
    @Body('rating') rating: number,
    @Body('comment') comment: string,
  ) {
    return await this.reviewsService.create(req.user.id, vehicleId, rating, comment);
  }

  @Get(':vehicleId')
  async findByVehicle(@Param('vehicleId') vehicleId: string) {
    return await this.reviewsService.findByVehicle(vehicleId);
  }
}
