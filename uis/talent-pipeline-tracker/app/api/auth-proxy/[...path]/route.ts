import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE = process.env.AUTH_API_BASE || "http://127.0.0.1:8000";

async function proxy(request: NextRequest, paramsPath: string[]): Promise<NextResponse> {
  const targetPath = paramsPath.join("/");
  const targetUrl = new URL(`/${targetPath}`, BACKEND_BASE);
  targetUrl.search = request.nextUrl.search;

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const authorization = request.headers.get("authorization");

  if (contentType) headers.set("content-type", contentType);
  if (authorization) headers.set("authorization", authorization);

  const method = request.method;
  const hasBody = method !== "GET" && method !== "HEAD";

  const upstream = await fetch(targetUrl, {
    method,
    headers,
    body: hasBody ? await request.text() : undefined,
  });

  const body = await upstream.text();
  const response = new NextResponse(body, {
    status: upstream.status,
  });

  const upstreamType = upstream.headers.get("content-type");
  if (upstreamType) {
    response.headers.set("content-type", upstreamType);
  }

  return response;
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxy(request, path);
}
