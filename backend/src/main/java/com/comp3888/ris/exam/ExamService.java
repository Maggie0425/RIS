package com.comp3888.ris.exam;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.comp3888.ris.authentication.DemoActorService;
import com.comp3888.ris.patient.PatientService;

@Service
public class ExamService {
    private static final String ACCESSION_PREFIX = "SYN-ACC-";

    private final ExamRepository exams;
    private final PatientService patients;
    private final DemoActorService actors;

    ExamService(ExamRepository exams, PatientService patients, DemoActorService actors) {
        this.exams = exams;
        this.patients = patients;
        this.actors = actors;
    }

    @Transactional(readOnly = true)
    public List<ExamResponse> getExams(Long patientId, ExamStatus status) {
        List<Exam> records;
        if (patientId != null && status != null) {
            records = exams.findByPatientIdAndStatusOrderByCreatedAtDesc(patientId, status);
        } else if (patientId != null) {
            records = exams.findByPatientIdOrderByCreatedAtDesc(patientId);
        } else if (status != null) {
            records = exams.findByStatusOrderByCreatedAtDesc(status);
        } else {
            records = exams.findAllByOrderByCreatedAtDesc();
        }
        return records.stream().map(ExamResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<ExamResponse> getExams(ExamStatus status) {
        return getExams(null, status);
    }

    @Transactional(readOnly = true)
    public ExamResponse getExam(Long id) {
        return ExamResponse.from(findExam(id));
    }

    @Transactional
    public ExamResponse createExam(ExamRequest request) {
        patients.getPatient(request.patientId());
        Long createdBy = actors.defaultOrderCreatorId();
        Exam exam = Exam.createOrder(
                request.patientId(), createdBy, nextAccessionNumber(),
                request.requestedProcedure(), request.modality());
        return ExamResponse.from(exams.saveAndFlush(exam));
    }

    private Exam findExam(Long id) {
        return exams.findById(id).orElseThrow(() -> new ExamNotFoundException(id));
    }

    private String nextAccessionNumber() {
        long next = exams.countByAccessionNumberStartingWith(ACCESSION_PREFIX) + 1;
        String accessionNumber;
        do {
            accessionNumber = ACCESSION_PREFIX + String.format("%04d", next++);
        } while (exams.findByAccessionNumber(accessionNumber).isPresent());
        return accessionNumber;
    }
}
