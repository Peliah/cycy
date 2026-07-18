import type { ConceptContent } from "@/lib/cycy/types";

export type RoadmapModuleStatus =
	| "LOCKED"
	| "AVAILABLE"
	| "IN_PROGRESS"
	| "COMPLETED"
	| string;

export type RoadmapModule = {
	id: string;
	order: number;
	title: string;
	status: RoadmapModuleStatus;
	xpReward: number;
	channelId: string | null;
	xpEarned: number;
};

export type RoadmapNestProgress = {
	courseScore: number;
	rank: string;
	conceptsCompleted: number;
	conceptsTotal: number;
};

export type RoadmapData = {
	summary: string | null;
	memberXp: number;
	modulesCompleted: number;
	modulesTotal: number;
	modules: RoadmapModule[];
	nestProgress: RoadmapNestProgress | null;
};

export type RoadmapSummaryProps = {
	data: RoadmapData;
};

export type RoadmapTimelineProps = {
	serverId: string;
	data: RoadmapData;
};

export type LearningRoadmapPanelProps = {
	serverId: string;
};

export type LearningRoadmapButtonProps = {
	serverId: string;
};

export type ModuleStudyQuizInfo = {
	id: string;
	title: string;
	passScore: number;
	questionCount: number;
};

export type ModuleStudyPayload = {
	id: string;
	title: string;
	content: string;
	concepts: ConceptContent[];
	xpReward: number;
	timeLimitMinutes: number;
	status: string;
	startedAt: string | null;
	quiz: ModuleStudyQuizInfo | null;
	agentHandle: string | null;
};

export type ModuleStudyPanelProps = {
	serverId: string;
	moduleId: string;
};

export type ModuleLockedNoticeProps = {
	serverId: string;
	moduleTitle: string;
	previousModuleTitle: string | null;
	previousChannelId: string | null;
};

export type MarkdownBodyProps = {
	content: string;
};

export type GateQuizChoice = {
	id: string;
	text: string;
};

export type GateQuizQuestion = {
	id: string;
	order: number;
	type: "MCQ" | "STRUCTURAL";
	prompt: string;
	choices: GateQuizChoice[] | null;
};

export type GateQuizPayload = {
	id: string;
	title: string;
	passScore: number;
	questions: GateQuizQuestion[];
};

export type GateQuizResult = {
	passed: boolean;
	score: number;
	passScore: number;
	xpEarned: number;
	nextModule?: { id: string; title: string; channelId: string | null } | null;
};

export type GateQuizDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	serverId: string;
	moduleId: string;
	agentHandle: string | null;
};
