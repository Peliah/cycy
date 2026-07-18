"use client";

import { cn } from "@/lib/utils";
import {
	Award,
	BookOpen,
	CheckCircle2,
	FileUp,
	Loader2,
	Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const BEATS = [
	{
		id: "group",
		label: "Group",
		title: "Group ready",
		body: "Materials uploaded — PDF notes and pasted study text.",
		icon: Users,
	},
	{
		id: "roadmap",
		label: "Roadmap",
		title: "Roadmap building",
		body: "Modules take shape from your goal and files.",
		icon: BookOpen,
	},
	{
		id: "check",
		label: "Check",
		title: "Gate check passed",
		body: "+120 XP · next module unlocked.",
		icon: CheckCircle2,
	},
	{
		id: "cert",
		label: "Proof",
		title: "Certificate unlocked",
		body: "Finish the path with proof you can show.",
		icon: Award,
	},
] as const;

const INTERVAL_MS = 5000;

export function LandingProductStage() {
	const [beat, setBeat] = useState(0);
	const [paused, setPaused] = useState(false);
	const [reducedMotion, setReducedMotion] = useState(false);
	const frameRef = useRef<HTMLDivElement>(null);
	const [spot, setSpot] = useState({ x: 50, y: 40 });

	useEffect(() => {
		const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
		setReducedMotion(mq.matches);
		const onChange = () => setReducedMotion(mq.matches);
		mq.addEventListener("change", onChange);
		return () => mq.removeEventListener("change", onChange);
	}, []);

	useEffect(() => {
		if (reducedMotion || paused) return;
		const id = window.setInterval(() => {
			setBeat((b) => (b + 1) % BEATS.length);
		}, INTERVAL_MS);
		return () => window.clearInterval(id);
	}, [paused, reducedMotion]);

	const current = BEATS[beat]!;
	const Icon = current.icon;

	return (
		<div
			ref={frameRef}
			className="relative overflow-hidden rounded-2xl border border-white/40 bg-[#F4F8F7]/90 shadow-2xl shadow-[#0A4D4A]/25 backdrop-blur-md"
			onMouseEnter={() => setPaused(true)}
			onMouseLeave={() => setPaused(false)}
			onFocusCapture={() => setPaused(true)}
			onBlurCapture={(e) => {
				if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
					setPaused(false);
				}
			}}
			onMouseMove={(e) => {
				const el = frameRef.current;
				if (!el || reducedMotion) return;
				const rect = el.getBoundingClientRect();
				setSpot({
					x: ((e.clientX - rect.left) / rect.width) * 100,
					y: ((e.clientY - rect.top) / rect.height) * 100,
				});
			}}
		>
			{!reducedMotion && (
				<div
					aria-hidden
					className="pointer-events-none absolute inset-0 opacity-40 transition-opacity"
					style={{
						background: `radial-gradient(420px circle at ${spot.x}% ${spot.y}%, rgba(127,212,200,0.35), transparent 55%)`,
					}}
				/>
			)}

			<div className="relative flex min-h-[280px] flex-col sm:min-h-[320px]">
				<div className="flex items-center gap-2 border-b border-[#D5E3E0] px-3 py-2">
					<div className="flex gap-1.5">
						<span className="size-2.5 rounded-full bg-[#D5E3E0]" />
						<span className="size-2.5 rounded-full bg-[#D5E3E0]" />
						<span className="size-2.5 rounded-full bg-[#D5E3E0]" />
					</div>
					<p className="ml-2 text-xs font-medium text-[#5C6B69]">
						cycy · study group
					</p>
				</div>

				<div className="grid flex-1 grid-cols-[56px_1fr] sm:grid-cols-[72px_1fr]">
					<aside className="flex flex-col items-center gap-3 bg-[#0A4D4A] py-4">
						<div className="flex size-9 items-center justify-center rounded-xl bg-white/15 text-white">
							<Users className="size-4" />
						</div>
						<div
							className={cn(
								"flex size-9 items-center justify-center rounded-xl text-white transition",
								beat >= 1 ? "bg-[#7FD4C8]/30 ring-2 ring-[#7FD4C8]/50" : "bg-white/10",
							)}
						>
							<BookOpen className="size-4" />
						</div>
						<span className="text-[10px] font-medium text-[#B8D4D1]">Learn</span>
					</aside>

					<div className="relative flex flex-col p-4 sm:p-5">
						<div
							key={current.id}
							className={cn(
								"flex flex-1 flex-col justify-center",
								!reducedMotion && "animate-in fade-in duration-500",
							)}
						>
							<div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-[#0A4D4A]/10 text-[#0A4D4A]">
								{beat === 1 && !reducedMotion ? (
									<Loader2 className="size-5 animate-spin" />
								) : beat === 0 ? (
									<FileUp className="size-5" />
								) : (
									<Icon className="size-5" />
								)}
							</div>
							<p className="font-display text-xl text-[#14201F] sm:text-2xl">
								{current.title}
							</p>
							<p className="mt-1 max-w-sm text-sm text-[#5C6B69]">{current.body}</p>

							{beat === 1 && (
								<ul className="mt-4 space-y-2">
									{["Foundations", "Core concepts", "Applied practice"].map(
										(mod, i) => (
											<li
												key={mod}
												className={cn(
													"rounded-lg border border-[#D5E3E0] bg-white px-3 py-2 text-sm text-[#14201F] transition",
													!reducedMotion && "animate-in fade-in slide-in-from-bottom-1",
												)}
												style={{ animationDelay: `${i * 120}ms` }}
											>
												{mod}
											</li>
										),
									)}
								</ul>
							)}

							{beat === 2 && (
								<div className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-[#0A4D4A] px-3 py-1.5 text-xs font-medium text-white">
									<CheckCircle2 className="size-3.5" />
									Quiz passed · +120 XP
								</div>
							)}

							{beat === 3 && (
								<div className="mt-4 rounded-xl border border-[#0A4D4A]/20 bg-white px-4 py-3 shadow-sm">
									<p className="font-display text-lg text-[#0A4D4A]">
										Certificate
									</p>
									<p className="text-xs text-[#5C6B69]">
										Provisional → Final when the path is complete
									</p>
								</div>
							)}
						</div>

						<div
							className="mt-4 flex gap-1.5"
							role="tablist"
							aria-label="Product story beats"
						>
							{BEATS.map((item, index) => (
								<button
									key={item.id}
									type="button"
									role="tab"
									aria-selected={index === beat}
									aria-label={item.label}
									onClick={() => setBeat(index)}
									className={cn(
										"h-1.5 flex-1 rounded-full transition",
										index === beat
											? "bg-[#0A4D4A]"
											: "bg-[#D5E3E0] hover:bg-[#B8D4D1]",
									)}
								/>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
