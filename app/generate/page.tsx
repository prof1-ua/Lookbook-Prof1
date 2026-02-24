"use client";

import { useState } from "react";
import { ClothingUploader } from "@/components/ClothingUploader";
import { ModelConfigurator } from "@/components/ModelConfigurator";
import { BackgroundSelector } from "@/components/BackgroundSelector";
import { GenerationProgress } from "@/components/GenerationProgress";
import { LookbookResult } from "@/components/LookbookResult";
import { P1GIcon } from "@/components/P1GIcon";
import { cn } from "@/lib/utils";
import type {
  ClothingItem,
  ClothingSlot,
  ModelParams,
  BackgroundParams,
  GenerationStep,
} from "@/types/lookbook";

// ─── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_MODEL: ModelParams = {
  gender: "female",
  height: 170,
  bodyType: "average",
  bustSize: "M",
  skinTone: "light",
  hairColor: "brunette",
  hairLength: "long",
  pose: "standing",
  accessory: "none",
};

const DEFAULT_BG: BackgroundParams = {
  location: "forest",
  timeOfDay: "golden_hour",
  weather: "sunny",
};

// ─── Stepper ───────────────────────────────────────────────────────────────────

const WIZARD_STEPS = [
  { id: "clothing", label: "Одежда", short: "1" },
  { id: "model", label: "Модель", short: "2" },
  { id: "background", label: "Локация", short: "3" },
];

type WizardStep = "clothing" | "model" | "background";

export default function GeneratePage() {
  // Wizard state
  const [wizardStep, setWizardStep] = useState<WizardStep>("clothing");
  const [clothing, setClothing] = useState<Partial<Record<ClothingSlot, ClothingItem>>>({});
  const [modelParams, setModelParams] = useState<ModelParams>(DEFAULT_MODEL);
  const [bgParams, setBgParams] = useState<BackgroundParams>(DEFAULT_BG);

  // Generation state
  const [genStep, setGenStep] = useState<GenerationStep>("idle");
  const [genMessage, setGenMessage] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isGenerating = genStep !== "idle" && genStep !== "done" && genStep !== "error";

  function updateClothing(slot: ClothingSlot, item: ClothingItem | null) {
    setClothing((prev) => {
      const next = { ...prev };
      if (item === null) delete next[slot];
      else next[slot] = item;
      return next;
    });
  }

  const hasClothing = Object.keys(clothing).length > 0;
  const isUploading = Object.values(clothing).some((item) => !item.uploadedUrl && !item.cleanUrl);

  async function handleGenerate() {
    setError(null);
    setGenStep("removing_bg");
    setGenMessage("Убираем фон с фото одежды…");

    try {
      // cleanUrl или uploadedUrl — оба доступны серверу (не blob://)
      const clothingPayload: Record<string, { slot: ClothingSlot; originalUrl: string }> = {};
      for (const [slot, item] of Object.entries(clothing)) {
        const serverUrl = item.cleanUrl || item.uploadedUrl;
        if (!serverUrl) {
          throw new Error("Подождите, файл ещё загружается…");
        }
        clothingPayload[slot] = {
          slot: slot as ClothingSlot,
          originalUrl: serverUrl,
        };
      }

      await new Promise((r) => setTimeout(r, 150));
      setGenStep("generating_model");
      setGenMessage("Генерируем модель по вашим параметрам…");

      await new Promise((r) => setTimeout(r, 150));
      setGenStep("try_on");
      setGenMessage("FASHN примеряет одежду — точное воспроизведение деталей…");

      // Запускаем весь пайплайн на сервере
      const res = await fetch("/api/generate-lookbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clothing: clothingPayload,
          model: modelParams,
          background: bgParams,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }

      const { resultUrl: url } = await res.json();

      setGenStep("finalizing");
      setGenMessage("Добавляем локацию и финальные детали…");
      await new Promise((r) => setTimeout(r, 300));

      setGenStep("upscaling");
      setGenMessage("Повышаем качество до уровня печати…");
      await new Promise((r) => setTimeout(r, 400));

      setResultUrl(url);
      setGenStep("done");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Произошла ошибка");
      setGenStep("error");
    }
  }

  function handleReset() {
    setClothing({});
    setModelParams(DEFAULT_MODEL);
    setBgParams(DEFAULT_BG);
    setGenStep("idle");
    setResultUrl(null);
    setError(null);
    setWizardStep("clothing");
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  if (genStep === "done" && resultUrl) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
          <LookbookResult resultUrl={resultUrl} onReset={handleReset} />
        </div>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
          <GenerationProgress currentStep={genStep} message={genMessage} />
        </div>
      </div>
    );
  }

  const currentStepIndex = WIZARD_STEPS.findIndex((s) => s.id === wizardStep);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gray-950 border-b-2 border-red-600 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <P1GIcon size={36} />
            <div>
              <h1 className="text-lg font-black uppercase tracking-tight leading-none">PROF1GROUP Lookbook Generator</h1>
              <p className="text-gray-400 text-xs mt-0.5 uppercase tracking-wide">
                мережа військових магазинів
              </p>
            </div>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex border-b border-gray-100">
          {WIZARD_STEPS.map((step, idx) => {
            const isDone = idx < currentStepIndex;
            const isCurrent = step.id === wizardStep;
            return (
              <button
                key={step.id}
                onClick={() => idx <= currentStepIndex && setWizardStep(step.id as WizardStep)}
                className={cn(
                  "flex-1 py-3 text-xs font-medium text-center transition-colors border-b-2",
                  isCurrent
                    ? "border-red-600 text-red-600"
                    : isDone
                    ? "border-transparent text-green-600 cursor-pointer"
                    : "border-transparent text-gray-400 cursor-default"
                )}
              >
                <span
                  className={cn(
                    "inline-flex items-center justify-center w-5 h-5 rounded-full text-xs mr-1",
                    isCurrent && "bg-red-600 text-white",
                    isDone && "bg-green-100 text-green-600",
                    !isCurrent && !isDone && "bg-gray-100 text-gray-400"
                  )}
                >
                  {isDone ? "✓" : step.short}
                </span>
                {step.label}
              </button>
            );
          })}
        </div>

        {/* Step content */}
        <div className="p-6">
          {wizardStep === "clothing" && (
            <ClothingUploader clothing={clothing} onChange={updateClothing} />
          )}
          {wizardStep === "model" && (
            <ModelConfigurator params={modelParams} onChange={setModelParams} />
          )}
          {wizardStep === "background" && (
            <BackgroundSelector params={bgParams} onChange={setBgParams} />
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="px-6 pb-6 flex gap-3">
          {currentStepIndex > 0 && (
            <button
              onClick={() =>
                setWizardStep(WIZARD_STEPS[currentStepIndex - 1].id as WizardStep)
              }
              className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Назад
            </button>
          )}

          {currentStepIndex < WIZARD_STEPS.length - 1 ? (
            <button
              onClick={() =>
                setWizardStep(WIZARD_STEPS[currentStepIndex + 1].id as WizardStep)
              }
              disabled={wizardStep === "clothing" && !hasClothing}
              className={cn(
                "flex-1 py-3 rounded-xl text-sm font-medium transition-colors",
                wizardStep === "clothing" && !hasClothing
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-red-600 text-white hover:bg-red-700"
              )}
            >
              Далее
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={!hasClothing || isUploading}
              className={cn(
                "flex-1 py-3 rounded-xl text-sm font-semibold transition-colors",
                !hasClothing || isUploading
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-red-600 text-white hover:bg-red-700"
              )}
            >
              {isUploading ? "Загрузка файлов…" : "Создать лукбук ✨"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
