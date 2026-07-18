import type { Metadata } from "next";

import { ThemeProvider } from "@/contexts/theme-provider";

export const metadata: Metadata = {
	title: "Cycy — Study groups with an AI roadmap",
	description:
		"Create or join a group, bring your materials, and follow an AI-built roadmap to a certificate.",
	openGraph: {
		title: "Cycy — Study groups with an AI roadmap",
		description:
			"Create or join a group, bring your materials, and follow an AI-built roadmap to a certificate.",
		type: "website",
	},
};

export default function MarketingLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<ThemeProvider
			attribute="class"
			forcedTheme="light"
			enableSystem={false}
			storageKey="cycy-marketing-theme"
			disableTransitionOnChange
		>
			<div className="min-h-screen bg-[#F4F8F7] font-sans text-[#14201F] antialiased">
				{children}
			</div>
		</ThemeProvider>
	);
}
