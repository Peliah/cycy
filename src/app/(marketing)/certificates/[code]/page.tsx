import { prisma } from "@/lib/prismadb";
import { Award } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface CertificatePageProps {
	params: Promise<{ code: string }>;
}

export default async function CertificateVerifyPage({
	params,
}: CertificatePageProps) {
	const { code } = await params;
	const normalized = code.trim().toUpperCase();

	const certificate = await prisma.certificate.findUnique({
		where: { verificationCode: normalized },
		select: {
			issuedAt: true,
			verificationCode: true,
			profile: { select: { name: true } },
			finalExam: {
				select: {
					curriculum: {
						select: {
							server: { select: { name: true } },
						},
					},
				},
			},
		},
	});

	if (!certificate) {
		notFound();
	}

	const groupName =
		certificate.finalExam.curriculum.server.name ?? "a Cycy study group";

	return (
		<main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
			<div className="rounded-2xl border border-[#0A4D4A]/20 bg-white p-8 shadow-sm sm:p-12">
				<div className="mb-8 flex items-center gap-3">
					<span className="flex size-12 items-center justify-center rounded-full bg-[#0A4D4A] text-white">
						<Award className="size-6" aria-hidden />
					</span>
					<div>
						<p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0A4D4A]/70">
							Verified certificate
						</p>
						<p className="font-display text-2xl text-[#0A4D4A]">Cycy</p>
					</div>
				</div>

				<p className="font-display text-3xl leading-tight text-[#14201F]">
					{certificate.profile.name}
				</p>
				<p className="mt-3 text-base leading-relaxed text-[#14201F]/75">
					completed the learning path in{" "}
					<span className="font-semibold text-[#14201F]">{groupName}</span> and
					passed the final examination.
				</p>

				<dl className="mt-8 space-y-3 border-t border-[#0A4D4A]/15 pt-6 text-sm">
					<div className="flex justify-between gap-4">
						<dt className="text-[#14201F]/55">Issued</dt>
						<dd className="font-medium text-[#14201F]">
							{certificate.issuedAt.toLocaleDateString(undefined, {
								year: "numeric",
								month: "long",
								day: "numeric",
							})}
						</dd>
					</div>
					<div className="flex justify-between gap-4">
						<dt className="text-[#14201F]/55">Verification code</dt>
						<dd className="font-mono font-medium tracking-wide text-[#14201F]">
							{certificate.verificationCode}
						</dd>
					</div>
				</dl>
			</div>

			<p className="mt-8 text-center text-sm text-[#14201F]/55">
				<Link href="/" className="underline-offset-4 hover:underline">
					Back to Cycy
				</Link>
			</p>
		</main>
	);
}
