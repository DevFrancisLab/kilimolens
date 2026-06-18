import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Debug middleware: logs route registration and matched routes on the server.
// This is temporary and only intended to help diagnose why Vercel returned 404.
// It does not modify UI or route behavior — it only reads router info and logs it.
const debugRouteMiddleware = createMiddleware().server(async ({ request, next }) => {
  // Run the request handler first so the router has been created/updated by the
  // server runtime. We inspect in a finally block to ensure we always attempt
  // to log, even if the handler throws.
  try {
    return await next();
  } finally {
    try {
      // `getStartContext` is provided by the Start runtime via AsyncLocalStorage
      // at request time and contains `getRouter`.
      const { getStartContext } = await import("@tanstack/start-storage-context");
      const startCtx = getStartContext({ throwIfNotFound: false });
      if (!startCtx?.getRouter) {
        console.log("[TSSR DEBUG] no start context.getRouter available for this request");
        return;
      }

      const router = await startCtx.getRouter();
      const url = new URL(request.url);
      const pathname = url.pathname || "/";

      // `getMatchedRoutes` returns { matchedRoutes, foundRoute, routeParams }
      const { matchedRoutes, foundRoute } = router.getMatchedRoutes(pathname);

      console.log("[TSSR DEBUG] Request:", request.method, request.url);
      console.log("[TSSR DEBUG] Found route id:", foundRoute?.id ?? null);
      console.log(
        "[TSSR DEBUG] Matched route ids:",
        Array.isArray(matchedRoutes) ? matchedRoutes.map((r) => r.id) : matchedRoutes,
      );

      // Also dump the file-based route manifest from Start if available.
      try {
        const manifest = await import("./routeTree.gen");
        if (manifest && manifest.routeTree) {
          console.log("[TSSR DEBUG] routeTree root id:", manifest.routeTree.id ?? "<no id>");
        }
      } catch (e) {
        // non-fatal
      }
    } catch (err) {
      console.error("[TSSR DEBUG] inspect error:", err);
    }
  }
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware, debugRouteMiddleware],
}));
