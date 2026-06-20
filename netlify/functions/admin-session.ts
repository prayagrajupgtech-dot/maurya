import {
  clearAdminSessionCookie,
  createAdminSessionCookie,
  isAdminRequest,
  verifyAdminPassword
} from "./_shared/admin-auth.js";
import { jsonResponse, readJsonBody } from "./_shared/http.js";

export default async (request: Request) => {
  try {
    if (request.method === "GET") {
      return jsonResponse({ authenticated: await isAdminRequest(request) });
    }

    if (request.method === "POST") {
      const body = await readJsonBody(request, 1_000);
      const password = typeof body.password === "string" ? body.password : "";
      if (!(await verifyAdminPassword(password))) {
        return jsonResponse({ error: "Invalid admin password." }, 401);
      }
      const response = jsonResponse({ authenticated: true });
      response.headers.set("Set-Cookie", await createAdminSessionCookie(request));
      return response;
    }

    if (request.method === "DELETE") {
      const response = jsonResponse({ authenticated: false });
      response.headers.set("Set-Cookie", clearAdminSessionCookie(request));
      return response;
    }

    return jsonResponse({ error: "Method not allowed." }, 405);
  } catch (error) {
    if (error instanceof Error && (error.message === "INVALID_JSON" || error.message === "PAYLOAD_TOO_LARGE")) {
      return jsonResponse({ error: "Invalid request." }, 400);
    }
    console.error("admin-session failed", error);
    return jsonResponse({ error: "Admin authentication is not configured." }, 500);
  }
};
