"use client";

import { Button } from "@/components/ui/button";
import type { CertificateCardProps } from "@/types/learning";
import { Award, Copy, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function CertificateCard({
	serverName,
	certificate,
}: CertificateCardProps) {
	const [copied, setCopied] = useState(false);
	const verifyPath = `/certificates/${certificate.verificationCode}`;

	const copyCode = async () => {
		try {
			await navigator.clipboard.writeText(certificate.verificationCode);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 2000);
		} catch {
			// ignore
		}
	};

	return (
		<div className="rounded-xl border border-[#0A4D4A]/25 bg-gradient-to-br from-[#E8F2F1] to-shell-chat p-5">
			<div className="flex items-start gap-3">
				<span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#0A4D4A] text-white">
					<Award className="size-5" aria-hidden />
				</span>
				<div className="min-w-0 flex-1 space-y-2">
					<p className="font-display text-lg text-[#0A4D4A]">Certificate</p>
					<p className="text-sm text-shell-muted">
						Issued for{" "}
						<span className="font-medium text-foreground">
							{serverName ?? "this group"}
						</span>{" "}
						on {new Date(certificate.issuedAt).toLocaleDateString()}.
					</p>
					<p className="font-mono text-sm tracking-wide text-foreground">
						{certificate.verificationCode}
					</p>
					<div className="flex flex-wrap gap-2 pt-1">
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="gap-1.5"
							onClick={() => void copyCode()}
						>
							<Copy className="size-3.5" />
							{copied ? "Copied" : "Copy code"}
						</Button>
						<Button asChild size="sm" className="gap-1.5 bg-[#0A4D4A] hover:bg-[#0A4D4A]/90">
							<Link href={verifyPath} target="_blank" rel="noreferrer">
								<ExternalLink className="size-3.5" />
								Verify page
							</Link>
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
