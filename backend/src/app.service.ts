import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      name: 'datxe API',
      status: 'ok',
      version: '1.0.0',
    };
  }
}
