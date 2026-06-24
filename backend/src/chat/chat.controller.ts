import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(JwtAuthGuard)
  @Get('partners')
  async getPartners(@Req() req: any) {
    return await this.chatService.getRecentChatPartners(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('history/:partnerId')
  async getHistory(@Req() req: any, @Param('partnerId') partnerId: string) {
    return await this.chatService.getChatHistory(req.user.id, partnerId);
  }
}
