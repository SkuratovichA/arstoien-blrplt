import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PasswordChangeForm } from './password-form';
import type { PasswordChangeFormData } from './password-form-schema';

const setup = () => {
  const onSubmit = vi
    .fn<(data: PasswordChangeFormData) => Promise<void>>()
    .mockResolvedValue(undefined);
  const user = userEvent.setup();
  render(<PasswordChangeForm onSubmit={onSubmit} />);
  return { onSubmit, user };
};

describe('PasswordChangeForm', () => {
  it('requires the current and the new password to have at least 8 characters', async () => {
    const { onSubmit, user } = setup();

    await user.type(screen.getByLabelText('Current Password'), 'short');
    await user.type(screen.getByLabelText('New Password'), 'tiny');
    await user.type(screen.getByLabelText('Confirm Password'), 'tiny');
    await user.click(screen.getByRole('button', { name: 'Change Password' }));

    const messages = await screen.findAllByText('Password must be at least 8 characters');
    expect(messages).toHaveLength(2);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('reports a confirmation that differs from the new password', async () => {
    const { onSubmit, user } = setup();

    await user.type(screen.getByLabelText('Current Password'), 'current-password');
    await user.type(screen.getByLabelText('New Password'), 'brand-new-password');
    await user.type(screen.getByLabelText('Confirm Password'), 'another-password');
    await user.click(screen.getByRole('button', { name: 'Change Password' }));

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits all three passwords when they are valid', async () => {
    const { onSubmit, user } = setup();

    await user.type(screen.getByLabelText('Current Password'), 'current-password');
    await user.type(screen.getByLabelText('New Password'), 'brand-new-password');
    await user.type(screen.getByLabelText('Confirm Password'), 'brand-new-password');
    await user.click(screen.getByRole('button', { name: 'Change Password' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({
      currentPassword: 'current-password',
      newPassword: 'brand-new-password',
      confirmPassword: 'brand-new-password',
    });
  });
});
