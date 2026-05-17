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

  if (
    semver.major(current)
    !== semver.major(target)
  ) {
    return "high";
  }

  const diff = semver.diff(current, target);

  if (diff === "major") {
    return "high";
  }

  if (
    diff === "minor"
    && semver.major(current) !== 0
  ) {
    return "moderate";
  }

  return "low";
}