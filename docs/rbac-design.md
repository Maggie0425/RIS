# Database-Backed RBAC Design

Status: **Target authorization design** with **Implemented** database tables,
JPA entities, fixed-role seed data, and permission mappings. Spring Security,
login/JWT handling, and API enforcement are not yet implemented. Status labels
and source authority are defined in [`README.md`](README.md).

The target RIS uses database-backed role-based access control (RBAC).
Administrators assign fixed roles to users; custom role or permission editing
is outside the core scope.

## Data model — Implemented foundation

```text
users --< user_roles >-- roles --< role_permissions >-- permissions
```

| Table | Required fields and constraints |
|---|---|
| `users` | `id` BIGINT identity PK, `username` unique, `password_hash`, `display_name`, `enabled`, timestamps |
| `roles` | `id` BIGINT identity PK, `code` unique, `name` |
| `permissions` | `id` BIGINT identity PK, `code` unique, `description` |
| `user_roles` | (`user_id`, `role_id`) composite PK and foreign keys |
| `role_permissions` | (`role_id`, `permission_id`) composite PK and foreign keys |

Users and roles referenced by historical records must be disabled rather than deleted. BCrypt hashes are stored in `users.password_hash`; plaintext passwords are never stored.

## Fixed roles and permissions — Implemented seed mapping

| Permission | Receptionist | Technologist | Radiologist | Admin |
|---|:---:|:---:|:---:|:---:|
| `PATIENT_READ` | Yes | Yes | Yes | Yes |
| `PATIENT_WRITE` | Yes | No | No | Yes |
| `EXAM_READ` | Yes | Yes | Yes | Yes |
| `ORDER_CREATE` | Yes | No | No | Yes |
| `SCHEDULE_MANAGE` | Yes | No | No | Yes |
| `EXAM_CANCEL` | Yes | No | No | Yes |
| `WORKLIST_READ` | Yes | Yes | Yes | Yes |
| `EXAM_ACQUIRE` | No | Yes | No | Yes |
| `REPORT_READ` | No | No | Yes | Yes |
| `REPORT_WRITE` | No | No | Yes | Yes |
| `EXAM_COMPLETE` | No | No | Yes | Yes |
| `USER_MANAGE` | No | No | No | Yes |
| `AUDIT_VIEW` | No | No | No | Yes |

`ADMIN` receives every permission. A user may have multiple roles, and their effective permissions are the union of those roles.

## Enforcement rules — Target

- **Implemented:** Flyway creates the five tables and seeds the fixed roles,
  permissions, mappings, and synthetic demo accounts.
- Spring Security authenticates enabled users and checks permissions at the API/service boundary.
- Workflow permission and lifecycle checks both apply; having permission never allows an invalid status transition.
- Administrators may create or disable users, reset passwords, and assign or remove fixed roles.
- The system must prevent disabling the last enabled administrator or removing their final `ADMIN` role.
- The DICOM MWL endpoint uses its own DICOM association controls and does not use staff JWT roles.

## JWT behaviour — Target

On login, the backend issues a short-lived JWT containing the user identifier, username, roles, and permissions. Role changes, account disabling, and password resets take full effect no later than token expiry; the initial implementation should use a 15-minute access-token lifetime and require login again rather than implement refresh tokens.

## Minimum tests — Target

- Each operational role can perform its allowed actions and receives `403 Forbidden` for disallowed actions.
- An administrator can perform all workflow and user-management actions.
- Disabled users cannot log in.
- Multiple roles produce the union of permissions.
- Duplicate usernames and duplicate role assignments are rejected.
- Invalid lifecycle transitions remain rejected for every role, including `ADMIN`.
