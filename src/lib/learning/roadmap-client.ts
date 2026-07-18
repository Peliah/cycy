import type { RoadmapData } from "@/types/learning";

/** In-memory cache so remounts / sheet + panel share one fetch. */
const roadmapCache = new Map<string, RoadmapData>();

export function getCachedRoadmap(serverId: string): RoadmapData | undefined {
	return roadmapCache.get(serverId);
}

export function hasCachedRoadmap(serverId: string): boolean {
	return roadmapCache.has(serverId);
}

export async function fetchRoadmap(serverId: string): Promise<RoadmapData> {
	const cached = roadmapCache.get(serverId);
	if (cached) return cached;

	const res = await fetch(`/api/servers/${serverId}/learn/roadmap`);
	if (!res.ok) throw new Error("Could not load roadmap");

	const json = (await res.json()) as RoadmapData;
	roadmapCache.set(serverId, json);
	return json;
}
