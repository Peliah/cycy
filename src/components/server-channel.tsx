"use client";

import { ActionTooltip } from "@/components/ui/action-tooltip";
import { cn } from "@/lib/utils";
import { Channel, ChannelType, MemberRole, Server } from "@prisma/client";
import { Edit, Hash, Lock, Mic, Trash, Video } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import type React from "react";
import { useStore } from "@/store/store";
import type { ModalType } from "@/types/store";

interface ServerChannelParams {
	channel: Channel;
	server: Server;
	role?: MemberRole;
}

const iconMap = {
	[ChannelType.TEXT]: Hash,
	[ChannelType.AUDIO]: Mic,
	[ChannelType.VIDEO]: Video,
};

export function ServerChannel({ channel, server, role }: ServerChannelParams) {
	const onOpen = useStore.use.onOpen();
	const router = useRouter();
	const params = useParams();
	const isActive = params?.channelId === channel.id;
	const Icon = iconMap[channel.type];

	const onClick = () => {
		router.push(`/servers/${params?.serverId}/channels/${channel.id}`);
	};

	const onAction = (e: React.MouseEvent, action: ModalType) => {
		e.stopPropagation();
		onOpen(action, { server, channel });
	};

	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"group flex w-full items-center gap-x-2 rounded-md px-2 py-1.5 transition hover:bg-shell-hover",
				isActive && "bg-shell-active hover:bg-shell-active",
			)}
		>
			<Icon
				className={cn(
					"size-4 shrink-0 text-shell-muted",
					isActive && "text-shell-accent",
				)}
			/>
			<p
				className={cn(
					"line-clamp-1 text-sm font-medium text-shell-muted transition group-hover:text-foreground",
					isActive && "font-semibold text-foreground",
				)}
			>
				{channel.name}
			</p>
			{channel.name !== "general" && role !== MemberRole.GUEST && (
				<div className="ml-auto flex items-center gap-x-1.5">
					<ActionTooltip label="Edit">
						<Edit
							onClick={(e) => onAction(e, "editChannel")}
							className="hidden size-3.5 text-shell-muted transition hover:text-foreground group-hover:block"
						/>
					</ActionTooltip>
					<ActionTooltip label="Delete">
						<Trash
							onClick={(e) => onAction(e, "deleteChannel")}
							className="hidden size-3.5 text-shell-muted transition hover:text-destructive group-hover:block"
						/>
					</ActionTooltip>
				</div>
			)}
			{channel.name === "general" && (
				<Lock className="ml-auto size-3.5 text-shell-muted" />
			)}
		</button>
	);
}
