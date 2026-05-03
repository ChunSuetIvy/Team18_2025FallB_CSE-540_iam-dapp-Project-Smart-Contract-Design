import { useState } from 'react';
import { useContractService } from '../hooks/useContractService';
import { TransactionResult } from './common/TransactionResult';
import { LoadingSpinner } from './common/LoadingSpinner';
import { formatTimestamp, truncateAddress, isValidAddress } from '../lib/address-utils';

export function CredentialManagement() {
  const contracts = useContractService();
  const [activePanel, setActivePanel] = useState<'issuer' | 'manage'>('issuer');

  // Add Issuer Panel
  const [issuerAddress, setIssuerAddress] = useState('');
  const [isTrustedIssuer, setIsTrustedIssuer] = useState<boolean | null>(null);

  // Issue Credential Panel
  const [subjectAddress, setSubjectAddress] = useState('');
  const [credentialType, setCredentialType] = useState('');
  const [metadataURI, setMetadataURI] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  // Manage Credential Panel
  const [credentialId, setCredentialId] = useState('');
  const [credentialData, setCredentialData] = useState<any>(null);
  const [verificationStatus, setVerificationStatus] = useState<boolean | null>(null);

  const handleAddIssuer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidAddress(issuerAddress)) return;
    try {
      await contracts.addTrustedIssuer(issuerAddress);
      setIssuerAddress('');
    } catch (error) {
      console.error(error);
    }
  };

  const handleRemoveIssuer = async () => {
    if (!isValidAddress(issuerAddress)) return;
    try {
      await contracts.removeTrustedIssuer(issuerAddress);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCheckTrustedIssuer = async () => {
    if (!isValidAddress(issuerAddress)) return;
    try {
      const result = await contracts.isTrustedIssuer(issuerAddress);
      setIsTrustedIssuer(result);
    } catch (error) {
      console.error(error);
    }
  };

  const handleIssueCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidAddress(subjectAddress) || !credentialType.trim()) return;
    try {
      const expiresAtNum = expiresAt ? Math.floor(new Date(expiresAt).getTime() / 1000) : 0;
      await contracts.issueCredential(subjectAddress, credentialType, metadataURI, expiresAtNum);
      setSubjectAddress('');
      setCredentialType('');
      setMetadataURI('');
      setExpiresAt('');
    } catch (error) {
      console.error(error);
    }
  };

  const handleGetCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentialId.trim()) return;
    try {
      const cred = await contracts.getCredential(parseInt(credentialId));
      setCredentialData(cred);
      const isValid = await contracts.verifyCredential(parseInt(credentialId));
      setVerificationStatus(isValid);
    } catch (error) {
      console.error(error);
      setCredentialData(null);
      setVerificationStatus(null);
    }
  };

  const handleRevokeCredential = async () => {
    if (!credentialId.trim()) return;
    try {
      await contracts.revokeCredential(parseInt(credentialId));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      {contracts.state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {contracts.state.error}
        </div>
      )}

      {contracts.state.txHash && (
        <TransactionResult
          txHash={contracts.state.txHash}
          status="success"
          message="Transaction submitted successfully!"
        />
      )}

      {/* Panel Selector */}
      <div className="flex space-x-2 bg-white rounded-lg shadow-md p-2">
        <button
          onClick={() => setActivePanel('issuer')}
          className={`flex-1 px-4 py-2 rounded transition ${
            activePanel === 'issuer'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Issue Credentials
        </button>
        <button
          onClick={() => setActivePanel('manage')}
          className={`flex-1 px-4 py-2 rounded transition ${
            activePanel === 'manage'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Manage Credentials
        </button>
      </div>

      {activePanel === 'issuer' && (
        <div className="space-y-6">
          {/* Add Trusted Issuer */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Trusted Issuer Management (Admin Only)</h3>
            <form onSubmit={handleAddIssuer} className="space-y-3">
              <input
                type="text"
                placeholder="Issuer Ethereum address"
                value={issuerAddress}
                onChange={(e) => setIssuerAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={contracts.state.isLoading || !isValidAddress(issuerAddress)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 transition flex items-center justify-center space-x-2"
                >
                  {contracts.state.isLoading && <LoadingSpinner />}
                  <span>Add Issuer</span>
                </button>
                <button
                  type="button"
                  onClick={handleRemoveIssuer}
                  disabled={contracts.state.isLoading || !isValidAddress(issuerAddress)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 transition"
                >
                  Remove Issuer
                </button>
                <button
                  type="button"
                  onClick={handleCheckTrustedIssuer}
                  disabled={contracts.state.isLoading || !isValidAddress(issuerAddress)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400 transition"
                >
                  Check
                </button>
              </div>
              {isTrustedIssuer !== null && (
                <div className={`p-3 rounded-md ${isTrustedIssuer ? 'bg-green-50' : 'bg-red-50'}`}>
                  {isTrustedIssuer
                    ? '✓ This address is a trusted issuer'
                    : '✕ This address is NOT a trusted issuer'}
                </div>
              )}
            </form>
          </div>

          {/* Issue Credential */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Issue Credential to Student</h3>
            <form onSubmit={handleIssueCredential} className="space-y-3">
              <input
                type="text"
                placeholder="Student Ethereum address"
                value={subjectAddress}
                onChange={(e) => setSubjectAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Credential Type (e.g., DegreeCredential)"
                value={credentialType}
                onChange={(e) => setCredentialType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Metadata URI (e.g., ipfs://QmXxx)"
                value={metadataURI}
                onChange={(e) => setMetadataURI(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="datetime-local"
                placeholder="Expiry Date (optional)"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={
                  contracts.state.isLoading || !isValidAddress(subjectAddress) || !credentialType.trim()
                }
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition flex items-center justify-center space-x-2"
              >
                {contracts.state.isLoading && <LoadingSpinner />}
                <span>Issue Credential</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {activePanel === 'manage' && (
        <div className="space-y-6">
          {/* Manage Credential */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Lookup & Manage Credential</h3>
            <form onSubmit={handleGetCredential} className="space-y-3">
              <input
                type="number"
                placeholder="Credential ID"
                value={credentialId}
                onChange={(e) => setCredentialId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={contracts.state.isLoading || !credentialId.trim()}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400 transition flex items-center justify-center space-x-2"
                >
                  {contracts.state.isLoading && <LoadingSpinner />}
                  <span>Lookup</span>
                </button>
                <button
                  type="button"
                  onClick={handleRevokeCredential}
                  disabled={contracts.state.isLoading || !credentialId.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 transition"
                >
                  Revoke
                </button>
              </div>
            </form>

            {credentialData && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md space-y-2 text-sm">
                <div>
                  <span className="font-semibold">Status:</span>{' '}
                  {verificationStatus ? '✓ Valid' : '✕ Invalid/Revoked/Expired'}
                </div>
                <div>
                  <span className="font-semibold">Type:</span> {credentialData.credentialType}
                </div>
                <div>
                  <span className="font-semibold">Subject:</span> {truncateAddress(credentialData.subject)}
                </div>
                <div>
                  <span className="font-semibold">Issuer:</span> {truncateAddress(credentialData.issuer)}
                </div>
                <div>
                  <span className="font-semibold">Issued:</span> {formatTimestamp(credentialData.issuedAt)}
                </div>
                <div>
                  <span className="font-semibold">Expires:</span>{' '}
                  {credentialData.expiresAt === 0 ? 'Never' : formatTimestamp(credentialData.expiresAt)}
                </div>
                <div>
                  <span className="font-semibold">Revoked:</span> {credentialData.isRevoked ? 'Yes' : 'No'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
