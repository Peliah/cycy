"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select ,SelectContent,SelectLabel,SelectItem,SelectTrigger, SelectValue} from "@/components/ui/select";
import { useStore } from "@/store/store";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChannelType } from "@prisma/client";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import qs from "query-string";
import { useEffect } from "react";


export function CreateChannelModal() {
	const router = useRouter();
    const params = useParams()
	const type = useStore.use.type();
	const isOpen = useStore.use.isOpen();
	const onClose = useStore.use.onClose();
	const data = useStore.use.data();

	const isModelOpen = isOpen && type === "createChannel";

	const schema = z.object({
		name: z
			.string()
			.min(1, { message: "Channel name is required" })
			.refine((name) => name !== "general", {
				message: "Channel name can't be 'general'",
			}),
		type: z.nativeEnum(ChannelType),
	});
	const form = useForm({
		resolver: zodResolver(schema),
		defaultValues: {
			name: "",
			type: data?.channelType || ChannelType.TEXT,
		},
	});

	useEffect(() => {
		if (data?.channelType) {
			form.setValue("type", data?.channelType);
		} else {
			form.setValue("type", ChannelType.TEXT);
		}
	}, [data?.channelType, form]);


	const { register, handleSubmit, formState, watch } = form;

	const isLoading = formState.isSubmitting;

	const onSubmit = async (values: z.infer<typeof schema>) => {
		console.log(values);
		try {
            const url = qs.stringifyUrl({
                url: `/api/channels`,
                query: {
                    serverId: params?.serverId,
                },
            });
			await axios.post(url, values);
			form.reset();
			router.refresh();
			onClose();
		} catch (error) {
			console.log(error);
		}
	};
	const handleClose = () => {
		form.reset();
		onClose();
	};
	return (
		<Dialog open={isModelOpen} onOpenChange={handleClose}>
			<DialogContent className="overflow-hidden bg-shell-chat p-0 text-foreground">
				<DialogHeader className="px-6 pt-8">
					<DialogTitle className="text-center text-2xl font-bold">
						Create channel
					</DialogTitle>
					<DialogDescription className="text-center text-shell-muted">
						Channels are where your members communicate — for example #general.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
						<div className="space-y-8 px-6">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="text-xs font-bold uppercase text-shell-muted">
											Channel name
										</FormLabel>

										<FormControl>
											<Input
												disabled={isLoading}
												className="border-shell-border bg-shell-nav text-foreground focus-visible:ring-shell-accent"
												placeholder="Enter channel name"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="type"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Channel Type</FormLabel>
											<Select
                                            disabled={isLoading}
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger
                                                    className="capitalize border-shell-border bg-shell-nav text-foreground outline-none focus:ring-shell-accent"
                                                    >
                                                        <SelectValue  placeholder="Select a channel type"/>
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {Object.values(ChannelType).map((type) => (
                                                        <SelectItem key={type} value={type} className="capitalize">
                                                            {type?.toLocaleLowerCase()}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<DialogFooter className="bg-shell-nav px-6 py-4">
							<Button type="submit" variant="primary" disabled={isLoading} className="w-full">
								Create Channel
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
