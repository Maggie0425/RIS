INSERT INTO patients (
    medical_record_number,
    first_name,
    last_name,
    date_of_birth,
    sex
)
VALUES
    -- Names are historical references; identifiers and demographics are fictional.
    ('SYN-000001', 'Qubing', 'Huo', DATE '2006-09-24', 'MALE'),
    ('SYN-000002', 'Fei', 'Yue', DATE '1979-03-24', 'MALE'),
    ('SYN-000003', 'Julius', 'Caesar', DATE '1970-07-12', 'MALE'),
    ('SYN-000004', 'Napoleon', 'Bonaparte', DATE '1976-08-15', 'MALE');
