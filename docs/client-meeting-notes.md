# Client Meeting Notes

This file records concise client decisions and action items for future contributors and AI assistants. It is not a transcript. If a later meeting changes a decision, add a dated entry and identify the superseded decision.

## Meeting 1 — 13/08/2026

### Confirmed decisions

- Scope covers the exam workflow from ordering and scheduling through acquisition, reporting, and completion.
- A CT/MRI modality queries the RIS worklist and uses the returned patient and exam details to avoid manual re-entry.
- Minimum staff roles: receptionist/scheduler, technologist, radiologist, and administrator. Patients do not access the system.
- DICOM MWL C-FIND is read-only. Acquisition may be simulated with a **Mark as Acquired** action; no result is sent back through the worklist query.
- Required MWL matching includes modality, scheduled date/date range, and Scheduled Station AE Title. Additional matching keys may be implemented if useful.
- Cancellation is allowed only before acquisition. Rescheduling must update the active worklist, and the backend must reject invalid status transitions.
- A simple functional UI is sufficient; workflow correctness and DICOM integration have priority.
- The client provides no dataset. The team must create and use synthetic patient and exam data only; real patient data is prohibited.
- DCMTK will be used for final MWL evaluation. The required version and configuration were not yet known and must be confirmed with the tutor/coordinator.

### Follow-up actions

- Draft a role-permission matrix for client review and sign-off.
- Confirm the required DCMTK version and configuration.
- Test C-FIND matching with DCMTK and synthetic data.
- Prepare short weekly progress slides covering prior discussion, completed work, and current progress.
- Proposed scope and requirements were emailed to the client for approval (recorded as done in the source notes).

### Administrative note

- The next regular online meeting was agreed for Tuesday at 7:00 p.m.; the source document does not record its calendar date.
