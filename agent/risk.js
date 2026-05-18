import semver from "semver";

export function calculateRisk(
  currentVersion,
  targetVersion
) {

  const current =
    semver.coerce(currentVersion);

  const target =
    semver.coerce(targetVersion);

  if (!current || !target) {
    return "unknown";
  }

  const diff =
    semver.diff(current, target);

  if (diff === "major") {
    return "high";
  }

  if (diff === "minor") {
    return "moderate";
  }

  return "low";
}