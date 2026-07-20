import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/chat.dto';

type SocketIdentity = { id: string };
type ClientEvents = { sendMessage: (data: SendMessageDto) => void };
type ServerEvents = { messageReceived: (message: unknown) => void };
type SocketData = { identity?: SocketIdentity };

@WebSocketGateway({
  cors: {
    origin: (
      process.env.CORS_ORIGINS ||
      'http://localhost:3000,https://datxe.linuxunity.com'
    )
      .split(',')
      .map((origin) => origin.trim()),
    credentials: true,
  },
})
export class ChatGateway {
  @WebSocketServer()
  server: Server<ClientEvents, ServerEvents, Record<string, never>, SocketData>;

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(
    client: Socket<
      ClientEvents,
      ServerEvents,
      Record<string, never>,
      SocketData
    >,
  ) {
    const token =
      typeof client.handshake.auth?.token === 'string'
        ? client.handshake.auth.token
        : undefined;

    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true },
      });
      if (!user) throw new Error('User not found');
      client.data.identity = user;
      await client.join(`user:${user.id}`);
    } catch {
      client.disconnect(true);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket()
    client: Socket<
      ClientEvents,
      ServerEvents,
      Record<string, never>,
      SocketData
    >,
    @MessageBody() data: SendMessageDto,
  ) {
    const identity = client.data.identity;
    if (!identity) {
      client.disconnect(true);
      return;
    }

    const saved = await this.chatService.saveMessage(
      identity.id,
      data.receiverId,
      data.message,
    );

    this.server
      .to([`user:${identity.id}`, `user:${data.receiverId}`])
      .emit('messageReceived', saved);
    return saved;
  }
}
