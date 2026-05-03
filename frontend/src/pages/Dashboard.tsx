import { useState } from 'react';
import { Header } from '../components/common/Header';
import { DIDManagement } from '../components/DIDManagement';
import { CredentialManagement } from '../components/CredentialManagement';
import { CredentialVerification } from '../components/CredentialVerification';
import { AccessControlManagement } from '../components/AccessControlManagement';
import { useWallet } from '../hooks/useWallet';
import { useNetworkCheck } from '../hooks/useNetworkCheck';

export function Dashboard() {
  const wallet = useWallet();
  const network = useNetworkCheck();
  const [activeTab, setActiveTab] = useState<'student' | 'issuer' | 'employer' | 'resource'>('student');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        address={wallet.address}
        isConnected={wallet.isConnected}
        chainId={wallet.chainId}
        networkName={wallet.networkName}
        isSupportedNetwork={wallet.isSupportedNetwork}
        onConnect={wallet.connect}
        onNetworkSwitch={network.switchNetwork}
      />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Network Warning */}
        {wallet.isConnected && !network.isSupportedNetwork && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
            <p className="font-semibold">⚠ Unsupported network</p>
            <p className="text-sm mt-1">Please switch to the supported network configured for this app.</p>
            <button
              onClick={network.switchNetwork}
              className="mt-2 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition"
            >
              Switch Network
            </button>
          </div>
        )}

        {/* Not Connected Warning */}
        {!wallet.isConnected && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
            <p className="font-semibold">👛 Connect Your Wallet</p>
            <p className="text-sm mt-1">Please connect MetaMask to use this dApp.</p>
            <button
              onClick={wallet.connect}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Connect MetaMask
            </button>
          </div>
        )}

        {wallet.isConnected && network.isSupportedNetwork && (
          <div>
            <div className="flex space-x-2 mb-8 overflow-x-auto bg-white rounded-lg shadow-md p-2">
              <button
                onClick={() => setActiveTab('student')}
                className={`px-4 py-2 rounded font-medium transition whitespace-nowrap ${
                  activeTab === 'student'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                👤 Student / Holder
              </button>
              <button
                onClick={() => setActiveTab('issuer')}
                className={`px-4 py-2 rounded font-medium transition whitespace-nowrap ${
                  activeTab === 'issuer'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                🎓 University / Issuer
              </button>
              <button
                onClick={() => setActiveTab('employer')}
                className={`px-4 py-2 rounded font-medium transition whitespace-nowrap ${
                  activeTab === 'employer'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                💼 Employer / Verifier
              </button>
              <button
                onClick={() => setActiveTab('resource')}
                className={`px-4 py-2 rounded font-medium transition whitespace-nowrap ${
                  activeTab === 'resource'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                🔐 Resource Owner
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-md p-8">
              {activeTab === 'student' && (
                <div>
                  <h1 className="text-3xl font-bold mb-6">Student / DID Holder</h1>
                  <p className="text-gray-600 mb-6">
                    Register, update, and manage your Decentralized Identifier (DID). Your DID represents your digital identity on the blockchain.
                  </p>
                  <DIDManagement />
                </div>
              )}

              {activeTab === 'issuer' && (
                <div>
                  <h1 className="text-3xl font-bold mb-6">University / Credential Issuer</h1>
                  <p className="text-gray-600 mb-6">
                    Issue verifiable credentials to students, manage trusted issuers, and revoke credentials when needed.
                  </p>
                  <CredentialManagement />
                </div>
              )}

              {activeTab === 'employer' && (
                <div>
                  <h1 className="text-3xl font-bold mb-6">Employer / Credential Verifier</h1>
                  <p className="text-gray-600 mb-6">
                    Verify student credentials, check their validity, and lookup all credentials held by a student.
                  </p>
                  <CredentialVerification />
                </div>
              )}

              {activeTab === 'resource' && (
                <div>
                  <h1 className="text-3xl font-bold mb-6">Resource Owner / Access Control</h1>
                  <p className="text-gray-600 mb-6">
                    Register resources, grant roles to users based on credentials, and manage access control policies.
                  </p>
                  <AccessControlManagement />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
