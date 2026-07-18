"use client";

import { Button } from "@/components/ui/button";
import type { ModuleLockedNoticeProps } from "@/types/learning";
import { Lock } from "lucide-react";
import Link from "next/link";

export function ModuleLockedNotice({
	serverId,
	moduleTitle,
	previousModuleTitle,
	previousChannelId,
}: ModuleLockedNoticeProps) {
	return (
		<div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
			<span className="flex size-14 items-center justify-center rounded-full bg-[#E8F2F1] text-[#0A4D4A]">
				<Lock className="size-7" aria-hidden />
			</span>
			<div className="max-w-md space-y-2">
				<h2 className="font-display text-xl text-[#0A4D4A]">
					You don’t have access yet
				</h2>
				<p className="text-sm leading-relaxed text-shell-muted">
					<strong className="font-medium text-foreground">{moduleTitle}</strong>{" "}
					is locked. Pass the gate quiz on the previous module
					{previousModuleTitle ? (
						<>
							{" "}
							(
							<span className="font-medium text-foreground">
								{previousModuleTitle}
							</span>
							)
						</>
					) : null}{" "}
					to unlock this one.
				</p>
			</div>
			<div className="flex flex-wrap items-center justify-center gap-2">
				{previousChannelId ? (
					<Button
						asChild
						className="bg-[#0A4D4A] hover:bg-[#0A4D4A]/90"
					>
						<Link href={`/servers/${serverId}/channels/${previousChannelId}`}>
							Go to previous module
						</Link>
					</Button>
				) : null}
				<Button asChild variant="outline">
					<Link href={`/servers/${serverId}`}>Back to group</Link>
				</Button>
			</div>
		</div>
	);
}
