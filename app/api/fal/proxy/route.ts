/**
 * FAL.ai proxy — позволяет браузеру загружать файлы через сервер,
 * не раскрывая FAL_KEY клиенту.
 */
import { NextRequest, NextResponse } from "next/server";

const FAL_URL_HEADER = "x-fal-target-url";

async function proxyRequest(req: NextRequest): Promise<NextResponse> {
  const targetUrl =
    req.headers.get(FAL_URL_HEADER) ||
    req.nextUrl.searchParams.get("fal_url");

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing target URL" }, { status: 400 });
  }

  const headers = new Headers();
  headers.set("Authorization", `Key ${process.env.FAL_KEY}`);

  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const body = req.method !== "GET" ? await req.blob() : undefined;

  const response = await fetch(targetUrl, {
    method: req.method,
    headers,
    body,
  });

  const responseHeaders = new Headers();
  response.headers.forEach((value, key) => {
    if (!["content-encoding", "transfer-encoding"].includes(key.toLowerCase())) {
      responseHeaders.set(key, value);
    }
  });

  return new NextResponse(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;

export const maxDuration = 60;
