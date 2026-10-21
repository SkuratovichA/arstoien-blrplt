import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ProfileUpdateForm } from './profile-form';
import type { ProfileUpdateFormData } from './profile-form-schema';

const setup = () => {
  const onSubmit = vi
    .fn<(data: ProfileUpdateFormData) => Promise<void>>()
    .mockResolvedValue(undefined);
  const user = userEvent.setup();
  render(
    <ProfileUpdateForm
      initialValues={{ firstName: 'Ada', lastName: 'Lovelace' }}
      onSubmit={onSubmit}
    />
  );
  return { onSubmit, user };
};

describe('ProfileUpdateForm', () => {
  it('starts with the values of the current user', () => {
    setup();

    expect(screen.getByLabelText('First Name')).toHaveValue('Ada');
    expect(screen.getByLabelText('Last Name')).toHaveValue('Lovelace');
  });

  it('submits the edited values', async () => {
    const { onSubmit, user } = setup();

    await user.clear(screen.getByLabelText('First Name'));
    await user.type(screen.getByLabelText('First Name'), 'Augusta');
    await user.click(screen.getByRole('button', { name: 'Update Profile' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({ firstName: 'Augusta', lastName: 'Lovelace' });
  });

  it('accepts empty names because both fields are optional', async () => {
    const { onSubmit, user } = setup();

    await user.clear(screen.getByLabelText('First Name'));
    await user.clear(screen.getByLabelText('Last Name'));
    await user.click(screen.getByRole('button', { name: 'Update Profile' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({ firstName: '', lastName: '' });
  });
});
