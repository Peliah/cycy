/** Bootstrap jobs older than this are treated as crashed/stale and can be retried. */
export const STALE_BOOTSTRAP_MS = 10 * 60 * 1000;

export function isStaleBootstrap(
	updatedAt: Date | string | null | undefined,
): boolean {
	if (!updatedAt) return false;
	return Date.now() - new Date(updatedAt).getTime() > STALE_BOOTSTRAP_MS;
}
