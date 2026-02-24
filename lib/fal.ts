import { fal } from "@fal-ai/client";
import type {
  ModelParams,
  BackgroundParams,
  LocationPreset,
  TimeOfDay,
  Weather,
} from "@/types/lookbook";

fal.config({ credentials: process.env.FAL_KEY! });

// ─── Шаг 1: Удаление фона с одежды ───────────────────────────────────────────

export async function removeBackground(imageUrl: string): Promise<string> {
  const result = await fal.run("fal-ai/birefnet", {
    input: { image_url: imageUrl, model: "General Use (Light)" },
  }) as { data: { image: { url: string } } };
  return result.data.image.url;
}

// ─── Шаг 2: Генерация базовой модели (FLUX.1 Schnell) ────────────────────────
// Нейтральная поза, студийный фон — идеальная "канва" для примерки в FASHN

const BODY_TYPE_MAP: Record<string, string> = {
  slim: "slim athletic figure",
  average: "average build figure",
  plus: "plus-size curvy figure",
};

const BUST_MAP: Record<string, string> = {
  XS: "very small chest",
  S: "small chest",
  M: "medium chest",
  L: "full chest",
  XL: "large chest",
  XXL: "very large chest",
};

const SKIN_MAP: Record<string, string> = {
  fair: "very fair porcelain skin",
  light: "light skin",
  medium: "medium skin tone",
  olive: "olive skin tone",
  brown: "brown skin",
  dark: "dark skin",
};

export async function generateBaseModel(params: ModelParams): Promise<string> {
  const gender = params.gender === "female" ? "young woman" : "young man";

  const prompt = [
    `Professional fashion model, ${gender}`,
    `${params.height}cm tall`,
    BODY_TYPE_MAP[params.bodyType],
    BUST_MAP[params.bustSize],
    SKIN_MAP[params.skinTone],
    `${params.hairColor} ${params.hairLength} hair`,
    "standing straight, neutral T-pose, arms slightly away from body",
    "full body shot head to toe, whole figure visible",
    "plain light grey seamless studio background",
    "front view, centered in frame",
    "professional fashion photography lighting",
    "sharp focus, 8k",
  ].join(", ");

  const result = await fal.run("fal-ai/flux/schnell", {
    input: {
      prompt,
      image_size: "portrait_4_3",
      num_inference_steps: 4,
      num_images: 1,
    },
  }) as { data: { images: Array<{ url: string }> } };

  return result.data.images[0].url;
}

// ─── Шаг 3: Примерка одежды через FASHN ──────────────────────────────────────
// FASHN специализируется именно на fashion — воспроизводит принты, цвета,
// фактуры ткани с точностью ~90%. Применяем по одному предмету за раз.

export async function applyFashnTryOn(
  modelImageUrl: string,
  garmentImageUrl: string,
  category: "tops" | "bottoms" | "one-pieces" | "auto"
): Promise<string> {
  const result = await fal.run("fal-ai/fashn/tryon/v1.6", {
    input: {
      model_image: modelImageUrl,
      garment_image: garmentImageUrl,
      category,
      mode: "quality",
      garment_photo_type: "auto",
      segmentation_free: true,
      output_format: "png",
    },
  }) as { data: { images: Array<{ url: string }> } };

  return result.data.images[0].url;
}

// ─── Шаг 4: Финализация — фон + шляпа + обувь (FLUX.2 [pro] edit) ────────────

const LOCATION_PROMPTS: Record<LocationPreset, string> = {
  forest:
    "dense green forest, tall pine trees, dappled natural light through leaves, forest path",
  mountains:
    "dramatic alpine mountain landscape, rocky peaks, clear sky, mountain meadow",
  beach:
    "sandy beach, turquoise ocean waves, tropical palm trees, coastal scenery",
  city:
    "modern city street, beautiful urban architecture, sidewalk, city environment",
  studio:
    "high-end photography studio, seamless white backdrop, professional softbox lighting",
  field:
    "open wildflower field, golden countryside, scenic rural landscape, horizon",
};

const TIME_PROMPTS: Record<TimeOfDay, string> = {
  day: "bright midday natural light, clear sky",
  golden_hour: "warm golden hour light, soft sunset glow, long shadows",
  dusk: "blue hour twilight, soft purple and orange gradient sky",
};

const WEATHER_PROMPTS: Record<Weather, string> = {
  sunny: "clear sunny weather, crisp shadows",
  cloudy: "overcast soft diffused light, even illumination, no harsh shadows",
  foggy: "atmospheric misty fog, soft dreamy mood, reduced visibility in distance",
};

export async function finalizeScene(
  dressedModelUrl: string,
  background: BackgroundParams,
  hatUrl?: string,
  shoesUrl?: string,
  topUrl?: string,
  bottomUrl?: string
): Promise<string> {
  // image 1 — одетая модель из FASHN (основа)
  const imageUrls: string[] = [dressedModelUrl];
  const garmentRefs: string[] = [];

  // Передаём оригинальные фото одежды как reference — FLUX точнее сохранит детали
  if (topUrl) {
    imageUrls.push(topUrl);
    garmentRefs.push(`top/shirt garment from image ${imageUrls.length}`);
  }
  if (bottomUrl) {
    imageUrls.push(bottomUrl);
    garmentRefs.push(`bottom/pants garment from image ${imageUrls.length}`);
  }
  if (hatUrl) {
    imageUrls.push(hatUrl);
    garmentRefs.push(`headwear/hat from image ${imageUrls.length}`);
  }
  if (shoesUrl) {
    imageUrls.push(shoesUrl);
    garmentRefs.push(`shoes/footwear from image ${imageUrls.length}`);
  }

  const sceneDesc = background.customPrompt
    ? background.customPrompt
    : [
        LOCATION_PROMPTS[background.location],
        TIME_PROMPTS[background.timeOfDay],
        WEATHER_PROMPTS[background.weather],
      ].join(", ");

  const garmentPart =
    garmentRefs.length > 0
      ? ` Keep all clothing faithful to the reference images: ${garmentRefs.join(", ")} — preserve exact colors, prints, patterns, textures.`
      : "";

  const prompt =
    `Take the fashion model exactly from image 1 — preserve the person, pose, and all clothing details precisely.` +
    garmentPart +
    ` Replace the background with: ${sceneDesc}.` +
    ` The model stands naturally in this setting with matching realistic lighting and shadows.` +
    ` Professional fashion editorial photography, Vogue magazine quality, 85mm lens, shallow depth of field, 8k, photorealistic.`;

  const result = await fal.run("fal-ai/flux-2-pro/edit", {
    input: {
      prompt,
      image_urls: imageUrls,
      image_size: "portrait_4_3",
      safety_tolerance: "4",
      output_format: "jpeg",
    },
  }) as { data: { images: Array<{ url: string }> } };

  return result.data.images[0].url;
}

// ─── Шаг 5: Апскейл ──────────────────────────────────────────────────────────

export async function upscaleImage(imageUrl: string): Promise<string> {
  const result = await fal.run("fal-ai/clarity-upscaler", {
    input: {
      image_url: imageUrl,
      upscale_factor: 2,
      creativity: 0.3,
      resemblance: 0.65,
      prompt:
        "professional fashion editorial photography, sharp focus, high detail, photorealistic",
    },
  }) as { data: { image: { url: string } } };

  return result.data.image.url;
}
