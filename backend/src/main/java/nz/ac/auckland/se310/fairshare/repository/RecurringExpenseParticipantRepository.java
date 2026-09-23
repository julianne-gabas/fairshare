package nz.ac.auckland.se310.fairshare.repository;

import nz.ac.auckland.se310.fairshare.model.RecurringExpenseParticipant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RecurringExpenseParticipantRepository extends JpaRepository<RecurringExpenseParticipant, Long> {
    List<RecurringExpenseParticipant> findByRecurringExpenseId(Long recurringExpenseId);
}
