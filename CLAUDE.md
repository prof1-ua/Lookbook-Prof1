# Lookbook Generator — CLAUDE.md

## 1. Описание проекта

AI-генератор лукбуков для бренда P1G (PROF1 Group). Загружаешь фото одежды → система примеряет её на AI-модель → помещает в выбранную локацию (лес, горы, город…). Целевая аудитория — команда бренда для создания каталогов и маркетинговых материалов. Деплой: https://lookbook-prof1.vercel.app

## 2. Запуск

```bash
# Разработка
npm run dev

# Сборка
npm run build

# Проверка типов
npx tsc --noEmit
```

Переменные окружения (`.env.local`):
```
FAL_KEY=ваш_ключ_от_fal.ai
```

Деплой автоматический: `git push origin main` → Vercel подхватывает.
GitHub: https://github.com/prof1-ua/Lookbook-Prof1

## 3. Структура проекта

```
app/
  generate/page.tsx          # Главная страница генерации (форма + состояние)
  api/
    generate-lookbook/       # Основной пайплайн генерации (birefnet→FASHN→Kontext→upscale)
    remove-background/       # Удаление фона через birefnet
    train-lora/              # POST: запуск обучения LoRA
    train-lora/status/       # GET: статус обучения LoRA
    fal/proxy/               # Прокси для FAL storage upload (скрывает FAL_KEY от браузера)

components/
  ClothingUploader.tsx       # Загрузка фото одежды + кнопка "Обучить LoRA"

lib/
  fal.ts                     # Все обёртки FAL.ai (removeBackground, applyFashnTryOn, finalizeScene, LoRA)
  fal-client.ts              # Конфигурация FAL-клиента для браузера (proxyUrl)
  utils.ts                   # resizeImage, uploadFileToFal

types/
  lookbook.ts                # Все TypeScript типы (ClothingItem, ModelParams, LoRAItem…)
```

## 4. AI-пайплайн генерации

```
1. birefnet               → удаление фона с фото одежды
2. flux/dev               → генерация базовой модели (нейтральная поза, серый фон)
3. fashn/tryon/v1.6       → примерка одежды (tops/bottoms/shoes) — сохраняет паттерны
4. flux-pro/kontext/multi → замена фона на локацию, добавление аксессуаров
5. clarity-upscaler       → апскейл ×2 для печатного качества
```

LoRA-путь (если обучена): `flux-lora-fast-training` → `flux-lora` (заменяет шаги 2-3).

## 5. Стиль работы

- **Сразу делать**, не спрашивать разрешения на мелкие изменения
- Отвечать кратко, без лишних объяснений
- Коммитить и пушить сразу после изменений (деплой автоматический)
- Язык общения: русский

## 6. Правила

**Всегда:**
- Добавлять `export const maxDuration = 60` в любой API route, который вызывает внешние API (FAL, birefnet, FASHN)
- Использовать `as any` для FAL Kontext Multi inputs (TypeScript не знает все поля)
- При ошибках FAL — показывать `data.details` пользователю, не только `data.error`

**Никогда:**
- Не удалять `segmentation_free: false` в FASHN — критично для сохранения паттернов (мультикам, принты)
- Не передавать reference-изображения одежды в `finalizeScene` — только `dressedModelUrl` + style refs
- Не использовать `fal-ai/flux-2-pro/edit` для финализации — только `fal-ai/flux-pro/kontext/multi`
- Не ставить `fal-ai/flux/dev/lora` — правильный endpoint для LoRA инференса: `fal-ai/flux-lora`

## 7. Ключевые решения (почему так)

| Решение | Причина |
|---------|---------|
| `segmentation_free: false` | Сохраняет альфа-канал от birefnet → лучше воспроизводит паттерны |
| Kontext вместо flux-2-pro/edit | Точечное редактирование фона без искажения одежды |
| LoRA training через `flux-lora-fast-training` | $2 фиксировано, ~5 мин vs $5+ и 20+ мин у legacy |
| JSZip arraybuffer (не nodebuffer) | nodebuffer не совместим с Blob в браузере/edge runtime |
