import process from "node:process";

const baseUrl = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 15000);

const checks = [
  {
    name: "Live scores",
    path: "/api/football/live",
    arrayKey: "matches",
  },
  {
    name: "Today's fixtures",
    path: "/api/football/fixtures",
    arrayKey: "matches",
  },
  {
    name: "Leagues",
    path: "/api/football/leagues",
    arrayKey: "leagues",
  },
  {
    name: "Team search",
    path: "/api/football/teams?search=Arsenal",
    arrayKey: "teams",
  },
  {
    name: "Unified team search",
    path: "/api/football/search?query=Arsenal&type=teams",
    arrayKey: "teams",
  },
  {
    name: "YouTube highlights",
    path: "/api/youtube/highlights?kind=all",
    arrayKey: "videos",
    provider: "youtube",
  },
];

const totals = { PASS: 0, WARN: 0, SKIP: 0, FAIL: 0 };

function report(status, name, detail) {
  totals[status] += 1;
  const suffix = detail ? ` — ${detail}` : "";
  const output = `[${status}] ${name}${suffix}`;
  const logger = status === "FAIL" ? console.error : console.log;
  logger(output);
}

async function runCheck(check) {
  let response;

  try {
    response = await fetch(`${baseUrl}${check.path}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    const detail = error?.name === "TimeoutError"
      ? `request timed out after ${timeoutMs}ms`
      : "server unreachable; confirm the app is running and BASE_URL is correct";
    report("FAIL", check.name, detail);
    return;
  }

  let body;
  try {
    body = await response.json();
  } catch {
    report("FAIL", check.name, `HTTP ${response.status}; response was not valid JSON`);
    return;
  }

  if (response.status === 503) {
    const detail = typeof body?.error === "string" ? body.error : "service not configured";
    report("SKIP", check.name, detail);
    return;
  }

  if ([401, 403, 408, 429, 502, 504].includes(response.status)) {
    const detail = typeof body?.error === "string"
      ? body.error
      : `provider returned HTTP ${response.status}`;
    report("WARN", check.name, `provider limitation (HTTP ${response.status}): ${detail}`);
    return;
  }

  if (!response.ok) {
    const detail = typeof body?.error === "string" ? body.error : `HTTP ${response.status}`;
    report("FAIL", check.name, detail);
    return;
  }

  if (!body || typeof body !== "object" || body.success !== true) {
    const detail = typeof body?.error === "string" ? body.error : "unexpected response structure";
    report("FAIL", check.name, detail);
    return;
  }

  if (!Array.isArray(body[check.arrayKey])) {
    report("FAIL", check.name, `expected "${check.arrayKey}" to be an array`);
    return;
  }

  const count = body[check.arrayKey].length;
  report("PASS", check.name, `${count} item(s) returned`);
}

console.log(`LiveScore API smoke test: ${baseUrl}`);
console.log("No API keys or response payloads are printed.\n");

for (const check of checks) {
  await runCheck(check);
}

console.log("\nSmoke test summary:");
for (const [status, count] of Object.entries(totals)) {
  console.log(`  ${status}: ${count}`);
}

if (totals.FAIL > 0) {
  console.error("\nSmoke test found application/runtime failures.");
  process.exitCode = 1;
} else if (totals.WARN > 0 || totals.SKIP > 0) {
  console.log("\nSmoke test completed with provider warnings or skipped checks.");
} else {
  console.log("\nAll runtime API checks passed.");
}
