import { NextRequest, NextResponse } from "next/server";
import { generateModelImage } from "@/lib/fal";
import type { ModelParams } from "@/types/lookbook";

export async function POST(req: NextRequest) {
  try {
    const params: ModelParams = await req.json();

    if (!params.gender || !params.height || !params.bodyType) {
      return NextResponse.json(
        { error: "Missing required model parameters" },
        { status: 400 }
      );
    }

    const modelImageUrl = await generateModelImage(params);
    return NextResponse.json({ modelImageUrl });
  } catch (err) {
    console.error("[generate-model]", err);
    return NextResponse.json(
      { error: "Model generation failed" },
      { status: 500 }
    );
  }
}
