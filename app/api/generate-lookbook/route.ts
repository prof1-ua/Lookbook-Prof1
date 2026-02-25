import { NextRequest, NextResponse } from "next/server";
import {
  removeBackground,
  generateBaseModel,
  applyFashnTryOn,
  finalizeScene,
  getAccessoryMask,
  inpaintAccessory,
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

    // ── Шаг 4.5: Inpainting аксессуаров (SAM2 маска → Flux Kontext) ──────────
    // Для каждого аксессуара: находим регион через EVF-SAM2, затем перерисовываем
    // точно по reference-фото через Flux Kontext. Остальная часть изображения
    // не изменяется. При ошибке — тихо пропускаем, берём предыдущий результат.
    let postProcessedUrl = finalizedUrl;

    const accessoryInpaints: Array<{
      url: string;
      segmentPrompt: string;
      inpaintPrompt: string;
    }> = [
      cleanedImages.hat && {
        url: cleanedImages.hat,
        segmentPrompt: "hat cap headwear on head",
        inpaintPrompt:
          "hat from the reference image — exact same design: all logos, colors, stitching, brim shape, photorealistic, seamlessly integrated",
      },
      cleanedImages.glasses && {
        url: cleanedImages.glasses,
        segmentPrompt: "eyeglasses sunglasses on face",
        inpaintPrompt:
          "eyewear from the reference image — exact same frame color, shape, lens tint, temple design, photorealistic, naturally worn",
      },
      cleanedImages.gloves && {
        url: cleanedImages.gloves,
        segmentPrompt: "gloves on both hands",
        inpaintPrompt:
          "gloves from the reference image — exact same color, material, cut, logos, photorealistic, fitted on hands",
      },
    ].filter(Boolean) as Array<{
      url: string;
      segmentPrompt: string;
      inpaintPrompt: string;
    }>;

    for (const acc of accessoryInpaints) {
      try {
        const maskUrl = await getAccessoryMask(postProcessedUrl, acc.segmentPrompt);
        postProcessedUrl = await inpaintAccessory(
          postProcessedUrl,
          maskUrl,
          acc.url,
          acc.inpaintPrompt
        );
      } catch (err) {
        console.error(`[inpaint-accessory] ${acc.segmentPrompt}:`, err);
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
