"use client";

/**
 * Конфигурация FAL-клиента для браузера.
 * Использует прокси /api/fal/proxy чтобы не раскрывать FAL_KEY.
 * Импортируй этот файл один раз в layout.tsx или в компонентах где нужен upload.
 */
import { fal } from "@fal-ai/client";

fal.config({
  proxyUrl: "/api/fal/proxy",
});

export { fal };
