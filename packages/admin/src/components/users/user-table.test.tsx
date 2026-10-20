import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import en from '@/locales/en/translation.json';
import { UserTable } from './user-table';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, params }: { children: ReactNode; params: { id: string } }) => (
    <a href={`/users/${params.id}`}>{children}</a>
  ),
}));

const ada = {
  id: 'u1',
  email: 'ada@example.com',
  firstName: 'Ada',
  lastName: 'Lovelace',
  role: 'ADMIN',
  status: 'ACTIVE' as const,
  emailVerified: true,
  createdAt: '2026-01-02T00:00:00.000Z',
  lastLoginAt: null,
};

const grace = {
  ...ada,
  id: 'u2',
  email: 'grace@example.com',
  firstName: 'Grace',
  lastName: 'Hopper',
  role: 'USER',
  status: 'SUSPENDED' as const,
  emailVerified: false,
};

function renderTable(overrides: Partial<Parameters<typeof UserTable>[0]> = {}) {
  const onPaginationChange = vi.fn();
  render(
    <UserTable
      users={[ada, grace]}
      totalCount={2}
      pagination={{ skip: 0, take: 20 }}
      onPaginationChange={onPaginationChange}
      onRefetch={vi.fn()}
      {...overrides}
    />
  );
  return { onPaginationChange };
}

describe('UserTable', () => {
  it('shows the columns of the table and one row for every user', () => {
    renderTable();

    const headers = screen.getAllByRole('columnheader').map((header) => header.textContent);
    expect(headers).toEqual([
      en.common.user,
      en.fields.role,
      en.fields.status,
      en.users.table.verified,
      en.users.table.joined,
      en.users.table.lastLogin,
      en.users.table.actions,
    ]);
    expect(screen.getAllByRole('row')).toHaveLength(3);
  });

  it('shows the details of a user in the cells of its row', () => {
    renderTable();

    const row = screen.getByText('ada@example.com').closest('tr');
    if (row === null) {
      throw new Error('The row of the user is missing');
    }
    expect(within(row).getByText('Ada Lovelace')).toBeInTheDocument();
    expect(within(row).getByText('ADMIN')).toBeInTheDocument();
    expect(within(row).getByText('ACTIVE')).toBeInTheDocument();
    expect(within(row).getByText(en.common.yes)).toBeInTheDocument();
    expect(within(row).getByText(en.users.table.never)).toBeInTheDocument();
    expect(within(row).getByRole('link')).toHaveAttribute('href', '/users/u1');
  });

  it('shows a message instead of rows when there are no users', () => {
    renderTable({ users: [], totalCount: 0 });

    expect(screen.getByText('No results.')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(2);
  });

  it('asks for the next page from the end of the current one', async () => {
    const { onPaginationChange } = renderTable({ totalCount: 45 });

    await userEvent.setup().click(screen.getByRole('button', { name: en.users.table.next }));

    expect(onPaginationChange).toHaveBeenCalledExactlyOnceWith({ skip: 20, take: 20 });
  });

  it('does not offer a page before the first or after the last', () => {
    renderTable();

    expect(screen.getByRole('button', { name: en.users.table.previous })).toBeDisabled();
    expect(screen.getByRole('button', { name: en.users.table.next })).toBeDisabled();
  });
});
