/**
 * Parse contract revert messages and other blockchain errors
 * into user-friendly messages
 */

export function parseRevertReason(error: unknown): string {
  if (!error) return 'Unknown error occurred';

  const err = error as any;

  // Check for revert reason in error message
  if (err.reason) {
    return err.reason;
  }

  if (err.message) {
    // Extract revert reason from message
    if (err.message.includes('revert')) {
      // Try to extract the custom error message
      const match = err.message.match(/revert (.+?)(?:\n|$)/);
      if (match) {
        return match[1].trim();
      }
      // Generic revert message
      return 'Transaction reverted';
    }

    // User denied transaction
    if (err.message.includes('user rejected') || err.message.includes('User denied')) {
      return 'You rejected the transaction in MetaMask';
    }

    // Network error
    if (err.message.includes('network') || err.message.includes('Network')) {
      return 'Network error. Check your connection and MetaMask network settings.';
    }

    return err.message;
  }

  return 'An unexpected error occurred. Please check the browser console for details.';
}

/**
 * Friendly error message for common contract errors
 */
export const ERROR_MESSAGES: { [key: string]: string } = {
  'DIDRegistry: DID already registered for this address': 'You already have a registered DID. You cannot register twice.',
  'DIDRegistry: DID URI cannot be empty': 'Please enter a valid DID URI (cannot be empty)',
  'DIDRegistry: No DID registered for this address': 'You do not have a registered DID',
  'DIDRegistry: DID has been revoked': 'Your DID has been revoked and cannot be updated',
  'CredentialIssuer: Caller is not the admin': 'Only the admin can add trusted issuers',
  'CredentialIssuer: Caller is not a trusted issuer': 'You are not a trusted issuer. Only trusted issuers can issue credentials.',
  'CredentialIssuer: Subject does not have an active DID': 'The recipient does not have an active DID registered',
  'CredentialIssuer: Only the original issuer can revoke': 'Only the original issuer can revoke this credential',
  'AccessControl: Caller is not the resource owner': 'Only the resource owner can manage this resource',
  'AccessControl: Caller does not have an active DID': 'You must have an active DID to manage resources',
  'AccessControl: Account does not have an active DID': 'The target account does not have an active DID',
  'AccessControl: Credential type does not match resource requirement': 'The credential type does not match what this resource requires',
  'AccessControl: Provided credential is invalid or expired': 'The provided credential is invalid or has expired',
};

export function getFriendlyErrorMessage(rawError: string): string {
  // Check for exact matches
  if (ERROR_MESSAGES[rawError]) {
    return ERROR_MESSAGES[rawError];
  }

  // Check for partial matches
  for (const [pattern, message] of Object.entries(ERROR_MESSAGES)) {
    if (rawError.includes(pattern)) {
      return message;
    }
  }

  return rawError || 'An unknown error occurred';
}
