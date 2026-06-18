import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    // Report the error to console; external error reporting removed.
    console.error("Captured route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "KilimoLens — See agricultural risk clearly" },
      { name: "description", content: "AI-powered climate-finance intelligence for agricultural lenders." },
      { name: "author", content: "KilimoLens" },
      { property: "og:title", content: "KilimoLens" },
      { property: "og:description", content: "AI-powered climate-finance intelligence for agricultural lenders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@kilimolens" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  // Server-only middleware attached to the root route. Runs inside the Start
  // server request context so it can inspect the runtime router and matched
  // routes. This is temporary for debugging the Vercel 404 and does not
  // modify UI or business logic.
  server: {
    middleware: [
      createMiddleware().server(async ({ request, next }) => {
        try {
          const { getStartContext } = await import("@tanstack/start-storage-context");
          const startCtx = getStartContext({ throwIfNotFound: false });
          if (startCtx?.getRouter) {
            const router = await startCtx.getRouter();
            const url = new URL(request.url);
            const { matchedRoutes, foundRoute } = router.getMatchedRoutes(url.pathname || "/");
            console.log("[TSSR DEBUG-root] Request:", request.method, request.url);
            console.log("[TSSR DEBUG-root] Found route id:", foundRoute?.id ?? null);
            console.log(
              "[TSSR DEBUG-root] Matched route ids:",
              Array.isArray(matchedRoutes) ? matchedRoutes.map((r) => r.id) : matchedRoutes,
            );
          } else {
            console.log("[TSSR DEBUG-root] start context.getRouter not available");
          }
        } catch (err) {
          console.error("[TSSR DEBUG-root] inspect error:", err);
        }
        return await next();
      }),
    ],
  },
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
