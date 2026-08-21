# Frontend Skeleton Design

The frontend uses Angular Material with a restrained clinical interface. This is a University of Sydney student project, not an official University system.

## Colour roles

| Colour | Value | Role |
|---|---|---|
| USyd orange | `#E64626` | Small branding accents only |
| USyd charcoal | `#424242` | Branding, toolbar, and navigation |
| Primary blue | `#1565C0` | Buttons, links, focus, selection, and active navigation |
| Background | `#F5F7FA` | Application background |
| Surface | `#FFFFFF` | Cards, forms, and tables |
| Primary text | `#212121` | Main content |
| Secondary text | `#616161` | Supporting content |
| Border | `#E0E0E0` | Dividers and outlines |

The USyd colours express student-project identity and must not represent errors, warnings, destructive actions, or workflow states. Angular Material semantic colours remain responsible for success, warning, and error feedback.

## Layout

- A top toolbar carries the application identity and current-user area.
- A collapsible left navigation contains the primary routes.
- The routed page occupies a responsive main content area.
- Mobile navigation collapses without changing page routes.

Planned navigation:

```text
Dashboard
Patients
Exams
Worklist
Reports
Administration
```

## Skeleton boundary

The shared skeleton owns the Material theme, application shell, responsive navigation, routing, and plain route placeholders. Feature teams own forms, tables, API integration, workflow actions, permissions, and feature-specific components.

The existing patient page is retained as implemented feature work. Authentication guards and role-based menu filtering are added with the authentication feature, not simulated in the visual skeleton.
