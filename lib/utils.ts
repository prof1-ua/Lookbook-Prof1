import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Convert a File or data URL to a base64 string for FAL upload */
export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Resize image to max dimension before upload (speeds up upload + AI processing) */
export async function resizeImage(file: File, maxPx = 1024): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const blobUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(blobUrl);
      const { width, height } = img;
      const scale = Math.min(1, maxPx / Math.max(width, height));
      if (scale >= 1) { resolve(file); return; }
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => resolve(blob ? new File([blob], file.name, { type: "image/jpeg" }) : file),
        "image/jpeg",
        0.88
      );
    };
    img.onerror = () => { URL.revokeObjectURL(blobUrl); resolve(file); };
    img.src = blobUrl;
  });
}

/** Upload a file to FAL's temporary storage via the proxy */
export async function uploadFileToFal(file: File): Promise<string> {
  // Используем fal-client с proxyUrl чтобы не раскрывать FAL_KEY в браузере
  const { fal } = await import("@/lib/fal-client");
  const url = await fal.storage.upload(file);
  return url;
}
