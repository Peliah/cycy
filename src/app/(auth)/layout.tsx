import type { Metadata } from "next";
import { Figtree, Fraunces } from "next/font/google";
import Image from "next/image";

import { ThemeProvider } from "@/contexts/theme-provider";
import { cn } from "@/lib/utils";

const figtree = Figtree({
	subsets: ["latin"],
	variable: "--font-figtree",
});

const fraunces = Fraunces({
	subsets: ["latin"],
	variable: "--font-fraunces",
});

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
			<div
				className={cn(
					figtree.variable,
					fraunces.variable,
					"min-h-screen bg-[#F4F8F7] font-[family-name:var(--font-figtree)] text-[#14201F] antialiased",
				)}
			>
				<div className="grid min-h-screen lg:grid-cols-2">
					<aside className="relative flex flex-col justify-between overflow-hidden bg-[#0A4D4A] px-8 py-10 text-[#E8F2F1] lg:px-14 lg:py-14">
						<div
							aria-hidden
							className="pointer-events-none absolute inset-0 opacity-[0.18]"
							style={{
								backgroundImage:
									"radial-gradient(circle at 20% 20%, #7FD4C8 0%, transparent 45%), radial-gradient(circle at 80% 70%, #C9A227 0%, transparent 40%)",
							}}
						/>
						<svg
							aria-hidden
							className="pointer-events-none absolute -right-8 bottom-0 h-[70%] w-[80%] opacity-25"
							viewBox="0 0 400 500"
							fill="none"
						>
							<path
								d="M40 40 C120 80, 80 160, 160 200 S280 240, 240 320 S160 400, 300 460"
								stroke="#E8F2F1"
								strokeWidth="2"
								strokeDasharray="6 10"
							/>
							<circle cx="40" cy="40" r="6" fill="#C9A227" />
							<circle cx="160" cy="200" r="6" fill="#7FD4C8" />
							<circle cx="240" cy="320" r="6" fill="#C9A227" />
							<circle cx="300" cy="460" r="6" fill="#7FD4C8" />
						</svg>

						<div className="relative z-10 flex items-center gap-3">
							<Image
								src="/logo.svg"
								alt=""
								width={40}
								height={40}
								className="size-10 brightness-0 invert"
								priority
							/>
							<span className="font-[family-name:var(--font-fraunces)] text-2xl tracking-tight text-white">
								Cycy
							</span>
						</div>

						<div className="relative z-10 max-w-md space-y-4 py-16 lg:py-0">
							<h1 className="font-[family-name:var(--font-fraunces)] text-4xl leading-[1.15] tracking-tight text-white sm:text-5xl">
								Study together.
								<br />
								Finish with proof.
							</h1>
							<p className="max-w-sm text-base leading-relaxed text-[#B8D4D1] sm:text-lg">
								Create or join a group, bring your materials, and follow an AI-built
								roadmap to a certificate.
							</p>
						</div>

						<p className="relative z-10 hidden text-sm text-[#7FA8A4] lg:block">
							Collaborative learning for motivated groups.
						</p>
					</aside>

					<main className="flex flex-col justify-center overflow-x-hidden bg-[#F4F8F7] px-6 py-12 sm:px-10 lg:px-16">
						<div className="mx-auto w-full min-w-0 max-w-[400px]">{children}</div>
					</main>
				</div>
			</div>
		</ThemeProvider>
	);
}
