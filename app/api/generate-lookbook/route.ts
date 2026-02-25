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
    const { clothing, model, background }: LookbookRequest = await req.json();

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

    // ── Шаг 3: FASHN примерка — сначала низ, потом верх, потом перчатки ───────
    // Порядок важен: FASHN лучше справляется когда низ применяется первым,
    // потому что верхняя одежда может перекрывать линию талии.
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

    if (cleanedImages.gloves) {
      currentImageUrl = await applyFashnTryOn(
        currentImageUrl,
        cleanedImages.gloves,
        "auto"
      );
    }

    // ── Шаг 4: FLUX.2 — финализация сцены ────────────────────────────────────
    // Берём одетую модель из FASHN, переносим на локацию.
    // Шляпа, обувь, очки передаются как reference-фото — FLUX добавляет их органично.
    const finalizedUrl = await finalizeScene(
      currentImageUrl,
      background,
      cleanedImages.hat,
      cleanedImages.shoes,
      cleanedImages.top,     // reference для верха — FLUX точнее сохранит принт/цвет
      cleanedImages.bottom,  // reference для низа
      cleanedImages.glasses, // reference для очков — FLUX накладывает на лицо
      model.pose,
      model.accessory
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
