"use client";

import Image from "next/image";
import Link from "next/link";
import { Award, BookOpen, Link2, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CHAPTERS = [
	{
		id: "01",
		title: "Create or join a group",
		body: "Start a study circle or arrive with an invite. Same goal, same space.",
		visual: "join" as const,
	},
	{
		id: "02",
		title: "Bring materials, get a roadmap",
		body: "Upload PDFs, Word docs, or pasted notes. The AI turns them into a path you can follow.",
		visual: "roadmap" as const,
	},
	{
		id: "03",
		title: "Learn where you already talk",
		body: "Chat, checks, and modules live together—so accountability stays in the room.",
		visual: "shell" as const,
	},
	{
		id: "04",
		title: "Finish with proof",
		body: "Clear the final stage and leave with a certificate—not another abandoned streak.",
		visual: "cert" as const,
	},
] as const;

function ChapterVisual({
	visual,
}: {
	visual: (typeof CHAPTERS)[number]["visual"];
}) {
	if (visual === "roadmap") {
		return (
			<div className="relative h-full overflow-hidden rounded-2xl border border-[#D5E3E0]">
				<Image
					src="/roadmap-img.jpg"
					alt="Hands mapping a learning path on paper"
					fill
					className="object-cover"
					sizes="(max-width: 1024px) 100vw, 50vw"
				/>
			</div>
		);
	}

	if (visual === "join") {
		return (
			<div className="grid h-full grid-cols-2 gap-3 rounded-2xl border border-[#D5E3E0] bg-[#E8F2F1]/60 p-4 sm:p-6">
				<div className="flex flex-col justify-between rounded-xl bg-white p-4 shadow-sm">
					<Users className="size-5 text-[#0A4D4A]" />
					<div>
						<p className="font-medium text-[#14201F]">Create a group</p>
						<p className="mt-1 text-xs text-[#5C6B69]">Name it. Invite later.</p>
					</div>
				</div>
				<div className="flex flex-col justify-between rounded-xl border border-dashed border-[#0A4D4A]/30 bg-white/70 p-4">
					<Link2 className="size-5 text-[#0A4D4A]" />
					<div>
						<p className="font-medium text-[#14201F]">Join with invite</p>
						<p className="mt-1 text-xs text-[#5C6B69]">Paste a code. Jump in.</p>
					</div>
				</div>
			</div>
		);
	}

	if (visual === "shell") {
		return (
			<div className="flex h-full overflow-hidden rounded-2xl border border-[#D5E3E0] bg-white shadow-sm">
				<aside className="flex w-16 flex-col items-center gap-3 bg-[#0A4D4A] py-4 sm:w-20">
					<span className="size-8 rounded-xl bg-white/15" />
					<span className="flex size-8 items-center justify-center rounded-xl bg-[#7FD4C8]/35 text-white ring-2 ring-[#7FD4C8]/40">
						<BookOpen className="size-4" />
					</span>
					<span className="text-[9px] text-[#B8D4D1]">Learn</span>
				</aside>
				<div className="flex flex-1 flex-col p-4">
					<p className="text-xs font-medium text-[#5C6B69]"># general</p>
					<div className="mt-3 space-y-2">
						<div className="rounded-lg bg-[#F4F8F7] px-3 py-2 text-sm text-[#14201F]">
							Anyone free to review module 2 tonight?
						</div>
						<div className="rounded-lg bg-[#0A4D4A]/8 px-3 py-2 text-sm text-[#0A4D4A]">
							Roadmap check unlocked — take the quiz when ready.
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col items-start justify-center rounded-2xl border border-[#0A4D4A]/15 bg-gradient-to-br from-white to-[#E8F2F1] p-8">
			<div className="flex size-12 items-center justify-center rounded-full bg-[#0A4D4A] text-white">
				<Award className="size-6" />
			</div>
			<p className="mt-4 font-display text-3xl text-[#0A4D4A]">Certificate</p>
			<p className="mt-2 max-w-xs text-sm text-[#5C6B69]">
				Provisional while you finish · Final when the path is complete
			</p>
		</div>
	);
}

function VisualFrame({ visual }: { visual: (typeof CHAPTERS)[number]["visual"] }) {
	return (
		<div className="aspect-[16/10] w-full">
			<ChapterVisual visual={visual} />
		</div>
	);
}

export function LandingProductChapters() {
	const [active, setActive] = useState(0);
	const refs = useRef<(HTMLElement | null)[]>([]);
	const lockUntil = useRef(0);

	useEffect(() => {
		const syncActive = () => {
			if (Date.now() < lockUntil.current) return;

			const nodes = refs.current;
			const anchor = window.innerHeight * 0.38;
			let best = 0;
			let bestDist = Number.POSITIVE_INFINITY;

			for (let i = 0; i < nodes.length; i++) {
				const el = nodes[i];
				if (!el) continue;
				const top = el.getBoundingClientRect().top;
				const dist = Math.abs(top - anchor);
				if (dist < bestDist) {
					bestDist = dist;
					best = i;
				}
			}

			setActive((prev) => (prev === best ? prev : best));
		};

		syncActive();
		window.addEventListener("scroll", syncActive, { passive: true });
		window.addEventListener("resize", syncActive);
		return () => {
			window.removeEventListener("scroll", syncActive);
			window.removeEventListener("resize", syncActive);
		};
	}, []);

	const goToChapter = (index: number) => {
		setActive(index);
		lockUntil.current = Date.now() + 700;
		refs.current[index]?.scrollIntoView({
			behavior: "smooth",
			block: "start",
		});
	};

	return (
		<section className="border-t border-[#D5E3E0] bg-white py-20 sm:py-24">
			<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				<div className="max-w-2xl">
					<p className="text-xs font-medium uppercase tracking-[0.14em] text-[#5C6B69]">
						How Cycy works
					</p>
					<h2 className="mt-2 font-display text-3xl tracking-tight text-[#14201F] sm:text-4xl">
						From invite to certificate.
					</h2>
				</div>

				<div className="mt-12 lg:grid lg:grid-cols-[1fr_1.1fr] lg:gap-16">
					<div className="space-y-24 lg:pb-32">
						{CHAPTERS.map((chapter, index) => (
							<article
								key={chapter.id}
								ref={(el) => {
									refs.current[index] = el;
								}}
								className="scroll-mt-28"
							>
								<p className="font-mono text-xs font-medium text-[#0A4D4A]">
									{chapter.id}
								</p>
								<h3 className="mt-2 font-display text-2xl text-[#14201F] sm:text-3xl">
									{chapter.title}
								</h3>
								<p className="mt-3 max-w-md text-base leading-relaxed text-[#5C6B69]">
									{chapter.body}
								</p>
								<div className="mt-6 lg:hidden">
									<VisualFrame visual={chapter.visual} />
								</div>
								{index === 0 && (
									<Button
										asChild
										className="mt-6 bg-[#0A4D4A] text-white hover:bg-[#083D3B]"
									>
										<Link href="/sign-up">Get started</Link>
									</Button>
								)}
							</article>
						))}
					</div>

					<div className="relative hidden lg:block">
						<div className="sticky top-28">
							<div className="mb-4 flex gap-2">
								{CHAPTERS.map((chapter, index) => (
									<button
										key={chapter.id}
										type="button"
										aria-label={`Show chapter ${chapter.id}`}
										aria-current={active === index ? "true" : undefined}
										onClick={() => goToChapter(index)}
										className={cn(
											"rounded-full px-2.5 py-1 text-xs font-medium",
											active === index
												? "bg-[#0A4D4A] text-white"
												: "bg-[#F4F8F7] text-[#5C6B69] hover:text-[#14201F]",
										)}
									>
										{chapter.id}
									</button>
								))}
							</div>

							{/* Fixed frame — opacity swap, no remount / layout jump */}
							<div className="relative aspect-[16/10] w-full">
								{CHAPTERS.map((chapter, index) => (
									<div
										key={chapter.id}
										aria-hidden={active !== index}
										className={cn(
											"absolute inset-0 transition-opacity duration-200 ease-out",
											active === index
												? "opacity-100"
												: "pointer-events-none opacity-0",
										)}
									>
										<ChapterVisual visual={chapter.visual} />
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
