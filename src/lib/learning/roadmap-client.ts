/** In-memory cache so remounts / sheet + panel share one fetch. */
const roadmapCache = new Map<string, import("@/types/learning").RoadmapData>();

function cacheKey(serverId: string, contentVersion?: number): string {
	return contentVersion != null ? `${serverId}:v${contentVersion}` : serverId;
}

export function invalidateRoadmapCache(serverId: string): void {
	for (const key of roadmapCache.keys()) {
		if (key === serverId || key.startsWith(`${serverId}:`)) {
			roadmapCache.delete(key);
		}
	}
}

export function getCachedRoadmap(serverId: string): import("@/types/learning").RoadmapData | undefined {
	for (const [key, value] of roadmapCache.entries()) {
		if (key === serverId || key.startsWith(`${serverId}:`)) {
			return value;
		}
	}
	return undefined;
}

export function hasCachedRoadmap(serverId: string): boolean {
	return getCachedRoadmap(serverId) != null;
}

export async function fetchRoadmap(serverId: string): Promise<import("@/types/learning").RoadmapData> {
	const cached = getCachedRoadmap(serverId);
	if (cached) return cached;

	const res = await fetch(`/api/servers/${serverId}/learn/roadmap`);
	if (!res.ok) throw new Error("Could not load roadmap");

	const json = (await res.json()) as import("@/types/learning").RoadmapData;
	roadmapCache.set(cacheKey(serverId, json.contentVersion), json);
	return json;
}
