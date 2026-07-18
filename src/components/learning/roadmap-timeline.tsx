"use client";

import { RoadmapSummary } from "@/components/learning/roadmap-summary";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RoadmapTimelineProps } from "@/types/learning";
import {
	BookOpen,
	CheckCircle2,
	CircleDot,
	Lock,
} from "lucide-react";
import Link from "next/link";

const statusIcon = {
	LOCKED: Lock,
	AVAILABLE: BookOpen,
	IN_PROGRESS: CircleDot,
	COMPLETED: CheckCircle2,
} as const;

/** Vertical timeline / path-style roadmap. */
export function RoadmapTimeline({ serverId, data }: RoadmapTimelineProps) {
	return (
		<div className="flex h-full flex-col gap-5">
			<RoadmapSummary data={data} />

			<ol className="relative space-y-0 pl-1">
				{data.modules.map((mod, index) => {
					const Icon =
						statusIcon[mod.status as keyof typeof statusIcon] ?? Lock;
					const locked = mod.status === "LOCKED";
					const completed = mod.status === "COMPLETED";
					const active =
						mod.status === "AVAILABLE" || mod.status === "IN_PROGRESS";
					const isLast = index === data.modules.length - 1;
					const href = mod.channelId
						? `/servers/${serverId}/channels/${mod.channelId}`
						: null;

					const node = (
						<div className="relative flex gap-4 pb-8 last:pb-0">
							<div className="relative flex w-10 shrink-0 flex-col items-center">
								<span
									className={cn(
										"relative z-10 flex size-10 items-center justify-center rounded-full border-2 text-sm font-semibold",
										completed &&
											"border-[#0A4D4A] bg-[#0A4D4A] text-white",
										active &&
											"border-[#0A4D4A] bg-[#E8F2F1] text-[#0A4D4A]",
										locked &&
											"border-shell-border bg-shell-nav text-shell-muted",
									)}
								>
									{completed ? (
										<CheckCircle2 className="size-5" />
									) : (
										<span>{mod.order}</span>
									)}
								</span>
								{!isLast && (
									<span
										className={cn(
											"absolute top-10 bottom-0 w-0.5",
											completed ? "bg-[#0A4D4A]" : "bg-shell-border",
										)}
										aria-hidden
									/>
								)}
							</div>

							<div
								className={cn(
									"min-w-0 flex-1 rounded-xl border px-4 py-3 transition",
									locked &&
										"border-shell-border/60 bg-shell-nav/40 opacity-75",
									active &&
										"border-[#0A4D4A]/35 bg-shell-chat shadow-sm hover:border-[#0A4D4A]/60",
									completed && "border-shell-border bg-shell-chat",
								)}
							>
								<div className="flex flex-wrap items-center gap-2">
									<Icon
										className={cn(
											"size-3.5",
											locked ? "text-shell-muted" : "text-[#0A4D4A]",
										)}
									/>
									<Badge
										variant="outline"
										className="text-[10px] capitalize"
									>
										{mod.status.toLowerCase().replace("_", " ")}
									</Badge>
									<span className="text-xs text-shell-muted">
										{mod.xpReward} XP
										{mod.xpEarned > 0 ? ` · earned ${mod.xpEarned}` : ""}
									</span>
								</div>
								<p
									className={cn(
										"mt-1.5 font-display text-base font-medium",
										locked ? "text-shell-muted" : "text-foreground",
									)}
								>
									{mod.title}
								</p>
								{active && href && (
									<p className="mt-1 text-xs text-[#0A4D4A]">
										Continue studying →
									</p>
								)}
							</div>
						</div>
					);

					return (
						<li key={mod.id}>
							{href && !locked ? (
								<Link href={href} className="block">
									{node}
								</Link>
							) : (
								node
							)}
						</li>
					);
				})}
			</ol>
		</div>
	);
}
