import type { FormConfig } from '@arstoien/former';
import { defineStep } from '@arstoien/former';
import { z } from 'zod';
import { ButtonGroupField } from './button-group-field';
import { UserRole } from "@/gql/graphql.ts";

// Combined schema
export const multiStepRegisterSchema = z.object({
  role: z.enum([UserRole.Carrier, UserRole.Customer, '']),
  // Customer fields - all required when Customer role is selected
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  // Carrier fields - all required when Carrier role is selected
  companyName: z.string().optional(),
  contactPerson: z.string().optional(),
  identificationNumber: z.string().optional(),
  identificationNumberType: z.enum(['ICO', 'NIP', 'OTHER', '']).optional(),
  operatingRegion: z.enum(['Czechia', 'Slovakia', 'Poland', '']).optional(),
  // Common field - required for submission
  email: z.string(),
});

export type RegisterFormData = z.infer<typeof multiStepRegisterSchema>;

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
    schema: multiStepRegisterSchema,
    initialValues: {
      role: '',
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      companyName: '',
      contactPerson: '',
      identificationNumber: '',
      identificationNumberType: '',
      operatingRegion: '',
    },
    steps: {
      registrationDetails: defineStep({
        id: 'registrationDetails' as const,
        title: t('Registration Details'),
        description: t('Tell us about yourself'),
        fields: {
          role: {
            id: 'role' as const,
            type: 'select' as const,
            label: t('Account Type'),
            placeholder: t('Select your role'),
            options: [
              { label: t('Carrier'), value: UserRole.Carrier },
              { label: t('Customer'), value: UserRole.Customer },
            ],
            component: ButtonGroupField,
          },
          // Customer fields - shown only when role is UserRole.Customer
          firstName: {
            id: 'firstName' as const,
            type: 'text' as const,
            label: t('First name'),
            placeholder: t('Enter your first name'),
            hiddenCondition: (values) => values.role !== UserRole.Customer,
          },
          lastName: {
            id: 'lastName' as const,
            type: 'text' as const,
            label: t('Last name'),
            placeholder: t('Enter your last name'),
            hiddenCondition: (values) => values.role !== UserRole.Customer,
          },
          // Carrier fields - shown only when role is UserRole.Carrier
          companyName: {
            id: 'companyName' as const,
            type: 'text' as const,
            label: t('Company name'),
            placeholder: t('Enter your company name'),
            hiddenCondition: (values) => values.role !== UserRole.Carrier,
          },
          contactPerson: {
            id: 'contactPerson' as const,
            type: 'text' as const,
            label: t('Contact person'),
            placeholder: t('Enter contact person name'),
            hiddenCondition: (values) => values.role !== UserRole.Carrier,
          },
          identificationNumber: {
            id: 'identificationNumber' as const,
            type: 'text' as const,
            label: t('Company Identification Number (IČO/NIP)'),
            placeholder: t('Enter your company identification number'),
            hiddenCondition: (values) => values.role !== UserRole.Carrier,
          },
          identificationNumberType: {
            id: 'identificationNumberType' as const,
            type: 'select' as const,
            label: t('Identification Type'),
            placeholder: t('Select identification type'),
            options: [
              { label: t('IČO (Czech/Slovakia)'), value: 'ICO' },
              { label: t('NIP (Poland)'), value: 'NIP' },
              { label: t('Other'), value: 'OTHER' },
            ],
            hiddenCondition: (values) => values.role !== UserRole.Carrier,
          },
          operatingRegion: {
            id: 'operatingRegion' as const,
            type: 'select' as const,
            label: t('Operating region'),
            placeholder: t('Select your operating region'),
            options: [
              { label: t('Czechia'), value: 'Czechia' },
              { label: t('Slovakia'), value: 'Slovakia' },
              { label: t('Poland'), value: 'Poland' },
            ],
            hiddenCondition: (values) => values.role !== UserRole.Carrier,
          },
          // Common field - email (shown for both roles)
          email: {
            id: 'email' as const,
            type: 'text' as const,
            label: t('Email'),
            placeholder: t('Enter your email'),
            hiddenCondition: (values) => values.role === '',
          },
          // Customer optional field
          phone: {
            id: 'phone' as const,
            type: 'text' as const,
            label: t('Phone'),
            placeholder: t('Enter your phone number'),
            hiddenCondition: (values) => values.role !== UserRole.Customer,
          },
        },
      }),
    },
    uiOptions: {
      registrationDetails: [
        {
          type: 'container',
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            width: '100%'
          },
          children: [
            {
              type: 'fieldStyles',
              fieldId: 'role',
              style: {},
            },
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
            {
              type: 'fieldStyles',
              fieldId: 'companyName',
              style: {},
            },
            {
              type: 'fieldStyles',
              fieldId: 'contactPerson',
              style: {},
            },
            {
              type: 'fieldStyles',
              fieldId: 'identificationNumber',
              style: {},
            },
            {
              type: 'fieldStyles',
              fieldId: 'identificationNumberType',
              style: {},
            },
            {
              type: 'fieldStyles',
              fieldId: 'operatingRegion',
              style: {},
            },
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
      nextStep: {
        label: t('Next'),
        tooltip: t('Continue to next step'),
      },
      prevStep: {
        label: t('Back'),
        tooltip: t('Go back to previous step'),
      },
    },
  };
};
