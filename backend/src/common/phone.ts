import { BadRequestException } from '@nestjs/common';

export const VIETNAM_PHONE_PATTERN = /^(0|\+84|84)\d{9}$/;

export function normalizeVietnamesePhone(value: string): string {
  const compact = value.replace(/[\s.-]/g, '');
  if (/^\+84\d{9}$/.test(compact)) return compact;
  if (/^84\d{9}$/.test(compact)) return `+${compact}`;
  if (/^0\d{9}$/.test(compact)) return `+84${compact.slice(1)}`;
  throw new BadRequestException('Số điện thoại Việt Nam không hợp lệ');
}

export function maskPhone(value: string): string {
  return `${value.slice(0, 4)}***${value.slice(-3)}`;
}
