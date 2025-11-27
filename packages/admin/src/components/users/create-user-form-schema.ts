import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must be at most 100 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be at most 100 characters'),
  phone: z.string().max(20, 'Phone must be at most 20 characters').optional().or(z.literal('')),
  role: z
    .enum(['USER', 'ADMIN'], {
      message: 'Role must be either USER or ADMIN',
    })
    .default('USER'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .optional()
    .or(z.literal('')),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;
