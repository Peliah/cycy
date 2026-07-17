"use client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { Smile } from "lucide-react";
import { useTheme } from "@wrksz/themes/client";

interface EmojiPickerProps {
	onChange: (value: string) => void;
}

export function EmojiPicker({ onChange }: EmojiPickerProps) {
    const {resolvedTheme} = useTheme();
	return (
		<Popover>
			<PopoverTrigger asChild>
				<button
					type="button"
					className="flex items-center justify-center text-shell-muted transition hover:text-foreground"
					aria-label="Add emoji"
				>
					<Smile size={18} />
				</button>
			</PopoverTrigger>
			<PopoverContent
				side="top"
				align="start"
				sideOffset={12}
				className="mb-2 border-none bg-transparent shadow-none drop-shadow-none"
			>
				<Picker theme={resolvedTheme} data={data} onEmojiSelect={(emoji: any) => onChange(emoji.native)} />
			</PopoverContent>
		</Popover>
	);
}
