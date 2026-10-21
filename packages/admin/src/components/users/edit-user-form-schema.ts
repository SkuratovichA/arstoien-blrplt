import { z } from 'zod';
import { USER_STATUSES } from '@/lib/user-status';

export const editUserSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['USER', 'MODERATOR', 'ADMIN']),
  status: z.enum(USER_STATUSES),
  phoneNumber: z.string().optional(),
  otpAuthEnabled: z.boolean().optional(),
});

export type EditUserFormValues = z.infer<typeof editUserSchema>;
