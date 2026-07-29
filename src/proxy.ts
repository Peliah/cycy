import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
	"/",
	"/sign-in(.*)",
	"/sign-up(.*)",
	"/certificates(.*)",
	"/api/uploadthing(.*)",
	// Socket.IO handshake + polling — auth is enforced inside message handlers
	"/api/socket(.*)",
	// Nest → frontend agent webhook — auth via X-Internal-Secret
	"/api/internal/agent-response(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
	if (!isPublicRoute(request)) {
		await auth.protect();
	}
});

export const config = {
	matcher: [
		// Skip Next internals, static files, and Nest→frontend webhooks (body must stay intact)
		"/((?!_next|api/internal|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		"/api/((?!internal).*)",
		"/(trpc)(.*)",
	],
};
