## Методика разработки и обновлений

Цель: быстро дорабатывать проект, минимизируя конфликты с апстримом и сохраняя возможность безболезненно обновляться.

### 1) Репозитории и ветки

- `origin` — ваш форк (например, `github.com/<you>/better-chatbot`)
- `upstream` — исходный проект (`github.com/cgoinglove/better-chatbot`)
- Рабочий процесс:
  - Каждая задача — `feature/<кратко-о-фиче>` от вашего `main`.
  - В ваш `main` мерж через PR.

### 2) Обновления из апстрима

- Настройте апстрим: `git remote add upstream https://github.com/cgoinglove/better-chatbot.git`
- Авто-обновление и проверки:

```bash
pnpm update:upstream
# затем, если всё зелёное:
git push origin main --force-with-lease
```

### 3) Точки касания (минимальный список)

Держите изменения в ограниченном наборе файлов. Поддерживайте список в `docs/tips-guides/touchpoints.md`.

- Провайдеры/модели: `openai-compatible.config.ts` или `OPENAI_COMPATIBLE_DATA` в `.env`.
- MCP: `custom-mcp-server/` и файловая конфигурация (`.mcp-config.json`, `FILE_BASED_MCP_CONFIG=1`).
- Инструменты: `src/lib/ai/tools/custom/*`, `src/lib/ai/tools/image/*` и условная регистрация в `tool-kit.ts` под фичефлагом.
- UI: новые компоненты/обёртки вместо правки ядра.
- БД: только новые миграции.

### 4) Фичефлаги и окружение

Используйте фичефлаги для опциональных фич (пример: `ENABLE_ECHO_TOOL`, `ENABLE_IMAGE_TOOL`). Это:

- позволяет быстро отключить эксперименты,
- снижает риск конфликтов при апдейтах,
- упрощает откат.

### 5) Качество и проверки

Перед пушем:

```bash
pnpm format
pnpm lint:fix
pnpm check-types
pnpm test
```

Для e2e (опционально): `pnpm test:e2e`.

### 6) Запуск

- Dev: `pnpm dev` (Turbopack, HMR).
- Prod локально: `pnpm build:local && pnpm start` (ставит `NO_HTTPS=1` для корректных кук).

### 7) MCP: файловая конфигурация (локально)

- Скопируйте `mcp-config.sample.json` → `.mcp-config.json`.
- В `.env`:

```dotenv
FILE_BASED_MCP_CONFIG=true
MCP_CONFIG_PATH=.mcp-config.json
```

Инструменты MCP подтянутся без правок кода.

### 8) Добавление новых инструментов

- Создайте файл в `src/lib/ai/tools/...` (пример: `custom/echo-tool.ts`, `image/generate-image.ts`).
- Подключите условно в `src/lib/ai/tools/tool-kit.ts` под фичефлагом.
- Добавьте краткое описание в `touchpoints.md`.

### 9) Что делать при конфликтах

- Разрешайте только в файлах из `touchpoints.md`.
- Пересоберите локфайл зависимостей (`pnpm i`) при спорных конфликтах в `pnpm-lock.yaml`.
- Прогоните `pnpm check` и убедитесь, что типы/тесты зелёные.

### 10) Быстрый чек-лист перед релизом

- [ ] Апдейт из апстрима: `pnpm update:upstream`
- [ ] .env настроено для нужных фич
- [ ] Линт/типы/тесты зелёные
- [ ] Документированы новые точки касания
