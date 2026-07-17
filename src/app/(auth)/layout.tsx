import type { Metadata } from "next";
import Image from "next/image";

import { ThemeProvider } from "@/contexts/theme-provider";

export const metadata: Metadata = {
	title: "Cycy — Sign in",
	description: "Create or join a study group and learn together with AI.",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider
			attribute="class"
			forcedTheme="light"
			enableSystem={false}
			storageKey="cycy-auth-theme"
			disableTransitionOnChange
		>
			<div className="min-h-screen bg-[#F4F8F7] font-sans text-[#14201F] antialiased">
				<div className="grid min-h-screen lg:grid-cols-2">
					<aside className="relative hidden flex-col justify-between overflow-hidden bg-[#0A4D4A] px-8 py-10 text-[#E8F2F1] lg:flex lg:px-14 lg:py-14">
						<div
							aria-hidden
							className="pointer-events-none absolute inset-0 opacity-[0.18]"
							style={{
								backgroundImage:
									"radial-gradient(circle at 20% 20%, #7FD4C8 0%, transparent 45%), radial-gradient(circle at 80% 70%, #C9A227 0%, transparent 40%)",
							}}
						/>
						<img
							src="/roadmap-path.svg"
							alt=""
							aria-hidden
							className="pointer-events-none absolute -right-8 bottom-0 h-[70%] w-[80%] opacity-25 brightness-0 invert"
						/>

						<div className="relative z-10 flex items-center gap-3">
							<Image
								src="/logo.svg"
								alt=""
								width={40}
								height={40}
								className="size-10 brightness-0 invert"
								priority
							/>
							<span className="font-display text-2xl tracking-tight text-white">
								Cycy
							</span>
						</div>

						<div className="relative z-10 max-w-md space-y-4">
							<h1 className="font-display text-4xl leading-[1.15] tracking-tight text-white sm:text-5xl">
								Study together.
								<br />
								Finish with proof.
							</h1>
							<p className="max-w-sm text-base leading-relaxed text-[#B8D4D1] sm:text-lg">
								Create or join a group, bring your materials, and follow an AI-built
								roadmap to a certificate.
							</p>
						</div>

						<p className="relative z-10 text-sm text-[#7FA8A4]">
							Collaborative learning for motivated groups.
						</p>
					</aside>

					<main className="relative flex flex-col justify-center overflow-x-hidden bg-[#F4F8F7] px-6 py-12 sm:px-10 lg:px-16">
						<img
							src="/roadmap-path.svg"
							alt=""
							aria-hidden
							className="pointer-events-none absolute -right-6 bottom-0 h-[55%] w-[70%] opacity-[0.12] lg:hidden"
						/>

						<div className="relative z-10 mx-auto w-full min-w-0 max-w-[400px] space-y-8">
							<div className="flex items-center gap-2 lg:hidden">
								<Image
									src="/logo.svg"
									alt=""
									width={28}
									height={28}
									className="size-7"
									priority
								/>
								<span className="font-display text-xl text-[#0A4D4A]">
									Cycy
								</span>
							</div>
							{children}
						</div>
					</main>
				</div>
			</div>
		</ThemeProvider>
	);
}
