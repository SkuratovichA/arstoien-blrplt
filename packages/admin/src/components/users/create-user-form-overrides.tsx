import React, { forwardRef } from 'react';
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
  TextInput: forwardRef<HTMLInputElement, TextInputProps<CreateUserFormData>>((props, ref) => {
    const { id, placeholder, disabled, required, value, onChange, onBlur, name, ...rest } = props;
    return (
      <Input
        ref={ref}
        id={id}
        name={name || id}
        type={id === 'email' ? 'email' : 'text'}
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
  PasswordInput: forwardRef<HTMLInputElement, PasswordInputProps<CreateUserFormData>>(
    (props, ref) => {
      const { id, placeholder, disabled, required, value, onChange, onBlur, name, ...rest } =
        props;
      return (
        <Input
          ref={ref}
          id={id}
          name={name || id}
          type="password"
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          value={value ?? ''}
          onChange={onChange}
          onBlur={onBlur}
          {...rest}
        />
      );
    }
  ),
  Select: forwardRef<HTMLButtonElement, SelectProps<CreateUserFormData>>((props, ref) => {
    const { id, options, disabled, value, onChange, placeholder, name } = props;
    return (
      <Select
        value={value as string}
        onValueChange={(newValue) => {
          // Create a synthetic event that matches what react-hook-form expects
          const syntheticEvent = {
            target: {
              name: name || id,
              value: newValue,
            },
            type: 'change',
          } as React.ChangeEvent<HTMLSelectElement>;
          onChange(syntheticEvent);
        }}
        disabled={disabled}
      >
        <SelectTrigger ref={ref} id={id}>
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
    );
  }),
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
