import {
  clearAdminSessionCookie,
  createAdminSessionCookie,
  isAdminRequest,
  verifyAdminPassword
} from "./_shared/admin-auth.js";
import { jsonResponse, readJsonBody } from "./_shared/http.js";

export async function verifyAdminSession(request: Request) {
  if (await isAdminRequest(request)) {
    return { authenticated: true };
  }
  return null;
}

export default async (request: Request) => {
  try {
    if (request.method === "GET") {
      return jsonResponse({ authenticated: await isAdminRequest(request) });
    }

    if (request.method === "POST") {
      const body = await readJsonBody(request, 1_000);
      const password = typeof body.password === "string" ? body.password : "";

      if (!password) {
        return jsonResponse({ error: "Password is required." }, 400);
      }

      let passwordValid = false;
      try {
        passwordValid = await verifyAdminPassword(password);
      } catch (envError) {
        console.error("Admin auth config error:", envError);
        return jsonResponse({ error: "Admin authentication is not configured on the server." }, 500);
      }

      if (!passwordValid) {
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
    return jsonResponse({ error: "Admin authentication service encountered an error." }, 500);
  }
};
