CREATE SEQUENCE exam_accession_number_seq;

SELECT setval(
    'exam_accession_number_seq',
    COALESCE(MAX(substring(accession_number FROM '^SYN-ACC-([0-9]+)$')::BIGINT), 0) + 1,
    false
)
FROM exams
WHERE accession_number ~ '^SYN-ACC-[0-9]+$';
