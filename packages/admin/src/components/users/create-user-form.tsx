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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <RequiredLabel field="email">{t('fields.email')}</RequiredLabel>
              <FormControl>
                <Input type="email" placeholder={t('users.create.emailPlaceholder')} {...field} />
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
              <RequiredLabel field="firstName">{t('fields.firstName')}</RequiredLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder={t('users.create.firstNamePlaceholder')}
                  {...field}
                />
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
              <RequiredLabel field="lastName">{t('fields.lastName')}</RequiredLabel>
              <FormControl>
                <Input type="text" placeholder={t('users.create.lastNamePlaceholder')} {...field} />
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
              <RequiredLabel field="phone">{t('users.create.phoneLabel')}</RequiredLabel>
              <FormControl>
                <Input type="text" placeholder={t('users.create.phonePlaceholder')} {...field} />
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
              <RequiredLabel field="role">{t('fields.role')}</RequiredLabel>
              <Select value={field.value} onValueChange={field.onChange} disabled={field.disabled}>
                <FormControl>
                  <SelectTrigger ref={field.ref} onBlur={field.onBlur}>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="USER">{t('roles.user')}</SelectItem>
                  <SelectItem value="ADMIN">{t('roles.admin')}</SelectItem>
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
              <RequiredLabel field="password">{t('users.create.passwordLabel')}</RequiredLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={t('users.create.passwordPlaceholder')}
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs">
                {t('users.create.passwordHint')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? t('users.create.submitting') : t('users.create.submit')}
        </Button>
      </form>
    </Form>
  );
}
