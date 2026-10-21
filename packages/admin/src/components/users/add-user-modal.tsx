import { useMutation } from '@apollo/client/react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@blrplt/ui';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { CREATE_USER_MUTATION } from '@/graphql/users.graphql';
import { CreateUserForm } from './create-user-form';
import type { CreateUserFormData } from './create-user-form-schema';

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
        toast.success(t('users.create.success'));
        setIsOpen(false);
        onUserCreated?.();
      }
    } catch (error) {
      console.error('Create user error:', error);
      toast.error(t('users.create.error'));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {t('users.add')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('users.create.title')}</DialogTitle>
          <DialogDescription>{t('users.create.description')}</DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <CreateUserForm onSubmit={handleSubmit} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
