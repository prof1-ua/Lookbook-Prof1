"use client";

import { useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { X, Upload, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StyleReference } from "@/types/lookbook";

interface SlotProps {
  index: number;
  ref_: StyleReference | null;
  onUpload: (file: File) => void;
  onRemove: () => void;
  onDescChange: (desc: string) => void;
}

function StyleSlot({ index, ref_, onUpload, onRemove, onDescChange }: SlotProps) {
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
    disabled: !!ref_,
  });

  if (ref_) {
    const isUploading = !ref_.uploadedUrl;
    return (
      <div className="flex gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50">
        {/* Preview */}
        <div className="relative shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-white">
          <Image
            src={ref_.originalUrl}
            alt={`Референс ${index + 1}`}
            fill
            className="object-cover"
            unoptimized
          />
          {isUploading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <button
            onClick={onRemove}
            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"
          >
            <X size={10} />
          </button>
        </div>

        {/* Description */}
        <textarea
          value={ref_.description}
          onChange={(e) => onDescChange(e.target.value)}
          placeholder={`Что взять из этого фото?\nНапример: позу, освещение, стиль съёмки…`}
          rows={3}
          className="flex-1 text-xs text-gray-700 placeholder-gray-400 border border-gray-200 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-red-400 bg-white"
        />
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border-2 border-dashed cursor-pointer transition-colors",
        isDragActive
          ? "border-red-500 bg-red-50"
          : "border-gray-200 hover:border-red-400 hover:bg-red-50/50"
      )}
    >
      <input {...getInputProps()} />
      <div className="shrink-0 w-20 h-20 rounded-lg border border-dashed border-gray-300 bg-white flex flex-col items-center justify-center gap-1">
        <ImagePlus size={20} className="text-gray-300" />
        <Upload size={11} className="text-gray-300" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600">Референс {index + 1}</p>
        <p className="text-xs text-gray-400 mt-0.5 leading-snug">
          Загрузите фото и опишите,<br />что взять: позу, свет, стиль…
        </p>
      </div>
    </div>
  );
}

interface Props {
  refs: (StyleReference | null)[];
  onChange: (refs: (StyleReference | null)[]) => void;
}

const MAX_REFS = 3;

export function StyleReferences({ refs, onChange }: Props) {
  // Ensure array is always MAX_REFS length
  const slots: (StyleReference | null)[] = [
    ...refs,
    ...Array(Math.max(0, MAX_REFS - refs.length)).fill(null),
  ].slice(0, MAX_REFS);

  async function handleUpload(index: number, file: File) {
    const originalUrl = URL.createObjectURL(file);
    const next = [...slots];
    next[index] = { originalUrl, description: "" };
    onChange(next);

    try {
      const { uploadFileToFal, resizeImage } = await import("@/lib/utils");
      const resized = await resizeImage(file, 1024);
      const uploadedUrl = await uploadFileToFal(resized);
      const updated = [...slots];
      updated[index] = { originalUrl, uploadedUrl, description: updated[index]?.description ?? "" };
      onChange(updated);
    } catch {
      // silently ignore upload error
    }
  }

  function handleRemove(index: number) {
    const next = [...slots];
    next[index] = null;
    onChange(next);
  }

  function handleDescChange(index: number, desc: string) {
    const next = [...slots];
    const cur = next[index];
    if (cur) next[index] = { ...cur, description: desc };
    onChange(next);
  }

  const hasAny = slots.some(Boolean);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Референсы стиля</h2>
        <p className="text-sm text-gray-500 mt-1">
          Необязательно. До 3 фото с описанием — что именно взять из каждого.
        </p>
      </div>

      <div className="space-y-3">
        {slots.map((ref_, i) => {
          // Show next empty slot only if previous is filled
          const prevFilled = i === 0 || slots[i - 1] !== null;
          if (!ref_ && !prevFilled) return null;
          return (
            <StyleSlot
              key={i}
              index={i}
              ref_={ref_}
              onUpload={(f) => handleUpload(i, f)}
              onRemove={() => handleRemove(i)}
              onDescChange={(d) => handleDescChange(i, d)}
            />
          );
        })}
      </div>

      {!hasAny && (
        <p className="text-xs text-gray-400 text-center py-2">
          Пропустите этот шаг, если стиль не важен
        </p>
      )}
    </div>
  );
}
