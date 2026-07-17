"use client";

import { ActionTooltip } from "@/components/ui/action-tooltip";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";

interface SideBarItemProps {
	name: string;
	id: string;
	imageUrl: string | null;
}

export function SideBarItem({ name, id, imageUrl }: SideBarItemProps) {
	const router = useRouter();
	const params = useParams();
	const isActive = params?.serverId === id;

	return (
		<ActionTooltip side="right" align="center" label={name}>
			<button
				type="button"
				onClick={() => {
					router.push(`/servers/${id}`);
				}}
				className="group relative flex items-center"
			>
				<div
					className={cn(
						"absolute left-0 w-1 rounded-r-full bg-shell-accent transition-all",
						!isActive && "h-2 group-hover:h-5",
						isActive ? "h-9" : "h-2",
					)}
				/>
				<div
					className={cn(
						"relative mx-3 flex h-12 w-12 overflow-hidden rounded-3xl transition-all group-hover:rounded-2xl",
						isActive && "rounded-2xl bg-shell-active ring-2 ring-shell-accent/30",
						!imageUrl && "bg-shell-hover",
					)}
				>
					{imageUrl ? (
						<Image
							fill
							src={imageUrl}
							alt={name}
							unoptimized={imageUrl.includes("api.dicebear.com")}
							className="object-cover"
						/>
					) : (
						<span className="flex h-full w-full items-center justify-center text-sm font-semibold text-shell-accent">
							{name.charAt(0).toUpperCase()}
						</span>
					)}
				</div>
			</button>
		</ActionTooltip>
	);
}
