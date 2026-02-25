import { NextRequest, NextResponse } from "next/server";
import {
  removeBackground,
  generateBaseModel,
  generateWithLoRAs,
  applyFashnTryOn,
  finalizeScene,
  fixAccessoryWithKontext,
  upscaleImage,
} from "@/lib/fal";
import type { LookbookRequest, ClothingSlot } from "@/types/lookbook";

export async function POST(req: NextRequest) {
  try {
    const { clothing, model, background, styleReferences, loraItems }: LookbookRequest = await req.json();

    // ── Шаг 1: Удаляем фон со всей одежды параллельно ────────────────────────
    const slots: ClothingSlot[] = ["top", "bottom", "hat", "shoes", "gloves", "glasses"];
    const cleanedImages: Partial<Record<ClothingSlot, string>> = {};

    await Promise.all(
      slots.map(async (slot) => {
        const item = clothing[slot];
        if (!item?.originalUrl) return;
        try {
          cleanedImages[slot] = await removeBackground(item.originalUrl);
        } catch {
          cleanedImages[slot] = item.originalUrl; // fallback на оригинал
        }
      })
    );

    let currentImageUrl: string;

    // ── Шаги 2-3: LoRA (если доступна) или FASHN ─────────────────────────────
    if (loraItems && loraItems.length > 0) {
      // LoRA путь: FLUX генерирует модель сразу в нужной одежде
      // Точнее воспроизводит товар чем FASHN + не теряет паттерны
      currentImageUrl = await generateWithLoRAs(model, loraItems);

      // Для слотов без LoRA — докидываем через FASHN поверх
      const loraSlots = new Set(loraItems.map((l) => l.slot));
      if (cleanedImages.bottom && !loraSlots.has("bottom")) {
        currentImageUrl = await applyFashnTryOn(currentImageUrl, cleanedImages.bottom, "bottoms");
      }
      if (cleanedImages.top && !loraSlots.has("top")) {
        currentImageUrl = await applyFashnTryOn(currentImageUrl, cleanedImages.top, "tops");
      }
      if (cleanedImages.shoes && !loraSlots.has("shoes")) {
        currentImageUrl = await applyFashnTryOn(currentImageUrl, cleanedImages.shoes, "auto");
      }
    } else {
      // FASHN путь: как раньше
      currentImageUrl = await generateBaseModel(model);

      if (cleanedImages.bottom) {
        currentImageUrl = await applyFashnTryOn(currentImageUrl, cleanedImages.bottom, "bottoms");
      }
      if (cleanedImages.top) {
        currentImageUrl = await applyFashnTryOn(currentImageUrl, cleanedImages.top, "tops");
      }
      if (cleanedImages.shoes) {
        currentImageUrl = await applyFashnTryOn(currentImageUrl, cleanedImages.shoes, "auto");
      }
    }

    // ── Шаг 4: Kontext — меняем только фон и позу, одежда не трогается ─────────
    // Одежда уже на модели из FASHN — лишние reference-фото только путали модель.
    const finalizedUrl = await finalizeScene(
      currentImageUrl,
      background,
      model.pose,
      model.accessory,
      styleReferences
    );

    // ── Шаг 4.5: Точная замена аксессуаров через Flux Kontext Multi ──────────
    // Передаём [готовое фото + reference аксессуара], Kontext заменяет только
    // нужный элемент без маски и без риска bleeding на соседние области.
    let postProcessedUrl = finalizedUrl;

    const accessoryFixes: Array<{ url: string; prompt: string }> = [
      cleanedImages.hat && {
        url: cleanedImages.hat,
        prompt:
          "In the first image, replace the headwear with the exact hat/cap shown in the second image — copy every detail: colors, logos, print, brim shape, stitching. Keep the face, body, all clothing, pose, lighting, and background exactly as in the first image.",
      },
      cleanedImages.glasses && {
        url: cleanedImages.glasses,
        prompt:
          "In the first image, replace the eyewear with the exact glasses shown in the second image — copy frame color, shape, lens tint, temple design precisely. Preserve everything else: face, clothing, pose, background.",
      },
      cleanedImages.gloves && {
        url: cleanedImages.gloves,
        prompt:
          "In the first image, replace the gloves on the hands with the exact gloves shown in the second image — copy color, material, cut, any logos exactly. Preserve the rest of the image unchanged.",
      },
    ].filter(Boolean) as Array<{ url: string; prompt: string }>;

    for (const fix of accessoryFixes) {
      try {
        postProcessedUrl = await fixAccessoryWithKontext(
          postProcessedUrl,
          fix.url,
          fix.prompt
        );
      } catch (err) {
        console.error("[kontext-accessory-fix]", err);
        // Fallback — берём предыдущий результат без изменений
      }
    }

    // ── Шаг 5: Апскейл ────────────────────────────────────────────────────────
    const resultUrl = await upscaleImage(postProcessedUrl);

    return NextResponse.json({ resultUrl });
  } catch (err) {
    console.error("[generate-lookbook]", err);
    return NextResponse.json(
      { error: "Lookbook generation failed", details: String(err) },
      { status: 500 }
    );
  }
}

export const maxDuration = 300; // 5 минут — Vercel Pro
