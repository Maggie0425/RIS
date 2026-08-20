# Database Entity Relationship Diagram

```mermaid
erDiagram
    PATIENTS ||--o{ EXAMS : has
    USERS ||--o{ EXAMS : creates
    EXAMS ||--o| EXAM_SCHEDULES : has
    EXAMS ||--o| REPORTS : has
    USERS ||--o{ REPORTS : authors

    USERS ||--o{ USER_ROLES : receives
    ROLES ||--o{ USER_ROLES : assigned_to
    ROLES ||--o{ ROLE_PERMISSIONS : grants
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : included_in

    PATIENTS {
        BIGINT id PK
        VARCHAR medical_record_number UK
        VARCHAR first_name
        VARCHAR last_name
        DATE date_of_birth
        VARCHAR sex
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    USERS {
        BIGINT id PK
        VARCHAR username UK
        VARCHAR password_hash
        VARCHAR display_name
        BOOLEAN enabled
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    ROLES {
        BIGINT id PK
        VARCHAR code UK
        VARCHAR name
    }

    PERMISSIONS {
        BIGINT id PK
        VARCHAR code UK
        VARCHAR description
    }

    USER_ROLES {
        BIGINT user_id PK, FK
        BIGINT role_id PK, FK
    }

    ROLE_PERMISSIONS {
        BIGINT role_id PK, FK
        BIGINT permission_id PK, FK
    }

    EXAMS {
        BIGINT id PK
        BIGINT patient_id FK
        BIGINT created_by FK
        VARCHAR accession_number UK
        VARCHAR requested_procedure
        VARCHAR modality
        VARCHAR status
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    EXAM_SCHEDULES {
        BIGINT id PK
        BIGINT exam_id UK, FK
        TIMESTAMPTZ scheduled_start
        VARCHAR station_ae_title
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    REPORTS {
        BIGINT id PK
        BIGINT exam_id UK, FK
        BIGINT author_user_id FK
        TEXT report_text
        TIMESTAMPTZ submitted_at
    }
```

`EXAM_SCHEDULES.exam_id` and `REPORTS.exam_id` are unique, enforcing at most one current schedule and one submitted report per exam. The backend remains responsible for lifecycle transitions and role-based permissions.

