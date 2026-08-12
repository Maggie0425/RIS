Project Title: A Self-Hosted Open-Source Radiology Information System (RIS) — Scheduling, Worklist, Reporting and Workflow •

Project description and scope:
A RIS (Radiology Information System) manages the administrative and workflow side of a radiology department — patient registration and scheduling, exam ordering, the acquisition worklist, radiologist reporting and exam status tracking — as opposed to the images themselves, which a PACS handles.


This project builds a lightweight but realistic open-source RIS as a web application: 

patients and exams are scheduled, 
orders generate an acquisition worklist, 
reports are written and stored, 
and each exam’s status is tracked through its lifecycle (ordered → scheduled → acquired → reported → completed) under role-based access. 


What makes this a genuine radiology system rather than a generic booking app is the DICOM Modality Worklist (MWL) endpoint: 
the RIS exposes its orders as worklist entries that an imaging modality can query over DICOM, 
demonstrated with a simulated modality acting as the client, 
and matching correctly on the keys a real modality sends rather than returning every order. 

This is a core requirement, not a stretch goal. The user interface is deliberately constrained — list, form and detail views built on an off-the-shelf component library — so that effort goes into workflow correctness and DICOM integration rather than custom interface design. Custom design systems, image storage and viewing (that is the PACS project), and any use of real patient data are out of scope. Everything runs on local infrastructure with synthetic records and no paid or cloud API.

Expected outcomes/deliverables:
A deployable, containerised (Docker Compose) RIS web application — front-end, back-end and database — with patient and exam scheduling, an acquisition worklist, a reporting screen and exam status tracking.


A DICOM Modality Worklist SCP endpoint that turns RIS orders into worklist entries, with a documented mapping from RIS fields to DICOM tags.
Correct C-FIND matching on the keys a real modality sends — modality type, scheduled date range and scheduled station AE title — verified with a standard external client such as DCMTK findscu.
A server-enforced exam status lifecycle that rejects invalid transitions, with worklist entries updated or withdrawn when orders are rescheduled or cancelled.

Authentication and role-based access control enforced at the API layer, with automated tests covering the status lifecycle, access control and the worklist.

An end-to-end workflow demonstration run as a single unbroken sequence: 
register patient → order exam → modality queries worklist → mark acquired → write report → close. Plus seeded synthetic data, codebase, deployment guide and report. 

Optional stretch: HL7 v2 order/status/report messaging; structured report templates;a joint demonstration with the PACS project. 


Specific required knowledge, skills, and/or technology:
A web stack (front-end + back-end); databases; REST API design; Docker; familiarity with (or willingness to learn) DICOM Modality Worklist and HL7 v2 (dcm4che toolkit / pydicom are helpful); solid software engineering. No prior medical knowledge required. 

Related general fields/disciplines (if applicable):
Software Development; Web Development; Information Systems; Security/Networks; 

Can you provide dataset for this project?:
Not applicable. The RIS uses synthetic patient/exam records (and, if useful, public de-identified DICOM metadata); no licensed or restricted data is required, and everything runs locally (no paid/cloud API). 

How many groups would you like to work with on this project?:
2 groups