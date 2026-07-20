import { Role } from '@prisma/client';
import type { Request } from 'express';

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export type AuthenticatedRequest = Request & { user: AuthenticatedUser };
