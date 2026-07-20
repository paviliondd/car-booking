import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SendMessageDto } from './dto/chat.dto';

type AuthenticatedRequest = Request & { user: { id: string } };

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(JwtAuthGuard)
  @Get('partners')
  async getPartners(@Req() req: AuthenticatedRequest) {
    return this.chatService.getRecentChatPartners(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('history/:partnerId')
  async getHistory(
    @Req() req: AuthenticatedRequest,
    @Param('partnerId') partnerId: string,
  ) {
    return this.chatService.getChatHistory(req.user.id, partnerId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('message')
  async sendMessage(
    @Req() req: AuthenticatedRequest,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.saveMessage(
      req.user.id,
      dto.receiverId,
      dto.message,
    );
  }
}
