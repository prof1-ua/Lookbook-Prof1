import { NextRequest, NextResponse } from "next/server";
import { applyTryOn } from "@/lib/fal";
import type { ClothingSlot } from "@/types/lookbook";

// Map clothing slots to IDM-VTON categories
const SLOT_TO_CATEGORY: Record<
  ClothingSlot,
  "upper_body" | "lower_body" | "dresses" | "shoes"
> = {
  top: "upper_body",
  bottom: "lower_body",
  hat: "upper_body", // hats are applied via upper_body pass
  shoes: "shoes",
};

export async function POST(req: NextRequest) {
  try {
    const {
      modelImageUrl,
      garmentImageUrl,
      slot,
    }: { modelImageUrl: string; garmentImageUrl: string; slot: ClothingSlot } =
      await req.json();

    if (!modelImageUrl || !garmentImageUrl || !slot) {
      return NextResponse.json(
        { error: "modelImageUrl, garmentImageUrl, and slot are required" },
        { status: 400 }
      );
    }

    const category = SLOT_TO_CATEGORY[slot];
    const resultUrl = await applyTryOn(modelImageUrl, garmentImageUrl, category);

    return NextResponse.json({ resultUrl });
  } catch (err) {
    console.error("[try-on]", err);
    return NextResponse.json(
      { error: "Virtual try-on failed" },
      { status: 500 }
    );
  }
}
