import { it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AddRecurringExpense from '../src/pages/AddRecurringExpense.jsx';
import { getGroupMembers } from '../src/api/groups';
import { createRecurringExpense } from '../src/api/recurringExpenses';

vi.mock('../src/api/groups', () => ({
    getGroupMembers: vi.fn(),
}));

vi.mock('../src/api/recurringExpenses', () => ({
    createRecurringExpense: vi.fn(),
}));

const MEMBERS = [
    { userId: 1, username: 'alice', email: 'alice@test.com', netBalance: '0.00', currentUser: true },
    { userId: 2, username: 'bob', email: 'bob@test.com', netBalance: '0.00', currentUser: false },
];

function today() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
}

beforeEach(() => {
    vi.clearAllMocks();
    getGroupMembers.mockResolvedValue({ members: MEMBERS });
    createRecurringExpense.mockResolvedValue({ recurringExpense: { id: 9 } });
});

function renderPage() {
    render(
        <MemoryRouter initialEntries={['/groups/1/recurring-expenses/new']}>
            <Routes>
                <Route path="/groups/:id/recurring-expenses/new" element={<AddRecurringExpense />} />
                <Route path="/groups/:id" element={<h1>Flat 3</h1>} />
            </Routes>
        </MemoryRouter>
    );
}

it('AC1: saves the recurring expense and returns to the group', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(await screen.findByLabelText('Amount'), '500');
    await user.type(screen.getByLabelText('Description'), 'Rent');
    await user.selectOptions(screen.getByLabelText('Paid by'), '2');
    await user.selectOptions(screen.getByLabelText('Frequency'), 'MONTHLY');
    await user.click(screen.getByRole('checkbox', { name: 'alice' }));
    await user.click(screen.getByRole('checkbox', { name: 'bob' }));
    await user.click(screen.getByRole('button', { name: 'Save recurring expense' }));

    expect(createRecurringExpense).toHaveBeenCalledWith('1', {
        amount: '500',
        description: 'Rent',
        paidByUserId: 2,
        frequency: 'MONTHLY',
        startDate: today(),
        endDate: null,
        participantUserIds: [1, 2],
    });
    expect(await screen.findByText('Flat 3')).toBeInTheDocument();
});

it('AC1: the start date defaults to today', async () => {
    renderPage();

    expect(await screen.findByLabelText('Start date')).toHaveValue(today());
});

it('AC5: shows an inline error on each missing field', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Save recurring expense' }));

    expect(screen.getByText('Amount is required')).toBeInTheDocument();
    expect(screen.getByText('Description is required')).toBeInTheDocument();
    expect(screen.getByText('Frequency is required')).toBeInTheDocument();
    expect(createRecurringExpense).not.toHaveBeenCalled();
});

it('AC5: rejects a zero, negative or non-numeric amount', async () => {
    const user = userEvent.setup();
    renderPage();

    const amount = await screen.findByLabelText('Amount');
    await user.type(screen.getByLabelText('Description'), 'Rent');
    await user.selectOptions(screen.getByLabelText('Frequency'), 'MONTHLY');
    await user.click(screen.getByRole('checkbox', { name: 'alice' }));

    for (const value of ['0', '-5']) {
        await user.clear(amount);
        await user.type(amount, value);
        await user.click(screen.getByRole('button', { name: 'Save recurring expense' }));

        expect(screen.getByText('Amount must be a positive number')).toBeInTheDocument();
    }
    expect(createRecurringExpense).not.toHaveBeenCalled();
});

it('AC5: rejects an end date before the start date', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(await screen.findByLabelText('Amount'), '500');
    await user.type(screen.getByLabelText('Description'), 'Rent');
    await user.selectOptions(screen.getByLabelText('Frequency'), 'MONTHLY');
    await user.click(screen.getByRole('checkbox', { name: 'alice' }));
    await user.type(screen.getByLabelText('End date (optional)'), '2020-01-01');
    await user.click(screen.getByRole('button', { name: 'Save recurring expense' }));

    expect(screen.getByText('End date cannot be before the start date')).toBeInTheDocument();
    expect(createRecurringExpense).not.toHaveBeenCalled();
});

it('offers weekly, fortnightly and monthly as frequency options', async () => {
    renderPage();

    const frequency = await screen.findByLabelText('Frequency');

    expect([...frequency.options].map((option) => option.textContent))
        .toEqual(['Select a frequency', 'Weekly', 'Fortnightly', 'Monthly']);
});

it('AC8: shows the error when the group is not readable', async () => {
    getGroupMembers.mockResolvedValue({ error: 'You must be a group member to manage its members' });

    renderPage();

    expect(await screen.findByText('You must be a group member to manage its members'))
        .toBeInTheDocument();
});

it('AC5: shows the error when the payer is no longer a group member', async () => {
    createRecurringExpense.mockResolvedValue({ errors: { form: 'Payer must be a member of the group' } });
    const user = userEvent.setup();
    renderPage();

    await user.type(await screen.findByLabelText('Amount'), '500');
    await user.type(screen.getByLabelText('Description'), 'Rent');
    await user.selectOptions(screen.getByLabelText('Frequency'), 'MONTHLY');
    await user.click(screen.getByRole('checkbox', { name: 'alice' }));
    await user.click(screen.getByRole('button', { name: 'Save recurring expense' }));

    expect(await screen.findByText('Payer must be a member of the group')).toBeInTheDocument();
});
