"use client";

import Image from "next/image";
import { Download, RotateCcw, Share2 } from "lucide-react";

interface Props {
  resultUrl: string;
  onReset: () => void;
}

export function LookbookResult({ resultUrl, onReset }: Props) {
  async function handleDownload() {
    const res = await fetch(resultUrl);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lookbook-${Date.now()}.jpg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleShare() {
    if (navigator.share) {
      await navigator.share({ title: "Мой лукбук", url: resultUrl });
    } else {
      await navigator.clipboard.writeText(resultUrl);
      alert("Ссылка скопирована!");
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800 text-center">
        Ваш лукбук готов!
      </h2>

      {/* Result image */}
      <div className="relative aspect-[3/4] w-full max-w-sm mx-auto rounded-2xl overflow-hidden shadow-2xl">
        <Image
          src={resultUrl}
          alt="Lookbook result"
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 400px"
        />
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-3">
        <button
          onClick={handleDownload}
          className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors"
        >
          <Download size={18} />
          Скачать фото
        </button>

        <button
          onClick={handleShare}
          className="flex items-center justify-center gap-2 w-full py-3 px-6 border border-red-200 text-red-700 hover:bg-red-50 rounded-xl font-medium transition-colors"
        >
          <Share2 size={18} />
          Поделиться
        </button>

        <button
          onClick={onReset}
          className="flex items-center justify-center gap-2 w-full py-3 px-6 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl font-medium transition-colors"
        >
          <RotateCcw size={18} />
          Создать новый лукбук
        </button>
      </div>
    </div>
  );
}
