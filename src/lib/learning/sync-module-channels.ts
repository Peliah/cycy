import {
	ChannelType,
	ModuleProgressStatus,
	type Prisma,
} from "@prisma/client";

import type { CurriculumModule } from "@/lib/cycy/types";
import { prisma } from "@/lib/prismadb";

function slugifyChannelName(title: string, order: number): string {
	const slug = title
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "")
		.slice(0, 80);

	return slug || `module-${order}`;
}

function toModuleStatus(
	status: CurriculumModule["progressStatus"] | string | null | undefined,
): ModuleProgressStatus {
	switch (status) {
		case "LOCKED":
			return ModuleProgressStatus.LOCKED;
		case "AVAILABLE":
			return ModuleProgressStatus.AVAILABLE;
		case "IN_PROGRESS":
			return ModuleProgressStatus.IN_PROGRESS;
		case "COMPLETED":
			return ModuleProgressStatus.COMPLETED;
		default:
			return ModuleProgressStatus.LOCKED;
	}
}

async function uniqueChannelName(
	tx: Prisma.TransactionClient,
	serverId: string,
	baseName: string,
	externalModuleId: string,
): Promise<string> {
	const existing = await tx.channel.findFirst({
		where: { serverId, externalModuleId },
		select: { name: true },
	});
	if (existing) return existing.name;

	let candidate = baseName;
	let suffix = 2;
	while (
		await tx.channel.findFirst({
			where: { serverId, name: candidate },
			select: { id: true },
		})
	) {
		candidate = `${baseName}-${suffix}`;
		suffix += 1;
	}
	return candidate;
}

function normalizeModules(modules: unknown): CurriculumModule[] {
	if (!Array.isArray(modules)) return [];

	const normalized: CurriculumModule[] = [];
	for (const raw of modules) {
		if (!raw || typeof raw !== "object") continue;
		const record = raw as Record<string, unknown>;
		const id =
			typeof record.id === "string"
				? record.id
				: typeof record.moduleId === "string"
					? record.moduleId
					: null;
		const title = typeof record.title === "string" ? record.title : null;
		const order =
			typeof record.order === "number"
				? record.order
				: typeof record.order === "string" && Number.isFinite(Number(record.order))
					? Number(record.order)
					: null;

		if (!id || !title || order === null) continue;

		normalized.push({
			id,
			title,
			order,
			progressStatus:
				(record.progressStatus as CurriculumModule["progressStatus"]) ?? null,
		});
	}
	return normalized;
}

/**
 * Idempotent: upsert one TEXT channel per Nest curriculum module.
 * Only touches channels with externalModuleId set.
 */
export async function syncModuleChannels(
	serverId: string,
	modulesInput: CurriculumModule[] | unknown,
): Promise<{ upserted: number; skipped: number }> {
	const modules = normalizeModules(modulesInput);
	if (modules.length === 0) {
		return {
			upserted: 0,
			skipped: Array.isArray(modulesInput) ? modulesInput.length : 0,
		};
	}

	const server = await prisma.server.findUnique({
		where: { id: serverId },
		select: { profileId: true },
	});
	if (!server) {
		throw new Error(`Server not found: ${serverId}`);
	}

	let upserted = 0;

	await prisma.$transaction(
		async (tx) => {
			for (const mod of modules) {
				const baseName = slugifyChannelName(mod.title, mod.order);
				const name = await uniqueChannelName(
					tx,
					serverId,
					baseName,
					mod.id,
				);
				const moduleStatus = toModuleStatus(mod.progressStatus);

				const existing = await tx.channel.findFirst({
					where: { serverId, externalModuleId: mod.id },
					select: { id: true },
				});

				if (existing) {
					await tx.channel.update({
						where: { id: existing.id },
						data: {
							moduleStatus,
							moduleOrder: mod.order,
						},
					});
				} else {
					await tx.channel.create({
						data: {
							name,
							type: ChannelType.TEXT,
							serverId,
							profileId: server.profileId,
							externalModuleId: mod.id,
							moduleStatus,
							moduleOrder: mod.order,
						},
					});
				}
				upserted += 1;
			}
		},
		{
			maxWait: 10_000,
			timeout: 30_000,
		},
	);

	return { upserted, skipped: 0 };
}
