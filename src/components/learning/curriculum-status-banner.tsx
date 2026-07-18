"use client";

import { Loader2, RefreshCw, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
	bootstrapCurriculumRequest,
	fetchCurriculum,
	isTerminalCurriculumStatus,
} from "@/lib/cycy/curriculum";
import type { CurriculumLifecycleStatus } from "@/lib/cycy/types";
import { cn } from "@/lib/utils";

const POLL_MS = 2500;

export function CurriculumStatusBanner({
	serverId,
	initialStatus,
}: {
	serverId: string;
	initialStatus?: CurriculumLifecycleStatus | null;
}) {
	const [status, setStatus] = useState<CurriculumLifecycleStatus>(
		initialStatus ?? "PENDING",
	);
	const [summary, setSummary] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [dismissed, setDismissed] = useState(initialStatus === "READY");
	const [retryNonce, setRetryNonce] = useState(0);

	useEffect(() => {
		if (dismissed) return;

		const controller = new AbortController();
		let cancelled = false;

		const run = async () => {
			try {
				let latest = await fetchCurriculum(serverId);
				if (cancelled) return;

				setStatus(latest.status);
				setSummary(latest.summary);
				setError(null);

				if (latest.status === "READY") {
					setDismissed(true);
					return;
				}

				if (latest.status === "PENDING" || latest.status === "FAILED") {
					try {
						await bootstrapCurriculumRequest(serverId);
						latest = await fetchCurriculum(serverId);
						if (cancelled) return;
						setStatus(latest.status);
						setSummary(latest.summary);
						if (latest.status === "READY") {
							setDismissed(true);
							return;
						}
					} catch (bootError) {
						if (!cancelled && latest.status === "PENDING") {
							setError(
								bootError instanceof Error
									? bootError.message
									: "Could not start curriculum generation",
							);
						}
					}
				}

				while (
					!cancelled &&
					!controller.signal.aborted &&
					!isTerminalCurriculumStatus(latest.status)
				) {
					await new Promise<void>((resolve, reject) => {
						const timer = window.setTimeout(() => resolve(), POLL_MS);
						controller.signal.addEventListener(
							"abort",
							() => {
								window.clearTimeout(timer);
								reject(new DOMException("Aborted", "AbortError"));
							},
							{ once: true },
						);
					});
					latest = await fetchCurriculum(serverId);
					if (cancelled) return;
					setStatus(latest.status);
					setSummary(latest.summary);
					setError(null);
					if (latest.status === "READY") {
						setDismissed(true);
						return;
					}
				}
			} catch (err) {
				if (cancelled || controller.signal.aborted) return;
				if (err instanceof DOMException && err.name === "AbortError") return;
				setError(
					err instanceof Error
						? err.message
						: "Could not load curriculum status",
				);
			}
		};

		void run();
		return () => {
			cancelled = true;
			controller.abort();
		};
	}, [serverId, dismissed, retryNonce]);

	const onRetry = () => {
		setDismissed(false);
		setStatus("PENDING");
		setError(null);
		setRetryNonce((n) => n + 1);
	};

	if (dismissed || status === "READY") {
		return null;
	}

	const isFailed = status === "FAILED";
	const isBusy = status === "PENDING" || status === "GENERATING";

	return (
		<div
			className={cn(
				"flex items-start gap-3 border-b px-4 py-3 text-sm",
				isFailed
					? "border-rose-200 bg-rose-50 text-rose-900"
					: "border-[#D5E3E0] bg-[#E8F2F1] text-[#14201F]",
			)}
			role="status"
			aria-live="polite"
		>
			{isBusy && (
				<Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-[#0A4D4A]" />
			)}
			<div className="min-w-0 flex-1">
				<p className="font-medium">
					{isFailed
						? "Curriculum generation failed"
						: status === "GENERATING"
							? "Building your learning roadmap…"
							: "Starting curriculum generation…"}
				</p>
				<p className="mt-0.5 text-[#5C6B69]">
					{error ??
						summary ??
						(isFailed
							? "You can retry, or keep chatting while we sort this out."
							: "This usually takes a minute. You can keep using the group.")}
				</p>
			</div>
			<div className="flex shrink-0 items-center gap-1">
				{isFailed && (
					<Button
						type="button"
						size="sm"
						variant="outline"
						className="h-8 border-rose-300 bg-white text-rose-900 hover:bg-rose-100"
						onClick={onRetry}
					>
						<RefreshCw className="mr-1.5 size-3.5" />
						Retry
					</Button>
				)}
				{isFailed && (
					<Button
						type="button"
						size="icon"
						variant="ghost"
						className="size-8 text-rose-800 hover:bg-rose-100"
						aria-label="Dismiss"
						onClick={() => setDismissed(true)}
					>
						<X className="size-4" />
					</Button>
				)}
			</div>
		</div>
	);
}
