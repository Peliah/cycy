import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
	"/",
	"/sign-in(.*)",
	"/sign-up(.*)",
	"/api/uploadthing",
]);

// protect all routes except the public one
export default clerkMiddleware(async (auth, request) => {
	if (!isPublicRoute(request)) {
		await auth.protect();
	}
});

// export const config = {
// 	// The following matcher runs middleware on all routes
// 	// except static assets. + websocket routes
// 	matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
// };
export const config = {
	matcher: ["/((?!.*\\..*|_next|ws).*)", "/", "/(api|trpc)(.*)", "/__clerk/:path*"],
};
