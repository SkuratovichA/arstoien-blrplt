import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CreateUserForm } from './create-user-form';
import type { CreateUserFormData } from './create-user-form-schema';

const setup = () => {
  const onSubmit = vi
    .fn<(data: CreateUserFormData) => Promise<void>>()
    .mockResolvedValue(undefined);
  const user = userEvent.setup();
  render(<CreateUserForm onSubmit={onSubmit} />);
  return { onSubmit, user };
};

const fillRequired = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText(/^Email/), 'ada@example.com');
  await user.type(screen.getByLabelText(/^First Name/), 'Ada');
  await user.type(screen.getByLabelText(/^Last Name/), 'Lovelace');
};

describe('CreateUserForm', () => {
  it('marks exactly the required fields with an asterisk', () => {
    setup();

    expect(screen.getAllByText('*')).toHaveLength(3);
    expect(screen.getByLabelText(/^Email/).closest('div')?.textContent).toContain('*');
    expect(screen.getByLabelText(/^Phone/).closest('div')?.textContent).not.toContain('*');
  });

  it('shows the messages of the required fields and does not submit an empty form', async () => {
    const { onSubmit, user } = setup();

    await user.click(screen.getByRole('button', { name: 'Create User' }));

    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('First name is required')).toBeInTheDocument();
    expect(screen.getByText('Last name is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects a malformed email address and a short password', async () => {
    const { onSubmit, user } = setup();

    await fillRequired(user);
    await user.clear(screen.getByLabelText(/^Email/));
    await user.type(screen.getByLabelText(/^Email/), 'not-an-email');
    await user.type(screen.getByLabelText(/^Password/), 'short');
    await user.click(screen.getByRole('button', { name: 'Create User' }));

    expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the required fields with the USER role and empty optional fields', async () => {
    const { onSubmit, user } = setup();

    await fillRequired(user);
    await user.click(screen.getByRole('button', { name: 'Create User' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({
      email: 'ada@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: '',
      role: 'USER',
      password: '',
    });
  });

  it('submits the role picked from the select', async () => {
    const { onSubmit, user } = setup();

    await fillRequired(user);
    await user.click(screen.getByRole('combobox', { name: /^Role/ }));
    await user.click(await screen.findByRole('option', { name: 'Admin' }));
    await user.click(screen.getByRole('button', { name: 'Create User' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({ role: 'ADMIN' });
  });
});
