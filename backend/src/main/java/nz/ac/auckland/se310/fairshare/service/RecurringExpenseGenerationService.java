package nz.ac.auckland.se310.fairshare.service;

import nz.ac.auckland.se310.fairshare.model.ExpenseGroup;
import nz.ac.auckland.se310.fairshare.model.RecurringExpense;
import nz.ac.auckland.se310.fairshare.model.UserInGroup;
import nz.ac.auckland.se310.fairshare.repository.RecurringExpenseParticipantRepository;
import nz.ac.auckland.se310.fairshare.repository.RecurringExpenseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Service
public class RecurringExpenseGenerationService {

    private final RecurringExpenseRepository recurringExpenseRepository;
    private final RecurringExpenseParticipantRepository participantRepository;
    private final ExpenseService expenseService;
    private final Clock clock;

    public RecurringExpenseGenerationService(RecurringExpenseRepository recurringExpenseRepository,
                                              RecurringExpenseParticipantRepository participantRepository,
                                              ExpenseService expenseService,
                                              Clock clock) {
        this.recurringExpenseRepository = recurringExpenseRepository;
        this.participantRepository = participantRepository;
        this.expenseService = expenseService;
        this.clock = clock;
    }

    /**
     * Generates an Expense for every occurrence of every active recurring expense that has come
     * due, up to and including today. A schedule that was missed for a while (e.g. the server
     * was down) backfills one expense per missed occurrence, each dated on its actual due date;
     * advancing nextDueDate after each one makes a repeat run for the same day a no-op (AC2).
     */
    @Transactional
    public int generateDueExpenses() {
        LocalDate today = LocalDate.now(clock);
        int generated = 0;

        for (RecurringExpense recurringExpense : recurringExpenseRepository.findByActiveTrueAndNextDueDateLessThanEqual(today)) {
            generated += generateDueOccurrences(recurringExpense, today);
        }

        return generated;
    }

    /**
     * Generates any occurrences already due for a single recurring expense, using the same
     * backfill logic as the daily job. Called right after creation so a start date that's today
     * or earlier produces its expenses immediately, rather than waiting for the next scheduled run.
     */
    @Transactional
    public int generateDueOccurrencesFor(RecurringExpense recurringExpense) {
        return generateDueOccurrences(recurringExpense, LocalDate.now(clock));
    }

    private int generateDueOccurrences(RecurringExpense recurringExpense, LocalDate today) {
        ExpenseGroup group = recurringExpense.getGroup();
        UserInGroup payer = group.getMember(recurringExpense.getPaidBy().getId());
        List<UserInGroup> members = resolveMembers(recurringExpense, group);

        int generated = 0;
        while (recurringExpense.isActive() && !recurringExpense.getNextDueDate().isAfter(today)) {
            expenseService.createRecurringOccurrence(
                    recurringExpense, payer, members, recurringExpense.getNextDueDate());
            recurringExpense.advanceAfterGenerating(); // AC4: ends the series once past endDate
            generated++;
        }

        recurringExpenseRepository.save(recurringExpense);
        return generated;
    }

    private List<UserInGroup> resolveMembers(RecurringExpense recurringExpense, ExpenseGroup group) {
        return participantRepository.findByRecurringExpenseId(recurringExpense.getId()).stream()
                .map(participant -> group.getMember(participant.getUser().getId()))
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingLong(m -> m.getUser().getId()))
                .toList();
    }
}
