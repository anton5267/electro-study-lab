# Security Policy

## Supported Versions

Security fixes are provided for the latest `main` branch state and the latest tagged release.

## Reporting a Vulnerability

Please do not open public issues for security problems.

Use one of these channels:

1. GitHub Security Advisory (preferred): `Security` tab -> `Report a vulnerability`.
2. Private contact with repository owner if advisory flow is unavailable.

Include:

- clear reproduction steps
- expected vs actual behavior
- affected files/flows
- proof-of-concept payload (if relevant)
- impact assessment

## Response Targets

- Initial triage response: within 72 hours.
- Confirmed issue: remediation plan and severity assessment within 7 days.
- Fix release timing depends on severity and scope.

## Current Security Baseline

- GitHub secret scanning + push protection
- Dependabot for npm and GitHub Actions
- Gitleaks CI scan on push and pull requests
- Branch protection with required checks on `main`
