"use client";

import { ActionTooltip } from "@/components/ui/action-tooltip";
import { useStore } from "@/store/store";
import type { ServerWithMembersWithProfiles } from "@/types/server";
import { ChannelType, MemberRole } from "@prisma/client";
import { Plus, Settings } from "lucide-react";

interface ServerSectionProps {
	label: string;
	role?: MemberRole;
	sectionType: "channels" | "members";
	channelType?: ChannelType;
	server?: ServerWithMembersWithProfiles;
	/** Hide the create-channel control (e.g. system Modules section). */
	allowCreate?: boolean;
}

export function ServerSection({
	label,
	role,
	sectionType,
	channelType,
	server,
	allowCreate = true,
}: ServerSectionProps) {
	const onOpen = useStore.use.onOpen();

	return (
		<div className="flex items-center justify-between px-2 py-1">
			<p className="text-[11px] font-semibold uppercase tracking-wide text-shell-muted">
				{label}
			</p>
			{allowCreate &&
				role !== MemberRole.GUEST &&
				sectionType === "channels" && (
				<ActionTooltip label="Create Channel" side="top">
					<button
						type="button"
						onClick={() => onOpen("createChannel", { channelType })}
						className="text-shell-muted transition hover:text-shell-accent"
					>
						<Plus className="size-4" />
					</button>
				</ActionTooltip>
			)}
			{role === MemberRole.ADMIN && sectionType === "members" && (
				<ActionTooltip label="Manage Members" side="top">
					<button
						type="button"
						onClick={() => onOpen("manageMembers", { server })}
						className="text-shell-muted transition hover:text-shell-accent"
					>
						<Settings className="size-4" />
					</button>
				</ActionTooltip>
			)}
		</div>
	);
}
