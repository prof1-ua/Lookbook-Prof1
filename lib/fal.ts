import { fal } from "@fal-ai/client";
import JSZip from "jszip";
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
  LoRAItem,
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
      // false = FASHN uses alpha channel from our birefnet-cleaned PNG
      // → лучше сохраняет сложные паттерны (камуфляж, принты)
      segmentation_free: false,
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
  pose?: Pose,
  accessory?: Accessory,
  styleReferences?: StyleReference[]
): Promise<string> {
  // Kontext Multi — точечное редактирование: меняем только фон/позу,
  // одежда из FASHN не трогается (не передаём лишних reference-фото одежды).
  const imageUrls: string[] = [dressedModelUrl];
  const stylePromptParts: string[] = [];

  if (styleReferences) {
    for (const ref of styleReferences) {
      if (ref.uploadedUrl && ref.description) {
        imageUrls.push(ref.uploadedUrl);
        stylePromptParts.push(`Image ${imageUrls.length} (style reference): ${ref.description}`);
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

  const posePart = pose && pose !== "standing"
    ? ` The model is ${POSE_PROMPTS[pose]}.`
    : "";

  const accessoryPart = accessory && accessory !== "none"
    ? ` The model is ${ACCESSORY_PROMPTS[accessory]}.`
    : "";

  const scenePropPart = background.sceneProp && background.sceneProp !== "none"
    ? ` Scene includes: ${SCENE_PROP_PROMPTS[background.sceneProp]}.`
    : "";

  const prompt =
    `Keep the person from image 1 — face, body, and ALL clothing — 100% identical. ` +
    `Do not alter any clothing color, pattern, texture, or fit. ` +
    `Replace only the background with: ${sceneDesc}.` +
    posePart +
    accessoryPart +
    scenePropPart +
    (stylePromptParts.length > 0 ? ` Style references: ${stylePromptParts.join(". ")}.` : "") +
    ` Adapt lighting and shadows to match the new scene. ` +
    `Professional fashion editorial photography, 85mm lens, 8k photorealistic.`;

  const result = await fal.run("fal-ai/flux-pro/kontext/multi", {
    input: {
      image_urls: imageUrls,
      prompt,
      num_inference_steps: 40,
      guidance_scale: 2.5,
      safety_tolerance: "6",
      output_format: "jpeg",
    } as any,
  }) as { data: { images: Array<{ url: string }> } };

  return result.data.images[0].url;
}

// ─── Шаг 4.5: Точная замена аксессуаров через Flux Kontext Multi ──────────────
// Передаём [готовое фото, reference-фото аксессуара] и просим заменить только
// аксессуар. Kontext Multi видит оба изображения и редактирует точечно —
// без маски, без риска bleeding текстуры на соседние области.

export async function fixAccessoryWithKontext(
  imageUrl: string,
  referenceUrl: string,
  prompt: string
): Promise<string> {
  const result = await fal.run("fal-ai/flux-pro/kontext/multi", {
    input: {
      image_urls: [imageUrl, referenceUrl],
      prompt,
      num_inference_steps: 40,
      guidance_scale: 6,  // было 3.5 — выше = точнее воспроизводит reference
      safety_tolerance: "6",
      output_format: "jpeg",
    } as any,
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

// ─── LoRA: Обучение на конкретном товаре ─────────────────────────────────────
// 1. Скачиваем все фото товара
// 2. Пакуем в ZIP и загружаем в FAL storage
// 3. Отправляем задачу в очередь → возвращаем request_id (тренировка ~5-10 мин)

export async function submitLoRATraining(
  imageUrls: string[],
  triggerWord: string
): Promise<string> {
  const zip = new JSZip();

  await Promise.all(
    imageUrls.map(async (url, i) => {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      const ext = url.split("?")[0].split(".").pop() || "jpg";
      zip.file(`image_${String(i + 1).padStart(2, "0")}.${ext}`, buffer);
    })
  );

  const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });
  const zipBlob = new Blob([zipBuffer], { type: "application/zip" });
  const zipFile = new File([zipBlob], "training_images.zip", { type: "application/zip" });
  const zipUrl = await fal.storage.upload(zipFile);

  const { request_id } = await fal.queue.submit("fal-ai/flux/dev/lora/training", {
    input: {
      images_data_url: zipUrl,
      trigger_word: triggerWord,
      steps: 500,
      lora_rank: 16,
      learning_rate: 0.0001,
      batch_size: 1,
      resolution: "512,768,1024",
      autocaption: true,
    },
  });

  return request_id;
}

// ─── LoRA: Проверка статуса тренировки ───────────────────────────────────────

export async function getLoRATrainingResult(
  requestId: string
): Promise<{ status: "training" | "done" | "failed"; loraUrl?: string }> {
  const status = await fal.queue.status("fal-ai/flux/dev/lora/training", {
    requestId,
    logs: false,
  });

  if (status.status === "COMPLETED") {
    const result = await fal.queue.result("fal-ai/flux/dev/lora/training", {
      requestId,
    }) as { data: { diffusers_lora_file?: { url: string }; lora?: { url: string } } };
    const loraUrl =
      result.data?.diffusers_lora_file?.url ?? result.data?.lora?.url;
    if (!loraUrl) throw new Error("LoRA URL not found in result");
    return { status: "done", loraUrl };
  }

  // IN_QUEUE | IN_PROGRESS → ещё тренируется
  return { status: "training" };
}

// ─── LoRA: Генерация модели с обученными LoRA (заменяет FASHN) ───────────────
// Все LoRA активны одновременно, scale уменьшается при большом количестве LoRA
// чтобы они не конфликтовали друг с другом.

export async function generateWithLoRAs(
  model: ModelParams,
  loraItems: LoRAItem[]
): Promise<string> {
  const gender = model.gender === "female" ? "young woman" : "young man";
  const clothingDesc = loraItems.map((item) => item.triggerWord).join(", ");
  const loraScale = Math.max(0.5, 0.9 - (loraItems.length - 1) * 0.12);

  const prompt = [
    `Professional fashion model, ${gender}`,
    `${model.height}cm tall`,
    BODY_TYPE_MAP[model.bodyType],
    SKIN_MAP[model.skinTone],
    `${model.hairColor} ${model.hairLength} hair`,
    `wearing ${clothingDesc}`,
    "standing straight, neutral T-pose, arms slightly away from body",
    "full body shot head to toe, whole figure visible",
    "plain light grey seamless studio background",
    "front view, centered in frame",
    "professional fashion photography lighting",
    "sharp focus, 8k",
  ].join(", ");

  const result = await fal.run("fal-ai/flux/dev/lora", {
    input: {
      prompt,
      loras: loraItems.map((item) => ({ path: item.loraUrl, scale: loraScale })),
      image_size: "portrait_4_3",
      num_inference_steps: 30,
      num_images: 1,
    },
  }) as { data: { images: Array<{ url: string }> } };

  return result.data.images[0].url;
}
