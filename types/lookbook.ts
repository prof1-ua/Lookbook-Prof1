// ─── Clothing ─────────────────────────────────────────────────────────────────

export type ClothingSlot = "top" | "bottom" | "hat" | "shoes" | "gloves" | "glasses";

export interface ClothingItem {
  slot: ClothingSlot;
  /** Blob URL for browser preview only (not accessible server-side) */
  originalUrl: string;
  /** FAL storage URL — set after upload, valid server-side */
  uploadedUrl?: string;
  /** URL after background removal */
  cleanUrl?: string;
  /** Extra FAL URLs for additional angles (used as FLUX reference images) */
  extraUploadedUrls?: string[];
  /** LoRA trained weights URL */
  loraUrl?: string;
  /** Unique trigger word used in generation prompts */
  triggerWord?: string;
  /** Training job state */
  loraStatus?: "idle" | "training" | "ready" | "error";
  /** FAL queue request ID for polling */
  loraRequestId?: string;
}

// ─── Model Parameters ──────────────────────────────────────────────────────────

export type Gender = "female" | "male";

export type BodyType = "slim" | "average" | "plus";

export type SkinTone =
  | "fair"
  | "light"
  | "medium"
  | "olive"
  | "brown"
  | "dark";

export type HairColor =
  | "blonde"
  | "brunette"
  | "black"
  | "red"
  | "gray"
  | "white";

export type HairLength = "short" | "medium" | "long";

export type BustSize = "XS" | "S" | "M" | "L" | "XL" | "XXL";

export type Pose =
  | "standing"
  | "walking"
  | "leaning"
  | "over_shoulder"
  | "sitting";

export type Accessory =
  | "none"
  | "ak47"
  | "glock"
  | "tactical_backpack";

export interface ModelParams {
  gender: Gender;
  /** cm, 150–200 */
  height: number;
  bodyType: BodyType;
  bustSize: BustSize;
  skinTone: SkinTone;
  hairColor: HairColor;
  hairLength: HairLength;
  pose: Pose;
  accessory: Accessory;
}

// ─── Background / Location ────────────────────────────────────────────────────

export type LocationPreset =
  | "forest"
  | "mountains"
  | "beach"
  | "city"
  | "studio"
  | "field";

export type TimeOfDay = "day" | "golden_hour" | "dusk";

export type Weather = "sunny" | "cloudy" | "foggy" | "rain" | "snow" | "wind";

export type SceneProp =
  | "none"
  | "military_vehicle"
  | "suv"
  | "motorcycle"
  | "bicycle"
  | "yacht"
  | "helicopter";

export interface BackgroundParams {
  location: LocationPreset;
  timeOfDay: TimeOfDay;
  weather: Weather;
  sceneProp?: SceneProp;
  /** Optional free-text override */
  customPrompt?: string;
}

// ─── Generation State ─────────────────────────────────────────────────────────

export type GenerationStep =
  | "idle"
  | "removing_bg"
  | "generating_model"
  | "try_on"
  | "finalizing"
  | "upscaling"
  | "done"
  | "error";

export interface GenerationState {
  step: GenerationStep;
  progress: number; // 0–100
  message: string;
  /** Final result image URLs */
  resultUrls: string[];
  error?: string;
}

// ─── Style References ─────────────────────────────────────────────────────────

export interface StyleReference {
  /** Blob URL for browser preview */
  originalUrl: string;
  /** FAL storage URL — used server-side */
  uploadedUrl?: string;
  /** What to take from this image: pose, lighting, style, etc. */
  description: string;
}

// ─── Full Lookbook Request ────────────────────────────────────────────────────

export interface LoRAItem {
  slot: ClothingSlot;
  loraUrl: string;
  triggerWord: string;
}

export interface LookbookRequest {
  clothing: Partial<Record<ClothingSlot, ClothingItem>>;
  model: ModelParams;
  background: BackgroundParams;
  styleReferences?: StyleReference[];
  /** When present, use LoRA generation instead of FASHN for these slots */
  loraItems?: LoRAItem[];
}

// ─── API Response shapes ──────────────────────────────────────────────────────

export interface RemoveBgResponse {
  cleanUrl: string;
}

export interface GenerateModelResponse {
  modelImageUrl: string;
}

export interface TryOnResponse {
  resultUrl: string;
}

export interface SetBackgroundResponse {
  resultUrl: string;
}

export interface UpscaleResponse {
  resultUrl: string;
}
