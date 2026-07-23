import { Role } from '@prisma/client';
import type { Request } from 'express';

export type AuthenticatedUser = {
  id: string;
  email: string | null;
  phone: string | null;
  phoneVerifiedAt: Date | null;
  name: string;
  role: Role;
};

export type AuthenticatedRequest = Request & { user: AuthenticatedUser };
