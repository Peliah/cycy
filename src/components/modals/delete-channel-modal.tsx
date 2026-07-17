"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useStore } from "@/store/store";
import axios from "axios";
import {  useRouter } from "next/navigation";
import { useState } from "react";
import qs from "query-string";

export function DeleteChannelModal() {
	const router = useRouter();
	const type = useStore.use.type();
	const isOpen = useStore.use.isOpen();
	const onOpen = useStore.use.onOpen();
	const onClose = useStore.use.onClose();
	const data = useStore.use.data();
	const isModelOpen = isOpen && type === "deleteChannel";
	const [isLoading, setIsLoading] = useState(false);

	const handleDeleteServer = async () => {
		try {
			setIsLoading(true);
			const url = qs.stringifyUrl({
				url: `/api/channels/${data?.channel?.id}`,
				query: { serverId: data?.server?.id},
			});
			await axios.delete(url);
			onClose();
			router.refresh();
			router.push(`/servers/${data?.server?.id}`);
		} catch (error: any) {
			console.log(error, "LEAVE SERVER ERROR");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={isModelOpen} onOpenChange={onClose}>
			<DialogContent
				aria-describedby={undefined}
				className="overflow-hidden bg-shell-chat p-0 text-foreground"
			>
				<DialogHeader className="px-6 pt-8">
					<DialogTitle className="text-center text-2xl font-bold">Delete channel</DialogTitle>
					<DialogDescription className="text-center text-shell-muted">
						Are you sure you want to delete{" "}
						<span className="font-semibold text-shell-accent">#{data?.channel?.name}</span>?
					</DialogDescription>
				</DialogHeader>
				<DialogFooter className="bg-shell-nav px-6 py-4">
					<div className="flex w-full items-center justify-between">
						<Button disabled={isLoading} onClick={onClose} variant="ghost">
							Cancel
						</Button>
						<Button disabled={isLoading} onClick={handleDeleteServer} variant="destructive">
							Delete
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
