import type { Metadata } from "next";
import Image from "next/image";
import { UserButton } from "@clerk/nextjs";

import { ThemeProvider } from "@/contexts/theme-provider";

export const metadata: Metadata = {
	title: "Cycy — Set up your group",
	description: "Create or join a study group to start learning.",
};

export default function OnboardingLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<ThemeProvider
			attribute="class"
			forcedTheme="light"
			enableSystem={false}
			storageKey="cycy-auth-theme"
			disableTransitionOnChange
		>
			<div className="relative min-h-screen overflow-x-hidden bg-[#F4F8F7] font-sans text-[#14201F] antialiased">
				<img
					src="/roadmap-path.svg"
					alt=""
					aria-hidden
					className="pointer-events-none absolute -right-10 bottom-0 h-[min(70vh,520px)] w-auto opacity-[0.08] sm:-right-6"
				/>

				<header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
					<div className="flex items-center gap-2.5">
						<Image src="/logo.svg" alt="" width={32} height={32} className="size-8" priority />
						<span className="font-display text-xl tracking-tight text-[#0A4D4A]">
							Cycy
						</span>
					</div>
					<UserButton
						appearance={{
							elements: {
								userButtonAvatarBox: "size-8",
							},
						}}
					/>
				</header>

				<main className="relative z-10 px-6 pb-16 pt-4 sm:px-10 sm:pt-8">{children}</main>
			</div>
		</ThemeProvider>
	);
}
