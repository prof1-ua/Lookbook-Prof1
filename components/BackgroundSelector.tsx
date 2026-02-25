"use client";

import { Trees, Mountain, Waves, Building2, Camera, Wheat, Car, Bike, Ship, Truck } from "lucide-react";
import type { BackgroundParams, LocationPreset, TimeOfDay, Weather, SceneProp } from "@/types/lookbook";
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
  { value: "sunny",  label: "Солнечно" },
  { value: "cloudy", label: "Облачно" },
  { value: "foggy",  label: "Туман" },
  { value: "rain",   label: "Дождь" },
  { value: "snow",   label: "Снег" },
  { value: "wind",   label: "Ветер" },
];

function HelicopterIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <path d="M3 10h18M12 10v6M8 16h8M6 16l-2 3M18 16l2 3" />
      <ellipse cx="12" cy="10" rx="5" ry="2" />
      <line x1="12" y1="4" x2="12" y2="8" />
      <line x1="9" y1="4" x2="15" y2="4" />
    </svg>
  );
}

const SCENE_PROPS: { value: SceneProp; label: string; Icon: React.ElementType }[] = [
  { value: "none",             label: "Ничего",       Icon: () => <span className="text-gray-400 text-sm leading-none">✕</span> },
  { value: "military_vehicle", label: "Броневик",     Icon: Truck },
  { value: "suv",              label: "Внедорожник",  Icon: Car },
  { value: "motorcycle",       label: "Мотоцикл",     Icon: Bike },
  { value: "bicycle",          label: "Велосипед",    Icon: Bike },
  { value: "yacht",            label: "Яхта",         Icon: Ship },
  { value: "helicopter",       label: "Вертолёт",     Icon: HelicopterIcon },
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

  const currentProp = params.sceneProp ?? "none";

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

      {/* Scene prop */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Объект в сцене</label>
        <div className="grid grid-cols-4 gap-2">
          {SCENE_PROPS.map((prop) => (
            <button
              key={prop.value}
              onClick={() => update("sceneProp", prop.value)}
              className={cn(
                "rounded-xl p-2 border-2 text-center transition-all flex flex-col items-center gap-1",
                currentProp === prop.value
                  ? "border-red-500 bg-red-50"
                  : "border-gray-100 hover:border-red-300 bg-white"
              )}
            >
              <prop.Icon size={18} className="text-gray-500" />
              <span className="text-xs font-medium text-gray-700 leading-tight">{prop.label}</span>
            </button>
          ))}
        </div>
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
