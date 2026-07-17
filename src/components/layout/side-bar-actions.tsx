"use client";

import { ActionTooltip } from "@/components/ui/action-tooltip";
import { useStore } from "@/store/store";
import { Plus } from "lucide-react";

export function SideBarActions() {
	const onOpen = useStore.use.onOpen();
	return (
		<div>
			<ActionTooltip align="center" side="right" label="Add a group">
				<button
					type="button"
					onClick={() => onOpen("createServer")}
					className="group flex items-center"
				>
					<div className="mx-3 flex h-12 w-12 items-center justify-center overflow-hidden rounded-3xl bg-shell-chat text-shell-accent transition-all group-hover:rounded-2xl group-hover:bg-shell-accent group-hover:text-shell-accent-foreground">
						<Plus size={24} className="transition" />
					</div>
				</button>
			</ActionTooltip>
		</div>
	);
}
