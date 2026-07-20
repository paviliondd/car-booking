import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-user';
import { CreateTicketDto, ReplyTicketDto } from './dto/ticket.dto';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateTicketDto) {
    return await this.ticketsService.create(
      req.user.id,
      dto.subject,
      dto.message,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Req() req: AuthenticatedRequest) {
    return await this.ticketsService.findAll(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/reply')
  async reply(
    @Param('id') id: string,
    @Body() dto: ReplyTicketDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return await this.ticketsService.reply(id, dto.reply, req.user);
  }
}
