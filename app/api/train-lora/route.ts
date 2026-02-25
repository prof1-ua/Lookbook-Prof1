import { NextRequest, NextResponse } from "next/server";
import { submitLoRATraining } from "@/lib/fal";
import type { ClothingSlot } from "@/types/lookbook";

const TRIGGER_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateTriggerWord(slot: ClothingSlot): string {
  const suffix = Array.from({ length: 4 }, () =>
    TRIGGER_CHARS[Math.floor(Math.random() * TRIGGER_CHARS.length)]
  ).join("");
  return `ITEM${slot.toUpperCase().slice(0, 3)}${suffix}`;
}

export async function POST(req: NextRequest) {
  try {
    const { imageUrls, slot }: { imageUrls: string[]; slot: ClothingSlot } =
      await req.json();

    if (!imageUrls?.length) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }

    const triggerWord = generateTriggerWord(slot);
    const requestId = await submitLoRATraining(imageUrls, triggerWord);

    return NextResponse.json({ requestId, triggerWord });
  } catch (err) {
    console.error("[train-lora]", err);
    return NextResponse.json(
      { error: "Training submission failed", details: String(err) },
      { status: 500 }
    );
  }
}

export const maxDuration = 60;
