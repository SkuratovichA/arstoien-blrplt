import {
  Button,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@blrplt/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { z } from 'zod';
import type { CreateUserFormData } from './create-user-form-schema';
import { createUserSchema } from './create-user-form-schema';

type CreateUserFormInput = z.input<typeof createUserSchema>;

interface CreateUserFormProps {
  onSubmit: (data: CreateUserFormData) => Promise<void>;
}

type CreateUserField = keyof typeof createUserSchema.shape;

const isRequired = (field: CreateUserField) =>
  !createUserSchema.shape[field].safeParse(undefined).success;

function RequiredLabel({ field, children }: { field: CreateUserField; children: ReactNode }) {
  return (
    <FormLabel>
      {children} {isRequired(field) && <span className="text-destructive">*</span>}
    </FormLabel>
  );
}

export function CreateUserForm({ onSubmit }: CreateUserFormProps) {
  const { t } = useTranslation();

  const form = useForm<CreateUserFormInput, undefined, CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      role: 'USER',
      password: '',
    },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <RequiredLabel field="email">{t('Email')}</RequiredLabel>
              <FormControl>
                <Input type="email" placeholder={t('user@example.com')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <RequiredLabel field="firstName">{t('First Name')}</RequiredLabel>
              <FormControl>
                <Input type="text" placeholder={t('John')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <RequiredLabel field="lastName">{t('Last Name')}</RequiredLabel>
              <FormControl>
                <Input type="text" placeholder={t('Doe')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <RequiredLabel field="phone">{t('Phone (optional)')}</RequiredLabel>
              <FormControl>
                <Input type="text" placeholder={t('+1 234 567 8900')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <RequiredLabel field="role">{t('Role')}</RequiredLabel>
              <Select value={field.value} onValueChange={field.onChange} disabled={field.disabled}>
                <FormControl>
                  <SelectTrigger ref={field.ref} onBlur={field.onBlur}>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="USER">{t('User')}</SelectItem>
                  <SelectItem value="ADMIN">{t('Admin')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <RequiredLabel field="password">{t('Password (optional)')}</RequiredLabel>
              <FormControl>
                <Input type="password" placeholder={t('Leave empty to auto-generate')} {...field} />
              </FormControl>
              <FormDescription className="text-xs">
                {t('If left empty, a temporary password will be generated and sent via email')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? t('Creating...') : t('Create User')}
        </Button>
      </form>
    </Form>
  );
}
