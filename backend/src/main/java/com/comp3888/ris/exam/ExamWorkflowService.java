package com.comp3888.ris.exam;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.comp3888.ris.scheduling.ExamScheduleDetails;
import com.comp3888.ris.scheduling.ExamSchedulingService;

@Service
public class ExamWorkflowService {

    private final ExamRepository exams;
    private final ExamSchedulingService scheduling;

    ExamWorkflowService(ExamRepository exams, ExamSchedulingService scheduling) {
        this.exams = exams;
        this.scheduling = scheduling;
    }

    @Transactional
    public ScheduleExamResponse scheduleExam(Long examId, ScheduleExamRequest request) {
        Exam exam = findExamForUpdate(examId);
        ExamScheduleDetails schedule;

        if (exam.getStatus() == ExamStatus.ORDERED) {
            schedule = scheduling.createSchedule(
                    examId, request.scheduledStart(), request.stationAeTitle());
            exam.markScheduled();
        } else if (exam.getStatus() == ExamStatus.SCHEDULED) {
            schedule = scheduling.reschedule(
                    examId, request.scheduledStart(), request.stationAeTitle());
        } else {
            throw new InvalidExamTransitionException(exam.getStatus(), ExamStatus.SCHEDULED);
        }

        exams.flush();
        return ScheduleExamResponse.from(exam, schedule);
    }

    @Transactional
    public ExamResponse cancelExam(Long examId) {
        Exam exam = findExamForUpdate(examId);
        exam.cancel();
        exams.flush();
        return ExamResponse.from(exam);
    }

    private Exam findExamForUpdate(Long id) {
        return exams.findByIdForUpdate(id)
                .orElseThrow(() -> new ExamNotFoundException(id));
    }
}
