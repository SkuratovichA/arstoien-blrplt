import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RegisterForm } from './register-form';
import type { RegisterFormData } from './register-form-schema';

const setup = () => {
  const onSubmit = vi.fn<(data: RegisterFormData) => Promise<void>>().mockResolvedValue(undefined);
  const user = userEvent.setup();
  render(<RegisterForm onSubmit={onSubmit} />);
  return { onSubmit, user };
};

describe('RegisterForm', () => {
  it('shows every validation message and does not submit an empty form', async () => {
    const { onSubmit, user } = setup();

    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(await screen.findByText('First name is required')).toBeInTheDocument();
    expect(screen.getByText('Last name is required')).toBeInTheDocument();
    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText('Phone is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('drops a message as soon as the field value becomes valid', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: 'Register' }));
    expect(await screen.findByText('First name is required')).toBeInTheDocument();

    await user.type(screen.getByLabelText('First name'), 'Ada');

    await waitFor(() =>
      expect(screen.queryByText('First name is required')).not.toBeInTheDocument()
    );
  });

  it('rejects a malformed email address', async () => {
    const { onSubmit, user } = setup();

    await user.type(screen.getByLabelText('First name'), 'Ada');
    await user.type(screen.getByLabelText('Last name'), 'Lovelace');
    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.type(screen.getByLabelText('Phone'), '+420123456789');
    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the typed values once the form is valid', async () => {
    const { onSubmit, user } = setup();

    await user.type(screen.getByLabelText('First name'), 'Ada');
    await user.type(screen.getByLabelText('Last name'), 'Lovelace');
    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Phone'), '+420123456789');
    await user.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({
      email: 'ada@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: '+420123456789',
    });
  });
});
