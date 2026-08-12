# Development Workflow

Use a short-lived branch and pull request for every task. The `main` branch is protected and should always remain usable; do not commit or push directly to it.

## Start a task

Update `main`, then create a branch with a descriptive name:

```bash
git switch main
git pull origin main
git switch -c feature/patient-registration
```

Use prefixes such as `feature/`, `fix/`, `test/`, `docs/`, or `chore/`. Keep one task on each branch and avoid sharing a branch unless pair programming.

## Develop and push

Run the project and test the affected behaviour before requesting review:

```bash
docker compose up --build
```

Commit using the conventional commit style, then push the branch:

```bash
git add .
git commit -m "feat: add patient registration"
git push -u origin feature/patient-registration
```

Common commit prefixes are `feat:`, `fix:`, `test:`, `docs:`, `refactor:`, and `chore:`.

## Open and review a pull request

On GitHub, open a pull request from the task branch into `main`. The description should state:

- what changed;
- how it was tested;
- any incomplete work or known limitations.

Request at least one teammate's review. The reviewer should read the changes, check the relevant behaviour, resolve any discussion, and approve the pull request. Authors must not approve their own work.

After approval, use **Squash and merge**, then delete the remote task branch. Do not force-push or bypass the protected `main` branch.

## Finish and start the next task

Synchronise the local repository and remove the completed local branch:

```bash
git switch main
git pull origin main
git branch -d feature/patient-registration
```

Create the next branch only after `main` is up to date. If a pull request has conflicts, update the task branch from `main`, resolve and test the conflicts locally, then push the branch again for review.

