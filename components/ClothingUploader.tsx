"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { X, Upload, Shirt, HardHat, Footprints } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClothingSlot, ClothingItem } from "@/types/lookbook";

// Кастомна SVG-іконка штанів (lucide не має)
function PantsIcon({ size = 24, className = "" }: { size?: number | string; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="4" y="2" width="16" height="3" rx="1" />
      <path d="M4 5L2 21h5l5-9 5 9h5L20 5" />
    </svg>
  );
}

interface SlotConfig {
  slot: ClothingSlot;
  label: string;
  Icon: React.ElementType;
  hint: string;
}

const SLOTS: SlotConfig[] = [
  { slot: "top",    label: "Верх",           Icon: Shirt,     hint: "Футболка, рубашка, куртка…" },
  { slot: "bottom", label: "Низ",            Icon: PantsIcon, hint: "Брюки, джинсы, шорты…" },
  { slot: "hat",    label: "Головной убор",  Icon: HardHat,   hint: "Каска, кепка, берет…" },
  { slot: "shoes",  label: "Обувь",          Icon: Footprints, hint: "Берцы, кроссовки, ботинки…" },
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
      <div className="relative group rounded-xl overflow-hidden border-2 border-red-200 bg-red-50 aspect-square">
        <Image
          src={displayUrl}
          alt={config.label}
          fill
          className="object-contain p-2"
          unoptimized
        />
        {isUploading && (
          <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-1">
            <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-gray-500">Загрузка…</span>
          </div>
        )}
        {isProcessingBg && (
          <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center gap-1">
            <div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
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
          {config.label}
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
          ? "border-red-500 bg-red-50"
          : "border-gray-200 hover:border-red-400 hover:bg-red-50/50"
      )}
    >
      <input {...getInputProps()} />
      <config.Icon size={28} className="mb-2 text-gray-400" />
      <p className="text-sm font-medium text-gray-700">{config.label}</p>
      <p className="text-xs text-gray-400 mt-1 leading-tight">{config.hint}</p>
      <Upload size={14} className="mt-2 text-gray-300" />
    </div>
  );
}

export function ClothingUploader({ clothing, onChange }: Props) {
  async function handleUpload(slot: ClothingSlot, file: File) {
    const originalUrl = URL.createObjectURL(file);
    onChange(slot, { slot, originalUrl });

    try {
      const { uploadFileToFal, resizeImage } = await import("@/lib/utils");
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
      // Upload failed — uploadedUrl залишається undefined
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">
        Завантажте елементи одягу
      </h2>
      <p className="text-sm text-gray-500">
        Додайте хоча б один елемент. Фон видалиться автоматично.
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
