// ─── Clothing ─────────────────────────────────────────────────────────────────

export type ClothingSlot = "top" | "bottom" | "hat" | "shoes";

export interface ClothingItem {
  slot: ClothingSlot;
  /** Blob URL for browser preview only (not accessible server-side) */
  originalUrl: string;
  /** FAL storage URL — set after upload, valid server-side */
  uploadedUrl?: string;
  /** URL after background removal */
  cleanUrl?: string;
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

export interface ModelParams {
  gender: Gender;
  /** cm, 150–200 */
  height: number;
  bodyType: BodyType;
  bustSize: BustSize;
  skinTone: SkinTone;
  hairColor: HairColor;
  hairLength: HairLength;
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

export type Weather = "sunny" | "cloudy" | "foggy";

export interface BackgroundParams {
  location: LocationPreset;
  timeOfDay: TimeOfDay;
  weather: Weather;
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

// ─── Full Lookbook Request ────────────────────────────────────────────────────

export interface LookbookRequest {
  clothing: Partial<Record<ClothingSlot, ClothingItem>>;
  model: ModelParams;
  background: BackgroundParams;
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
