"use client";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ServerAvatarPicker } from "@/components/modals/server-avatar-picker";
import type { CreateServerFormValues } from "@/components/modals/create-server-schema";
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
		<div className="space-y-6 px-6">
			<FormField
				control={form.control}
				name="imageUrl"
				render={({ field }) => (
					<FormItem className="flex flex-col items-center">
						<ServerAvatarPicker
							value={field.value ?? ""}
							onChange={(url) => field.onChange(url || undefined)}
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
		</div>
	);
}
