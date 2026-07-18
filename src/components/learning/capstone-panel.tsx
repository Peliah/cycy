"use client";

import { CertificateCard } from "@/components/learning/certificate-card";
import { FinalExamDialog } from "@/components/learning/final-exam-dialog";
import { MockInterviewCard } from "@/components/learning/mock-interview-card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type {
	CapstonePanelProps,
	CapstoneSnapshot,
	FinalExamCertificate,
} from "@/types/learning";
import { ClipboardCheck, Lock } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export function CapstonePanel({ serverId }: CapstonePanelProps) {
	const [data, setData] = useState<CapstoneSnapshot | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [examOpen, setExamOpen] = useState(false);
	const [localCert, setLocalCert] = useState<FinalExamCertificate | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const res = await fetch(`/api/servers/${serverId}/learn/capstone`);
			if (!res.ok) throw new Error("Could not load capstone");
			const json = (await res.json()) as CapstoneSnapshot;
			setData(json);
			setLocalCert(json.certificate);
			setError(null);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to load");
		} finally {
			setLoading(false);
		}
	}, [serverId]);

	useEffect(() => {
		void load();
	}, [load]);

	const certificate = localCert ?? data?.certificate ?? null;
	const modulesComplete = data?.modulesComplete ?? false;
	const canTakeExam =
		modulesComplete && data?.hasFinalExam && !certificate;

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<div className="border-b border-shell-border px-4 py-3">
				<h2 className="font-display text-lg text-[#0A4D4A]">Capstone</h2>
				<p className="text-sm text-shell-muted">
					Final exam, certificate, and mock interview.
				</p>
			</div>
			<ScrollArea className="min-h-0 flex-1 px-4 py-5">
				<div className="mx-auto flex max-w-lg flex-col gap-4">
					{error && <p className="text-sm text-rose-600">{error}</p>}
					{loading && !data && (
						<p className="text-sm text-shell-muted">Loading…</p>
					)}

					{data && (
						<>
							<div className="rounded-xl border border-shell-border bg-shell-chat p-5">
								<div className="flex items-start gap-3">
									<span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#E8F2F1] text-[#0A4D4A]">
										{modulesComplete ? (
											<ClipboardCheck className="size-5" aria-hidden />
										) : (
											<Lock className="size-5" aria-hidden />
										)}
									</span>
									<div className="min-w-0 flex-1 space-y-2">
										<p className="font-display text-lg text-[#0A4D4A]">
											Final exam
										</p>
										{!modulesComplete ? (
											<p className="text-sm text-shell-muted">
												Complete every module (and its gate quiz) to unlock
												the final exam.
											</p>
										) : !data.hasFinalExam ? (
											<p className="text-sm text-shell-muted">
												No final exam is published for this curriculum yet.
											</p>
										) : certificate ? (
											<p className="text-sm text-[#0A4D4A]">
												Exam passed. Your certificate is below.
											</p>
										) : (
											<>
												<p className="text-sm text-shell-muted">
													You’re ready. Take the final exam to earn your
													certificate.
												</p>
												<Button
													type="button"
													className="bg-[#0A4D4A] hover:bg-[#0A4D4A]/90"
													onClick={() => setExamOpen(true)}
												>
													Take final exam
												</Button>
											</>
										)}
										{data.nest && (
											<p className="text-xs text-shell-muted">
												Nest: {data.nest.rank} · score{" "}
												{Math.round(data.nest.courseScore)}
												{data.nest.goalMet != null
													? ` · goal ${data.nest.goalMet ? "met" : "not met"}`
													: ""}
											</p>
										)}
									</div>
								</div>
							</div>

							{certificate && (
								<CertificateCard
									serverName={data.serverName}
									certificate={certificate}
								/>
							)}

							<MockInterviewCard
								serverId={serverId}
								agentHandle={data.agentHandle}
								interviewStatus={data.nest?.interviewStatus ?? null}
								certificateStage={data.nest?.certificateStage ?? null}
								modulesComplete={modulesComplete}
								hasLocalCertificate={Boolean(certificate)}
							/>
						</>
					)}
				</div>
			</ScrollArea>

			{canTakeExam && (
				<FinalExamDialog
					open={examOpen}
					onOpenChange={setExamOpen}
					serverId={serverId}
					onPassed={() => {
						void load();
					}}
				/>
			)}
		</div>
	);
}
