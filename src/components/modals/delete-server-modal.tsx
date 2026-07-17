"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOrigin } from "@/hooks/use-origin";
import { useStore } from "@/store/store";
import axios from "axios";
import { Check, Copy, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteServerModal() {
	const router = useRouter();
	const type = useStore.use.type();
	const isOpen = useStore.use.isOpen();
	const onOpen = useStore.use.onOpen();
	const onClose = useStore.use.onClose();
	const data = useStore.use.data();
	const isModelOpen = isOpen && type === "deleteServer";
	const [isLoading, setIsLoading] = useState(false);

	const handleDeleteServer = async () => {
		try {
			setIsLoading(true);
			await axios.delete(`/api/servers/${data?.server?.id}`);
			onClose();
			router.refresh();
			router.push("/");
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
					<DialogTitle className="text-center text-2xl font-bold">Delete group</DialogTitle>
					<DialogDescription className="text-center text-shell-muted">
						Are you sure you want to delete{" "}
						<span className="font-semibold text-shell-accent">{data?.server?.name}</span>?
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
