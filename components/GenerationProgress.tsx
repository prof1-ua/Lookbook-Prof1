"use client";

import type { GenerationStep } from "@/types/lookbook";
import { cn } from "@/lib/utils";

interface StepInfo {
  step: GenerationStep;
  label: string;
  description: string;
  emoji: string;
}

const STEPS: StepInfo[] = [
  {
    step: "removing_bg",
    label: "Подготовка одежды",
    description: "Убираем фон с каждого предмета параллельно",
    emoji: "✂️",
  },
  {
    step: "generating_model",
    label: "Генерация модели",
    description: "FLUX создаёт базовую модель по заданным параметрам",
    emoji: "🧍",
  },
  {
    step: "try_on",
    label: "Примерка одежды (FASHN)",
    description: "Точное воспроизведение цвета, принтов и фактуры ткани",
    emoji: "👗",
  },
  {
    step: "finalizing",
    label: "Сцена и локация",
    description: "FLUX.2 переносит модель в выбранное место, добавляет обувь и шляпу",
    emoji: "🌄",
  },
  {
    step: "upscaling",
    label: "Улучшение качества",
    description: "Повышаем резкость и детализацию до уровня печати",
    emoji: "✨",
  },
];

const STEP_ORDER: GenerationStep[] = [
  "removing_bg",
  "generating_model",
  "try_on",
  "finalizing",
  "upscaling",
];

interface Props {
  currentStep: GenerationStep;
  message: string;
}

export function GenerationProgress({ currentStep, message }: Props) {
  const currentIndex = STEP_ORDER.indexOf(currentStep);

  return (
    <div className="space-y-6 py-4">
      <h2 className="text-xl font-semibold text-gray-800 text-center">
        Создаём ваш лукбук…
      </h2>
      <p className="text-sm text-gray-500 text-center">{message}</p>

      <div className="space-y-3">
        {STEPS.map((info, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = STEP_ORDER[currentIndex] === info.step;
          const isPending = idx > currentIndex;

          return (
            <div
              key={info.step}
              className={cn(
                "flex items-start gap-4 p-4 rounded-xl transition-all duration-300",
                isCurrent && "bg-red-50 border border-red-200 shadow-sm",
                isDone && "opacity-50",
                isPending && "opacity-25"
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0",
                  isDone && "bg-green-100",
                  isCurrent && "bg-red-600 animate-pulse",
                  isPending && "bg-gray-100"
                )}
              >
                {isDone ? "✓" : info.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    isCurrent ? "text-red-700" : isDone ? "text-green-700" : "text-gray-500"
                  )}
                >
                  {info.label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{info.description}</p>
              </div>
              {isCurrent && (
                <div className="flex gap-1 items-center shrink-0 mt-1.5">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Прогресс-бар */}
      <div className="space-y-1.5">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-red-700 rounded-full transition-all duration-700"
            style={{
              width:
                currentIndex === -1
                  ? "0%"
                  : `${((currentIndex + 0.5) / STEPS.length) * 100}%`,
            }}
          />
        </div>
        <p className="text-xs text-gray-400 text-center">
          Примерное время: 60–90 секунд
        </p>
      </div>
    </div>
  );
}
