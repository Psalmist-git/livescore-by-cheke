/** Shared safeguards and response handling for API-Football requests. */
type FootballFetchInit = RequestInit & {
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
};

type ProviderPayload = {
  errors?: unknown;
  results?: unknown;
  response?: unknown;
};

export class FootballApiRequestError extends Error {
  constructor(message: string, public readonly status: number = 502) {
    super(message);
    this.name = "FootballApiRequestError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function fetchFootballApi(
  input: RequestInfo | URL,
  init: FootballFetchInit = {},
  timeoutMs = 10_000,
): Promise<Response> {
  const signal = init.signal ?? AbortSignal.timeout(timeoutMs);
  return fetch(input, { ...init, signal });
}

export function hasFootballApiErrors(errors: unknown): boolean {
  if (!errors) return false;
  if (Array.isArray(errors)) return errors.length > 0;
  if (isRecord(errors)) return Object.keys(errors).length > 0;
  return Boolean(errors);
}

/**
 * Fetches and validates the common API-Football envelope.
 * Route handlers remain responsible for validating endpoint-specific records.
 */
export async function fetchFootballApiData<T>(
  input: RequestInfo | URL,
  apiKey: string,
  init: FootballFetchInit = {},
): Promise<{ response: T[]; results?: number }> {
  const headers = new Headers(init.headers);
  headers.set("x-apisports-key", apiKey);

  const response = await fetchFootballApi(input, {
    ...init,
    headers,
  });

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new FootballApiRequestError("The football provider returned invalid JSON.");
  }

  if (!isRecord(payload)) {
    throw new FootballApiRequestError("The football provider returned an unexpected response.");
  }

  const providerPayload = payload as ProviderPayload;

  if (!response.ok || hasFootballApiErrors(providerPayload.errors)) {
    const status = response.status === 429 ? 429 : 502;
    throw new FootballApiRequestError("The football provider request failed.", status);
  }

  if (!Array.isArray(providerPayload.response)) {
    throw new FootballApiRequestError("The football provider returned an unexpected response.");
  }

  return {
    response: providerPayload.response as T[],
    results: typeof providerPayload.results === "number" ? providerPayload.results : undefined,
  };
}
