import { Controller, Post, Get, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Req() req: any,
    @Body('subject') subject: string,
    @Body('message') message: string,
  ) {
    return await this.ticketsService.create(req.user.id, subject, message);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Req() req: any) {
    return await this.ticketsService.findAll(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/reply')
  async reply(
    @Param('id') id: string,
    @Body('reply') reply: string,
    @Req() req: any,
  ) {
    return await this.ticketsService.reply(id, reply, req.user);
  }
}
