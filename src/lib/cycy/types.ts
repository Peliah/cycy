/** Types mirrored from Cycy AI Backend OpenAPI (`/api/docs-json`). */

export type HealthStatus = "ok" | "degraded";
export type DatabaseStatus = "connected" | "error";
export type MastraStatus = "ready" | "initializing";

export type CurriculumLifecycleStatus =
	| "PENDING"
	| "GENERATING"
	| "READY"
	| "FAILED";

export type ModuleProgressStatus =
	| "LOCKED"
	| "AVAILABLE"
	| "IN_PROGRESS"
	| "COMPLETED";

export type ProcessMessageStatus =
	| "processing"
	| "duplicate_ignored"
	| "curriculum_not_ready";

export type ConversationType = "AGENT" | "PEER";

export type SessionStep =
	| "STUDY"
	| "QUICK_CHECK"
	| "PRACTICE"
	| "EXPLAIN_BACK"
	| "MICRO_DRILL"
	| "CONCEPT_COMPLETE"
	| "MODULE_GATE"
	| "GOAL_VERIFICATION"
	| "MOCK_INTERVIEW"
	| "INTERVIEW_DEBRIEF"
	| "COURSE_COMPLETE"
	| "FREE_CHAT";

export type SessionNextActionType = "MCQ" | "PRACTICE" | "EXPLAIN_BACK";

export type QuestionType = "COMPREHENSION" | "PRACTICE";

export type ConceptCompletionStatus = "COMPLETED" | "IN_PROGRESS";

export type RankTier = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";

export type CertificateStage = "provisional" | "final" | "none";

export type InterviewStatus =
	| "not_applicable"
	| "not_started"
	| "in_progress"
	| "passed"
	| "failed";

export type ExplainBackNextStep = "CONCEPT_COMPLETE" | "STUDY";

export interface HealthResponse {
	status: HealthStatus;
	database: DatabaseStatus;
	mastra: MastraStatus;
}

export interface ValidationErrorResponse {
	statusCode: number;
	error: string;
	message: string[];
}

export interface ApiErrorResponse {
	statusCode: number;
	error: string;
	message: string | Record<string, unknown>;
}

export interface BootstrapResult {
	curriculumId: string;
	moduleCount: number;
	conceptCount: number;
	goalCriteria: string[];
	summary: string;
}

export interface BootstrapResponse {
	jobId: string;
	status: "generating";
}

export interface CurriculumModule {
	id: string;
	order: number;
	title: string;
	progressStatus: ModuleProgressStatus | null;
}

export interface CurriculumStatusResponse {
	serverId: string;
	status: CurriculumLifecycleStatus;
	summary: string | null;
	modules: CurriculumModule[];
	conceptCount: number;
	goalCriteria: string[];
}

export interface MessageDto {
	id?: string;
	content: string;
	type?: string;
}

export interface ProcessMessageBody {
	serverId: string;
	memberId: string;
	profileId?: string;
	message: MessageDto;
	conversationType?: ConversationType;
}

export interface ProcessMessageResponse {
	jobId: string;
	status: ProcessMessageStatus;
}

export interface SessionNextAction {
	type: SessionNextActionType;
	questionId: string;
	prompt: string;
}

export interface SessionProgress {
	conceptsCompleted: number;
	conceptsTotal: number;
}

export interface ConversationSessionResponse {
	conversationId: string;
	serverId: string;
	currentConceptId?: string | null;
	currentConceptTitle?: string | null;
	step: SessionStep;
	nextAction?: SessionNextAction | null;
	progress: SessionProgress;
}

export interface SubmitAssessmentBody {
	conversationId: string;
	serverId: string;
	questionId: string;
	questionType: QuestionType;
	answer: string;
	memberId?: string;
}

export interface SubmitAssessmentResponse {
	status: "processed";
	messageCount: number;
}

export interface ExplainBackBody {
	conversationId: string;
	serverId: string;
	conceptId: string;
	answer: string;
	memberId?: string;
}

export interface ExplainBackResponse {
	passed: boolean;
	feedback: string;
	scoreDelta: number;
	nextStep: ExplainBackNextStep;
}

export interface ConceptProgress {
	id: string;
	title: string;
	mastery: number;
	status: ConceptCompletionStatus;
	nextReviewAt?: string | null;
}

export interface ModuleProgress {
	id: string;
	title: string;
	order: number;
	status: ModuleProgressStatus;
	score?: number | null;
}

export interface ProgressResponse {
	serverId: string;
	courseScore: number;
	rank: RankTier;
	concepts: ConceptProgress[];
	modules: ModuleProgress[];
	currentModuleId?: string | null;
	goalMet?: boolean | null;
	certificateStage?: CertificateStage | null;
	interviewStatus: InterviewStatus;
	weakTopics: string[];
	strongTopics: string[];
}

export interface ConceptSummary {
	id: string;
	slug: string;
	title: string;
	order: number;
}

export interface CourseConceptsResponse {
	serverId: string;
	subject: string;
	agentHandle: string;
	concepts: ConceptSummary[];
}
