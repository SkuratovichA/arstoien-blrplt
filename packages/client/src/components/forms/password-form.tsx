import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  PasswordInput,
} from '@blrplt/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { PasswordChangeFormData } from './password-form-schema';
import { passwordChangeSchema } from './password-form-schema';

interface PasswordChangeFormProps {
  /** Resolves to true when the password was changed, which clears the form; false keeps what the user typed so they can correct it */
  onSubmit: (data: PasswordChangeFormData) => Promise<boolean>;
}

export function PasswordChangeForm({ onSubmit }: PasswordChangeFormProps) {
  const { t } = useTranslation();

  const form = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const submit = async (data: PasswordChangeFormData) => {
    if (await onSubmit(data)) {
      form.reset();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Current Password')}</FormLabel>
              <FormControl>
                <PasswordInput placeholder={t('Enter your current password')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('New Password')}</FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder={t('Enter your new password')}
                  {...field}
                  onChange={(event) => {
                    field.onChange(event);
                    // The mismatch message sits on the confirmation, so it is checked again when the password it is compared with changes
                    if (form.getValues('confirmPassword')) {
                      form.trigger('confirmPassword');
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Confirm Password')}</FormLabel>
              <FormControl>
                <PasswordInput placeholder={t('Confirm your new password')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? t('Loading...') : t('Change Password')}
        </Button>
      </form>
    </Form>
  );
}
