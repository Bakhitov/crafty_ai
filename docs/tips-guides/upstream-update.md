## Обновление из апстрима

Стандартный путь:

```bash
git fetch upstream
git checkout main
git rebase upstream/main
pnpm i
pnpm db:push # если есть новые миграции
pnpm check   # lint + types + tests
```

Автоматизировано:

```bash
pnpm update:upstream
```

Требования:

- Настроен remote `upstream` на оригинальный репозиторий.
- Чистое рабочее дерево (без незафиксированных изменений).

После успешной проверки:

```bash
git push origin main --force-with-lease
```
