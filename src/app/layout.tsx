import { ourFileRouter } from "@/app/api/uploadthing/core";
import "@/app/globals.css";
import { ModalProvider } from "@/contexts/modal-provider";
import { QueryProvider } from "@/contexts/query-provider";
import { SocketProvider } from "@/contexts/socket-provider";
import { ThemeProvider } from "@/contexts/theme-provider";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { cn } from "@/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import { extractRouterConfig } from "uploadthing/server";

const open_sans = Open_Sans({ subsets: ["latin"] });

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
		<html lang="en" className="scroll-smooth" suppressHydrationWarning>
			<body className={cn(open_sans.className, "bg-white dark:bg-[#313338]")}>
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
