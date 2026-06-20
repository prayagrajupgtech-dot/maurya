import type { IncomingMessage, ServerResponse } from "node:http";

type WebHandler = (request: Request) => Promise<Response> | Response;

function firstHeader(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function createVercelHandler(webHandler: WebHandler) {
  return async (request: IncomingMessage, response: ServerResponse) => {
    try {
      const headers = new Headers();
      for (const [name, value] of Object.entries(request.headers)) {
        if (Array.isArray(value)) {
          value.forEach(item => headers.append(name, item));
        } else if (value !== undefined) {
          headers.set(name, value);
        }
      }

      const protocol = firstHeader(request.headers["x-forwarded-proto"]) || "https";
      const host = firstHeader(request.headers.host) || "localhost";
      const url = new URL(request.url || "/", `${protocol}://${host}`);
      const method = request.method || "GET";
      const chunks: Buffer[] = [];
      if (method !== "GET" && method !== "HEAD") {
        for await (const chunk of request) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
      }

      const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined;
      const webResponse = await webHandler(new Request(url, { body, headers, method }));
      response.statusCode = webResponse.status;
      webResponse.headers.forEach((value, name) => response.setHeader(name, value));
      response.end(Buffer.from(await webResponse.arrayBuffer()));
    } catch (error) {
      console.error("Vercel function adapter failed", error);
      response.statusCode = 500;
      response.setHeader("Content-Type", "application/json; charset=utf-8");
      response.end(JSON.stringify({ error: "Server error." }));
    }
  };
}
