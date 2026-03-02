# Release Checklist

Цей чекліст використовується перед створенням git-тега `v*`.

## 1. Підготовка змін

- [ ] `CHANGELOG.md` містить секцію `## [X.Y.Z]` для нового релізу.
- [ ] `README.md` і супровідна документація оновлені під фактичні зміни.
- [ ] Робоче дерево перевірене, випадкових файлів у релізі немає.

## 2. Preflight перед тегом

- [ ] Запусти preflight:
  - `npm run release:preflight`
- [ ] Якщо потрібно прогнати повний gate у preflight:
  - `npm run release:preflight -- --full-quality`
- [ ] Для контрольної перевірки конкретного тега:
  - `npm run release:preflight -- --tag=vX.Y.Z`

## 3. Створення тега

- [ ] Створи тег: `git tag vX.Y.Z`
- [ ] Запуш тег: `git push origin vX.Y.Z`
- [ ] Перевір GitHub Actions `Release` workflow та створений zip-артефакт.
