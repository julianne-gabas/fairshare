import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getGroupMembers } from '../api/groups';
import { createRecurringExpense } from '../api/recurringExpenses';
import RecurringExpenseForm from '../components/RecurringExpenseForm';
import './AddExpense.css';

// Built from local date because toISOString() reports the UTC date and
// would give yesterday for the first hours of a New Zealand day.
function today() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
}

function validate({ amount, description, paidByUserId, frequency, startDate, endDate, participantUserIds }) {
    const errors = {};

    if (amount.trim() === '') {
        errors.amount = 'Amount is required';
    } else if (!(Number(amount) > 0)) {
        errors.amount = 'Amount must be a positive number';
    }

    if (description.trim() === '') {
        errors.description = 'Description is required';
    }

    if (paidByUserId === '') {
        errors.paidByUserId = 'Payer is required';
    }

    if (frequency === '') {
        errors.frequency = 'Frequency is required';
    }

    if (startDate === '') {
        errors.startDate = 'Start date is required';
    }

    if (endDate && endDate < startDate) {
        errors.endDate = 'End date cannot be before the start date';
    }

    if (!participantUserIds || participantUserIds.length === 0) {
        errors.participantUserIds = 'At least one participant is required';
    }

    return errors;
}

function AddRecurringExpense() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [members, setMembers] = useState([]);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [paidByUserId, setPaidByUserId] = useState('');
    const [frequency, setFrequency] = useState('');
    const [startDate, setStartDate] = useState(today());
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [participantUserIds, setParticipantUserIds] = useState([]);

    useEffect(() => {
        async function loadMembers() {
            const result = await getGroupMembers(id);
            if (result.error) {
                setErrors({ form: result.error });
            } else {
                setMembers(result.members);
                const self = result.members.find((member) => member.currentUser);
                setPaidByUserId(String((self ?? result.members[0])?.userId ?? ''));
            }
            setLoading(false);
        }

        loadMembers().catch(() => {
            setErrors({ form: 'Could not load group members.' });
            setLoading(false);
        });
    }, [id]);

    async function handleSubmit(event) {
        event.preventDefault();

        const found = validate({ amount, description, paidByUserId, frequency, startDate, endDate, participantUserIds });
        if (Object.keys(found).length > 0) {
            setErrors(found);
            return;
        }

        setSubmitting(true);
        setErrors({});

        try {
            const result = await createRecurringExpense(id, {
                amount,
                description,
                paidByUserId: Number(paidByUserId),
                frequency,
                startDate,
                endDate: endDate || null,
                participantUserIds: participantUserIds.map(Number)
            });

            if (result.errors) {
                setErrors(result.errors);
                return;
            }

            navigate(`/groups/${id}`);
        } catch {
            setErrors({ form: 'Could not add this recurring expense. Please try again.' });
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
                <h1>Add a recurring expense</h1>
                <p className="subtitle">Automatically split on a schedule</p>

                <RecurringExpenseForm
                    amount={amount}
                    description={description}
                    paidByUserId={paidByUserId}
                    frequency={frequency}
                    startDate={startDate}
                    endDate={endDate}
                    participantUserIds={participantUserIds}
                    members={members}
                    errors={errors}
                    submitting={submitting}
                    onAmountChange={setAmount}
                    onDescriptionChange={setDescription}
                    onPaidByUserIdChange={setPaidByUserId}
                    onFrequencyChange={setFrequency}
                    onStartDateChange={setStartDate}
                    onEndDateChange={setEndDate}
                    onParticipantUserIdsChange={setParticipantUserIds}
                    onSubmit={handleSubmit}
                />

                <Link to={`/groups/${id}`}>Back to the group</Link>
            </div>
        </div>
    );
}

export default AddRecurringExpense;
