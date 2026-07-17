"use client";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStore } from "@/store/store";
import { ServerWithMembersWithProfiles } from "@/types/server";
import { MemberRole } from "@prisma/client";
import {
	ChevronDown,
	LogOut,
	PlusCircle,
	Settings,
	TrashIcon,
	UserPlus,
	Users,
} from "lucide-react";
import { useState } from "react";

interface ServerHeaderProps {
	server: ServerWithMembersWithProfiles;
	role?: MemberRole;
}

export function ServerHeader({ server, role }: ServerHeaderProps) {
	const onOpen = useStore.use.onOpen();
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);

	const isAdmin = role === MemberRole.ADMIN;
	const isModerator = isAdmin || role === MemberRole.MODERATOR;

	const handleInviteClick = () => {
		setIsDropdownOpen(false);
		onOpen("invite", { server });
	};
	const handleServerSettingsClick = () => {
		setIsDropdownOpen(false);
		onOpen("editServer", { server });
	};

	function handleMangeMembersClick() {
		setIsDropdownOpen(false);
		onOpen("manageMembers", { server });
	}
	function handleLeaveServerClick() {
		setIsDropdownOpen(false);
		onOpen("leaveServer", { server });
	}
	function handleDeleteServerClick() {
		setIsDropdownOpen(false);
		onOpen("deleteServer", { server });
	}
	function handleCreateChannelClick() {
		setIsDropdownOpen(false);
		onOpen("createChannel", { server });
	}

	return (
		<DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
			<DropdownMenuTrigger className="focus:outline-none" asChild>
				<button
					type="button"
					className="flex h-12 w-full items-center border-b border-shell-border px-4 text-sm font-semibold text-foreground transition hover:bg-shell-hover"
				>
					<span className="truncate font-display text-base tracking-tight">
						{server?.name}
					</span>
					<ChevronDown className="ml-auto size-4 shrink-0 text-shell-muted" />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56 space-y-0.5 text-sm font-medium text-foreground">
				{isModerator && (
					<DropdownMenuItem
						onClick={handleInviteClick}
						className="cursor-pointer px-3 py-2 text-shell-accent"
					>
						Invite People
						<UserPlus className="ml-auto size-4" />
					</DropdownMenuItem>
				)}
				{isAdmin && (
					<DropdownMenuItem
						onClick={handleMangeMembersClick}
						className="cursor-pointer px-3 py-2"
					>
						Manage Members
						<Users className="ml-auto size-4" />
					</DropdownMenuItem>
				)}
				{isAdmin && (
					<DropdownMenuItem
						onClick={handleServerSettingsClick}
						className="cursor-pointer px-3 py-2"
					>
						Group Settings
						<Settings className="ml-auto size-4" />
					</DropdownMenuItem>
				)}
				{isModerator && (
					<DropdownMenuItem
						onClick={handleCreateChannelClick}
						className="cursor-pointer px-3 py-2 text-shell-accent"
					>
						Create Channel
						<PlusCircle className="ml-auto size-4" />
					</DropdownMenuItem>
				)}
				{isModerator && <DropdownMenuSeparator className="bg-shell-border" />}
				{isAdmin && (
					<DropdownMenuItem
						onClick={handleDeleteServerClick}
						className="cursor-pointer px-3 py-2 text-destructive"
					>
						Delete Group
						<TrashIcon className="ml-auto size-4" />
					</DropdownMenuItem>
				)}
				{!isAdmin && (
					<DropdownMenuItem
						onClick={handleLeaveServerClick}
						className="cursor-pointer px-3 py-2 text-destructive"
					>
						Leave Group
						<LogOut className="ml-auto size-4" />
					</DropdownMenuItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
