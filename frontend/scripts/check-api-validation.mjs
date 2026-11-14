import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const routesRoot = path.join(process.cwd(), "src", "app", "api", "football");
const sourceFiles = [];

async function collectRoutes(directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      await collectRoutes(fullPath);
    } else if (entry.name === "route.ts") {
      sourceFiles.push(fullPath);
    }
  }
}

await collectRoutes(routesRoot);

const invalidPattern = String.fromCharCode(92, 92) + "d";
const failures = [];

for (const file of sourceFiles) {
  const source = await readFile(file, "utf8");

  if (source.includes(invalidPattern)) {
    failures.push(path.relative(process.cwd(), file));
  }
}

if (failures.length > 0) {
  console.error("Found double-escaped digit patterns in API route validation:");
  for (const file of failures) console.error(` - ${file}`);
  process.exitCode = 1;
} else {
  console.log(`API validation check passed (${sourceFiles.length} football routes scanned).`);
}
