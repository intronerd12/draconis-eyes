// Helpers for scoping local storage/cache by user.
// Goal: prevent cross-user data leakage on shared devices.

export const getUserNamespace = (user) => {
  const raw =
    user?.id ??
    user?._id ??
    user?.userId ??
    user?.uid ??
    user?.email ??
    user?.username;

  if (!raw) return null;
  return String(raw).trim().toLowerCase();
};

export const sanitizeForKey = (ns) => {
  if (!ns) return null;
  // Keep keys and folder names stable + filesystem-friendly.
  return String(ns)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '_')
    .slice(0, 80);
};

