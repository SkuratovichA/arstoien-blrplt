import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PasswordInput } from './password-input';

describe('PasswordInput', () => {
  it('hides the value until the toggle is pressed', async () => {
    render(<PasswordInput placeholder="Password" />);
    const input = screen.getByPlaceholderText('Password');

    expect(input).toHaveAttribute('type', 'password');

    await userEvent.click(screen.getByRole('button'));
    expect(input).toHaveAttribute('type', 'text');

    await userEvent.click(screen.getByRole('button'));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('forwards typing to the input', async () => {
    render(<PasswordInput placeholder="Password" />);

    await userEvent.type(screen.getByPlaceholderText('Password'), 'hunter22');

    expect(screen.getByPlaceholderText('Password')).toHaveValue('hunter22');
  });
});
