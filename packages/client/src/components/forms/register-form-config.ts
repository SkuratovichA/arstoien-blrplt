import type { FormConfig } from '@arstoien/former';
import { defineStep } from '@arstoien/former';
import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(1, 'Phone is required'),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormConfigOptions {
  t: (key: string) => string;
  onSubmit: (data: RegisterFormData) => Promise<void>;
}

export const createRegisterFormConfig = ({
  t,
  onSubmit,
}: RegisterFormConfigOptions): FormConfig<RegisterFormData> => {
  return {
    formType: 'single-step' as const,
    schema: registerSchema,
    initialValues: {
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
    },
    steps: {
      register: defineStep({
        id: 'register' as const,
        fields: {
          firstName: {
            id: 'firstName' as const,
            type: 'text' as const,
            label: t('First name'),
            placeholder: t('Enter your first name'),
          },
          lastName: {
            id: 'lastName' as const,
            type: 'text' as const,
            label: t('Last name'),
            placeholder: t('Enter your last name'),
          },
          email: {
            id: 'email' as const,
            type: 'text' as const,
            label: t('Email'),
            placeholder: t('Enter your email'),
          },
          phone: {
            id: 'phone' as const,
            type: 'text' as const,
            label: t('Phone'),
            placeholder: t('Enter your phone number'),
          },
        },
      }),
    },
    uiOptions: {
      register: [
        {
          type: 'container',
          style: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
          },
          children: [
            {
              type: 'fieldStyles',
              fieldId: 'firstName',
              style: {},
            },
            {
              type: 'fieldStyles',
              fieldId: 'lastName',
              style: {},
            },
          ],
        },
        {
          type: 'container',
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          },
          children: [
            {
              type: 'fieldStyles',
              fieldId: 'email',
              style: {},
            },
            {
              type: 'fieldStyles',
              fieldId: 'phone',
              style: {},
            },
          ],
        },
      ],
    },
    formControls: {
      submit: {
        label: t('Register'),
        onSubmit,
      },
    },
  };
};
