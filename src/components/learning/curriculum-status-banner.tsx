"use client";

import { Loader2, RefreshCw, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
	fetchLocalCurriculumStatus,
	type LocalCurriculumStatus,
} from "@/lib/cycy/curriculum";
import { invalidateRoadmapCache } from "@/lib/learning/roadmap-client";
import type { CurriculumLifecycleStatus } from "@/lib/cycy/types";

const ENRICH_POLL_MS = 12_000;

async function retryProvision(serverId: string): Promise<void> {
	const res = await fetch(`/api/servers/${serverId}/curriculum/retry-provision`, {
		method: "POST",
		credentials: "include",
	});
	if (!res.ok) {
		const body: unknown = await res.json().catch(() => null);
		const message =
			body &&
			typeof body === "object" &&
			"message" in body &&
			typeof (body as { message: unknown }).message === "string"
				? (body as { message: string }).message
				: `Retry failed (${res.status})`;
		throw new Error(message);
	}
}

export function CurriculumStatusBanner({
	serverId,
	initialStatus,
	initialBootstrapPhase,
	initialContentVersion,
}: {
	serverId: string;
	initialStatus?: CurriculumLifecycleStatus | null;
	initialBootstrapPhase?: string | null;
	initialContentVersion?: number;
}) {
	const router = useRouter();
	const [status, setStatus] = useState<CurriculumLifecycleStatus>(
		initialStatus ?? "PENDING",
	);
	const [bootstrapPhase, setBootstrapPhase] = useState<string | null>(
		initialBootstrapPhase ?? null,
	);
	const [contentVersion, setContentVersion] = useState(
		initialContentVersion ?? 1,
	);
	const [error, setError] = useState<string | null>(null);
	const [dismissed, setDismissed] = useState(
		initialStatus === "READY" && !initialBootstrapPhase,
	);
	const [retrying, setRetrying] = useState(false);
	const contentVersionRef = useRef(contentVersion);
	contentVersionRef.current = contentVersion;

	const isEnriching = bootstrapPhase === "ENRICHING";
	const isLegacyFailed = status === "FAILED";

	useEffect(() => {
		if (dismissed) return;
		if (!isEnriching && !isLegacyFailed) return;

		const controller = new AbortController();
		let cancelled = false;

		const applyLocal = (latest: LocalCurriculumStatus) => {
			setStatus(latest.status);
			setBootstrapPhase(latest.bootstrapPhase);
			setContentVersion(latest.contentVersion);

			if (
				latest.contentVersion !== contentVersionRef.current &&
				latest.status === "READY"
			) {
				invalidateRoadmapCache(serverId);
				router.refresh();
			}

			if (latest.status === "READY" && !latest.bootstrapPhase) {
				setDismissed(true);
			}
		};

		const poll = async () => {
			try {
				const latest = await fetchLocalCurriculumStatus(serverId);
				if (cancelled) return;
				applyLocal(latest);
				setError(null);
			} catch (err) {
				if (cancelled || controller.signal.aborted) return;
				setError(
					err instanceof Error ? err.message : "Could not load curriculum status",
				);
			}
		};

		void poll();

		const timer = window.setInterval(() => {
			void poll();
		}, ENRICH_POLL_MS);

		controller.signal.addEventListener(
			"abort",
			() => {
				window.clearInterval(timer);
			},
			{ once: true },
		);

		return () => {
			cancelled = true;
			controller.abort();
			window.clearInterval(timer);
		};
	}, [serverId, dismissed, isEnriching, isLegacyFailed, router]);

	const onRetry = async () => {
		setRetrying(true);
		setError(null);
		try {
			await retryProvision(serverId);
			invalidateRoadmapCache(serverId);
			router.refresh();
			setDismissed(true);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Retry failed");
		} finally {
			setRetrying(false);
		}
	};

	if (dismissed || (status === "READY" && !bootstrapPhase)) {
		return null;
	}

	if (isEnriching) {
		return (
			<div
				className="flex items-start gap-3 border-b border-[#D5E3E0] bg-[#E8F2F1] px-4 py-3 text-sm text-[#14201F]"
				role="status"
				aria-live="polite"
			>
				<Sparkles className="mt-0.5 size-4 shrink-0 text-[#0A4D4A]" />
				<div className="min-w-0 flex-1">
					<p className="font-medium">Enhancing your syllabus from your materials…</p>
					<p className="mt-0.5 text-[#5C6B69]">
						Your starter roadmap is ready — we&apos;re upgrading it in the
						background. You can keep studying now.
					</p>
				</div>
				<Loader2 className="size-4 shrink-0 animate-spin text-[#0A4D4A]" />
			</div>
		);
	}

	if (isLegacyFailed) {
		return (
			<div
				className="flex items-start gap-3 border-b border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
				role="status"
				aria-live="polite"
			>
				<div className="min-w-0 flex-1">
					<p className="font-medium">Curriculum setup failed</p>
					<p className="mt-0.5 text-rose-800/80">
						{error ?? "Tap Retry to rebuild your learning path."}
					</p>
				</div>
				<div className="flex shrink-0 items-center gap-1">
					<Button
						type="button"
						size="sm"
						variant="outline"
						className="h-8 border-rose-300 bg-white text-rose-900 hover:bg-rose-100"
						onClick={() => void onRetry()}
						disabled={retrying}
					>
						{retrying ? (
							<Loader2 className="mr-1.5 size-3.5 animate-spin" />
						) : (
							<RefreshCw className="mr-1.5 size-3.5" />
						)}
						Retry
					</Button>
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
				</div>
			</div>
		);
	}

	return null;
}
