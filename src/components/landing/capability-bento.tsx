"use client";

import Image from "next/image";
import { Award, BookOpen, CheckCircle2, Users } from "lucide-react";
import {
	useCallback,
	useId,
	useState,
	type KeyboardEvent,
} from "react";

import { cn } from "@/lib/utils";

const TABS = [
	{
		id: "roadmap",
		title: "Roadmap from your files",
		body: "Upload notes or PDFs; the AI shapes modules around what you actually need.",
		icon: BookOpen,
	},
	{
		id: "checks",
		title: "Checks that unlock",
		body: "Practice and quizzes gate the next step so progress is real—not just scrolled past.",
		icon: CheckCircle2,
	},
	{
		id: "groups",
		title: "Groups that stick",
		body: "Study with people who share your goal, not another lonely tab.",
		icon: Users,
	},
	{
		id: "certificate",
		title: "Finish with proof",
		body: "End the cycle with a certificate you can show—not another abandoned course.",
		icon: Award,
	},
] as const;

type TabId = (typeof TABS)[number]["id"];

function TabVisual({ id }: { id: TabId }) {
	if (id === "roadmap") {
		return (
			<div className="relative h-full min-h-[220px] overflow-hidden rounded-xl">
				<Image
					src="/roadmap-img.jpg"
					alt="Hands sketching a learning journey on paper"
					fill
					className="object-cover"
					sizes="(max-width: 768px) 100vw, 50vw"
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-[#0A4D4A]/50 to-transparent" />
				<p className="absolute bottom-3 left-3 right-3 text-sm font-medium text-white">
					Map the path before you start the work.
				</p>
			</div>
		);
	}

	if (id === "checks") {
		return (
			<div className="flex h-full min-h-[220px] flex-col justify-center rounded-xl border border-[#D5E3E0] bg-white p-5">
				<p className="text-xs font-medium uppercase tracking-wide text-[#5C6B69]">
					Gate check
				</p>
				<p className="mt-2 text-sm font-medium text-[#14201F]">
					What unlocks the next module?
				</p>
				<ul className="mt-4 space-y-2">
					{["Skim once and move on", "Pass the practice check", "Skip to the exam"].map(
						(choice, i) => (
							<li
								key={choice}
								className={cn(
									"rounded-lg border px-3 py-2 text-sm transition",
									i === 1
										? "border-[#0A4D4A] bg-[#0A4D4A]/5 text-[#0A4D4A]"
										: "border-[#E8F0EE] text-[#5C6B69]",
								)}
							>
								{choice}
							</li>
						),
					)}
				</ul>
			</div>
		);
	}

	if (id === "groups") {
		return (
			<div className="flex h-full min-h-[220px] flex-col justify-between rounded-xl bg-[#0A4D4A] p-5 text-[#E8F2F1]">
				<div className="flex -space-x-2">
					{["A", "M", "J", "S"].map((letter) => (
						<span
							key={letter}
							className="flex size-9 items-center justify-center rounded-full border-2 border-[#0A4D4A] bg-[#7FD4C8]/30 text-xs font-semibold"
						>
							{letter}
						</span>
					))}
				</div>
				<div>
					<p className="font-display text-xl text-white">Exam prep circle</p>
					<p className="mt-1 text-sm text-[#B8D4D1]">4 members · learning online</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-full min-h-[220px] flex-col justify-center rounded-xl border border-[#0A4D4A]/15 bg-white p-6 shadow-sm">
			<div className="mb-3 flex size-10 items-center justify-center rounded-full bg-[#0A4D4A] text-white">
				<Award className="size-5" />
			</div>
			<p className="font-display text-2xl text-[#0A4D4A]">Certificate</p>
			<p className="mt-1 text-sm text-[#5C6B69]">
				Provisional while you finish · Final when the path is complete
			</p>
			<div className="mt-6 h-px w-full bg-[#D5E3E0]" />
			<p className="mt-3 font-display text-sm text-[#14201F]">Your name here</p>
		</div>
	);
}

export function LandingCapabilityBento() {
	const [active, setActive] = useState<TabId>("roadmap");
	const baseId = useId();
	const activeTab = TABS.find((t) => t.id === active) ?? TABS[0];

	const onKeyDown = useCallback(
		(event: KeyboardEvent) => {
			const index = TABS.findIndex((t) => t.id === active);
			if (event.key === "ArrowRight" || event.key === "ArrowDown") {
				event.preventDefault();
				const next = TABS[(index + 1) % TABS.length]!;
				setActive(next.id);
			}
			if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
				event.preventDefault();
				const prev = TABS[(index - 1 + TABS.length) % TABS.length]!;
				setActive(prev.id);
			}
		},
		[active],
	);

	return (
		<section className="bg-[#F4F8F7] py-20 sm:py-24">
			<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				<div className="max-w-2xl">
					<p className="text-xs font-medium uppercase tracking-[0.14em] text-[#5C6B69]">
						What you get
					</p>
					<h2 className="mt-2 font-display text-3xl tracking-tight text-[#14201F] sm:text-4xl">
						Everything a study group needs to finish.
					</h2>
				</div>

				<div className="mt-10 grid gap-3 lg:grid-cols-3 lg:grid-rows-2">
					<div className="flex flex-col overflow-hidden rounded-2xl border border-[#D5E3E0] bg-[#E8F2F1]/50 p-4 lg:col-span-2 lg:row-span-2 sm:p-6">
						<div
							className="mb-4 flex flex-wrap gap-2"
							role="tablist"
							aria-label="Capabilities"
							onKeyDown={onKeyDown}
						>
							{TABS.map((tab) => (
								<button
									key={tab.id}
									id={`${baseId}-${tab.id}`}
									type="button"
									role="tab"
									aria-selected={active === tab.id}
									tabIndex={active === tab.id ? 0 : -1}
									onClick={() => setActive(tab.id)}
									className={cn(
										"rounded-full px-3 py-1.5 text-sm font-medium transition",
										active === tab.id
											? "bg-[#0A4D4A] text-white"
											: "bg-white text-[#5C6B69] hover:text-[#14201F]",
									)}
								>
									{tab.title.split(" ")[0]}
								</button>
							))}
						</div>
						<div
							key={active}
							role="tabpanel"
							className="flex flex-1 flex-col gap-4 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300 lg:flex-row lg:items-stretch"
						>
							<div className="lg:w-2/5">
								<p className="font-display text-2xl text-[#14201F]">
									{activeTab.title}
								</p>
								<p className="mt-2 text-sm leading-relaxed text-[#5C6B69]">
									{activeTab.body}
								</p>
							</div>
							<div className="min-h-[220px] flex-1">
								<TabVisual id={active} />
							</div>
						</div>
					</div>

					{TABS.filter((t) => t.id !== "roadmap").map((tab) => {
						const Icon = tab.icon;
						return (
							<button
								key={tab.id}
								type="button"
								onClick={() => setActive(tab.id)}
								className={cn(
									"group flex flex-col rounded-2xl border border-[#D5E3E0] bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-[#0A4D4A]/30 hover:shadow-md",
									active === tab.id && "border-[#0A4D4A]/40 ring-1 ring-[#0A4D4A]/20",
								)}
							>
								<Icon className="size-5 text-[#0A4D4A]" />
								<p className="mt-3 font-medium text-[#14201F]">{tab.title}</p>
								<p className="mt-1 text-sm text-[#5C6B69]">{tab.body}</p>
							</button>
						);
					})}
				</div>
			</div>
		</section>
	);
}
