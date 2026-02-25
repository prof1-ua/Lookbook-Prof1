import { NextRequest, NextResponse } from "next/server";
import {
  removeBackground,
  generateBaseModel,
  applyFashnTryOn,
  finalizeScene,
  upscaleImage,
} from "@/lib/fal";
import type { LookbookRequest, ClothingSlot } from "@/types/lookbook";

export async function POST(req: NextRequest) {
  try {
    const { clothing, model, background, styleReferences }: LookbookRequest = await req.json();

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

    // ── Шаг 2: Генерируем базовую модель в нейтральной позе ───────────────────
    // Нейтральная поза критически важна для FASHN — так примерка получается чище
    let currentImageUrl = await generateBaseModel(model);

    // ── Шаг 3: FASHN примерка — низ → верх → обувь ───────────────────────────
    // Порядок важен: низ первым (верх перекрывает талию), обувь последней (ноги).
    // Перчатки, очки, кепка — только через FLUX reference (FASHN путает аксессуары).
    if (cleanedImages.bottom) {
      currentImageUrl = await applyFashnTryOn(
        currentImageUrl,
        cleanedImages.bottom,
        "bottoms"
      );
    }

    if (cleanedImages.top) {
      currentImageUrl = await applyFashnTryOn(
        currentImageUrl,
        cleanedImages.top,
        "tops"
      );
    }

    // Обувь через FASHN — точнее воспроизводит цвет, подошву, шнуровку чем FLUX
    if (cleanedImages.shoes) {
      currentImageUrl = await applyFashnTryOn(
        currentImageUrl,
        cleanedImages.shoes,
        "auto"
      );
    }

    // ── Шаг 4: FLUX.2 — финализация сцены ────────────────────────────────────
    // Собираем доп. углы одежды из всех слотов
    const extraReferenceUrls: string[] = [];
    for (const slot of slots) {
      const item = clothing[slot];
      if (item?.extraUploadedUrls) {
        extraReferenceUrls.push(...item.extraUploadedUrls);
      }
    }

    const finalizedUrl = await finalizeScene(
      currentImageUrl,
      background,
      cleanedImages.hat,
      cleanedImages.shoes,
      cleanedImages.top,
      cleanedImages.bottom,
      cleanedImages.glasses,
      cleanedImages.gloves,
      model.pose,
      model.accessory,
      extraReferenceUrls.length > 0 ? extraReferenceUrls : undefined,
      styleReferences
    );

    // ── Шаг 5: Апскейл ────────────────────────────────────────────────────────
    const resultUrl = await upscaleImage(finalizedUrl);

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
