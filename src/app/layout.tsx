import { ourFileRouter } from "@/app/api/uploadthing/core";
import "@/app/globals.css";
import { ModalProvider } from "@/contexts/modal-provider";
import { QueryProvider } from "@/contexts/query-provider";
import { SocketProvider } from "@/contexts/socket-provider";
import { ThemeProvider } from "@/contexts/theme-provider";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { figtree, fraunces } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import type { Metadata } from "next";
import { extractRouterConfig } from "uploadthing/server";

export const metadata: Metadata = {
	title: "Cycy",
	description: "AI collaboration hub — study groups, roadmaps, and certificates.",
	openGraph: {
		type: "website",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			className={cn(
				"scroll-smooth",
				figtree.variable,
				fraunces.variable,
			)}
			suppressHydrationWarning
		>
			<body className="bg-background font-sans text-foreground antialiased">
				<ClerkProvider appearance={clerkAppearance}>
					<ThemeProvider
						attribute="class"
						defaultTheme="dark"
						enableSystem={false}
						storageKey="cycy-theme"
						disableTransitionOnChange
					>
						<NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
						<SocketProvider>
							<QueryProvider>
								<ModalProvider />
								{children}
							</QueryProvider>
						</SocketProvider>
					</ThemeProvider>
				</ClerkProvider>
			</body>
		</html>
	);
}
