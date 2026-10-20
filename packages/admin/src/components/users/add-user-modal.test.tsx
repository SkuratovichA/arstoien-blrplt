import type { MockLink } from '@apollo/client/testing';
import { MockedProvider } from '@apollo/client/testing/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toaster } from 'react-hot-toast';
import { describe, expect, it, vi } from 'vitest';
import { CREATE_USER_MUTATION } from '@/graphql/users.graphql';
import { AddUserModal } from './add-user-modal';

const createdUser = {
  __typename: 'User' as const,
  id: 'user-1',
  email: 'ada@example.com',
  firstName: 'Ada',
  lastName: 'Lovelace',
  phone: null,
  role: 'USER' as const,
  status: 'ACTIVE' as const,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const setup = (response: Pick<MockLink.MockedResponse, 'result' | 'error'>) => {
  const variableMatcher = vi.fn<(variables: Record<string, unknown>) => boolean>(() => true);
  const onUserCreated = vi.fn();
  const mocks: MockLink.MockedResponse[] = [
    { request: { query: CREATE_USER_MUTATION, variables: variableMatcher }, ...response },
  ];
  const user = userEvent.setup({ pointerEventsCheck: 0 });

  render(
    <>
      <MockedProvider mocks={mocks}>
        <AddUserModal onUserCreated={onUserCreated} />
      </MockedProvider>
      <Toaster />
    </>
  );

  return { variableMatcher, onUserCreated, user };
};

const openAndFill = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: 'Add User' }));
  await user.type(await screen.findByLabelText(/^Email/), 'ada@example.com');
  await user.type(screen.getByLabelText(/^First Name/), 'Ada');
  await user.type(screen.getByLabelText(/^Last Name/), 'Lovelace');
};

describe('AddUserModal', () => {
  it('creates the user without sending the empty optional fields, then closes', async () => {
    const { variableMatcher, onUserCreated, user } = setup({
      result: { data: { createUser: createdUser } },
    });

    await openAndFill(user);
    await user.click(screen.getByRole('button', { name: 'Create User' }));

    await waitFor(() => expect(onUserCreated).toHaveBeenCalledTimes(1));
    expect(variableMatcher).toHaveBeenCalledWith({
      input: {
        email: 'ada@example.com',
        firstName: 'Ada',
        lastName: 'Lovelace',
        phone: undefined,
        role: 'USER',
        password: undefined,
      },
    });
    expect(await screen.findByText('User created successfully')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('keeps the dialog open and reports the failure in the text of the catalog, not in the text of the error', async () => {
    const { onUserCreated, user } = setup({ error: new Error('Email already in use') });

    await openAndFill(user);
    await user.click(screen.getByRole('button', { name: 'Create User' }));

    expect(await screen.findByText('Failed to create user. Please try again.')).toBeInTheDocument();
    expect(screen.queryByText('Email already in use')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(onUserCreated).not.toHaveBeenCalled();
  });
});
