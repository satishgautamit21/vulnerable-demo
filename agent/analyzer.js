import fs from "fs";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1"
});

function loadFailedVersions() {

  try {

    return JSON.parse(
      fs.readFileSync(
        "failed-upgrades.json",
        "utf-8"
      )
    );

  } catch {

    return {};
  }
}

export async function analyzePackage(
  vulnerability,
  failureContext = ""
) {

  const failedVersions =
    loadFailedVersions();

  const failedForPackage =
    failedVersions[
      vulnerability.package
    ] || [];

  const prompt = `
You are a senior dependency remediation expert.

Your task:
Recommend the BEST stable upgrade version
for this vulnerable package.

Package Details:
${JSON.stringify(vulnerability, null, 2)}

Rules:
1. Recommend the latest stable version fixing the vulnerability
2. Major upgrades ARE allowed
3. Prefer stable production-safe versions
4. Avoid beta, alpha, rc releases
5. If previous versions failed validation,
   avoid recommending them again
6. Include fallbackVersion if possible
7. Return ONLY valid JSON

Previously failed versions:
${JSON.stringify(failedForPackage)}

${failureContext}

Return format:
{
  "package": "axios",
  "targetVersion": "1.12.0",
  "fallbackVersion": "1.11.0",
  "risk": "high",
  "reason": "Latest stable secure version"
}
`;

  console.log(`
Analyzing package:
${vulnerability.package}
`);

  const response =
    await client.chat.completions.create({
      model: "openai/gpt-oss-20b:free",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0
    });

  const raw =
    response.choices[0]
      .message.content;

  console.log(`
=== AI RESPONSE ===
`);

  console.log(raw);

  const cleaned = raw
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const jsonStart =
    cleaned.indexOf("{");

  const jsonEnd =
    cleaned.lastIndexOf("}");

  const safeJson =
    cleaned.slice(
      jsonStart,
      jsonEnd + 1
    );

  return JSON.parse(safeJson);
}

export function getVulnerabilities() {

  const raw = fs.readFileSync(
    "audit-report.json",
    "utf-8"
  ).replace(/^\uFEFF/, "");

  const audit = JSON.parse(raw);

  const packageJson =
    fs.readFileSync(
      "package.json",
      "utf-8"
    );

  const packageData =
    JSON.parse(packageJson);

  const dependencies = {
    ...packageData.dependencies,
    ...packageData.devDependencies
  };

  const vulnerabilities =
    audit.vulnerabilities || {};

  const summary = [];

  for (const [pkg, details]
    of Object.entries(vulnerabilities)) {

    if (!details.fixAvailable) {
      continue;
    }

    summary.push({
      package: pkg,

      currentVersion:
        dependencies[pkg] || "unknown",

      severity:
        details.severity,

      direct:
        details.isDirect,

      fixAvailable:
        details.fixAvailable,

      vulnerableRange:
        details.range || "unknown"
    });
  }

  return summary;
}