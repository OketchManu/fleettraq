import { isQuotaPaused, markQuotaExceeded } from "./firestoreQuota";
import { isQuotaError } from "./firestoreErrors";

export const QUOTA_WRITE_BLOCKED_MSG =
  "Firebase daily limit reached — this save cannot complete until the quota resets (midnight Pacific) or you upgrade to Blaze. " +
  "You can edit records manually in Firebase Console, or try again tomorrow.";

export function assertCanWrite() {
  if (isQuotaPaused()) {
    throw new Error(QUOTA_WRITE_BLOCKED_MSG);
  }
}

export function handleWriteError(err) {
  if (isQuotaError(err)) markQuotaExceeded();
  return err;
}
