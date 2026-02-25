import { fal } from "@fal-ai/client";
import type {
  ModelParams,
  BackgroundParams,
  LocationPreset,
  TimeOfDay,
  Weather,
  SceneProp,
  Pose,
  Accessory,
  StyleReference,
} from "@/types/lookbook";

fal.config({ credentials: process.env.FAL_KEY! });

// ─── Шаг 1: Удаление фона с одежды ───────────────────────────────────────────

export async function removeBackground(imageUrl: string): Promise<string> {
  const result = await fal.run("fal-ai/birefnet", {
    input: { image_url: imageUrl, model: "General Use (Light)" },
  }) as { data: { image: { url: string } } };
  return result.data.image.url;
}

// ─── Шаг 2: Генерация базовой модели (FLUX.1 Dev) ────────────────────────────
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

  const result = await fal.run("fal-ai/flux/dev", {
    input: {
      prompt,
      image_size: "portrait_4_3",
      num_inference_steps: 28,
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

// ─── Шаг 4: Финализация — фон + шляпа + обувь + очки (FLUX.2 [pro] edit) ─────

const POSE_PROMPTS: Record<Pose, string> = {
  standing: "standing naturally, confident pose, hands relaxed at sides",
  walking: "walking naturally, one step forward, dynamic movement, mid-stride",
  leaning: "leaning casually against a wall or surface, relaxed and confident",
  over_shoulder: "turned slightly away, looking back over shoulder toward camera, elegant editorial pose",
  sitting: "sitting elegantly, legs crossed or to the side, poised",
};

const ACCESSORY_PROMPTS: Record<Accessory, string> = {
  none: "",
  ak47: "AK-47 rifle slung across chest on tactical sling, operator carry position, military style",
  glock: "Glock pistol in drop-leg tactical holster on thigh, law enforcement equipment",
  tactical_backpack: "wearing a 5.11 Tactical backpack on back, straps adjusted, ready for action",
};

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
  rain: "heavy rain, wet ground reflections, rain drops falling, dramatic stormy atmosphere",
  snow: "heavy snowfall, snow covered ground, snowflakes in air, crisp winter atmosphere",
  wind: "strong gusting wind, dynamic wind-blown hair and clothing, dramatic weather",
};

const SCENE_PROP_PROMPTS: Record<SceneProp, string> = {
  none: "",
  military_vehicle: "military tactical armored vehicle parked in the background",
  suv: "large tactical SUV parked nearby in the scene",
  motorcycle: "heavy military-style motorcycle parked in the scene",
  bicycle: "bicycle leaning against a surface in the background",
  yacht: "luxury motor yacht moored at dock visible behind the model",
  helicopter: "military helicopter on the ground visible in the background",
};

export async function finalizeScene(
  dressedModelUrl: string,
  background: BackgroundParams,
  hatUrl?: string,
  shoesUrl?: string,
  topUrl?: string,
  bottomUrl?: string,
  glassesUrl?: string,
  glovesUrl?: string,
  pose?: Pose,
  accessory?: Accessory,
  extraReferenceUrls?: string[],      // доп. углы одежды
  styleReferences?: StyleReference[]  // пользовательские референсы
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
  if (glassesUrl) {
    imageUrls.push(glassesUrl);
    garmentRefs.push(`eyewear/glasses from image ${imageUrls.length} — place on model's face`);
  }
  if (glovesUrl) {
    imageUrls.push(glovesUrl);
    garmentRefs.push(`gloves from image ${imageUrls.length} — place on model's hands only, do not affect any other garment`);
  }

  // Доп. углы одежды — только как reference для FLUX (не для FASHN)
  if (extraReferenceUrls) {
    for (const url of extraReferenceUrls) {
      imageUrls.push(url);
      garmentRefs.push(`additional garment angle from image ${imageUrls.length}`);
    }
  }

  // Стиль-референсы с описанием пользователя
  const styleRefPromptParts: string[] = [];
  if (styleReferences) {
    for (const ref of styleReferences) {
      if (ref.uploadedUrl && ref.description) {
        imageUrls.push(ref.uploadedUrl);
        styleRefPromptParts.push(`From image ${imageUrls.length}: ${ref.description}`);
      }
    }
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

  const posePart = pose && pose !== "standing"
    ? ` The model is ${POSE_PROMPTS[pose]}.`
    : ` The model stands naturally in this setting.`;

  const accessoryPart = accessory && accessory !== "none"
    ? ` The model is ${ACCESSORY_PROMPTS[accessory]}.`
    : "";

  const scenePropPart = background.sceneProp && background.sceneProp !== "none"
    ? ` Scene includes: ${SCENE_PROP_PROMPTS[background.sceneProp]}.`
    : "";

  const styleRefPart = styleRefPromptParts.length > 0
    ? ` Style references: ${styleRefPromptParts.join(". ")}.`
    : "";

  const prompt =
    `Take the fashion model exactly from image 1 — preserve the person and all clothing details precisely.` +
    garmentPart +
    ` Replace the background with: ${sceneDesc}.` +
    posePart +
    accessoryPart +
    scenePropPart +
    styleRefPart +
    ` Matching realistic lighting and shadows.` +
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
