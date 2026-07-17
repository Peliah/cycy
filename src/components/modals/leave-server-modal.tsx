"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOrigin } from "@/hooks/use-origin";
import { useStore } from "@/store/store";
import axios from "axios";
import { Check, Copy, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function LeaveServerModal() {
  const router = useRouter();
	const type = useStore.use.type();
	const isOpen = useStore.use.isOpen();
	const onOpen = useStore.use.onOpen();
	const onClose = useStore.use.onClose();
	const data = useStore.use.data();
	const isModelOpen = isOpen && type === "leaveServer";
  const [isLoading, setIsLoading] = useState(false);

  const handleLeaveServer = async () => {
    try {
      setIsLoading(true);
      await axios.patch(`/api/servers/${data?.server?.id}/leave`);
      onClose();
      router.refresh();
      router.push("/");
    } catch (error: any) {
      console.log(error, "LEAVE SERVER ERROR");
    }finally{
      setIsLoading(false);
    }
  }

	return (
		<Dialog open={isModelOpen} onOpenChange={onClose}>
			<DialogContent
				aria-describedby={undefined}
				className="overflow-hidden bg-shell-chat p-0 text-foreground"
			>
				<DialogHeader className="px-6 pt-8">
					<DialogTitle className="text-center text-2xl font-bold">Leave group</DialogTitle>
					<DialogDescription className="text-center text-shell-muted">
						Are you sure you want to leave{" "}
						<span className="font-semibold text-shell-accent">{data?.server?.name}</span>?
					</DialogDescription>
				</DialogHeader>
				<DialogFooter className="bg-shell-nav px-6 py-4">
					<div className="flex w-full items-center justify-between">
						<Button disabled={isLoading} onClick={onClose} variant="ghost">
							Cancel
						</Button>
						<Button disabled={isLoading} onClick={handleLeaveServer} variant="destructive">
							Leave
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
