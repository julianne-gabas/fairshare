const FREQUENCY_OPTIONS = [
    { value: 'WEEKLY', label: 'Weekly' },
    { value: 'FORTNIGHTLY', label: 'Fortnightly' },
    { value: 'MONTHLY', label: 'Monthly' },
];

function RecurringExpenseForm({
    amount,
    description,
    paidByUserId,
    frequency,
    startDate,
    endDate,
    participantUserIds,
    members,
    errors,
    submitting,
    onAmountChange,
    onDescriptionChange,
    onPaidByUserIdChange,
    onFrequencyChange,
    onStartDateChange,
    onEndDateChange,
    onParticipantUserIdsChange,
    onSubmit,
}) {
    function handleParticipantChange(event) {
        const userId = event.target.value;
        onParticipantUserIdsChange((currentIds) => (
            event.target.checked
                ? [...currentIds, userId]
                : currentIds.filter((id) => id !== userId)
        ));
    }

    return (
        <form onSubmit={onSubmit} noValidate>
            <div className="form-group">
                <label htmlFor="amount">Amount</label>
                <input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    placeholder="0.00"
                    onChange={(event) => onAmountChange(event.target.value)}
                />
                {errors.amount && <span className="error">{errors.amount}</span>}
            </div>

            <div className="form-group">
                <label htmlFor="description">Description</label>
                <input
                    id="description"
                    type="text"
                    value={description}
                    placeholder="What is it for?"
                    onChange={(event) => onDescriptionChange(event.target.value)}
                />
                {errors.description && <span className="error">{errors.description}</span>}
            </div>

            <div className="form-group">
                <label htmlFor="paidByUserId">Paid by</label>
                <select
                    id="paidByUserId"
                    value={paidByUserId}
                    onChange={(event) => onPaidByUserIdChange(event.target.value)}
                >
                    {members.map((member) => (
                        <option key={member.userId} value={member.userId}>
                            {member.username}
                        </option>
                    ))}
                </select>
                {errors.paidByUserId && <span className="error">{errors.paidByUserId}</span>}
            </div>

            <div className="form-group">
                <label htmlFor="frequency">Frequency</label>
                <select
                    id="frequency"
                    value={frequency}
                    onChange={(event) => onFrequencyChange(event.target.value)}
                >
                    <option value="">Select a frequency</option>
                    {FREQUENCY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                {errors.frequency && <span className="error">{errors.frequency}</span>}
            </div>

            <div className="form-group">
                <label htmlFor="startDate">Start date</label>
                <input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(event) => onStartDateChange(event.target.value)}
                />
                {errors.startDate && <span className="error">{errors.startDate}</span>}
            </div>

            <div className="form-group">
                <label htmlFor="endDate">End date (optional)</label>
                <input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(event) => onEndDateChange(event.target.value)}
                />
                {errors.endDate && <span className="error">{errors.endDate}</span>}
            </div>

            <div className="select-participants">
                <p>Participants</p>
                <ul>
                    {members.map((member) => (
                        <li key={member.userId}>
                            <label>
                                <input
                                    type="checkbox"
                                    value={member.userId}
                                    checked={participantUserIds.includes(String(member.userId))}
                                    onChange={handleParticipantChange}
                                />
                                {member.username}
                            </label>
                        </li>
                    ))}
                </ul>
                {errors.participantUserIds && <span className="error">{errors.participantUserIds}</span>}
            </div>

            {errors.form && <span className="error">{errors.form}</span>}

            <button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save recurring expense'}
            </button>
        </form>
    );
}

export default RecurringExpenseForm;
