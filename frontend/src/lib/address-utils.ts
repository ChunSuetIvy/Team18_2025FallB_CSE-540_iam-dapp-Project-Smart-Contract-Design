/**
 * Utility functions for Ethereum address handling
 */

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function truncateAddress(address: string, chars = 4): string {
  if (!isValidAddress(address)) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function toChecksumAddress(address: string): string {
  // Simple checksum (not full EIP-55, but good enough for display)
  if (!isValidAddress(address)) return address;
  return address.toLowerCase();
}

export function formatAddress(address: string | undefined | null): string {
  if (!address) return 'Not connected';
  return truncateAddress(address);
}

export function isValidTimestamp(timestamp: number): boolean {
  return Number.isInteger(timestamp) && timestamp > 0;
}

export function isFutureTimestamp(timestamp: number): boolean {
  return timestamp > Math.floor(Date.now() / 1000);
}

export function formatTimestamp(timestamp: number): string {
  if (!isValidTimestamp(timestamp)) return 'Invalid date';
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
}

export function formatCredentialId(id: number | bigint): string {
  return `#${id}`;
}

export function formatResourceId(id: number | bigint): string {
  return `Resource #${id}`;
}
