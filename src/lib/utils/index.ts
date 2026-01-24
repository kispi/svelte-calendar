import { env } from '$env/dynamic/public'

export const withCdn = (path: string) => {
  const cdnUrl = env.PUBLIC_CDN_URL
  if (!cdnUrl) return path

  // Remove leading slash if present in path to avoid double slashes if cdnUrl has trailing slash
  // But usually it's safer to ensure cdnUrl doesn't have trailing slash or handle it properly.
  // Simple concatenation for now, assuming standard usage.

  // Clean up path: remove leading slash
  const cleanPath = path.startsWith('/') ? path.slice(1) : path

  // Clean up CDN URL: remove trailing slash
  const cleanCdnUrl = cdnUrl.endsWith('/') ? cdnUrl.slice(0, -1) : cdnUrl

  return `${cleanCdnUrl}/${cleanPath}`
}
