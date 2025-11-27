import type { FormConfig } from '@arstoien/former';
import { defineStep } from '@arstoien/former';
import { z } from 'zod';

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(8, 'Password must be at least 8 characters'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;

interface PasswordFormConfigOptions {
  t: (key: string) => string;
  onSubmit: (data: PasswordChangeFormData) => Promise<void>;
}

export const createPasswordChangeFormConfig = ({
  t,
  onSubmit,
}: PasswordFormConfigOptions): FormConfig<PasswordChangeFormData> => {
  return {
    formType: 'single-step' as const,
    schema: passwordChangeSchema,
    steps: {
      password: defineStep({
        id: 'password' as const,
        fields: {
          currentPassword: {
            id: 'currentPassword' as const,
            type: 'password' as const,
            label: t('Current Password'),
            placeholder: t('Enter your current password'),
          },
          newPassword: {
            id: 'newPassword' as const,
            type: 'password' as const,
            label: t('New Password'),
            placeholder: t('Enter your new password'),
          },
          confirmPassword: {
            id: 'confirmPassword' as const,
            type: 'password' as const,
            label: t('Confirm Password'),
            placeholder: t('Confirm your new password'),
          },
        },
      }),
    },
    uiOptions: {
      password: [
        {
          type: 'container',
          // title?: SerializedTypography;
          // description?: SerializedTypography;
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          },
          children: [
            {
              type: 'fieldStyles',
              fieldId: 'currentPassword',
              style: {},
            },
            {
              type: 'fieldStyles',
              fieldId: 'newPassword',
              style: {},
            },
            {
              type: 'fieldStyles',
              fieldId: 'confirmPassword',
              style: {},
            },
          ],
        },
      ],
    },
    formControls: {
      submit: {
        label: t('Change Password'),
        onSubmit,
      },
    },
  };
};
