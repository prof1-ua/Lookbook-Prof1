import { NextRequest, NextResponse } from "next/server";
import { getLoRATrainingResult } from "@/lib/fal";

export async function GET(req: NextRequest) {
  try {
    const requestId = req.nextUrl.searchParams.get("requestId");
    if (!requestId) {
      return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
    }

    const result = await getLoRATrainingResult(requestId);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[train-lora/status]", err);
    return NextResponse.json(
      { error: "Status check failed", details: String(err) },
      { status: 500 }
    );
  }
}

export const maxDuration = 30;
