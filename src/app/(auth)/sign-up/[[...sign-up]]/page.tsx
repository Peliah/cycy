import { SignUp } from "@clerk/nextjs";
import { authClerkAppearance } from "@/lib/auth-appearance";

export default function SignUpPage() {
	return (
		<div className="space-y-6">
			<div className="hidden space-y-1 lg:block">
				<h2 className="font-[family-name:var(--font-fraunces)] text-2xl tracking-tight text-[#14201F]">
					Get started
				</h2>
				<p className="text-sm text-[#5C6B69]">
					Create an account to start or join a study group.
				</p>
			</div>
			<SignUp
				appearance={authClerkAppearance}
				fallbackRedirectUrl="/"
				signInUrl="/sign-in"
			/>
		</div>
	);
}
