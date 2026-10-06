export function errorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;
  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'An account already uses this email. Please sign in.',
    'auth/invalid-credential': 'The email or password is incorrect.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Choose a password with at least 8 characters.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'We could not reach the account service. Check your connection.',
    'permission-denied': 'This action was not permitted. Refresh your session and check that your bag is current.',
    'unavailable': 'The store is temporarily unreachable. Please try again.',
    'storage/unauthorized': 'You do not have access to this receipt.',
  };
  return (code && messages[code]) || (error instanceof Error ? error.message : 'Something went wrong. Please try again.');
}
