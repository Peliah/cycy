"use client";

import { UserAvatar } from "@/components/user/user-avatar";
import { cn } from "@/lib/utils";
import { Member, MemberRole, Profile, Server } from "@prisma/client";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

interface ServerMemberProps {
	member: Member & { profile: Profile };
	server: Server;
}

const roleIconMap = {
	[MemberRole.GUEST]: null,
	[MemberRole.ADMIN]: (
		<ShieldAlert className="ml-2 size-4 text-amber-600 dark:text-amber-400" />
	),
	[MemberRole.MODERATOR]: (
		<ShieldCheck className="ml-2 size-4 text-shell-accent" />
	),
};

export function ServerMember({ member }: ServerMemberProps) {
	const params = useParams();
	const router = useRouter();
	const isActive = params?.memberId === member.id;
	const icon = roleIconMap[member.role];

	const onClick = () => {
		router.push(`/servers/${params?.serverId}/conversations/${member.id}`);
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
			<UserAvatar
				src={member?.profile?.imageUrl ?? undefined}
				className="size-7"
			/>
			<p
				className={cn(
					"truncate text-sm font-medium text-shell-muted transition group-hover:text-foreground",
					isActive && "font-semibold text-foreground",
				)}
			>
				{member.profile?.name}
			</p>
			{icon}
		</button>
	);
}
