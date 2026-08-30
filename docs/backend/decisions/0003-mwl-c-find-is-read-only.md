# ADR-0003: Keep MWL C-FIND read-only

- Status: Accepted
- Date: 2026-08-13
- Decision owners: client and COMP3888 P33 team

## Context

A modality uses DICOM Modality Worklist C-FIND to discover scheduled
examinations. Returning a matching worklist entry confirms query success, not
that imaging was performed.

## Decision

The RIS MWL C-FIND operation is read-only. Receiving or answering a query must
not change examination status. Acquisition is a separate backend action after
the scheduled examination is discovered.

## Consequences

- MWL queries cannot transition an examination to `ACQUIRED`.
- Rescheduling changes later query results.
- Cancellation before acquisition withdraws the examination from the active
  worklist.
- The acquisition action requires separate lifecycle and authorization checks.

## Evidence

- [`../../client-meeting-notes.md`](../../client-meeting-notes.md), Meeting 1
  confirmed decisions dated 13 August 2026.
- [`../../architecture.md`](../../architecture.md), DICOM Modality Worklist
  rules.

## Supersedes / superseded by

None.
