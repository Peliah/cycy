"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOrigin } from "@/hooks/use-origin";
import { useStore } from "@/store/store";
import axios from "axios";
import { Check, Copy, RefreshCw } from "lucide-react";
import { useState } from "react";

export function InviteModal() {
	const type = useStore.use.type();
	const isOpen = useStore.use.isOpen();
	const onOpen = useStore.use.onOpen();
	const onClose = useStore.use.onClose();
	const data = useStore.use.data();
	const isModelOpen = isOpen && type === "invite";
	const origin = useOrigin();

	const [copied, setCopied] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const onCopy = () => {
		navigator.clipboard.writeText(inviteUrl);
		setCopied(true);
		setTimeout(() => {
			setCopied(false);
		}, 1000);
	};

	const onGenerate = async () => {
		try {
			setIsLoading(true);
			const res = await axios.patch(`/api/servers/${data?.server?.id}/invite-code`);
			onOpen("invite", { server: res.data });
		} catch (error) {
			console.log(error);
		} finally {
			setIsLoading(false);
		}
	};

	const inviteUrl = `${origin}/invite/${data?.server?.inviteCode}`;

	return (
		<Dialog open={isModelOpen} onOpenChange={onClose}>
			<DialogContent
				aria-describedby={undefined}
				className="overflow-hidden bg-shell-chat p-0 text-foreground"
			>
				<DialogHeader className="px-6 pt-8">
					<DialogTitle className="text-center text-2xl font-bold">
						Invite people
					</DialogTitle>
				</DialogHeader>
				<div className="p-6">
					<Label className="text-xs font-bold uppercase text-shell-muted">
						Group invite link
					</Label>
					<div className="mt-2 flex items-center gap-x-2">
						<Input
							aria-readonly
							readOnly
							disabled={isLoading}
							className="border-shell-border bg-shell-nav text-foreground focus-visible:ring-shell-accent"
							value={inviteUrl}
						/>
						<Button disabled={isLoading} onClick={onCopy} size="icon" variant="primary">
							{copied ? <Check className="size-4" /> : <Copy className="size-4" />}
						</Button>
					</div>
					<Button
						onClick={onGenerate}
						disabled={isLoading}
						variant="link"
						size="sm"
						className="mt-4 text-sm text-shell-muted"
					>
						Generate a new link
						<RefreshCw className="ml-2 size-4" />
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
