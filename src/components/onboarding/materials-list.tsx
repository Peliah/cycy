"use client";

import { FileText, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	materialDisplayName,
	materialKind,
} from "@/lib/onboarding/materials";
import type { MaterialItem } from "@/lib/onboarding/schema";

type MaterialsListProps = {
	materials: MaterialItem[];
	disabled?: boolean;
	onRemove: (url: string) => void;
};

export function MaterialsList({
	materials,
	disabled,
	onRemove,
}: MaterialsListProps) {
	if (materials.length === 0) return null;

	return (
		<div className="space-y-3">
			<p className="text-xs font-medium uppercase tracking-wide text-[#5C6B69]">
				Added ({materials.length})
			</p>
			<ul className="divide-y divide-[#D5E3E1] overflow-hidden rounded-xl border border-[#D5E3E1] bg-white">
				{materials.map((m) => (
					<li key={m.fileUrl} className="flex items-center gap-3 px-4 py-3">
						<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#E8F3F1] text-[#0A4D4A]">
							<FileText className="size-4" />
						</div>
						<div className="min-w-0 flex-1">
							<p className="truncate text-sm font-medium text-[#14201F]">
								{materialDisplayName(m.fileName)}
							</p>
							<p className="text-xs text-[#5C6B69]">
								{materialKind(m.mimeType, m.fileName)}
							</p>
						</div>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="size-8 shrink-0 text-[#5C6B69] hover:text-[#14201F]"
							onClick={() => onRemove(m.fileUrl)}
							disabled={disabled}
						>
							<X className="size-4" />
							<span className="sr-only">Remove</span>
						</Button>
					</li>
				))}
			</ul>
		</div>
	);
}
