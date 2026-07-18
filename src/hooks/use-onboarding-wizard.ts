"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";

import {
	createGroupSchema,
	joinGroupSchema,
	type CreateGroupValues,
	type JoinGroupValues,
	type MaterialItem,
} from "@/lib/onboarding/schema";

import type { CreateStep, JoinStep, OnboardingPath } from "@/lib/onboarding/types";

function getProgress(path: OnboardingPath, createStep: CreateStep, joinStep: JoinStep) {
	if (path === "create") {
		if (createStep === "details") return 55;
		if (createStep === "materials") return 100;
		return 15;
	}
	if (path === "join") {
		return joinStep === "invite" ? 100 : 15;
	}
	return 8;
}

function getStepLabel(
	path: OnboardingPath,
	createStep: CreateStep,
	joinStep: JoinStep,
) {
	if (path === "create") {
		if (createStep === "details") return "Step 2 of 3";
		if (createStep === "materials") return "Step 3 of 3";
		return "Step 1 of 3";
	}
	if (path === "join") {
		return joinStep === "invite" ? "Step 2 of 2" : "Step 1 of 2";
	}
	return "Get started";
}

function apiError(err: unknown, fallback: string) {
	if (axios.isAxiosError(err) && err.response?.data?.error) {
		return String(err.response.data.error);
	}
	return fallback;
}

export function useOnboardingWizard() {
	const router = useRouter();
	const [path, setPath] = useState<OnboardingPath>(null);
	const [createStep, setCreateStep] = useState<CreateStep>("path");
	const [joinStep, setJoinStep] = useState<JoinStep>("path");
	const [error, setError] = useState<string | null>(null);

	const createForm = useForm<CreateGroupValues>({
		resolver: zodResolver(createGroupSchema),
		defaultValues: {
			name: "",
			imageUrl: "",
			learningGoal: "",
			learningReason: undefined,
			materials: [],
		},
		mode: "onTouched",
	});

	const joinForm = useForm<JoinGroupValues>({
		resolver: zodResolver(joinGroupSchema),
		defaultValues: { inviteCode: "" },
	});

	const materials = createForm.watch("materials");

	const progress = useMemo(
		() => getProgress(path, createStep, joinStep),
		[path, createStep, joinStep],
	);

	const stepLabel = useMemo(
		() => getStepLabel(path, createStep, joinStep),
		[path, createStep, joinStep],
	);

	const canGoBack =
		(path === "create" && createStep !== "path") ||
		(path === "join" && joinStep !== "path");

	const selectCreate = () => {
		setPath("create");
		setCreateStep("details");
		setError(null);
	};

	const selectJoin = () => {
		setPath("join");
		setJoinStep("invite");
		setError(null);
	};

	const goBack = () => {
		setError(null);
		if (path === "create") {
			if (createStep === "materials") setCreateStep("details");
			else if (createStep === "details") {
				setCreateStep("path");
				setPath(null);
			}
			return;
		}
		if (path === "join" && joinStep === "invite") {
			setJoinStep("path");
			setPath(null);
		}
	};

	const continueFromDetails = async () => {
		const ok = await createForm.trigger([
			"name",
			"learningGoal",
			"learningReason",
		]);
		if (ok) {
			setError(null);
			setCreateStep("materials");
		}
	};

	const addMaterials = (items: MaterialItem[]) => {
		createForm.setValue("materials", [...materials, ...items], {
			shouldValidate: true,
		});
	};

	const removeMaterial = (url: string) => {
		createForm.setValue(
			"materials",
			materials.filter((m) => m.fileUrl !== url),
			{ shouldValidate: true },
		);
	};

	const submitCreate = createForm.handleSubmit(async (values) => {
		setError(null);
		try {
			const { data } = await axios.post<{
				id: string;
				curriculumStatus?: string;
			}>("/api/onboarding/create-group", values);
			router.push(`/servers/${data.id}`);
			router.refresh();
		} catch (err) {
			setError(apiError(err, "Could not create group. Try again."));
		}
	});

	const submitJoin = joinForm.handleSubmit(async (values) => {
		setError(null);
		try {
			const { data } = await axios.post<{ inviteCode: string }>(
				"/api/onboarding/join",
				values,
			);
			router.push(`/invite/${data.inviteCode}`);
			router.refresh();
		} catch (err) {
			setError(apiError(err, "Could not join group. Check the invite code."));
		}
	});

	return {
		path,
		createStep,
		joinStep,
		error,
		setError,
		createForm,
		joinForm,
		materials,
		progress,
		stepLabel,
		canGoBack,
		isCreateLoading: createForm.formState.isSubmitting,
		isJoinLoading: joinForm.formState.isSubmitting,
		selectCreate,
		selectJoin,
		goBack,
		continueFromDetails,
		addMaterials,
		removeMaterial,
		submitCreate,
		submitJoin,
	};
}
