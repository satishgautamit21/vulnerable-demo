import fs from "fs";

import dotenv from "dotenv";

import OpenAI from "openai";

import {
  getLatestVersion
} from "./versionResolver.js";

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

  // REAL npm versions
  const availableVersions =
    getLatestVersion(
      vulnerability.package,
      10
    );

  const prompt = `
You are a senior dependency remediation expert.

Your task:
Choose the BEST upgrade version
for this vulnerable package.

Package Details:
${JSON.stringify(vulnerability, null, 2)}

IMPORTANT:
You MUST choose ONLY from the availableVersions list.

Rules:
1. Prefer latest stable secure version
2. Major upgrades ARE allowed
3. Avoid beta/alpha/rc versions
4. Avoid previously failed versions
5. Prefer versions outside vulnerableRange
6. Return ONLY valid JSON

Available stable versions:
${JSON.stringify(availableVersions, null, 2)}

Previously failed versions:
${JSON.stringify(failedForPackage, null, 2)}

${failureContext}

Return format:
{
  "package": "lodash",
  "targetVersion": "4.18.1",
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