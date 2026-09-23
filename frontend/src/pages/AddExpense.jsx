import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createExpense } from '../api/expenses';
import ExpenseForm from '../components/ExpenseForm';
import { today } from '../utils/dates';
import { validateSharedExpenseFields } from '../utils/expenseValidation';
import { useGroupMembersForm } from '../utils/useGroupMembersForm';
import './AddExpense.css';

function validate({ amount, description, paidByUserId, expenseDate, participantUserIds }) {
    const errors = validateSharedExpenseFields({ amount, description, paidByUserId, participantUserIds });

    if (expenseDate > today()) {
        errors.expenseDate = 'Expense date cannot be in the future';   // AC6
    }

    return errors;
}

function AddExpense() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { members, paidByUserId, setPaidByUserId, loading, errors, setErrors } = useGroupMembersForm(id);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [expenseDate, setExpenseDate] = useState(today());   // AC6
    const [submitting, setSubmitting] = useState(false);
    const [participantUserIds, setParticipantUserIds] = useState([]);  // #8 AC3

    async function handleSubmit(event) {
        event.preventDefault();

        const found = validate({ amount, description, paidByUserId, expenseDate, participantUserIds });
        if (Object.keys(found).length > 0) {
            setErrors(found);
            return;
        }

        setSubmitting(true);
        setErrors({});

        try {
            const result = await createExpense(id, {
                amount,
                description,
                paidByUserId: Number(paidByUserId),
                expenseDate,
                participantUserIds: participantUserIds.map(Number)
            });

            if (result.errors) {
                setErrors(result.errors);
                return;
            }

            navigate(`/groups/${id}`);          // AC7: back to the list the expense now appears in
        } catch {
            setErrors({ form: 'Could not add this expense. Please try again.' });
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return <div className="page"><p>Loading…</p></div>;
    }

    return (
        <div className="page">
            <div className="card">
                <h1>Add an expense</h1>
                <p className="subtitle">Split equally among selected members</p>

                <ExpenseForm
                    amount={amount}
                    description={description}
                    paidByUserId={paidByUserId}
                    expenseDate={expenseDate}
                    participantUserIds={participantUserIds}
                    members={members}
                    errors={errors}
                    submitting={submitting}
                    onAmountChange={setAmount}
                    onDescriptionChange={setDescription}
                    onPaidByUserIdChange={setPaidByUserId}
                    onExpenseDateChange={setExpenseDate}
                    onParticipantUserIdsChange={setParticipantUserIds}
                    onSubmit={handleSubmit}
                    maxExpenseDate={today()}
                />

                <Link to={`/groups/${id}`}>Back to the group</Link>
            </div>
        </div>
    );
}

export default AddExpense;
