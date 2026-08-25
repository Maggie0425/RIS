ALTER TABLE exams
    ADD CONSTRAINT chk_exams_modality
    CHECK (modality IN ('CT', 'MR', 'DX', 'US'));
