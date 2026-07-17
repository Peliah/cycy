"use client";

import { cn } from "@/lib/utils";
import { getUploadedFileUrl, useUploadThing } from "@/lib/uploadthing";
import { Camera, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const SIZE = 96;
const STROKE = 3;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface ServerAvatarPickerProps {
	value?: string;
	onChange: (url: string) => void;
	onUploadingChange?: (isUploading: boolean) => void;
	onError?: (message: string) => void;
	disabled?: boolean;
}

export function ServerAvatarPicker({
	value = "",
	onChange,
	onUploadingChange,
	onError,
	disabled,
}: ServerAvatarPickerProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const localPreviewRef = useRef<string | null>(null);
	const [localPreview, setLocalPreview] = useState<string | null>(null);
	const [progress, setProgress] = useState(0);

	const clearLocalPreview = () => {
		if (localPreviewRef.current) {
			URL.revokeObjectURL(localPreviewRef.current);
			localPreviewRef.current = null;
		}
		setLocalPreview(null);
	};

	const { startUpload, isUploading } = useUploadThing("serverImage", {
		onUploadProgress: (p) => setProgress(p),
		onUploadError: (error) => {
			clearLocalPreview();
			onChange("");
			onError?.(error.message);
		},
	});

	useEffect(() => {
		onUploadingChange?.(isUploading);
	}, [isUploading, onUploadingChange]);

	useEffect(() => {
		return () => {
			if (localPreviewRef.current) {
				URL.revokeObjectURL(localPreviewRef.current);
			}
		};
	}, []);

	const handlePick = () => {
		if (disabled || isUploading) return;
		inputRef.current?.click();
	};

	const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		event.target.value = "";
		if (!file) return;

		if (!file.type.startsWith("image/")) {
			onError?.("Please choose an image file");
			return;
		}

		onError?.("");

		clearLocalPreview();
		const objectUrl = URL.createObjectURL(file);
		localPreviewRef.current = objectUrl;
		setLocalPreview(objectUrl);
		setProgress(0);

		try {
			const result = await startUpload([file]);
			if (!result) return;

			const url = getUploadedFileUrl(result);
			if (!url) {
				throw new Error("Upload finished but no image URL was returned");
			}

			onChange(url);
			clearLocalPreview();
		} catch (error) {
			clearLocalPreview();
			onChange("");
			onError?.(error instanceof Error ? error.message : "Upload failed");
		} finally {
			setProgress(0);
		}
	};

	const handleRemove = (event: React.MouseEvent) => {
		event.stopPropagation();
		if (disabled || isUploading) return;
		onChange("");
		onError?.("");
		clearLocalPreview();
	};

	const previewSrc = value || localPreview;
	const showProgress = isUploading && !value;

	return (
		<div className="flex flex-col items-center gap-2">
			<button
				type="button"
				onClick={handlePick}
				disabled={disabled || isUploading}
				className={cn(
					"group relative rounded-full outline-none transition-opacity",
					(disabled || isUploading) && "cursor-not-allowed opacity-80",
					!disabled && !isUploading && "cursor-pointer hover:opacity-90",
				)}
				aria-label={previewSrc ? "Change server icon" : "Upload server icon"}
			>
				<div
					className="relative overflow-hidden rounded-full bg-zinc-100 ring-2 ring-zinc-200 ring-offset-2 ring-offset-white"
					style={{ width: SIZE, height: SIZE }}
				>
					{previewSrc ? (
						<Image
							src={previewSrc}
							alt="Server icon preview"
							fill
							className="object-cover"
							unoptimized
						/>
					) : (
						<div className="flex h-full w-full flex-col items-center justify-center gap-1 text-zinc-400">
							<Camera className="h-7 w-7" />
							<span className="text-[10px] font-semibold uppercase tracking-wide">Upload</span>
						</div>
					)}

					{showProgress && (
						<div className="absolute inset-0 flex items-center justify-center bg-black/40">
							<span className="text-xs font-semibold text-white">{progress}%</span>
						</div>
					)}

					{!disabled && !isUploading && previewSrc && (
						<div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity group-hover:bg-black/40 group-hover:opacity-100">
							<Camera className="h-6 w-6 text-white" />
						</div>
					)}
				</div>

				{showProgress && (
					<svg
						className="pointer-events-none absolute inset-0 -rotate-90"
						width={SIZE}
						height={SIZE}
						aria-hidden
					>
						<circle
							cx={SIZE / 2}
							cy={SIZE / 2}
							r={RADIUS}
							fill="none"
							stroke="currentColor"
							strokeWidth={STROKE}
							className="text-zinc-200"
						/>
						<circle
							cx={SIZE / 2}
							cy={SIZE / 2}
							r={RADIUS}
							fill="none"
							stroke="currentColor"
							strokeWidth={STROKE}
							strokeLinecap="round"
							className="text-indigo-500 transition-[stroke-dashoffset] duration-150"
							strokeDasharray={CIRCUMFERENCE}
							strokeDashoffset={CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE}
						/>
					</svg>
				)}

				{previewSrc && !isUploading && !disabled && (
					<span
						role="button"
						tabIndex={0}
						onClick={handleRemove}
						onKeyDown={(event) => {
							if (event.key === "Enter" || event.key === " ") {
								event.preventDefault();
								handleRemove(event as unknown as React.MouseEvent);
							}
						}}
						className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white shadow-sm hover:bg-rose-700"
						aria-label="Remove server icon"
					>
						<X className="h-3.5 w-3.5" />
					</span>
				)}
			</button>

			<input
				ref={inputRef}
				type="file"
				accept="image/*"
				className="hidden"
				onChange={handleFileChange}
				disabled={disabled || isUploading}
			/>

			<p className="text-xs text-zinc-500">
				{isUploading ? "Uploading..." : previewSrc ? "Click to change" : "Click to upload an icon"}
			</p>
		</div>
	);
}
