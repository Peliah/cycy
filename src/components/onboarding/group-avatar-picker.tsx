"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Camera, Loader2, RefreshCw } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
	DICEBEAR_STYLES,
	dicebearUrl,
	randomDicebearSeeds,
	type DicebearStyleId,
} from "@/lib/onboarding/dicebear";
import { cn } from "@/lib/utils";
import { getUploadedFileUrl, useUploadThing } from "@/lib/uploadthing";

type GroupAvatarPickerProps = {
	value?: string;
	seedHint?: string;
	disabled?: boolean;
	onChange: (url: string) => void;
	onUploadingChange?: (uploading: boolean) => void;
	onError?: (message: string | null) => void;
};

function isDicebearUrl(url: string) {
	return url.includes("api.dicebear.com");
}

export function GroupAvatarPicker({
	value = "",
	seedHint,
	disabled,
	onChange,
	onUploadingChange,
	onError,
}: GroupAvatarPickerProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const localPreviewRef = useRef<string | null>(null);
	const [localPreview, setLocalPreview] = useState<string | null>(null);
	const [progress, setProgress] = useState(0);
	const [style, setStyle] = useState<DicebearStyleId>("lorelei");
	const [seeds, setSeeds] = useState(() => randomDicebearSeeds(7, seedHint));

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
			onError?.(error.message || "Upload failed");
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

	const busy = disabled || isUploading;
	const customPreview = localPreview || (value && !isDicebearUrl(value) ? value : "");
	const customSelected = Boolean(customPreview && value === customPreview);

	const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		event.target.value = "";
		if (!file || busy) return;

		if (!file.type.startsWith("image/")) {
			onError?.("Please choose an image file");
			return;
		}

		onError?.(null);
		clearLocalPreview();
		const objectUrl = URL.createObjectURL(file);
		localPreviewRef.current = objectUrl;
		setLocalPreview(objectUrl);
		setProgress(0);

		try {
			const result = await startUpload([file]);
			const url = getUploadedFileUrl(result);
			if (!url) throw new Error("Upload finished but no image URL was returned");
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

	return (
		<div className="space-y-3">
			<div>
				<p className="text-sm font-medium text-[#14201F]">Group avatar</p>
				<p className="mt-0.5 text-sm text-[#5C6B69]">
					Pick a generated look, or upload your own.
				</p>
			</div>

			<div className="flex flex-wrap gap-2">
				{DICEBEAR_STYLES.map((item) => (
					<button
						key={item.id}
						type="button"
						disabled={busy}
						onClick={() => {
							setStyle(item.id);
							setSeeds(randomDicebearSeeds(7, seedHint));
						}}
						className={cn(
							"rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
							style === item.id
								? "border-[#0A4D4A] bg-[#0A4D4A] text-white"
								: "border-[#C5D4D2] bg-white text-[#5C6B69] hover:border-[#0A4D4A]/50 hover:text-[#0A4D4A]",
						)}
					>
						{item.label}
					</button>
				))}
			</div>

			<div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
				{seeds.map((seed) => {
					const url = dicebearUrl(style, seed);
					const selected = value === url;
					return (
						<button
							key={seed}
							type="button"
							disabled={busy}
							onClick={() => {
								onError?.(null);
								onChange(url);
							}}
							className={cn(
								"relative aspect-square overflow-hidden rounded-xl border bg-[#F4F8F7] transition-all",
								selected
									? "border-[#0A4D4A] ring-2 ring-[#0A4D4A]/30"
									: "border-[#D5E3E1] hover:border-[#0A4D4A]/50",
							)}
							aria-label="Select generated avatar"
							aria-pressed={selected}
						>
							<Image
								src={url}
								alt=""
								fill
								unoptimized
								className="object-cover"
							/>
						</button>
					);
				})}

				<button
					type="button"
					disabled={busy}
					onClick={() => inputRef.current?.click()}
					className={cn(
						"relative aspect-square overflow-hidden rounded-xl border transition-all",
						customSelected
							? "border-[#0A4D4A] ring-2 ring-[#0A4D4A]/30"
							: "border-dashed border-[#C5D4D2] bg-white hover:border-[#0A4D4A]/60 hover:bg-[#F4F8F7]",
					)}
					aria-label="Upload your own avatar"
					aria-pressed={customSelected}
				>
					{isUploading ? (
						<div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-[#E8F3F1] text-[#0A4D4A]">
							<Loader2 className="size-4 animate-spin" />
							<span className="text-[10px] font-medium tabular-nums">
								{progress}%
							</span>
						</div>
					) : customPreview ? (
						<Image
							src={customPreview}
							alt="Uploaded avatar"
							fill
							unoptimized
							className="object-cover"
						/>
					) : (
						<div className="flex h-full w-full flex-col items-center justify-center gap-1 text-[#5C6B69]">
							<Camera className="size-5" />
							<span className="text-[10px] font-medium">Upload</span>
						</div>
					)}
				</button>
			</div>

			<input
				ref={inputRef}
				type="file"
				accept="image/*"
				className="hidden"
				disabled={busy}
				onChange={handleFileChange}
			/>

			<div className="flex items-center justify-between gap-3">
				<p className="text-xs text-[#5C6B69]">
					Avatars by{" "}
					<a
						href="https://www.dicebear.com/"
						target="_blank"
						rel="noreferrer"
						className="underline underline-offset-2 hover:text-[#0A4D4A]"
					>
						DiceBear
					</a>
				</p>
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={busy}
					onClick={() => setSeeds(randomDicebearSeeds(7, seedHint))}
					className="h-8 border-[#C5D4D2] text-[#0A4D4A] hover:bg-[#F4F8F7]"
				>
					<RefreshCw className="mr-1.5 size-3.5" />
					Shuffle
				</Button>
			</div>
		</div>
	);
}
