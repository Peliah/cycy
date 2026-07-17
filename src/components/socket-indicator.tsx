"use client";

import { Badge } from "@/components/ui/badge";
import { useSocket } from "@/contexts/socket-provider";

export function SocketIndicator() {
	const { isConnected } = useSocket();
	if (!isConnected) {
		return (
			<Badge
				variant="outline"
				className="border-none bg-amber-600/90 text-white"
			>
				Fallback: Polling every 1s
			</Badge>
		);
	}
	return (
		<Badge
			variant="outline"
			className="border-none bg-shell-accent text-shell-accent-foreground"
		>
			Live
		</Badge>
	);
}
