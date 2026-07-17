import { SignIn } from "@clerk/nextjs";
import { authClerkAppearance } from "@/lib/auth-appearance";

export default function SignInPage() {
	return (
		<div className="space-y-6">
			<div className="hidden space-y-1 lg:block">
				<h2 className="font-[family-name:var(--font-fraunces)] text-2xl tracking-tight text-[#14201F]">
					Welcome back
				</h2>
				<p className="text-sm text-[#5C6B69]">
					Sign in to continue to your study groups.
				</p>
			</div>
			<SignIn
				appearance={authClerkAppearance}
				fallbackRedirectUrl="/"
				signUpUrl="/sign-up"
			/>
		</div>
	);
}
