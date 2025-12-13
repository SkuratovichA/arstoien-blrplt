import { forwardRef } from 'react';
import type { ComponentPaletteOverrides } from '@arstoien/former';
import type {
  TextInputProps,
  PasswordInputProps,
  ErrorMessageProps,
  FieldLabelProps,
  FieldDescriptionProps,
  SubmitButtonProps,
  NextButtonProps,
  PrevButtonProps,
  FieldValues,
} from '@arstoien/former';
import { Button, Input, PasswordInput, Label } from '@arstoien/shared-ui';

/**
 * Generic component overrides for Former forms in the client package
 */
export const createFormComponentOverrides = <T extends FieldValues>(
  t: (key: string) => string
): ComponentPaletteOverrides<T> => ({
  TextInput: forwardRef<HTMLInputElement, TextInputProps<T>>((props, ref) => {
    const { id, placeholder, disabled, required, value, onChange, onBlur, name, ...rest } = props;
    return (
      <Input
        ref={ref}
        id={id}
        name={name || id}
        type="text"
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        value={value ?? ''}
        onChange={onChange}
        onBlur={onBlur}
        {...rest}
      />
    );
  }),

  PasswordInput: forwardRef<HTMLInputElement, PasswordInputProps<T>>((props, ref) => {
    const { id, placeholder, disabled, required, value, onChange, onBlur, name, ...rest } = props;
    return (
      <PasswordInput
        ref={ref}
        id={id}
        name={name || id}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        value={value ?? ''}
        onChange={onChange}
        onBlur={onBlur}
        {...rest}
      />
    );
  }),

  FieldLabel: ({ htmlFor, label }: FieldLabelProps) => {
    return <Label htmlFor={htmlFor}>{label}</Label>;
  },

  ErrorMessage: ({ message }: ErrorMessageProps) => (
    <p className="text-destructive mt-1 text-sm">{message}</p>
  ),

  FieldDescription: ({ description }: FieldDescriptionProps) => (
    <p className="text-muted-foreground mt-1 text-xs">{description}</p>
  ),

  SubmitButton: ({ label, isSubmitting, disabled }: SubmitButtonProps) => (
    <Button
      type="submit"
      className="w-full bg-gray-900 text-white hover:bg-gray-800 border border-gray-900"
      disabled={disabled ?? isSubmitting}
    >
      {isSubmitting ? t('Loading...') : label}
    </Button>
  ),

  NextButton: ({ label, onClick, disabled }: NextButtonProps) => (
    <Button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full bg-gray-900 text-white hover:bg-gray-800 border border-gray-900"
    >
      {label}
    </Button>
  ),

  PrevButton: ({ label, onClick, disabled }: PrevButtonProps) => (
    <Button
      type="button"
      onClick={onClick}
      disabled={disabled}
      variant="outline"
      className="w-full border-gray-300 text-gray-900 hover:bg-gray-50"
    >
      {label}
    </Button>
  ),
});
