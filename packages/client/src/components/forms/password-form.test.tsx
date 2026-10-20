import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PasswordChangeForm } from './password-form';
import type { PasswordChangeFormData } from './password-form-schema';

const setup = (changed = true) => {
  const onSubmit = vi
    .fn<(data: PasswordChangeFormData) => Promise<boolean>>()
    .mockResolvedValue(changed);
  const user = userEvent.setup();
  render(<PasswordChangeForm onSubmit={onSubmit} />);
  return { onSubmit, user };
};

const fillValid = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText('Current Password'), 'current-password');
  await user.type(screen.getByLabelText('New Password'), 'brand-new-password');
  await user.type(screen.getByLabelText('Confirm Password'), 'brand-new-password');
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

  it('checks the confirmation again when the new password is corrected to match it', async () => {
    const { user } = setup();

    await user.type(screen.getByLabelText('New Password'), 'brand-new-passwor');
    await user.type(screen.getByLabelText('Confirm Password'), 'brand-new-password');
    await user.tab();
    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();

    await user.type(screen.getByLabelText('New Password'), 'd');

    await waitFor(() =>
      expect(screen.queryByText('Passwords do not match')).not.toBeInTheDocument()
    );
  });

  it('does not report a mismatch before the confirmation has been typed', async () => {
    const { user } = setup();

    await user.type(screen.getByLabelText('New Password'), 'brand-new-password');

    expect(screen.queryByText('Passwords do not match')).not.toBeInTheDocument();
  });

  it('submits all three passwords when they are valid', async () => {
    const { onSubmit, user } = setup();

    await fillValid(user);
    await user.click(screen.getByRole('button', { name: 'Change Password' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({
      currentPassword: 'current-password',
      newPassword: 'brand-new-password',
      confirmPassword: 'brand-new-password',
    });
  });

  it('clears the three passwords once the change went through', async () => {
    const { user } = setup(true);

    await fillValid(user);
    await user.click(screen.getByRole('button', { name: 'Change Password' }));

    await waitFor(() => expect(screen.getByLabelText('Current Password')).toHaveValue(''));
    expect(screen.getByLabelText('New Password')).toHaveValue('');
    expect(screen.getByLabelText('Confirm Password')).toHaveValue('');
  });

  it('keeps the three passwords when the change did not go through', async () => {
    const { onSubmit, user } = setup(false);

    await fillValid(user);
    await user.click(screen.getByRole('button', { name: 'Change Password' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Change Password' })).toBeEnabled()
    );
    expect(screen.getByLabelText('Current Password')).toHaveValue('current-password');
    expect(screen.getByLabelText('New Password')).toHaveValue('brand-new-password');
    expect(screen.getByLabelText('Confirm Password')).toHaveValue('brand-new-password');
  });
});
