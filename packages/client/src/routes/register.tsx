import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@apollo/client/react';
import { Former } from '@arstoien/former';
import { AuthLayout } from '@components/layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@arstoien/shared-ui';
import { REGISTER_CARRIER, REGISTER_CUSTOMER } from '../graphql/auth.graphql.ts';
import { type AuthGuardContext, requireGuest } from '../lib/auth-guard';
import { createFormComponentOverrides } from '../components/forms/form-component-overrides';
import {
  createRegisterFormConfig,
  type RegisterFormData,
} from '../components/forms/multi-step-register-form-config';
import { UserRole } from '@/gql/graphql.ts';
// import { match } from 'ts-pattern';
import toast from 'react-hot-toast';

export const Route = createFileRoute('/register')({
  beforeLoad: ({ context }) => {
    requireGuest(context as AuthGuardContext);
  },
  component: Register,
});

function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [registerCustomer] = useMutation(REGISTER_CUSTOMER);
  const [registerCarrier] = useMutation(REGISTER_CARRIER);

  const onSubmit = async (inputData: RegisterFormData) => {
    const result = await (async () => {
      switch (inputData.role) {
        case UserRole.Customer:
          const { data: res1, error: err1 } = await registerCustomer({
            variables: {
              input: {
                email: inputData.email,
                firstName: inputData.firstName!,
                lastName: inputData.lastName!,
                phone: inputData.phone!,
              },
            },
          });
          if (res1 && !err1) {
            return res1.registerCustomer;
          }
          toast.error(t('Registration failed: ' + err1?.message));
          return null;
        case UserRole.Carrier:
          const { data: res2, error: err2 } = await registerCarrier({
            variables: {
              input: {
                companyName: inputData.companyName!,
                email: inputData.email,
                contactPerson: inputData.contactPerson!,
                identificationNumber: inputData.identificationNumber!,
                identificationNumberType: inputData.identificationNumberType!,
                operatingRegion: inputData.operatingRegion!,
              },
            },
          });
          if (res2 && !err2) {
            return res2.registerCarrier;
          }
          toast.error(t('Registration failed: ' + err2?.message));
          return null;
      }
    })();

    if (result) {
      toast.success(result.message ?? t('Registration successful'));
      navigate({ to: '/login' });
    }
  };

  // Create form configuration
  const formConfig = createRegisterFormConfig({
    t,
    onSubmit,
  });

  // Create component overrides
  const componentOverrides = createFormComponentOverrides<RegisterFormData>(t)

  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle>{t('Register')}</CardTitle>
          <CardDescription>{t('Create a new account')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Former<RegisterFormData> config={formConfig} componentOverrides={componentOverrides} />
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-muted-foreground text-sm">
            {t('Already have an account?')}{' '}
            <Link to="/login" className="text-foreground hover:underline">
              {t('Sign in')}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}
