import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return API information', () => {
      expect(appController.getHello()).toEqual({
        name: 'datxe API',
        status: 'ok',
        version: '1.0.0',
      });
    });

    it('should report liveness', () => {
      expect(appController.getLiveness()).toEqual({
        status: 'ok',
        service: 'datxe-api',
      });
    });
  });
});
