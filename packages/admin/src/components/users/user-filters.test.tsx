import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { USER_STATUSES } from '@/lib/user-status';
import { UserFilters } from './user-filters';

const noFilters = { search: '', role: undefined, status: undefined };

const pick = async (comboboxIndex: number, option: string) => {
  const user = userEvent.setup();
  await user.click(screen.getAllByRole('combobox')[comboboxIndex]);
  await user.click(await screen.findByRole('option', { name: option }));
};

describe('UserFilters', () => {
  it('sends the role the user picks', async () => {
    const onFiltersChange = vi.fn();
    render(<UserFilters filters={noFilters} onFiltersChange={onFiltersChange} />);

    await pick(0, 'Moderator');

    expect(onFiltersChange).toHaveBeenCalledWith({ ...noFilters, role: 'MODERATOR' });
  });

  it('clears the role when "All Roles" is picked instead of sending the word all', async () => {
    const onFiltersChange = vi.fn();
    render(
      <UserFilters filters={{ ...noFilters, role: 'ADMIN' }} onFiltersChange={onFiltersChange} />
    );

    await pick(0, 'All Roles');

    expect(onFiltersChange).toHaveBeenCalledWith({ ...noFilters, role: undefined });
  });

  it('sends the status values that the server knows', async () => {
    const onFiltersChange = vi.fn();
    render(<UserFilters filters={noFilters} onFiltersChange={onFiltersChange} />);

    await pick(1, 'Pending');
    expect(onFiltersChange).toHaveBeenLastCalledWith({ ...noFilters, status: 'PENDING_APPROVAL' });

    await pick(1, 'Banned');
    expect(onFiltersChange).toHaveBeenLastCalledWith({ ...noFilters, status: 'BLOCKED' });
  });

  it('offers every status of the server enum next to the choice of none', async () => {
    render(<UserFilters filters={noFilters} onFiltersChange={vi.fn()} />);

    await userEvent.setup().click(screen.getAllByRole('combobox')[1]);

    expect(await screen.findAllByRole('option')).toHaveLength(USER_STATUSES.length + 1);
  });

  it('clears the status when "All Statuses" is picked instead of sending the word all', async () => {
    const onFiltersChange = vi.fn();
    render(
      <UserFilters filters={{ ...noFilters, status: 'ACTIVE' }} onFiltersChange={onFiltersChange} />
    );

    await pick(1, 'All Statuses');

    expect(onFiltersChange).toHaveBeenCalledWith({ ...noFilters, status: undefined });
  });
});
