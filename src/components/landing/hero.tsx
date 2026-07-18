"use client";

import { useAuth } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

import { LandingProductStage } from "@/components/landing/product-stage";
import { Button } from "@/components/ui/button";

export function LandingHero() {
	const { isSignedIn, isLoaded } = useAuth();

	return (
		<section className="relative isolate overflow-hidden pb-8 pt-6 sm:pb-12 sm:pt-10">
			{/* Full-bleed atmosphere — keep cubes visible */}
			<div className="absolute inset-0 -z-10">
				<picture>
					<source srcSet="/landing-page-bg.avif" type="image/avif" />
					<Image
						src="/landing-page-bg.png"
						alt=""
						fill
						priority
						sizes="100vw"
						className="object-cover object-[center_40%]"
					/>
				</picture>
				{/* Soft read-zone for type; fade to page surface at bottom */}
				<div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,77,74,0.72)_0%,rgba(10,77,74,0.45)_42%,rgba(244,248,247,0.92)_78%,#F4F8F7_100%)]" />
			</div>

			<div className="mx-auto flex max-w-5xl flex-col items-center px-4 text-center sm:px-6 lg:px-8">
				{/* Copy block: brand → headline → sub → CTAs */}
				<div className="max-w-2xl motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-700">
					<p className="font-display text-5xl tracking-tight text-white sm:text-6xl md:text-7xl">
						Cycy
					</p>
					<h1 className="mt-5 font-display text-2xl leading-snug tracking-tight text-white/95 sm:text-3xl md:text-[2rem]">
						Study together. Finish with proof.
					</h1>
					<p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-[#D5E8E5] sm:text-lg">
						Create or join a group, bring your materials, and follow an AI-built
						roadmap to a certificate.
					</p>

					<div className="mt-8 flex min-h-11 flex-wrap items-center justify-center gap-3">
						{isLoaded && isSignedIn && (
							<Button
								asChild
								size="lg"
								className="bg-white px-8 text-[#0A4D4A] hover:bg-[#E8F2F1]"
							>
								<Link href="/onboarding">Open app</Link>
							</Button>
						)}
						{isLoaded && !isSignedIn && (
							<>
								<Button
									asChild
									size="lg"
									className="bg-white px-8 text-[#0A4D4A] hover:bg-[#E8F2F1]"
								>
									<Link href="/sign-up">Get started</Link>
								</Button>
								<Button
									asChild
									size="lg"
									variant="outline"
									className="border-white/50 bg-white/5 px-8 text-white backdrop-blur-sm hover:bg-white/15 hover:text-white"
								>
									<Link href="/sign-in">Sign in</Link>
								</Button>
							</>
						)}
					</div>
					{isLoaded && !isSignedIn && (
						<p className="mt-3 text-sm text-[#B8D4D1]">
							Free to create a group · Invite your people
						</p>
					)}
				</div>

				{/* Dominant product visual — one frame under the thesis */}
				<div className="mt-10 w-full max-w-3xl motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-1000 motion-safe:delay-100 sm:mt-12">
					<LandingProductStage />
				</div>
			</div>
		</section>
	);
}
