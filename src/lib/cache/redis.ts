import { Redis } from "@upstash/redis";

import type {
	CurriculumStatusResponse,
	ProgressResponse,
} from "@/lib/cycy/types";

const CURRICULUM_READY_TTL_SEC = 90;
const PROGRESS_TTL_SEC = 45;

let redis: Redis | null | undefined;

function getRedis(): Redis | null {
	if (redis !== undefined) return redis;

	const url = process.env.UPSTASH_REDIS_REST_URL;
	const token = process.env.UPSTASH_REDIS_REST_TOKEN;
	if (!url || !token) {
		redis = null;
		return null;
	}

	redis = new Redis({ url, token });
	return redis;
}

export function curriculumCacheKey(serverId: string) {
	return `cycy:curriculum:${serverId}`;
}

export function progressCacheKey(serverId: string) {
	return `cycy:progress:${serverId}`;
}

export async function cacheGetJson<T>(key: string): Promise<T | null> {
	const client = getRedis();
	if (!client) return null;
	try {
		return (await client.get<T>(key)) ?? null;
	} catch (error) {
		console.error(error, "REDIS GET ERROR");
		return null;
	}
}

export async function cacheSetJson(
	key: string,
	value: unknown,
	ttlSeconds: number,
): Promise<void> {
	const client = getRedis();
	if (!client) return;
	try {
		await client.set(key, value, { ex: ttlSeconds });
	} catch (error) {
		console.error(error, "REDIS SET ERROR");
	}
}

export async function cacheDel(...keys: string[]): Promise<void> {
	const client = getRedis();
	if (!client || keys.length === 0) return;
	try {
		await client.del(...keys);
	} catch (error) {
		console.error(error, "REDIS DEL ERROR");
	}
}

/** Cache only READY curriculum — never GENERATING as long-lived truth. */
export async function getCachedReadyCurriculum(
	serverId: string,
): Promise<CurriculumStatusResponse | null> {
	const cached = await cacheGetJson<CurriculumStatusResponse>(
		curriculumCacheKey(serverId),
	);
	if (cached?.status === "READY") return cached;
	return null;
}

export async function setCachedReadyCurriculum(
	serverId: string,
	data: CurriculumStatusResponse,
): Promise<void> {
	if (data.status !== "READY") return;
	await cacheSetJson(
		curriculumCacheKey(serverId),
		data,
		CURRICULUM_READY_TTL_SEC,
	);
}

export async function getCachedProgress(
	serverId: string,
): Promise<ProgressResponse | null> {
	return cacheGetJson<ProgressResponse>(progressCacheKey(serverId));
}

export async function setCachedProgress(
	serverId: string,
	data: ProgressResponse,
): Promise<void> {
	await cacheSetJson(progressCacheKey(serverId), data, PROGRESS_TTL_SEC);
}

export async function invalidateServerLearningCache(
	serverId: string,
): Promise<void> {
	await cacheDel(curriculumCacheKey(serverId), progressCacheKey(serverId));
}
