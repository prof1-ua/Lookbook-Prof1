import { NextRequest, NextResponse } from "next/server";
import { upscaleImage } from "@/lib/fal";

export async function POST(req: NextRequest) {
  try {
    const { imageUrl }: { imageUrl: string } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
    }

    const resultUrl = await upscaleImage(imageUrl);
    return NextResponse.json({ resultUrl });
  } catch (err) {
    console.error("[upscale]", err);
    return NextResponse.json(
      { error: "Upscaling failed" },
      { status: 500 }
    );
  }
}
