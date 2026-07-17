"use client";

import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Search } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ServerSearchProps {
	data: {
		label: string;
		type: "channel" | "member";
		data:
			| {
					icon: React.ReactNode;
					id: string;
					name: string;
			  }[]
			| undefined;
	}[];
}

export function ServerSearch({ data }: ServerSearchProps) {
	const [open, setOpen] = useState(false);
	const router = useRouter();
	const params = useParams();

	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setOpen((open) => !open);
			}
		};

		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, []);

	const onClick = ({
		id,
		type,
	}: {
		id: string;
		type: "channel" | "member";
	}) => {
		setOpen(false);
		if (type === "channel") {
			router.push(`/servers/${params?.serverId}/channels/${id}`);
		} else if (type === "member") {
			router.push(`/servers/${params?.serverId}/conversations/${id}`);
		}
	};

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="group flex w-full items-center gap-x-2 rounded-md border border-shell-border bg-shell-chat px-2.5 py-2 transition hover:bg-shell-hover"
			>
				<Search className="size-4 text-shell-muted" />
				<p className="text-sm font-medium text-shell-muted transition group-hover:text-foreground">
					Search
				</p>
				<kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border border-shell-border bg-shell-nav px-1.5 font-mono text-[10px] font-medium text-shell-muted">
					<span className="text-xs">⌘</span>K
				</kbd>
			</button>
			<CommandDialog open={open} onOpenChange={setOpen}>
				<CommandInput placeholder="Search for channels or members" />
				<CommandList>
					<CommandEmpty>No results found</CommandEmpty>
					{data.map(({ label, type, data: items }) => {
						if (!items?.length) return null;
						return (
							<CommandGroup key={label} heading={label}>
								{items.map(({ icon, id, name }) => (
									<CommandItem
										className="cursor-pointer"
										onSelect={() => onClick({ id, type })}
										key={id}
									>
										{icon}
										<span>{name}</span>
									</CommandItem>
								))}
							</CommandGroup>
						);
					})}
				</CommandList>
			</CommandDialog>
		</>
	);
}
