"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Loader2, Upload } from "lucide-react";

import { cn } from "@/lib/utils";
import { MATERIAL_ACCEPT_ATTR } from "@/lib/onboarding/materials";

import { UploadProgressBar } from "./upload-progress-bar";

type MaterialsUploadZoneProps = {
	busy: boolean;
	isUploading: boolean;
	uploadProgress: number;
	uploadingNames: string[];
	onUploadFiles: (files: File[]) => Promise<void>;
};

export function MaterialsUploadZone({
	busy,
	isUploading,
	uploadProgress,
	uploadingNames,
	onUploadFiles,
}: MaterialsUploadZoneProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [isDragging, setIsDragging] = useState(false);

	const openPicker = () => {
		if (!busy) inputRef.current?.click();
	};

	const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(event.target.files ?? []);
		event.target.value = "";
		await onUploadFiles(files);
	};

	const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		setIsDragging(false);
		await onUploadFiles(Array.from(event.dataTransfer.files ?? []));
	};

	return (
		<>
			<div
				role="button"
				tabIndex={0}
				onClick={openPicker}
				onKeyDown={(event) => {
					if (event.key === "Enter" || event.key === " ") {
						event.preventDefault();
						openPicker();
					}
				}}
				onDragEnter={(event) => {
					event.preventDefault();
					setIsDragging(true);
				}}
				onDragOver={(event) => {
					event.preventDefault();
					setIsDragging(true);
				}}
				onDragLeave={(event) => {
					event.preventDefault();
					setIsDragging(false);
				}}
				onDrop={handleDrop}
				className={cn(
					"flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center transition-colors",
					isDragging
						? "border-[#0A4D4A] bg-[#E8F3F1]"
						: "border-[#C5D4D2] bg-white hover:border-[#0A4D4A]/60 hover:bg-[#F4F8F7]",
					busy && "pointer-events-none opacity-70",
				)}
			>
				<div className="flex size-12 items-center justify-center rounded-full bg-[#E8F3F1] text-[#0A4D4A]">
					{isUploading ? (
						<Loader2 className="size-5 animate-spin" />
					) : (
						<Upload className="size-5" />
					)}
				</div>
				<div className="space-y-1">
					<p className="text-sm font-medium text-[#14201F]">
						{isUploading ? "Uploading…" : "Drop a PDF or Word file here"}
					</p>
					<p className="text-sm text-[#5C6B69]">
						{isUploading
							? uploadingNames.join(", ")
							: "or click to browse · PDF, DOCX up to 16MB"}
					</p>
				</div>
				{isUploading && (
					<UploadProgressBar value={uploadProgress} className="w-full max-w-xs space-y-2 pt-2" />
				)}
			</div>
			<input
				ref={inputRef}
				type="file"
				accept={MATERIAL_ACCEPT_ATTR}
				multiple
				className="hidden"
				onChange={handleFileChange}
				disabled={busy}
			/>
		</>
	);
}
