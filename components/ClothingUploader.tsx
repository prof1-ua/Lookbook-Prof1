"use client";

import { useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { X, Upload, Shirt, HardHat, Footprints, Glasses, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClothingSlot, ClothingItem } from "@/types/lookbook";

function PantsIcon({ size = 24, className = "" }: { size?: number | string; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="4" y="2" width="16" height="3" rx="1" />
      <path d="M4 5L2 21h5l5-9 5 9h5L20 5" />
    </svg>
  );
}

function GlovesIcon({ size = 24, className = "" }: { size?: number | string; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8 2h2v7H8z" />
      <path d="M10 2h2v6h-2z" />
      <path d="M12 2h2v5h-2z" />
      <path d="M14 4h2v3h-2z" />
      <path d="M6 6h2v3H6z" />
      <path d="M6 9c0 0-2 1-2 4v4a3 3 0 0 0 6 0v-6H6z" />
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
  { slot: "top",     label: "Верх",          Icon: Shirt,      hint: "Футболка, рубашка, куртка…" },
  { slot: "bottom",  label: "Низ",           Icon: PantsIcon,  hint: "Брюки, джинсы, шорты…" },
  { slot: "hat",     label: "Головной убор", Icon: HardHat,    hint: "Каска, кепка, берет…" },
  { slot: "shoes",   label: "Обувь",         Icon: Footprints, hint: "Берцы, кроссовки, ботинки…" },
  { slot: "gloves",  label: "Перчатки",      Icon: GlovesIcon, hint: "Тактические, зимние…" },
  { slot: "glasses", label: "Очки",          Icon: Glasses,    hint: "Тактические, солнцезащитные…" },
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
  onExtraUpload,
  onReorder,
}: {
  config: SlotConfig;
  item?: ClothingItem;
  onUpload: (main: File, extras?: File[]) => void;
  onRemove: () => void;
  onExtraUpload: (files: File[]) => void;
  onReorder: (newMainUrl: string) => void;
}) {
  const extraInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (!accepted.length) return;
      onUpload(accepted[0], accepted.slice(1));
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxFiles: 3,
    disabled: !!item,
  });

  if (item) {
    const displayUrl = item.cleanUrl || item.originalUrl;
    const isUploading = !item.uploadedUrl && !item.cleanUrl;
    const isProcessingBg = !!item.uploadedUrl && !item.cleanUrl;
    const extras = item.extraUploadedUrls ?? [];
    const canAddExtra = extras.length < 2;

    return (
      <div className="relative group rounded-xl overflow-hidden border-2 border-red-200 bg-red-50 flex flex-col">
        {/* Main photo */}
        <div className="relative aspect-square w-full">
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
        </div>

        {/* Bottom bar: label + all thumbnails + add button */}
        <div className="bg-black/60 px-2 py-1.5 flex items-center gap-1.5">
          <span className="text-white text-xs flex-1 truncate">{config.label}</span>

          {/* Main photo thumbnail — marked as "1", not clickable */}
          {item.uploadedUrl && (
            <div className="relative w-7 h-7 rounded overflow-hidden border-2 border-white shrink-0" title="Главное фото (для примерки)">
              <Image src={item.uploadedUrl} alt="main" fill className="object-cover" unoptimized />
              <span className="absolute bottom-0 left-0 right-0 text-center text-white bg-black/60 text-[8px] leading-none py-px">1</span>
            </div>
          )}

          {/* Extra thumbnails — clickable to promote to main */}
          {extras.map((url, i) => (
            <button
              key={i}
              onClick={() => onReorder(url)}
              className="relative w-7 h-7 rounded overflow-hidden border border-white/40 hover:border-white shrink-0 transition-colors"
              title="Нажми чтобы сделать главным"
            >
              <Image src={url} alt={`ракурс ${i + 2}`} fill className="object-cover" unoptimized />
              <span className="absolute bottom-0 left-0 right-0 text-center text-white/70 bg-black/40 text-[8px] leading-none py-px">{i + 2}</span>
            </button>
          ))}

          {/* Add extra button */}
          {canAddExtra && !isUploading && (
            <>
              <button
                onClick={() => extraInputRef.current?.click()}
                className="w-7 h-7 rounded border border-dashed border-white/40 flex items-center justify-center text-white/60 hover:border-white hover:text-white transition-colors shrink-0"
                title="Добавить ракурс"
              >
                <Plus size={12} />
              </button>
              <input
                ref={extraInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  if (files.length) onExtraUpload(files);
                  e.target.value = "";
                }}
              />
            </>
          )}
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
      <p className="text-xs text-gray-300 mt-1">до 3 фото сразу</p>
    </div>
  );
}

export function ClothingUploader({ clothing, onChange }: Props) {
  async function handleUpload(slot: ClothingSlot, file: File, extraFiles?: File[]) {
    const originalUrl = URL.createObjectURL(file);
    onChange(slot, { slot, originalUrl });

    try {
      const { uploadFileToFal, resizeImage } = await import("@/lib/utils");

      // Загружаем основной файл и экстра-файлы параллельно
      const [uploadedUrl, ...extraUploadedUrls] = await Promise.all([
        resizeImage(file, 1024).then(uploadFileToFal),
        ...(extraFiles ?? []).slice(0, 2).map((f) =>
          resizeImage(f, 1024).then(uploadFileToFal)
        ),
      ]);

      onChange(slot, {
        slot, originalUrl, uploadedUrl,
        ...(extraUploadedUrls.length > 0 ? { extraUploadedUrls } : {}),
      });

      const res = await fetch("/api/remove-background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: uploadedUrl }),
      });

      if (res.ok) {
        const { cleanUrl } = await res.json();
        onChange(slot, {
          slot, originalUrl, uploadedUrl, cleanUrl,
          ...(extraUploadedUrls.length > 0 ? { extraUploadedUrls } : {}),
        });
      }
    } catch {
      // Upload failed
    }
  }

  async function handleReorder(slot: ClothingSlot, newMainUrl: string) {
    const item = clothing[slot];
    if (!item?.uploadedUrl) return;
    const oldMainUrl = item.uploadedUrl;
    const newExtras = (item.extraUploadedUrls ?? [])
      .filter((u) => u !== newMainUrl)
      .concat(oldMainUrl);

    // Сразу показываем новый порядок, cleanUrl сбрасываем — нужна новая обработка
    onChange(slot, {
      ...item,
      originalUrl: newMainUrl,
      uploadedUrl: newMainUrl,
      cleanUrl: undefined,
      extraUploadedUrls: newExtras.length > 0 ? newExtras : undefined,
    });

    // Перезапускаем удаление фона для нового главного фото
    try {
      const res = await fetch("/api/remove-background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: newMainUrl }),
      });
      if (res.ok) {
        const { cleanUrl } = await res.json();
        onChange(slot, {
          ...item,
          originalUrl: newMainUrl,
          uploadedUrl: newMainUrl,
          cleanUrl,
          extraUploadedUrls: newExtras.length > 0 ? newExtras : undefined,
        });
      }
    } catch {
      // silently ignore
    }
  }

  async function handleExtraUpload(slot: ClothingSlot, files: File[]) {
    const item = clothing[slot];
    if (!item) return;
    const existing = item.extraUploadedUrls ?? [];
    const slots = 2 - existing.length;
    if (slots <= 0) return;
    const toUpload = files.slice(0, slots);
    try {
      const { uploadFileToFal, resizeImage } = await import("@/lib/utils");
      const uploaded = await Promise.all(
        toUpload.map(async (f) => {
          const resized = await resizeImage(f, 1024);
          return uploadFileToFal(resized);
        })
      );
      onChange(slot, { ...item, extraUploadedUrls: [...existing, ...uploaded] });
    } catch {
      // silently ignore
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">
        Завантажте елементи одягу
      </h2>
      <p className="text-sm text-gray-500">
        Додайте хоча б один елемент. Фон видалиться автоматично.
        Натисніть <strong>+</strong> у слоті щоб додати додатковий ракурс.
      </p>
      <div className="grid grid-cols-2 gap-4">
        {SLOTS.map((config) => (
          <SlotDropzone
            key={config.slot}
            config={config}
            item={clothing[config.slot]}
            onUpload={(main, extras) => handleUpload(config.slot, main, extras)}
            onRemove={() => onChange(config.slot, null)}
            onExtraUpload={(files) => handleExtraUpload(config.slot, files)}
            onReorder={(url) => handleReorder(config.slot, url)}
          />
        ))}
      </div>
    </div>
  );
}
