import { useState } from 'react';
import { useContractService } from '../hooks/useContractService';
import { TransactionResult } from './common/TransactionResult';
import { LoadingSpinner } from './common/LoadingSpinner';
import { formatTimestamp } from '../lib/address-utils';

export function DIDManagement() {
  const contracts = useContractService();
  const [didURI, setDIDURI] = useState('');
  const [newDIDURI, setNewDIDURI] = useState('');
  const [lookupAddress, setLookupAddress] = useState('');
  const [didRecord, setDIDRecord] = useState<any>(null);
  const [isActiveDIDStatus, setIsActiveDIDStatus] = useState<boolean | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!didURI.trim()) return;
    try {
      await contracts.registerDID(didURI);
      setDIDURI('');
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDIDURI.trim()) return;
    try {
      await contracts.updateDID(newDIDURI);
      setNewDIDURI('');
    } catch (error) {
      console.error(error);
    }
  };

  const handleRevoke = async () => {
    try {
      await contracts.revokeDID();
    } catch (error) {
      console.error(error);
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupAddress.trim()) return;
    try {
      const record = await contracts.getDID(lookupAddress);
      setDIDRecord(record);
      const isActive = await contracts.isActiveDID(lookupAddress);
      setIsActiveDIDStatus(isActive);
    } catch (error) {
      console.error(error);
      setDIDRecord(null);
      setIsActiveDIDStatus(null);
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

      {/* Register DID */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Register Your DID</h3>
        <form onSubmit={handleRegister} className="space-y-3">
          <input
            type="text"
            placeholder="DID URI (e.g., ipfs://QmXxxx or did:ethr:0x...)"
            value={didURI}
            onChange={(e) => setDIDURI(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={contracts.state.isLoading || !didURI.trim()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition flex items-center justify-center space-x-2"
          >
            {contracts.state.isLoading && <LoadingSpinner />}
            <span>Register DID</span>
          </button>
        </form>
      </div>

      {/* Update DID */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Update Your DID</h3>
        <form onSubmit={handleUpdate} className="space-y-3">
          <input
            type="text"
            placeholder="New DID URI"
            value={newDIDURI}
            onChange={(e) => setNewDIDURI(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={contracts.state.isLoading || !newDIDURI.trim()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition flex items-center justify-center space-x-2"
          >
            {contracts.state.isLoading && <LoadingSpinner />}
            <span>Update DID</span>
          </button>
        </form>
      </div>

      {/* Revoke DID */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Revoke Your DID</h3>
        <button
          onClick={handleRevoke}
          disabled={contracts.state.isLoading}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 transition flex items-center justify-center space-x-2"
        >
          {contracts.state.isLoading && <LoadingSpinner />}
          <span>Revoke DID</span>
        </button>
      </div>

      {/* Lookup DID */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Lookup DID by Address</h3>
        <form onSubmit={handleLookup} className="space-y-3">
          <input
            type="text"
            placeholder="Ethereum address"
            value={lookupAddress}
            onChange={(e) => setLookupAddress(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={contracts.state.isLoading || !lookupAddress.trim()}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400 transition flex items-center justify-center space-x-2"
          >
            {contracts.state.isLoading && <LoadingSpinner />}
            <span>Lookup</span>
          </button>
        </form>

        {didRecord && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md space-y-2 text-sm">
            <div>
              <span className="font-semibold">Status:</span> {isActiveDIDStatus ? '✓ Active' : '✕ Revoked'}
            </div>
            <div>
              <span className="font-semibold">DID URI:</span> {didRecord.didURI}
            </div>
            <div>
              <span className="font-semibold">Owner:</span> {didRecord.owner}
            </div>
            <div>
              <span className="font-semibold">Created:</span> {formatTimestamp(didRecord.createdAt)}
            </div>
            <div>
              <span className="font-semibold">Updated:</span> {formatTimestamp(didRecord.updatedAt)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
