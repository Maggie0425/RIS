package com.comp3888.ris.exam;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ExamService {

    private final ExamRepository repository;

    ExamService(ExamRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<ExamResponse> getExams(ExamStatus status) {
        List<Exam> exams = status == null
                ? repository.findAllByOrderByCreatedAtDesc()
                : repository.findByStatusOrderByCreatedAtDesc(status);
        return exams.stream().map(ExamResponse::from).toList();
    }
}
