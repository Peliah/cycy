"use client";

import { Progress } from "@/components/ui/progress";
import type { RoadmapSummaryProps } from "@/types/learning";

export function RoadmapSummary({ data }: RoadmapSummaryProps) {
	const pct =
		data.modulesTotal === 0
			? 0
			: Math.round((data.modulesCompleted / data.modulesTotal) * 100);

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between text-sm">
				<span className="text-shell-muted">
					{data.modulesCompleted}/{data.modulesTotal} modules
				</span>
				<span className="font-medium text-[#0A4D4A]">
					{data.memberXp} XP
					{data.nestProgress ? ` · ${data.nestProgress.rank}` : ""}
				</span>
			</div>
			<Progress value={pct} className="h-2" />
			{data.summary && (
				<p className="text-sm leading-relaxed text-shell-muted">{data.summary}</p>
			)}
		</div>
	);
}
