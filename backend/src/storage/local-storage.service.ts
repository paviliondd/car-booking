import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { createReadStream } from 'fs';
import { mkdir, stat, writeFile } from 'fs/promises';
import { dirname, extname, join, resolve } from 'path';

export type StorageArea = 'public' | 'private';

@Injectable()
export class LocalStorageService {
  private readonly root: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.root = resolve(this.config.get<string>('UPLOAD_DIR') || './uploads');
    this.publicBaseUrl = (
      this.config.get<string>('FILE_PUBLIC_BASE_URL') || 'http://localhost:5000'
    ).replace(/\/$/, '');
  }

  async save(file: Express.Multer.File, area: StorageArea, namespace?: string) {
    const extension = this.extensionFor(file.mimetype, area);
    const fileName = `${randomUUID()}${extension}`;
    if (namespace && !/^[0-9a-f-]{36}$/i.test(namespace)) {
      throw new BadRequestException('Namespace lưu trữ không hợp lệ');
    }
    const directory = join(this.root, area, namespace || '');
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, fileName), file.buffer, { flag: 'wx' });

    return {
      key: `${area}/${namespace ? `${namespace}/` : ''}${fileName}`,
      url:
        area === 'public'
          ? `${this.publicBaseUrl}/api/storage/public/${fileName}`
          : undefined,
    };
  }

  async open(area: StorageArea, fileName: string, namespace?: string) {
    if (!/^[0-9a-f-]{36}\.(jpg|png|webp|pdf)$/i.test(fileName)) {
      throw new BadRequestException('Tên tệp không hợp lệ');
    }

    const filePath = resolve(this.root, area, namespace || '', fileName);
    const expectedRoot = resolve(this.root, area, namespace || '');
    if (dirname(filePath) !== expectedRoot) {
      throw new BadRequestException('Đường dẫn tệp không hợp lệ');
    }

    try {
      await stat(filePath);
    } catch {
      throw new NotFoundException('Không tìm thấy tệp');
    }

    return createReadStream(filePath);
  }

  async privateKeyExists(key: string, ownerId: string) {
    const fileName = this.fileNameFromKey(key, 'private', ownerId);
    try {
      await stat(resolve(this.root, 'private', ownerId, fileName));
      return true;
    } catch {
      return false;
    }
  }

  fileNameFromKey(key: string, area: StorageArea, namespace?: string) {
    const prefix = `${area}/${namespace ? `${namespace}/` : ''}`;
    const match = key.match(
      new RegExp(`^${prefix}([0-9a-f-]{36}\\.(?:jpg|png|webp|pdf))$`, 'i'),
    );
    if (!match) throw new BadRequestException('Storage key không hợp lệ');
    return match[1];
  }

  contentType(fileName: string) {
    const types: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
    };
    return types[extname(fileName).toLowerCase()] || 'application/octet-stream';
  }

  private extensionFor(mimeType: string, area: StorageArea) {
    const extensions: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'application/pdf': '.pdf',
    };
    const extension = extensions[mimeType];
    if (!extension || (area === 'public' && extension === '.pdf')) {
      throw new BadRequestException('Chỉ chấp nhận JPG, PNG, WebP hoặc PDF');
    }
    return extension;
  }
}
