# Backend domain glossary

| Term | Meaning |
|---|---|
| RIS | Radiology Information System managing administrative workflow and metadata. |
| PACS | System responsible for medical-image storage, retrieval, and viewing; outside this RIS boundary. |
| Patient | Synthetic demographic record identified locally by a medical record number. |
| Exam order | Request for an imaging procedure, identified by an accession number. |
| Schedule | Planned start time and station AE title associated with an exam. |
| Modality | Imaging category such as CT, MR, DX, or US. |
| Accession number | Unique RIS identifier for an imaging exam order. |
| AE title | DICOM Application Entity title identifying a DICOM endpoint or station. |
| MWL | DICOM Modality Worklist used by a modality to query scheduled examination metadata. |
| SCP | DICOM Service Class Provider; the RIS role for MWL queries. |
| SCU | DICOM Service Class User; a modality or `findscu` client. |
| C-FIND | Read-only DICOM query operation used to find matching worklist entries. |
| Acquisition | Performance of the imaging examination; distinct from returning an MWL query result. |
| Report | Radiologist-authored result associated with an acquired examination. |
| RBAC | Role-based access control enforced by the backend API. |
| Flyway migration | Versioned, immutable database change applied in order. |

If a domain term changes, update this glossary and the authoritative design or
contract that uses it in the same pull request.
