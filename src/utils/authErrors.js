/**
 * Maps Firebase Auth error codes to clear, user-friendly messages.
 * `context` tailors a few messages: "login" | "signup" | "reset".
 */
export function friendlyAuthError(error, context = "login") {
  const code = typeof error === "string" ? error : error?.code || "";

  switch (code) {
    // Modern Firebase returns this generic code for wrong password OR
    // a non-existent account (to prevent email enumeration).
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
      return context === "login"
        ? "Incorrect email or password. If you don't have an account yet, please register."
        : "Those credentials are invalid. Please check and try again.";

    case "auth/wrong-password":
      return "Incorrect password. Please try again or reset your password.";

    case "auth/user-not-found":
      return "No account found with this email. Please register first.";

    case "auth/invalid-email":
      return "That email address doesn't look right. Please check it.";

    case "auth/missing-password":
      return "Please enter your password.";

    case "auth/user-disabled":
      return "This account has been disabled. Contact your fleet administrator.";

    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again, or reset your password.";

    case "auth/email-already-in-use":
      return "An account with this email already exists. Please sign in instead.";

    case "auth/weak-password":
      return "Password is too weak. Use at least 6 characters.";

    case "auth/popup-closed-by-user":
      return "Google sign-in was cancelled.";

    case "auth/cancelled-popup-request":
      return "Another sign-in popup is already open.";

    case "auth/popup-blocked":
      return "Your browser blocked the sign-in popup. Please allow popups and try again.";

    case "auth/account-exists-with-different-credential":
      return "This email is already registered with a different sign-in method. Try signing in with email and password.";

    case "auth/network-request-failed":
      return "Network error. Please check your internet connection and try again.";

    case "auth/unauthorized-domain":
      return "This website domain isn't authorized for Google sign-in yet. Add it under Firebase Authentication → Settings → Authorized domains.";

    case "auth/internal-error":
      return "Something went wrong with sign-in. Please try again.";

    case "auth/operation-not-allowed":
      return "This sign-in method is not enabled. Contact your fleet administrator.";

    case "auth/requires-recent-login":
      return "For security, please sign in again before continuing.";

    default:
      if (context === "signup") return "Could not create your account. Please try again.";
      if (context === "reset") return "Could not send the reset link. Please try again.";
      return "Sign-in failed. Please try again.";
  }
}
