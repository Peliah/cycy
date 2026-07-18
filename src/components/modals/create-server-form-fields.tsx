"use client";

import {
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
import { ServerAvatarPicker } from "@/components/modals/server-avatar-picker";
import type { CreateServerFormValues } from "@/components/modals/create-server-schema";
import { learningReasons } from "@/lib/onboarding/schema";
import type { UseFormReturn } from "react-hook-form";

interface CreateServerFormFieldsProps {
	form: UseFormReturn<CreateServerFormValues>;
	isSubmitting?: boolean;
	onUploadingChange: (isUploading: boolean) => void;
}

export function CreateServerFormFields({
	form,
	isSubmitting,
	onUploadingChange,
}: CreateServerFormFieldsProps) {
	return (
		<div className="space-y-5 px-6">
			<FormField
				control={form.control}
				name="imageUrl"
				render={({ field }) => (
					<FormItem className="flex flex-col items-center">
						<ServerAvatarPicker
							value={field.value ?? ""}
							onChange={(url) => field.onChange(url || "")}
							onUploadingChange={onUploadingChange}
							onError={(message) => {
								if (message) {
									form.setError("imageUrl", { message });
								} else {
									form.clearErrors("imageUrl");
								}
							}}
							disabled={isSubmitting}
						/>
						<FormMessage className="text-center" />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="name"
				render={({ field }) => (
					<FormItem>
						<FormLabel className="text-xs font-bold uppercase text-shell-muted">
							Group name
						</FormLabel>
						<FormControl>
							<Input
								disabled={isSubmitting}
								className="border-shell-border bg-shell-nav text-foreground focus-visible:ring-shell-accent"
								placeholder="Enter group name"
								autoFocus
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
						<FormLabel className="text-xs font-bold uppercase text-shell-muted">
							What do you want to learn?
						</FormLabel>
						<FormControl>
							<Textarea
								disabled={isSubmitting}
								rows={3}
								className="resize-none border-shell-border bg-shell-nav text-foreground focus-visible:ring-shell-accent"
								placeholder="e.g. Linear algebra for my midterm"
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
						<FormLabel className="text-xs font-bold uppercase text-shell-muted">
							Why are you learning this?
						</FormLabel>
						<Select
							disabled={isSubmitting}
							onValueChange={field.onChange}
							value={field.value}
						>
							<FormControl>
								<SelectTrigger className="border-shell-border bg-shell-nav text-foreground focus:ring-shell-accent">
									<SelectValue placeholder="Choose a reason" />
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
		</div>
	);
}
