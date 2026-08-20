INSERT INTO exams (
    patient_id,
    created_by,
    accession_number,
    requested_procedure,
    modality,
    status
)
SELECT
    patients.id,
    users.id,
    seed.accession_number,
    seed.requested_procedure,
    seed.modality,
    seed.status
FROM (
    VALUES
        ('SYN-000001', 'SYN-ACC-0001', 'CT abdomen', 'CT', 'ORDERED'),
        ('SYN-000002', 'SYN-ACC-0002', 'Chest X-ray', 'DX', 'SCHEDULED'),
        ('SYN-000003', 'SYN-ACC-0003', 'MRI brain', 'MR', 'ACQUIRED'),
        ('SYN-000004', 'SYN-ACC-0004', 'CT chest', 'CT', 'REPORTED'),
        ('SYN-000001', 'SYN-ACC-0005', 'Abdominal ultrasound', 'US', 'COMPLETED'),
        ('SYN-000002', 'SYN-ACC-0006', 'Knee X-ray', 'DX', 'CANCELLED')
) AS seed(
    medical_record_number,
    accession_number,
    requested_procedure,
    modality,
    status
)
JOIN patients
    ON patients.medical_record_number = seed.medical_record_number
CROSS JOIN users
WHERE users.username = 'receptionist';

INSERT INTO exam_schedules (exam_id, scheduled_start, station_ae_title)
SELECT
    exams.id,
    DATE_TRUNC('day', CURRENT_TIMESTAMP) + seed.start_offset,
    seed.station_ae_title
FROM (
    VALUES
        ('SYN-ACC-0002', INTERVAL '10 hours', 'XRAY_1'),
        ('SYN-ACC-0003', INTERVAL '11 hours', 'MRI_1'),
        ('SYN-ACC-0004', INTERVAL '12 hours', 'CT_1'),
        ('SYN-ACC-0005', INTERVAL '13 hours', 'US_1'),
        ('SYN-ACC-0006', INTERVAL '14 hours', 'XRAY_1')
) AS seed(accession_number, start_offset, station_ae_title)
JOIN exams ON exams.accession_number = seed.accession_number;

INSERT INTO reports (exam_id, author_user_id, report_text)
SELECT
    exams.id,
    users.id,
    seed.report_text
FROM (
    VALUES
        ('SYN-ACC-0004', 'Synthetic report: no acute abnormality identified.'),
        ('SYN-ACC-0005', 'Synthetic report: examination completed without significant finding.')
) AS seed(accession_number, report_text)
JOIN exams ON exams.accession_number = seed.accession_number
CROSS JOIN users
WHERE users.username = 'radiologist';
