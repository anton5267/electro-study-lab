# Changelog

All notable changes to this project should be documented in this file.

## [Unreleased]

### Added

- Security automation baseline for repository maintenance:
  - Dependabot configuration for `npm` and `github-actions`.
  - `gitleaks` configuration and CI workflow for secret scanning on pushes and pull requests.

## [1.0.0] - 2026-02-27

### Added

- Bilingual static study app with theory, flashcards, practice, quiz, exam, checklist and analytics.
- Local persistence for progress, review state, exam restore, URL state and custom content packs.
- PWA support with offline cache, install flow and update handling.
- Backup/import/export flows with strict validation and recovery of working state.
- Automated quality stack: unit-style scripts, HTTP/browser smoke tests, accessibility audit and visual regression baselines.
- GitHub Actions workflows for quality gate, GitHub Pages deploy and tagged releases.

### Changed

- Refactored core app logic into dedicated modules for runtime, progress state, assessment state, validation, templates and study helpers.
- Hardened accessibility semantics for tabs, keyboard navigation and print/mobile behavior.
