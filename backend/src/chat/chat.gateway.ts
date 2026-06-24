import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { senderId: string; receiverId: string; message: string },
  ) {
    const saved = await this.chatService.saveMessage(data.senderId, data.receiverId, data.message);
    
    // Phát tin nhắn đến tất cả các client đang kết nối
    // Trong thực tế, bạn sẽ dùng room chat cụ thể: this.server.to(data.receiverId).emit(...)
    this.server.emit('messageReceived', saved);
    return saved;
  }
}
