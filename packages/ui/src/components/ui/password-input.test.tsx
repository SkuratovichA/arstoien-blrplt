import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PasswordInput } from './password-input';

describe('PasswordInput', () => {
  it('hides the value until the toggle is pressed', async () => {
    render(<PasswordInput placeholder="Password" />);
    const input = screen.getByPlaceholderText('Password');

    expect(input).toHaveAttribute('type', 'password');

    await userEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(input).toHaveAttribute('type', 'text');

    await userEvent.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('names the toggle and tells whether the password is shown', async () => {
    render(
      <PasswordInput placeholder="Password" showLabel="Zobrazit heslo" hideLabel="Skrýt heslo" />
    );

    const toggle = screen.getByRole('button', { name: 'Zobrazit heslo' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(toggle);
    expect(screen.getByRole('button', { name: 'Skrýt heslo' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('can be reached with the keyboard after the field', async () => {
    render(<PasswordInput placeholder="Password" />);

    await userEvent.tab();
    expect(screen.getByPlaceholderText('Password')).toHaveFocus();

    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Show password' })).toHaveFocus();
  });

  it('keeps room for the toggle next to the text and the class of the caller', () => {
    render(<PasswordInput placeholder="Password" className="w-1/2" />);

    expect(screen.getByPlaceholderText('Password')).toHaveClass('pr-10', 'w-1/2');
  });

  it('forwards typing to the input', async () => {
    render(<PasswordInput placeholder="Password" />);

    await userEvent.type(screen.getByPlaceholderText('Password'), 'hunter22');

    expect(screen.getByPlaceholderText('Password')).toHaveValue('hunter22');
  });
});
