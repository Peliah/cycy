"use client";

import { CreateDetailsStep } from "./create-details-step";
import { CreateMaterialsStep } from "./create-materials-step";
import { JoinInviteStep } from "./join-invite-step";
import { OnboardingProgress } from "./onboarding-progress";
import { PathStep } from "./path-step";
import { useOnboardingWizard } from "@/hooks/use-onboarding-wizard";

export function OnboardingWizard() {
	const wizard = useOnboardingWizard();

	return (
		<div className="mx-auto w-full max-w-2xl">
			<OnboardingProgress
				stepLabel={wizard.stepLabel}
				progress={wizard.progress}
				canGoBack={wizard.canGoBack}
				onBack={wizard.goBack}
			/>

			{wizard.error && (
				<p
					role="alert"
					className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
				>
					{wizard.error}
				</p>
			)}

			{wizard.path === null && (
				<PathStep
					onSelectCreate={wizard.selectCreate}
					onSelectJoin={wizard.selectJoin}
				/>
			)}

			{wizard.path === "create" && wizard.createStep === "details" && (
				<CreateDetailsStep
					form={wizard.createForm}
					onContinue={wizard.continueFromDetails}
				/>
			)}

			{wizard.path === "create" && wizard.createStep === "materials" && (
				<CreateMaterialsStep
					form={wizard.createForm}
					materials={wizard.materials}
					isSubmitting={wizard.isCreateLoading}
					onAddMaterials={wizard.addMaterials}
					onRemoveMaterial={wizard.removeMaterial}
					onUploadError={wizard.setError}
					onSubmit={wizard.submitCreate}
				/>
			)}

			{wizard.path === "join" && wizard.joinStep === "invite" && (
				<JoinInviteStep
					form={wizard.joinForm}
					isSubmitting={wizard.isJoinLoading}
					onSubmit={wizard.submitJoin}
				/>
			)}
		</div>
	);
}
