import type { ComponentPaletteOverrides } from '@arstoien/former';
import type {
  TextInputProps,
  PasswordInputProps,
  SelectProps,
  ErrorMessageProps,
  FieldLabelProps,
  FieldDescriptionProps,
  SubmitButtonProps,
} from '@arstoien/former';
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@arstoien/shared-ui';
import { type CreateUserFormData, createUserSchema } from './create-user-form-schema';

/**
 * Component overrides for create user form
 */
export const createUserFormOverrides = (
  t: (key: string) => string
): ComponentPaletteOverrides<CreateUserFormData> => ({
  TextInput: ({
    id,
    placeholder,
    disabled,
    required,
    value,
    onChange,
    onBlur,
    name,
  }: TextInputProps<CreateUserFormData>) => (
    <Input
      id={id}
      name={name}
      type={id === 'email' ? 'email' : 'text'}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      value={(value as string) ?? ''}
      onChange={onChange}
      onBlur={onBlur}
    />
  ),
  PasswordInput: ({
    id,
    placeholder,
    disabled,
    required,
    value,
    onChange,
    onBlur,
    name,
  }: PasswordInputProps<CreateUserFormData>) => (
    <Input
      id={id}
      name={name}
      type="password"
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      value={(value as string) ?? ''}
      onChange={onChange}
      onBlur={onBlur}
    />
  ),
  Select: ({
    id,
    options,
    disabled,
    value,
    onChange,
    placeholder,
    name,
  }: SelectProps<CreateUserFormData>) => (
    <Select
      value={value as string}
      onValueChange={(newValue) => {
        onChange({
          target: {
            name: name || id,
            value: newValue,
          },
        } as React.ChangeEvent<HTMLSelectElement>);
      }}
      disabled={disabled}
    >
      <SelectTrigger id={id}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options?.map((option: { value: string; label: string }) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ),
  FieldLabel: ({ htmlFor, label }: FieldLabelProps) => {
    const fieldId = htmlFor;
    const isRequired =
      !createUserSchema.shape[fieldId as keyof typeof createUserSchema.shape]?.isOptional();

    return (
      <Label htmlFor={htmlFor}>
        {label} {isRequired && <span className="text-destructive">*</span>}
      </Label>
    );
  },
  ErrorMessage: ({ message }: ErrorMessageProps) => (
    <p className="text-destructive mt-1 text-sm">{message}</p>
  ),
  FieldDescription: ({ description }: FieldDescriptionProps) => (
    <p className="text-muted-foreground mt-1 text-xs">{description}</p>
  ),
  SubmitButton: ({ label, isSubmitting, disabled }: SubmitButtonProps) => (
    <Button type="submit" className="w-full" disabled={disabled ?? isSubmitting}>
      {isSubmitting ? t('Creating...') : label}
    </Button>
  ),
});
