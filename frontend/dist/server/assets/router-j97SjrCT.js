import { routeTree } from "./routeTree.gen-c8FQYgT6.js";
import { createRouter } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
//#region src/router.tsx
var getRouter = () => {
	return createRouter({
		routeTree,
		context: { queryClient: new QueryClient() },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
