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
	status: CurriculumModule["progressStatus"],
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

/**
 * Idempotent: upsert one TEXT channel per Nest curriculum module.
 * Only touches channels with externalModuleId set.
 */
export async function syncModuleChannels(
	serverId: string,
	modules: CurriculumModule[],
): Promise<{ upserted: number }> {
	if (modules.length === 0) return { upserted: 0 };

	const server = await prisma.server.findUnique({
		where: { id: serverId },
		select: { profileId: true },
	});
	if (!server) {
		throw new Error(`Server not found: ${serverId}`);
	}

	let upserted = 0;

	await prisma.$transaction(async (tx) => {
		for (const mod of modules) {
			const baseName = slugifyChannelName(mod.title, mod.order);
			const name = await uniqueChannelName(
				tx,
				serverId,
				baseName,
				mod.id,
			);
			const moduleStatus = toModuleStatus(mod.progressStatus);

			await tx.channel.upsert({
				where: {
					serverId_externalModuleId: {
						serverId,
						externalModuleId: mod.id,
					},
				},
				create: {
					name,
					type: ChannelType.TEXT,
					serverId,
					profileId: server.profileId,
					externalModuleId: mod.id,
					moduleStatus,
					moduleOrder: mod.order,
				},
				update: {
					moduleStatus,
					moduleOrder: mod.order,
					// Keep existing channel name if user-facing rename ever allowed later.
				},
			});
			upserted += 1;
		}
	});

	return { upserted };
}
