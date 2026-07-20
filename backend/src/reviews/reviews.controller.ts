import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-user';
import { CreateReviewDto } from './dto/review.dto';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateReviewDto) {
    return await this.reviewsService.create(
      req.user.id,
      dto.vehicleId,
      dto.rating,
      dto.comment || '',
    );
  }

  @Get(':vehicleId')
  async findByVehicle(@Param('vehicleId') vehicleId: string) {
    return await this.reviewsService.findByVehicle(vehicleId);
  }
}
