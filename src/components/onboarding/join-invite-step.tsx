"use client";

import type { FormEvent } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import type { JoinGroupValues } from "@/lib/onboarding/schema";
import { StepHeading } from "./step-heading";

type JoinInviteStepProps = {
	form: UseFormReturn<JoinGroupValues>;
	isSubmitting: boolean;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function JoinInviteStep({
	form,
	isSubmitting,
	onSubmit,
}: JoinInviteStepProps) {
	return (
		<section className="animate-in fade-in slide-in-from-bottom-2 duration-500">
			<StepHeading
				title="Enter your invite"
				description="Paste the invite code or the full invite link. The group's goal and materials are already set."
			/>

			<Form {...form}>
				<form className="mt-10 space-y-6" onSubmit={onSubmit}>
					<FormField
						control={form.control}
						name="inviteCode"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-[#14201F]">Invite code</FormLabel>
								<FormControl>
									<Input
										placeholder="Paste invite code or link"
										className="h-11 border-[#C5D4D2] bg-white"
										disabled={isSubmitting}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<div className="flex justify-end pt-2">
						<Button
							type="submit"
							disabled={isSubmitting}
							className="h-11 bg-[#0A4D4A] px-6 text-white hover:bg-[#083D3B]"
						>
							{isSubmitting ? (
								<>
									<Loader2 className="mr-2 size-4 animate-spin" />
									Joining…
								</>
							) : (
								<>
									Join group
									<ArrowRight className="ml-2 size-4" />
								</>
							)}
						</Button>
					</div>
				</form>
			</Form>
		</section>
	);
}
