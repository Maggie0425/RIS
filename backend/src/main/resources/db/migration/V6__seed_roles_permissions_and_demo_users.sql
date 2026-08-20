INSERT INTO roles (code, name)
VALUES
    ('ADMIN', 'Administrator'),
    ('RECEPTIONIST', 'Receptionist'),
    ('TECHNOLOGIST', 'Technologist'),
    ('RADIOLOGIST', 'Radiologist');

INSERT INTO permissions (code, description)
VALUES
    ('PATIENT_READ', 'View patient records'),
    ('PATIENT_WRITE', 'Create and update patient records'),
    ('EXAM_READ', 'View exam records'),
    ('ORDER_CREATE', 'Create exam orders'),
    ('SCHEDULE_MANAGE', 'Schedule and reschedule exams'),
    ('EXAM_CANCEL', 'Cancel eligible exams'),
    ('WORKLIST_READ', 'View the active worklist'),
    ('EXAM_ACQUIRE', 'Mark scheduled exams as acquired'),
    ('REPORT_READ', 'View submitted reports'),
    ('REPORT_WRITE', 'Submit radiology reports'),
    ('EXAM_COMPLETE', 'Complete reported exams'),
    ('USER_MANAGE', 'Manage user accounts and role assignments'),
    ('AUDIT_VIEW', 'View audit records');

INSERT INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM roles
CROSS JOIN permissions
WHERE roles.code = 'ADMIN';

INSERT INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM (
    VALUES
        ('RECEPTIONIST', 'PATIENT_READ'),
        ('RECEPTIONIST', 'PATIENT_WRITE'),
        ('RECEPTIONIST', 'EXAM_READ'),
        ('RECEPTIONIST', 'ORDER_CREATE'),
        ('RECEPTIONIST', 'SCHEDULE_MANAGE'),
        ('RECEPTIONIST', 'EXAM_CANCEL'),
        ('RECEPTIONIST', 'WORKLIST_READ'),
        ('TECHNOLOGIST', 'PATIENT_READ'),
        ('TECHNOLOGIST', 'EXAM_READ'),
        ('TECHNOLOGIST', 'WORKLIST_READ'),
        ('TECHNOLOGIST', 'EXAM_ACQUIRE'),
        ('RADIOLOGIST', 'PATIENT_READ'),
        ('RADIOLOGIST', 'EXAM_READ'),
        ('RADIOLOGIST', 'WORKLIST_READ'),
        ('RADIOLOGIST', 'REPORT_READ'),
        ('RADIOLOGIST', 'REPORT_WRITE'),
        ('RADIOLOGIST', 'EXAM_COMPLETE')
) AS mapping(role_code, permission_code)
JOIN roles ON roles.code = mapping.role_code
JOIN permissions ON permissions.code = mapping.permission_code;

-- All synthetic demo accounts initially use the password: ris-demo-password
INSERT INTO users (username, password_hash, display_name)
VALUES
    ('admin', '$2b$10$0UcBPJVESsH7tEr0drNlX.I9wU7MZvxYJzuztZ9GdFWW3BwsTZGCm', 'Demo Administrator'),
    ('receptionist', '$2b$10$0UcBPJVESsH7tEr0drNlX.I9wU7MZvxYJzuztZ9GdFWW3BwsTZGCm', 'Demo Receptionist'),
    ('technologist', '$2b$10$0UcBPJVESsH7tEr0drNlX.I9wU7MZvxYJzuztZ9GdFWW3BwsTZGCm', 'Demo Technologist'),
    ('radiologist', '$2b$10$0UcBPJVESsH7tEr0drNlX.I9wU7MZvxYJzuztZ9GdFWW3BwsTZGCm', 'Demo Radiologist');

INSERT INTO user_roles (user_id, role_id)
SELECT users.id, roles.id
FROM (
    VALUES
        ('admin', 'ADMIN'),
        ('receptionist', 'RECEPTIONIST'),
        ('technologist', 'TECHNOLOGIST'),
        ('radiologist', 'RADIOLOGIST')
) AS assignment(username, role_code)
JOIN users ON users.username = assignment.username
JOIN roles ON roles.code = assignment.role_code;

