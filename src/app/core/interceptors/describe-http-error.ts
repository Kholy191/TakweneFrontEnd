import { HttpErrorResponse } from '@angular/common/http';

export interface ErrorMessage {
  summary: string;
  detail: string;
}

const SUMMARIES: Record<number, string> = {
  0: 'Server unreachable',
  400: 'Validation failed',
  401: 'Not signed in',
  403: 'Not allowed',
  404: 'Not found',
  409: 'Conflict',
  500: 'Server error',
};

// NSwag requests every body as a Blob, so the ProblemDetails JSON has to be read from it first.
export async function describeHttpError(error: HttpErrorResponse): Promise<ErrorMessage> {
  const summary = SUMMARIES[error.status] ?? `Error ${error.status}`;
  if (error.status === 0) return { summary, detail: 'Check that the API is running and trusted.' };

  const problem = await readProblem(error.error);
  const validationErrors = Object.values(problem?.errors ?? {}).flat();
  const detail = validationErrors.length > 0 ? validationErrors.join(' ') : problem?.detail ?? problem?.title;

  return { summary, detail: detail ?? error.message };
}

interface ProblemBody {
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
}

async function readProblem(body: unknown): Promise<ProblemBody | null> {
  const text = body instanceof Blob ? await body.text() : body;
  if (typeof text !== 'string') return (text as ProblemBody) ?? null;

  try {
    return JSON.parse(text) as ProblemBody;
  } catch {
    return null;
  }
}
