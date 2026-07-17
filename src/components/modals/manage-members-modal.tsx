"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuPortal,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "@/components/user/user-avatar";
import { useStore } from "@/store/store";
import { ServerWithMembersWithProfiles } from "@/types/server";
import { MemberRole } from "@prisma/client";
import axios from "axios";
import { Check, Gavel, Loader2, MoreVertical, Shield, ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import { useRouter } from "next/navigation";
import qs from "query-string";
import { useState } from "react";

export function ManageMembersModal() {
	const router = useRouter();
	const [loadingId, setLoadingId] = useState("");
	const type = useStore.use.type();
	const isOpen = useStore.use.isOpen();
	const onOpen = useStore.use.onOpen();
	const onClose = useStore.use.onClose();
	const data = useStore.use.data() as { server: ServerWithMembersWithProfiles };
	const isModelOpen = isOpen && type === "manageMembers";
	const roleIconMap = {
		[MemberRole.ADMIN]: (
			<ShieldAlert className="ml-2 size-4 text-amber-600 dark:text-amber-400" />
		),
		[MemberRole.MODERATOR]: (
			<ShieldCheck className="ml-2 size-4 text-shell-accent" />
		),
		[MemberRole.GUEST]: null,
	};

	const onRoleChange = async (memberId: string, role: MemberRole) => {
		try {
			setLoadingId(memberId);
			const url = qs.stringifyUrl({
				url: `/api/members/${memberId}`,
				query: {
					serverId: data.server.id,
				},
			});
			const res = await axios.patch(url, { role });
			router.refresh();
			onOpen("manageMembers", { server: res.data });
		} catch (error) {
			console.log(error);
		} finally {
			setLoadingId("");
		}
	};

	const onKick = async (memberId: string) => {
		try {
			setLoadingId(memberId);
			const url = qs.stringifyUrl({
				url: `/api/members/${memberId}`,
				query: {
					serverId: data.server.id,
				},
			});
			const res = await axios.delete(url);
			router.refresh();
			onOpen("manageMembers", { server: res.data });
		} catch (error) {
			console.log(error);
		} finally {
			setLoadingId("");
		}
	};

	return (
		<Dialog open={isModelOpen} onOpenChange={onClose}>
			<DialogContent
				aria-describedby={undefined}
				className="overflow-hidden bg-shell-chat text-foreground"
			>
				<DialogHeader className="px-6 pt-8">
					<DialogTitle className="text-center text-2xl font-bold">
						Manage members
					</DialogTitle>
					<DialogDescription className="px-6 py-2 text-center text-sm text-shell-muted">
						{data?.server?.members?.length} members
					</DialogDescription>
				</DialogHeader>
				<ScrollArea className="mt-8 max-h-[420px] pr-6">
					{data?.server?.members?.map((member) => (
						<div key={member.id} className="mb-6 flex items-center gap-x-2">
							<UserAvatar src={member?.profile?.imageUrl ?? undefined} />
							<div className="flex flex-col gap-y-1">
								<div className="flex items-center gap-x-1 text-sm font-semibold">
									{member.profile?.name}
									{roleIconMap[member.role]}
								</div>
								<p className="text-xs text-shell-muted">{member.profile.email}</p>
							</div>
							{data?.server?.profileId !== member.profileId && loadingId !== member.id && (
								<div className="ml-auto">
									<DropdownMenu modal={true}>
										<DropdownMenuTrigger asChild>
											<MoreVertical className="size-4 text-shell-muted" />
										</DropdownMenuTrigger>

										<DropdownMenuContent side="left">
											<DropdownMenuSub>
												<DropdownMenuSubTrigger className="flex items-center">
													<ShieldQuestion className="w-4 h-4 mr-2" />
													<span>Role</span>
												</DropdownMenuSubTrigger>
												<DropdownMenuPortal>
													<DropdownMenuSubContent>
														<DropdownMenuItem
															onClick={() => onRoleChange(member.id, "GUEST")}
														>
															<Shield className="mr-2 h-4 w-4" />
															Guest
															{member.role === MemberRole.GUEST && (
																<Check className="w-4 h-4 ml-auto" />
															)}
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() => onRoleChange(member.id, "MODERATOR")}
														>
															<ShieldCheck className=" mr-2 h-4 w-4" />
															Moderator
															{member.role === MemberRole.MODERATOR && (
																<Check className="w-4 h-4 ml-auto" />
															)}
														</DropdownMenuItem>
													</DropdownMenuSubContent>
												</DropdownMenuPortal>
											</DropdownMenuSub>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												onClick={() => onKick(member.id)}
											>
												<Gavel className="mr-2 h-4 w-4" />
												Kick
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							)}
							{loadingId === member.id && (
								<Loader2 className="ml-auto size-4 animate-spin text-shell-muted" />
							)}
						</div>
					))}
				</ScrollArea>
			</DialogContent>
		</Dialog>
	);
}
