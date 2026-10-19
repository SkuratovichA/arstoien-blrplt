import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from '@blrplt/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { ProfileUpdateFormData } from './profile-form-schema';
import { profileUpdateSchema } from './profile-form-schema';

interface ProfileUpdateFormProps {
  initialValues: ProfileUpdateFormData;
  onSubmit: (data: ProfileUpdateFormData) => Promise<void>;
}

export function ProfileUpdateForm({ initialValues, onSubmit }: ProfileUpdateFormProps) {
  const { t } = useTranslation();

  const form = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: initialValues,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('First Name')}</FormLabel>
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
              <FormLabel>{t('Last Name')}</FormLabel>
              <FormControl>
                <Input type="text" placeholder={t('Doe')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? t('Loading...') : t('Update Profile')}
        </Button>
      </form>
    </Form>
  );
}
