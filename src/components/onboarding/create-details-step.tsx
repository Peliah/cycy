"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import {
	learningReasons,
	type CreateGroupValues,
} from "@/lib/onboarding/schema";
import { GroupAvatarPicker } from "./group-avatar-picker";
import { StepHeading } from "./step-heading";

type CreateDetailsStepProps = {
	form: UseFormReturn<CreateGroupValues>;
	onContinue: () => void;
};

export function CreateDetailsStep({ form, onContinue }: CreateDetailsStepProps) {
	const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
	const groupName = form.watch("name");

	return (
		<section className="animate-in fade-in slide-in-from-bottom-2 duration-500">
			<StepHeading
				title="Tell us about the group"
				description="This shapes the curriculum. Keep it concrete — topic and why it matters."
			/>

			<Form {...form}>
				<form className="mt-10 space-y-6" onSubmit={(e) => e.preventDefault()}>
					<FormField
						control={form.control}
						name="imageUrl"
						render={({ field }) => (
							<FormItem>
								<GroupAvatarPicker
									value={field.value ?? ""}
									seedHint={groupName}
									disabled={isUploadingAvatar}
									onChange={(url) => field.onChange(url)}
									onUploadingChange={setIsUploadingAvatar}
									onError={(message) => {
										if (message) {
											form.setError("imageUrl", { message });
										} else {
											form.clearErrors("imageUrl");
										}
									}}
								/>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-[#14201F]">Group name</FormLabel>
								<FormControl>
									<Input
										placeholder="e.g. Calculus study circle"
										className="h-11 border-[#C5D4D2] bg-white"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="learningGoal"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-[#14201F]">
									What do you want to learn?
								</FormLabel>
								<FormControl>
									<Textarea
										placeholder="Short description of the topic or course"
										rows={3}
										className="resize-none border-[#C5D4D2] bg-white"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="learningReason"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-[#14201F]">
									What brings you here?
								</FormLabel>
								<Select
									onValueChange={field.onChange}
									value={field.value || undefined}
								>
									<FormControl>
										<SelectTrigger className="h-11 border-[#C5D4D2] bg-white">
											<SelectValue placeholder="Choose your reason" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{learningReasons.map((reason) => (
											<SelectItem key={reason.value} value={reason.value}>
												{reason.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
					<div className="flex justify-end pt-2">
						<Button
							type="button"
							onClick={onContinue}
							disabled={isUploadingAvatar}
							className="h-11 bg-[#0A4D4A] px-6 text-white hover:bg-[#083D3B]"
						>
							Continue
							<ArrowRight className="ml-2 size-4" />
						</Button>
					</div>
				</form>
			</Form>
		</section>
	);
}
