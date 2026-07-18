"use client";

import { RoadmapTimeline } from "@/components/learning/roadmap-timeline";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import {
	fetchRoadmap,
	getCachedRoadmap,
	hasCachedRoadmap,
} from "@/lib/learning/roadmap-client";
import type { LearningRoadmapButtonProps, RoadmapData } from "@/types/learning";
import { Map as MapIcon } from "lucide-react";
import { useCallback, useState } from "react";

/** Header control: right sheet; fetches once per server on first open. */
export function LearningRoadmapButton({ serverId }: LearningRoadmapButtonProps) {
	const [open, setOpen] = useState(false);
	const [data, setData] = useState<RoadmapData | null>(
		() => getCachedRoadmap(serverId) ?? null,
	);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const loadOnce = useCallback(async () => {
		if (hasCachedRoadmap(serverId) || loading) {
			const cached = getCachedRoadmap(serverId);
			if (cached) setData(cached);
			return;
		}
		setLoading(true);
		try {
			const json = await fetchRoadmap(serverId);
			setData(json);
			setError(null);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to load");
		} finally {
			setLoading(false);
		}
	}, [loading, serverId]);

	const onOpenChange = (next: boolean) => {
		setOpen(next);
		if (next) void loadOnce();
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetTrigger asChild>
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="h-6 gap-1.5 border-none bg-shell-nav px-2 text-xs font-semibold text-shell-muted hover:bg-shell-hover hover:text-foreground"
				>
					<MapIcon className="size-3.5" />
					Roadmap
				</Button>
			</SheetTrigger>
			<SheetContent
				side="right"
				className="flex w-full flex-col border-shell-border bg-shell-chat sm:max-w-md"
			>
				<SheetHeader>
					<SheetTitle className="font-display text-[#0A4D4A]">
						Learning roadmap
					</SheetTitle>
					<SheetDescription>
						Your path through this group — unlock modules as you go.
					</SheetDescription>
				</SheetHeader>
				<div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
					{error && <p className="text-sm text-rose-600">{error}</p>}
					{loading && !data && (
						<p className="text-sm text-shell-muted">Loading…</p>
					)}
					{data && <RoadmapTimeline serverId={serverId} data={data} />}
				</div>
			</SheetContent>
		</Sheet>
	);
}
