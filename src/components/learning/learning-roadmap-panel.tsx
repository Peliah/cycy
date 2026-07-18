"use client";

import { RoadmapTimeline } from "@/components/learning/roadmap-timeline";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	fetchRoadmap,
	getCachedRoadmap,
	hasCachedRoadmap,
} from "@/lib/learning/roadmap-client";
import type { LearningRoadmapPanelProps, RoadmapData } from "@/types/learning";
import { useEffect, useState } from "react";

/** Full-pane timeline for #general — loads once when this tab mounts. */
export function LearningRoadmapPanel({ serverId }: LearningRoadmapPanelProps) {
	const [data, setData] = useState<RoadmapData | null>(
		() => getCachedRoadmap(serverId) ?? null,
	);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(() => !hasCachedRoadmap(serverId));

	useEffect(() => {
		if (hasCachedRoadmap(serverId)) {
			setData(getCachedRoadmap(serverId)!);
			setLoading(false);
			return;
		}
		let cancelled = false;
		setLoading(true);
		void (async () => {
			try {
				const json = await fetchRoadmap(serverId);
				if (!cancelled) {
					setData(json);
					setError(null);
				}
			} catch (e) {
				if (!cancelled) {
					setError(e instanceof Error ? e.message : "Failed to load");
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [serverId]);

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<div className="border-b border-shell-border px-4 py-3">
				<h2 className="font-display text-lg text-[#0A4D4A]">
					Learning roadmap
				</h2>
				<p className="text-sm text-shell-muted">
					Your path through this group — unlock modules as you go.
				</p>
			</div>
			<ScrollArea className="min-h-0 flex-1 px-4 py-5">
				<div className="mx-auto max-w-lg">
					{error && <p className="text-sm text-rose-600">{error}</p>}
					{loading && !data && (
						<p className="text-sm text-shell-muted">Loading roadmap…</p>
					)}
					{data && <RoadmapTimeline serverId={serverId} data={data} />}
					{!loading && !error && data && data.modules.length === 0 && (
						<p className="text-sm text-shell-muted">
							No modules yet. Curriculum will appear here when ready.
						</p>
					)}
				</div>
			</ScrollArea>
		</div>
	);
}
