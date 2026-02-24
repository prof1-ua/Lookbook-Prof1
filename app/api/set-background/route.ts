import { NextRequest, NextResponse } from "next/server";
import { replaceBackground } from "@/lib/fal";
import type { BackgroundParams } from "@/types/lookbook";

export async function POST(req: NextRequest) {
  try {
    const {
      imageUrl,
      background,
    }: { imageUrl: string; background: BackgroundParams } = await req.json();

    if (!imageUrl || !background?.location) {
      return NextResponse.json(
        { error: "imageUrl and background params are required" },
        { status: 400 }
      );
    }

    const resultUrl = await replaceBackground(imageUrl, background);
    return NextResponse.json({ resultUrl });
  } catch (err) {
    console.error("[set-background]", err);
    return NextResponse.json(
      { error: "Background replacement failed" },
      { status: 500 }
    );
  }
}
