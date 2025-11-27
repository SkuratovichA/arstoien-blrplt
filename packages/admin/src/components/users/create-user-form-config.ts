import { defineStep } from '@arstoien/former';
import { type CreateUserFormData, createUserSchema } from './create-user-form-schema';

interface FormConfigOptions {
  t: (key: string) => string;
  onSubmit: (data: CreateUserFormData) => Promise<void>;
}

export const createUserFormConfig = ({ t, onSubmit }: FormConfigOptions) => {
  return {
    formType: 'single-step' as const,
    schema: createUserSchema,
    steps: {
      createUser: defineStep({
        id: 'createUser' as const,
        fields: {
          email: {
            id: 'email' as const,
            type: 'text' as const,
            label: t('Email'),
            placeholder: t('user@example.com'),
          },
          firstName: {
            id: 'firstName' as const,
            type: 'text' as const,
            label: t('First Name'),
            placeholder: t('John'),
          },
          lastName: {
            id: 'lastName' as const,
            type: 'text' as const,
            label: t('Last Name'),
            placeholder: t('Doe'),
          },
          phone: {
            id: 'phone' as const,
            type: 'text' as const,
            label: t('Phone (optional)'),
            placeholder: t('+1 234 567 8900'),
          },
          role: {
            id: 'role' as const,
            type: 'select' as const,
            label: t('Role'),
            options: [
              { value: 'USER', label: t('User') },
              { value: 'ADMIN', label: t('Admin') },
            ],
          },
          password: {
            id: 'password' as const,
            type: 'password' as const,
            label: t('Password (optional)'),
            placeholder: t('Leave empty to auto-generate'),
            description: t(
              'If left empty, a temporary password will be generated and sent via email'
            ),
          },
        },
      }),
    },
    formControls: {
      submit: {
        label: t('Create User'),
        onSubmit,
      },
    },
  };
};
