"use client";

import { Trees, Mountain, Waves, Building2, Camera, Wheat } from "lucide-react";
import type { BackgroundParams, LocationPreset, TimeOfDay, Weather } from "@/types/lookbook";
import { cn } from "@/lib/utils";

interface Props {
  params: BackgroundParams;
  onChange: (params: BackgroundParams) => void;
}

const LOCATIONS: { value: LocationPreset; label: string; Icon: React.ElementType; preview: string }[] = [
  { value: "forest",    label: "Лес",     Icon: Trees,     preview: "bg-green-800" },
  { value: "mountains", label: "Горы",    Icon: Mountain,  preview: "bg-slate-600" },
  { value: "beach",     label: "Пляж",    Icon: Waves,     preview: "bg-amber-300" },
  { value: "city",      label: "Город",   Icon: Building2, preview: "bg-gray-700" },
  { value: "studio",    label: "Студия",  Icon: Camera,    preview: "bg-gray-300" },
  { value: "field",     label: "Поле",    Icon: Wheat,     preview: "bg-yellow-500" },
];

const TIME_OPTIONS: { value: TimeOfDay; label: string }[] = [
  { value: "day", label: "День" },
  { value: "golden_hour", label: "Золотой час" },
  { value: "dusk", label: "Сумерки" },
];

const WEATHER_OPTIONS: { value: Weather; label: string }[] = [
  { value: "sunny", label: "Солнечно" },
  { value: "cloudy", label: "Облачно" },
  { value: "foggy", label: "Туман" },
];

function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm border transition-colors",
            value === opt.value
              ? "bg-red-600 border-red-600 text-white"
              : "border-gray-200 text-gray-600 hover:border-red-400"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function BackgroundSelector({ params, onChange }: Props) {
  const update = <K extends keyof BackgroundParams>(key: K, value: BackgroundParams[K]) =>
    onChange({ ...params, [key]: value });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Локация и фон</h2>

      {/* Location Grid */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Место съёмки</label>
        <div className="grid grid-cols-3 gap-3">
          {LOCATIONS.map((loc) => (
            <button
              key={loc.value}
              onClick={() => update("location", loc.value)}
              className={cn(
                "rounded-xl p-3 border-2 text-center transition-all",
                params.location === loc.value
                  ? "border-red-500 bg-red-50"
                  : "border-gray-100 hover:border-red-300 bg-white"
              )}
            >
              <div
                className={cn(
                  "w-full h-12 rounded-lg mb-2 flex items-center justify-center text-2xl",
                  loc.preview
                )}
              >
                <loc.Icon size={22} className="text-white drop-shadow" />
              </div>
              <span className="text-xs font-medium text-gray-700">{loc.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Time of day */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Время суток</label>
        <Chips<TimeOfDay>
          options={TIME_OPTIONS}
          value={params.timeOfDay}
          onChange={(v) => update("timeOfDay", v)}
        />
      </div>

      {/* Weather */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Погода</label>
        <Chips<Weather>
          options={WEATHER_OPTIONS}
          value={params.weather}
          onChange={(v) => update("weather", v)}
        />
      </div>

      {/* Custom prompt */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Кастомное описание фона{" "}
          <span className="font-normal text-gray-400">(опционально)</span>
        </label>
        <textarea
          value={params.customPrompt || ""}
          onChange={(e) => update("customPrompt", e.target.value || undefined)}
          placeholder="Например: заснеженный японский сад с цветущей сакурой, зима..."
          rows={2}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
        />
      </div>
    </div>
  );
}
