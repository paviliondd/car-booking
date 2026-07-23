import {
  Controller,
  BadRequestException,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
  StreamableFile,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Role } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedRequest } from '../auth/types/authenticated-user';
import { LocalStorageService } from './local-storage.service';
import { PrismaService } from '../prisma/prisma.service';

const uploadOptions = {
  storage: memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 3 },
};

@Controller('storage')
export class StorageController {
  constructor(
    private readonly storage: LocalStorageService,
    private readonly prisma: PrismaService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF, Role.OWNER)
  @Post('vehicle-image')
  @UseInterceptors(FileInterceptor('file', uploadOptions))
  async uploadVehicleImage(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Thiếu tệp ảnh xe');
    return this.storage.save(file, 'public');
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER, Role.OWNER)
  @Post('customer-documents')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'idCardFront', maxCount: 1 },
        { name: 'idCardBack', maxCount: 1 },
        { name: 'driverLicense', maxCount: 1 },
      ],
      uploadOptions,
    ),
  )
  async uploadCustomerDocuments(
    @Req() req: AuthenticatedRequest,
    @UploadedFiles()
    files: Record<string, Express.Multer.File[] | undefined>,
  ) {
    const supplied = ['idCardFront', 'idCardBack', 'driverLicense'].filter(
      (field) => Boolean(files[field]?.[0]),
    );
    if (supplied.length === 0) {
      throw new BadRequestException('Cần chọn ít nhất một tệp hồ sơ');
    }
    const entries = await Promise.all(
      supplied.map(async (field) => {
        const file = files[field]?.[0];
        if (!file) throw new BadRequestException('Tệp tải lên không hợp lệ');
        const stored = await this.storage.save(file, 'private', req.user.id);
        return [field, stored.key] as const;
      }),
    );
    const documentKeys = Object.fromEntries(entries) as {
      idCardFront?: string;
      idCardBack?: string;
      driverLicense?: string;
    };
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      select: { name: true, phone: true },
    });
    if (!user) throw new ForbiddenException('Tài khoản không còn hợp lệ');

    const customer = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.customer.upsert({
        where: { userId: req.user.id },
        create: {
          userId: req.user.id,
          fullName: user.name,
          phone: user.phone,
          ...documentKeys,
        },
        update: documentKeys,
      });
      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'UPDATE_CUSTOMER_DOCUMENTS',
          targetTable: 'Customer',
          targetId: updated.id,
          newValue: { fields: supplied },
        },
      });
      return updated;
    });
    return {
      idCardFront: customer.idCardFront,
      idCardBack: customer.idCardBack,
      driverLicense: customer.driverLicense,
    };
  }

  @Get('public/:fileName')
  async publicFile(@Param('fileName') fileName: string) {
    return new StreamableFile(await this.storage.open('public', fileName), {
      type: this.storage.contentType(fileName),
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('private/:ownerId/:fileName')
  async privateFile(
    @Req() req: AuthenticatedRequest,
    @Param('ownerId') ownerId: string,
    @Param('fileName') fileName: string,
  ) {
    const key = `private/${ownerId}/${fileName}`;
    if (req.user.role === Role.CUSTOMER || req.user.role === Role.OWNER) {
      if (ownerId !== req.user.id) {
        throw new ForbiddenException('Bạn không có quyền xem tệp này');
      }
      const customer = await this.prisma.customer.findFirst({
        where: {
          userId: req.user.id,
          OR: [
            { idCardFront: key },
            { idCardBack: key },
            { driverLicense: key },
          ],
        },
        select: { id: true },
      });
      if (!customer)
        throw new ForbiddenException('Bạn không có quyền xem tệp này');
    } else if (req.user.role !== Role.ADMIN && req.user.role !== Role.STAFF) {
      throw new ForbiddenException('Bạn không có quyền xem tệp này');
    }
    return new StreamableFile(
      await this.storage.open('private', fileName, ownerId),
      {
        type: this.storage.contentType(fileName),
        disposition: 'inline',
      },
    );
  }
}
