export type WorkflowType =
  | 'deployments'
  | 'pull_requests'
  | 'build_failures'
  | 'tasks'
  | 'reviews';

export interface RawCSVRow {
  [key: string]: string | number;
}

export interface BaseWorkflowData {
  id: string;
  type: WorkflowType;
  name: string;
  date?: string;
  calculatedCost: number;
}

export interface DeploymentData extends BaseWorkflowData {
  type: 'deployments';
  failedMinutes: number;
  retryCount: number;
}

export interface BuildFailureData extends BaseWorkflowData {
  type: 'build_failures';
  failedTime: number;
  retryCount: number;
}

export interface PullRequestData extends BaseWorkflowData {
  type: 'pull_requests';
  reviewDelayHours: number;
  reviewersCount: number;
}

export interface TaskData extends BaseWorkflowData {
  type: 'tasks';
  blockedDays: number;
}

export interface ReviewsData extends BaseWorkflowData {
  type: 'reviews';
  blockedDays?: number;
  reviewDelayHours?: number;
  reviewersCount?: number;
}

export type WorkflowData =
  | DeploymentData
  | BuildFailureData
  | PullRequestData
  | TaskData
  | ReviewsData;

export interface ParsedResult {
  success: boolean;
  data?: WorkflowData[];
  totalCost?: number;
  error?: string;
  rowsProcessed?: number;
  rowsFailed?: number;
}
