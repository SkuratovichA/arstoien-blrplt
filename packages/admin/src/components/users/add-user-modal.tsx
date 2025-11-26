import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { Former } from '@arstoien/former';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@arstoien/shared-ui';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import { CREATE_USER_MUTATION } from '@/graphql/users.graphql';
import { createUserFormConfig } from './create-user-form-config';
import { type CreateUserFormData } from './create-user-form-schema';
import { createUserFormOverrides } from './create-user-form-overrides';

interface AddUserModalProps {
  onUserCreated?: () => void;
}

export function AddUserModal({ onUserCreated }: AddUserModalProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [createUser] = useMutation(CREATE_USER_MUTATION);

  const handleSubmit = async (data: CreateUserFormData) => {
    try {
      const result = await createUser({
        variables: {
          input: {
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone || undefined,
            role: data.role,
            password: data.password || undefined,
          },
        },
      });

      if (result.data?.createUser) {
        toast.success(t('User created successfully'));
        setIsOpen(false);
        onUserCreated?.();
      }
    } catch (error) {
      console.error('Create user error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user. Please try again.';
      toast.error(t(errorMessage));
      throw error;
    }
  };

  const formConfig = createUserFormConfig({
    t,
    onSubmit: handleSubmit,
  });

  const formOverrides = createUserFormOverrides(t);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {t('Add User')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('Create User')}</DialogTitle>
          <DialogDescription>
            {t('Add a new user to the system. Required fields are marked with an asterisk (*)')}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <Former config={formConfig} componentOverrides={formOverrides} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
