"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { UploadProgressBar } from "./upload-progress-bar";

type MaterialsPasteNotesProps = {
	busy: boolean;
	isAddingNotes: boolean;
	uploadProgress: number;
	onUploadNotes: (text: string) => Promise<boolean>;
};

export function MaterialsPasteNotes({
	busy,
	isAddingNotes,
	uploadProgress,
	onUploadNotes,
}: MaterialsPasteNotesProps) {
	const [notes, setNotes] = useState("");

	const handleAddNotes = async () => {
		const ok = await onUploadNotes(notes);
		if (ok) setNotes("");
	};

	return (
		<div className="space-y-4">
			<Textarea
				value={notes}
				onChange={(event) => setNotes(event.target.value)}
				placeholder="Paste syllabus notes, key topics, or anything you want the roadmap built from…"
				rows={8}
				disabled={busy}
				className="resize-none border-[#C5D4D2] bg-white text-[#14201F] placeholder:text-[#5C6B69]/70"
			/>
			{isAddingNotes && (
				<UploadProgressBar
					value={uploadProgress}
					label={`Saving notes… ${uploadProgress}%`}
					className="w-full space-y-2"
				/>
			)}
			<div className="flex justify-end">
				<Button
					type="button"
					variant="outline"
					disabled={busy || !notes.trim()}
					onClick={handleAddNotes}
					className="h-10 border-[#C5D4D2] text-[#0A4D4A] hover:bg-[#F4F8F7] hover:text-[#083D3B]"
				>
					{isAddingNotes ? (
						<>
							<Loader2 className="mr-2 size-4 animate-spin" />
							Saving…
						</>
					) : (
						"Add notes"
					)}
				</Button>
			</div>
		</div>
	);
}
