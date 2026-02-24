"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { X, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClothingSlot, ClothingItem } from "@/types/lookbook";

interface SlotConfig {
  slot: ClothingSlot;
  label: string;
  emoji: string;
  hint: string;
}

const SLOTS: SlotConfig[] = [
  { slot: "top", label: "Верх", emoji: "👕", hint: "Футболка, рубашка, свитер, куртка…" },
  { slot: "bottom", label: "Низ", emoji: "👖", hint: "Брюки, джинсы, юбка, шорты…" },
  { slot: "hat", label: "Головной убор", emoji: "🧢", hint: "Кепка, шляпа, берет…" },
  { slot: "shoes", label: "Обувь", emoji: "👟", hint: "Кроссовки, туфли, ботинки…" },
];

interface Props {
  clothing: Partial<Record<ClothingSlot, ClothingItem>>;
  onChange: (slot: ClothingSlot, item: ClothingItem | null) => void;
}

function SlotDropzone({
  config,
  item,
  onUpload,
  onRemove,
}: {
  config: SlotConfig;
  item?: ClothingItem;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  const [isRemoving, setIsRemoving] = useState(false);

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) onUpload(accepted[0]);
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxFiles: 1,
    disabled: !!item,
  });

  if (item) {
    const displayUrl = item.cleanUrl || item.originalUrl;
    const isUploading = !item.uploadedUrl && !item.cleanUrl;
    const isProcessingBg = !!item.uploadedUrl && !item.cleanUrl;
    return (
      <div className="relative group rounded-xl overflow-hidden border-2 border-violet-200 bg-violet-50 aspect-square">
        <Image
          src={displayUrl}
          alt={config.label}
          fill
          className="object-contain p-2"
          unoptimized
        />
        {isUploading && (
          <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-1">
            <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-gray-500">Загрузка…</span>
          </div>
        )}
        {isProcessingBg && (
          <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center gap-1">
            <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-gray-500">Убираем фон…</span>
          </div>
        )}
        {!isUploading && (
          <button
            onClick={onRemove}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={14} />
          </button>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-1">
          {config.emoji} {config.label}
        </div>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "rounded-xl border-2 border-dashed aspect-square flex flex-col items-center justify-center cursor-pointer transition-colors p-4 text-center",
        isDragActive
          ? "border-violet-500 bg-violet-50"
          : "border-gray-200 hover:border-violet-400 hover:bg-violet-50/50"
      )}
    >
      <input {...getInputProps()} />
      <span className="text-3xl mb-2">{config.emoji}</span>
      <p className="text-sm font-medium text-gray-700">{config.label}</p>
      <p className="text-xs text-gray-400 mt-1">{config.hint}</p>
      <Upload size={16} className="mt-3 text-gray-400" />
    </div>
  );
}

export function ClothingUploader({ clothing, onChange }: Props) {
  async function handleUpload(slot: ClothingSlot, file: File) {
    const originalUrl = URL.createObjectURL(file);
    // Set immediately with original
    onChange(slot, { slot, originalUrl });

    try {
      const { uploadFileToFal, resizeImage } = await import("@/lib/utils");
      // Сжимаем до 1024px — загрузка ускоряется в 5-10 раз
      const resized = await resizeImage(file, 1024);
      const uploadedUrl = await uploadFileToFal(resized);
      onChange(slot, { slot, originalUrl, uploadedUrl });

      const res = await fetch("/api/remove-background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: uploadedUrl }),
      });

      if (res.ok) {
        const { cleanUrl } = await res.json();
        onChange(slot, { slot, originalUrl, uploadedUrl, cleanUrl });
      }
    } catch {
      // Upload failed — uploadedUrl остаётся undefined
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">
        Загрузите элементы одежды
      </h2>
      <p className="text-sm text-gray-500">
        Добавьте хотя бы один элемент. Фон удалится автоматически.
      </p>
      <div className="grid grid-cols-2 gap-4">
        {SLOTS.map((config) => (
          <SlotDropzone
            key={config.slot}
            config={config}
            item={clothing[config.slot]}
            onUpload={(file) => handleUpload(config.slot, file)}
            onRemove={() => onChange(config.slot, null)}
          />
        ))}
      </div>
    </div>
  );
}
