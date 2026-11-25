import { spawnSync } from "node:child_process";

const result = spawnSync("npm", ["audit", "--workspaces", "--json"], {
  encoding: "utf8",
  maxBuffer: 10 * 1024 * 1024,
});

if (result.error || ![0, 1].includes(result.status)) {
  console.error(result.error ?? result.stderr ?? "npm audit failed");
  process.exit(1);
}

const audit = JSON.parse(result.stdout);
if (audit.error || !audit.vulnerabilities || !audit.metadata?.vulnerabilities) {
  console.error("Invalid npm audit response", audit.error ?? "");
  process.exit(1);
}

const temporaryException = "https://github.com/advisories/GHSA-fc5q-39xc-vjpf";
const advisories = new Map();
for (const vulnerability of Object.values(audit.vulnerabilities)) {
  for (const advisory of vulnerability.via) {
    if (typeof advisory === "object") {
      advisories.set(advisory.url, advisory);
    }
  }
}

let blocked = false;
for (const advisory of advisories.values()) {
  if (advisory.url === temporaryException) {
    console.warn(`TEMPORARY EXCEPTION (no upstream fix): ${advisory.title} ${advisory.url}`);
    continue;
  }
  console.log(`${advisory.severity}: ${advisory.title} ${advisory.url}`);
  if (["high", "critical"].includes(advisory.severity)) {
    blocked = true;
  }
}

console.log("npm audit totals:", audit.metadata.vulnerabilities);
process.exitCode = blocked ? 1 : 0;