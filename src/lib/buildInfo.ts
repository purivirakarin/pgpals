export function getAppVersion(): string {
  const explicit = process.env.NEXT_PUBLIC_BUILD_NUMBER
  if (explicit) {
    return `v0.0.${explicit}`
  }
  const sha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_GIT_SHA
  if (sha) {
    return `v0.0.${sha.substring(0, 7)}`
  }
  return 'v0.0.dev'
}


