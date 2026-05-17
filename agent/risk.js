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

  if (
    semver.minor(current)
    !== semver.minor(target)
  ) {
    return "moderate";
  }

  return "low";
}