"use client";

import type { ModelParams, Gender, BodyType, SkinTone, HairColor, HairLength, BustSize, Pose, Accessory } from "@/types/lookbook";
import { cn } from "@/lib/utils";

interface Props {
  params: ModelParams;
  onChange: (params: ModelParams) => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}

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
              ? "bg-violet-600 border-violet-600 text-white"
              : "border-gray-200 text-gray-600 hover:border-violet-400"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

const SKIN_COLORS: Record<SkinTone, string> = {
  fair: "#FDDBB4",
  light: "#F3C58C",
  medium: "#D4956A",
  olive: "#C68642",
  brown: "#8D5524",
  dark: "#4A2912",
};

export function ModelConfigurator({ params, onChange }: Props) {
  const update = <K extends keyof ModelParams>(key: K, value: ModelParams[K]) =>
    onChange({ ...params, [key]: value });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Параметры модели</h2>

      <Field label="Пол">
        <Chips<Gender>
          options={[
            { value: "female", label: "Женский" },
            { value: "male", label: "Мужской" },
          ]}
          value={params.gender}
          onChange={(v) => update("gender", v)}
        />
      </Field>

      <Field label={`Рост: ${params.height} см`}>
        <input
          type="range"
          min={150}
          max={200}
          value={params.height}
          onChange={(e) => update("height", Number(e.target.value))}
          className="w-full accent-violet-600"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>150 см</span>
          <span>200 см</span>
        </div>
      </Field>

      <Field label="Тип фигуры">
        <Chips<BodyType>
          options={[
            { value: "slim", label: "Худощавый" },
            { value: "average", label: "Стандартный" },
            { value: "plus", label: "Plus-size" },
          ]}
          value={params.bodyType}
          onChange={(v) => update("bodyType", v)}
        />
      </Field>

      <Field label="Объём груди">
        <Chips<BustSize>
          options={["XS", "S", "M", "L", "XL", "XXL"].map((s) => ({
            value: s as BustSize,
            label: s,
          }))}
          value={params.bustSize}
          onChange={(v) => update("bustSize", v)}
        />
      </Field>

      <Field label="Цвет кожи">
        <div className="flex gap-3">
          {(Object.entries(SKIN_COLORS) as [SkinTone, string][]).map(([tone, hex]) => (
            <button
              key={tone}
              onClick={() => update("skinTone", tone)}
              style={{ backgroundColor: hex }}
              title={tone}
              className={cn(
                "w-8 h-8 rounded-full border-2 transition-transform",
                params.skinTone === tone
                  ? "border-violet-600 scale-125"
                  : "border-transparent hover:scale-110"
              )}
            />
          ))}
        </div>
      </Field>

      <Field label="Цвет волос">
        <Chips<HairColor>
          options={[
            { value: "blonde", label: "Блондинка" },
            { value: "brunette", label: "Шатенка" },
            { value: "black", label: "Брюнетка" },
            { value: "red", label: "Рыжая" },
            { value: "gray", label: "Серый" },
          ]}
          value={params.hairColor}
          onChange={(v) => update("hairColor", v)}
        />
      </Field>

      <Field label="Длина волос">
        <Chips<HairLength>
          options={[
            { value: "short", label: "Короткие" },
            { value: "medium", label: "Средние" },
            { value: "long", label: "Длинные" },
          ]}
          value={params.hairLength}
          onChange={(v) => update("hairLength", v)}
        />
      </Field>

      <Field label="Поза">
        <Chips<Pose>
          options={[
            { value: "standing", label: "Стоит" },
            { value: "walking", label: "Идёт" },
            { value: "leaning", label: "Опирается" },
            { value: "over_shoulder", label: "Через плечо" },
            { value: "sitting", label: "Сидит" },
          ]}
          value={params.pose}
          onChange={(v) => update("pose", v)}
        />
      </Field>

      <Field label="Предмет в руках">
        <Chips<Accessory>
          options={[
            { value: "none", label: "Ничего" },
            { value: "handbag", label: "Сумка" },
            { value: "clutch", label: "Клатч" },
            { value: "umbrella", label: "Зонт" },
            { value: "coffee", label: "Кофе" },
            { value: "flowers", label: "Цветы" },
            { value: "phone", label: "Телефон" },
          ]}
          value={params.accessory}
          onChange={(v) => update("accessory", v)}
        />
      </Field>
    </div>
  );
}
