import { useState } from 'react';
import { useContractService } from '../hooks/useContractService';
import { TransactionResult } from './common/TransactionResult';
import { LoadingSpinner } from './common/LoadingSpinner';
import { isValidAddress, truncateAddress } from '../lib/address-utils';

export function AccessControlManagement() {
  const contracts = useContractService();
  const [activePanel, setActivePanel] = useState<'register' | 'grant' | 'check'>('register');

  // Register Resource Panel
  const [resourceName, setResourceName] = useState('');
  const [requiredCredType, setRequiredCredType] = useState('');

  // Grant Role Panel
  const [resourceId, setResourceId] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [roleName, setRoleName] = useState('');
  const [credentialId, setCredentialId] = useState('');
  const [resourceData, setResourceData] = useState<any>(null);

  // Check Role Panel
  const [checkResourceId, setCheckResourceId] = useState('');
  const [checkUserAddress, setCheckUserAddress] = useState('');
  const [checkRoleName, setCheckRoleName] = useState('');
  const [hasRoleResult, setHasRoleResult] = useState<boolean | null>(null);

  const handleRegisterResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceName.trim()) return;
    try {
      await contracts.registerResource(resourceName, requiredCredType);
      setResourceName('');
      setRequiredCredType('');
    } catch (error) {
      console.error(error);
    }
  };

  const handleViewResource = async () => {
    if (!resourceId.trim()) return;
    try {
      const resource = await contracts.getResource(parseInt(resourceId));
      setResourceData(resource);
    } catch (error) {
      console.error(error);
      setResourceData(null);
    }
  };

  const handleDeactivateResource = async () => {
    if (!resourceId.trim()) return;
    try {
      await contracts.deactivateResource(parseInt(resourceId));
    } catch (error) {
      console.error(error);
    }
  };

  const handleGrantRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidAddress(userAddress) || !roleName.trim() || !resourceId.trim()) return;
    try {
      const credId = credentialId ? parseInt(credentialId) : 0;
      await contracts.grantRole(
        parseInt(resourceId),
        userAddress,
        roleName,
        credId
      );
      setUserAddress('');
      setRoleName('');
      setCredentialId('');
    } catch (error) {
      console.error(error);
    }
  };

  const handleRevokeRole = async () => {
    if (!isValidAddress(userAddress) || !roleName.trim() || !resourceId.trim()) return;
    try {
      await contracts.revokeRole(parseInt(resourceId), userAddress, roleName);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCheckRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidAddress(checkUserAddress) || !checkRoleName.trim() || !checkResourceId.trim()) return;
    try {
      const result = await contracts.hasRole(
        parseInt(checkResourceId),
        checkUserAddress,
        checkRoleName
      );
      setHasRoleResult(result);
    } catch (error) {
      console.error(error);
      setHasRoleResult(null);
    }
  };

  const handleCheckAndLogAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkRoleName.trim() || !checkResourceId.trim()) return;
    try {
      await contracts.checkAndLogAccess(parseInt(checkResourceId), checkRoleName);
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
          onClick={() => setActivePanel('register')}
          className={`flex-1 px-4 py-2 rounded transition ${
            activePanel === 'register'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Register Resource
        </button>
        <button
          onClick={() => setActivePanel('grant')}
          className={`flex-1 px-4 py-2 rounded transition ${
            activePanel === 'grant'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Grant/Revoke Roles
        </button>
        <button
          onClick={() => setActivePanel('check')}
          className={`flex-1 px-4 py-2 rounded transition ${
            activePanel === 'check'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Check Access
        </button>
      </div>

      {activePanel === 'register' && (
        <div className="space-y-6">
          {/* Register Resource */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Register New Resource</h3>
            <form onSubmit={handleRegisterResource} className="space-y-3">
              <input
                type="text"
                placeholder="Resource Name (e.g., University Portal)"
                value={resourceName}
                onChange={(e) => setResourceName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Required Credential Type (optional, e.g., DegreeCredential)"
                value={requiredCredType}
                onChange={(e) => setRequiredCredType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={contracts.state.isLoading || !resourceName.trim()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition flex items-center justify-center space-x-2"
              >
                {contracts.state.isLoading && <LoadingSpinner />}
                <span>Register Resource</span>
              </button>
            </form>
          </div>

          {/* View Resource */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">View & Manage Resource</h3>
            <div className="space-y-3">
              <input
                type="number"
                placeholder="Resource ID"
                value={resourceId}
                onChange={(e) => setResourceId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleViewResource}
                  disabled={contracts.state.isLoading || !resourceId.trim()}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400 transition"
                >
                  View Resource
                </button>
                <button
                  onClick={handleDeactivateResource}
                  disabled={contracts.state.isLoading || !resourceId.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 transition"
                >
                  Deactivate
                </button>
              </div>
            </div>

            {resourceData && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md space-y-2 text-sm">
                <div>
                  <span className="font-semibold">ID:</span> {resourceData.resourceId}
                </div>
                <div>
                  <span className="font-semibold">Name:</span> {resourceData.name}
                </div>
                <div>
                  <span className="font-semibold">Owner:</span> {truncateAddress(resourceData.owner)}
                </div>
                <div>
                  <span className="font-semibold">Required Credential Type:</span>{' '}
                  {resourceData.requiredCredentialType || '(none)'}
                </div>
                <div>
                  <span className="font-semibold">Status:</span>{' '}
                  {resourceData.isActive ? '✓ Active' : '✕ Inactive'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activePanel === 'grant' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Grant/Revoke Roles</h3>
          <form onSubmit={handleGrantRole} className="space-y-3">
            <input
              type="number"
              placeholder="Resource ID"
              value={resourceId}
              onChange={(e) => setResourceId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="User Ethereum address"
              value={userAddress}
              onChange={(e) => setUserAddress(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Role Name (e.g., VIEWER, EDITOR, ADMIN)"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Credential ID (if required by resource, otherwise 0)"
              value={credentialId}
              onChange={(e) => setCredentialId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={
                  contracts.state.isLoading ||
                  !isValidAddress(userAddress) ||
                  !roleName.trim() ||
                  !resourceId.trim()
                }
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 transition flex items-center justify-center space-x-2"
              >
                {contracts.state.isLoading && <LoadingSpinner />}
                <span>Grant Role</span>
              </button>
              <button
                type="button"
                onClick={handleRevokeRole}
                disabled={
                  contracts.state.isLoading ||
                  !isValidAddress(userAddress) ||
                  !roleName.trim() ||
                  !resourceId.trim()
                }
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 transition"
              >
                Revoke Role
              </button>
            </div>
          </form>
        </div>
      )}

      {activePanel === 'check' && (
        <div className="space-y-6">
          {/* Check Role */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Check if User Has Role (Query Only)</h3>
            <form onSubmit={handleCheckRole} className="space-y-3">
              <input
                type="number"
                placeholder="Resource ID"
                value={checkResourceId}
                onChange={(e) => setCheckResourceId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="User Ethereum address"
                value={checkUserAddress}
                onChange={(e) => setCheckUserAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Role Name"
                value={checkRoleName}
                onChange={(e) => setCheckRoleName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={
                  contracts.state.isLoading ||
                  !isValidAddress(checkUserAddress) ||
                  !checkRoleName.trim() ||
                  !checkResourceId.trim()
                }
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition flex items-center justify-center space-x-2"
              >
                {contracts.state.isLoading && <LoadingSpinner />}
                <span>Check</span>
              </button>
            </form>

            {hasRoleResult !== null && (
              <div
                className={`mt-4 p-4 rounded-md font-semibold text-white text-center ${
                  hasRoleResult ? 'bg-green-500' : 'bg-red-500'
                }`}
              >
                {hasRoleResult ? '✓ User HAS this role' : '✕ User DOES NOT have this role'}
              </div>
            )}
          </div>

          {/* Check and Log Access */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Check & Log Access (Emits Event)</h3>
            <form onSubmit={handleCheckAndLogAccess} className="space-y-3">
              <input
                type="number"
                placeholder="Resource ID"
                value={checkResourceId}
                onChange={(e) => setCheckResourceId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Role Name"
                value={checkRoleName}
                onChange={(e) => setCheckRoleName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-600">
                This will log your access attempt on-chain and emit an AccessChecked event.
              </p>
              <button
                type="submit"
                disabled={
                  contracts.state.isLoading ||
                  !checkRoleName.trim() ||
                  !checkResourceId.trim()
                }
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 transition flex items-center justify-center space-x-2"
              >
                {contracts.state.isLoading && <LoadingSpinner />}
                <span>Check & Log Access</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
