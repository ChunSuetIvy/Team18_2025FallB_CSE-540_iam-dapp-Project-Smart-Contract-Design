import { useState } from 'react';
import { useContractService } from '../hooks/useContractService';
import { LoadingSpinner } from './common/LoadingSpinner';
import { formatTimestamp, truncateAddress, isValidAddress } from '../lib/address-utils';

export function CredentialVerification() {
  const contracts = useContractService();
  const [activePanel, setActivePanel] = useState<'verify' | 'lookup'>('verify');

  // Verify Panel
  const [credentialId, setCredentialId] = useState('');
  const [credentialData, setCredentialData] = useState<any>(null);
  const [verificationStatus, setVerificationStatus] = useState<boolean | null>(null);

  // Lookup Panel
  const [studentAddress, setStudentAddress] = useState('');
  const [studentCredentials, setStudentCredentials] = useState<number[]>([]);

  const handleVerify = async (e: React.FormEvent) => {
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

  const handleLookupStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidAddress(studentAddress)) return;
    try {
      const creds = await contracts.getCredentialsBySubject(studentAddress);
      setStudentCredentials(creds);
    } catch (error) {
      console.error(error);
      setStudentCredentials([]);
    }
  };

  const handleViewCredential = async (credId: number) => {
    try {
      const cred = await contracts.getCredential(credId);
      setCredentialData(cred);
      const isValid = await contracts.verifyCredential(credId);
      setVerificationStatus(isValid);
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

      {/* Panel Selector */}
      <div className="flex space-x-2 bg-white rounded-lg shadow-md p-2">
        <button
          onClick={() => setActivePanel('verify')}
          className={`flex-1 px-4 py-2 rounded transition ${
            activePanel === 'verify'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Verify Credential
        </button>
        <button
          onClick={() => setActivePanel('lookup')}
          className={`flex-1 px-4 py-2 rounded transition ${
            activePanel === 'lookup'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Lookup Student
        </button>
      </div>

      {activePanel === 'verify' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Verify Credential by ID</h3>
          <form onSubmit={handleVerify} className="space-y-3">
            <input
              type="number"
              placeholder="Credential ID"
              value={credentialId}
              onChange={(e) => setCredentialId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={contracts.state.isLoading || !credentialId.trim()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition flex items-center justify-center space-x-2"
            >
              {contracts.state.isLoading && <LoadingSpinner />}
              <span>Verify</span>
            </button>
          </form>

          {credentialData && (
            <div className="mt-6 space-y-4">
              {/* Status Badge */}
              <div
                className={`p-4 rounded-lg font-semibold text-center text-white ${
                  verificationStatus
                    ? 'bg-green-500'
                    : 'bg-red-500'
                }`}
              >
                {verificationStatus
                  ? '✓ CREDENTIAL VALID'
                  : '✕ CREDENTIAL INVALID / REVOKED / EXPIRED'}
              </div>

              {/* Credential Details */}
              <div className="p-4 bg-gray-50 rounded-md space-y-2 text-sm">
                <div>
                  <span className="font-semibold">Credential ID:</span> {credentialData.credentialId}
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
                  <span className="font-semibold">Issued At:</span> {formatTimestamp(credentialData.issuedAt)}
                </div>
                <div>
                  <span className="font-semibold">Expires At:</span>{' '}
                  {credentialData.expiresAt === 0
                    ? 'Never (non-expiring)'
                    : formatTimestamp(credentialData.expiresAt)}
                </div>
                <div>
                  <span className="font-semibold">Revoked:</span> {credentialData.isRevoked ? 'Yes' : 'No'}
                </div>
                <div>
                  <span className="font-semibold">Metadata URI:</span>{' '}
                  <a
                    href={`https://ipfs.io/ipfs/${credentialData.metadataURI.replace('ipfs://', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline break-all"
                  >
                    {credentialData.metadataURI}
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activePanel === 'lookup' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Lookup All Credentials for a Student</h3>
            <form onSubmit={handleLookupStudent} className="space-y-3">
              <input
                type="text"
                placeholder="Student Ethereum address"
                value={studentAddress}
                onChange={(e) => setStudentAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={contracts.state.isLoading || !isValidAddress(studentAddress)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition flex items-center justify-center space-x-2"
              >
                {contracts.state.isLoading && <LoadingSpinner />}
                <span>Lookup</span>
              </button>
            </form>

            {studentCredentials.length > 0 && (
              <div className="mt-6 space-y-2">
                <h4 className="font-semibold">Credentials found: {studentCredentials.length}</h4>
                <div className="space-y-2">
                  {studentCredentials.map((credId) => (
                    <button
                      key={credId}
                      onClick={() => handleViewCredential(credId)}
                      className="w-full p-3 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 text-left transition"
                    >
                      Credential #{credId}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {studentCredentials.length === 0 && studentAddress && (
              <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 rounded-md">
                No credentials found for this student address.
              </div>
            )}
          </div>

          {credentialData && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Credential Details</h3>
              <div
                className={`p-4 rounded-lg font-semibold text-center text-white mb-4 ${
                  verificationStatus
                    ? 'bg-green-500'
                    : 'bg-red-500'
                }`}
              >
                {verificationStatus
                  ? '✓ VALID'
                  : '✕ INVALID / REVOKED / EXPIRED'}
              </div>

              <div className="p-4 bg-gray-50 rounded-md space-y-2 text-sm">
                <div>
                  <span className="font-semibold">Credential ID:</span> {credentialData.credentialId}
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
                  <span className="font-semibold">Issued At:</span> {formatTimestamp(credentialData.issuedAt)}
                </div>
                <div>
                  <span className="font-semibold">Expires At:</span>{' '}
                  {credentialData.expiresAt === 0
                    ? 'Never'
                    : formatTimestamp(credentialData.expiresAt)}
                </div>
                <div>
                  <span className="font-semibold">Revoked:</span> {credentialData.isRevoked ? 'Yes' : 'No'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
