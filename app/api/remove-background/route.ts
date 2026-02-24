import { NextRequest, NextResponse } from "next/server";
import { removeBackground } from "@/lib/fal";

export async function POST(req: NextRequest) {
  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
    }

    const cleanUrl = await removeBackground(imageUrl);
    return NextResponse.json({ cleanUrl });
  } catch (err) {
    console.error("[remove-background]", err);
    return NextResponse.json(
      { error: "Background removal failed" },
      { status: 500 }
    );
  }
}
