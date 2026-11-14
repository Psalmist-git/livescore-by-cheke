import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchFootballApiData,
  hasFootballApiErrors,
  FootballApiRequestError,
} from "../football-api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("hasFootballApiErrors", () => {
  it("returns false when errors are absent", () => {
    expect(hasFootballApiErrors(undefined)).toBe(false);
    expect(hasFootballApiErrors(null)).toBe(false);
  });

  it("returns false for empty error collections", () => {
    expect(hasFootballApiErrors([])).toBe(false);
    expect(hasFootballApiErrors({})).toBe(false);
  });

  it("detects populated error collections", () => {
    expect(hasFootballApiErrors(["Invalid API key"])).toBe(true);
    expect(hasFootballApiErrors({ token: "Invalid API key" })).toBe(true);
  });
});

describe("fetchFootballApiData", () => {
  it("returns valid football provider data", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          results: 1,
          response: [{ fixture: { id: 123 } }],
        }),
        { status: 200 },
      ),
    );

    vi.stubGlobal("fetch", mockFetch);

    const result = await fetchFootballApiData<{ fixture: { id: number } }>(
      "https://example.com/fixtures",
      "test-api-key",
    );

    expect(result.results).toBe(1);
    expect(result.response[0].fixture.id).toBe(123);

    const requestOptions = mockFetch.mock.calls[0][1] as RequestInit;
    expect(new Headers(requestOptions.headers).get("x-apisports-key"))
      .toBe("test-api-key");
  });

  it("rejects invalid JSON responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("not-json", { status: 200 }),
      ),
    );

    await expect(
      fetchFootballApiData("https://example.com/fixtures", "test-key"),
    ).rejects.toThrow("invalid JSON");
  });

  it("rejects provider error responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            errors: { token: "Invalid API key" },
            response: [],
          }),
          { status: 200 },
        ),
      ),
    );

    await expect(
      fetchFootballApiData("https://example.com/fixtures", "test-key"),
    ).rejects.toBeInstanceOf(FootballApiRequestError);
  });

  it("preserves the provider rate-limit status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ response: [] }),
          { status: 429 },
        ),
      ),
    );

    try {
      await fetchFootballApiData(
        "https://example.com/fixtures",
        "test-key",
      );
      throw new Error("Expected request to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(FootballApiRequestError);
      expect((error as FootballApiRequestError).status).toBe(429);
    }
  });
});
