import type { FormConfig } from '@arstoien/former';
import { defineStep } from '@arstoien/former';
import { z } from 'zod';

export const profileUpdateSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;

interface ProfileFormConfigOptions {
  t: (key: string) => string;
  onSubmit: (data: ProfileUpdateFormData) => Promise<void>;
  initialValues?: ProfileUpdateFormData;
}

export const createProfileUpdateFormConfig = ({
  t,
  onSubmit,
  initialValues,
}: ProfileFormConfigOptions): FormConfig<ProfileUpdateFormData> => {
  return {
    formType: 'single-step' as const,
    schema: profileUpdateSchema,
    initialValues,
    steps: {
      profile: defineStep({
        id: 'profile' as const,
        fields: {
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
        },
      }),
    },
    uiOptions: {
      profile: [
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
      ],
    },
    formControls: {
      submit: {
        label: t('Update Profile'),
        onSubmit,
      },
    },
  };
};
