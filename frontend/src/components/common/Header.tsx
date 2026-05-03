import { formatAddress } from '../../lib/address-utils';

export function Header({
  address,
  isConnected,
  chainId,
  networkName,
  isSupportedNetwork,
  onConnect,
  onNetworkSwitch,
}: {
  address: string | null;
  isConnected: boolean;
  chainId: number | null;
  networkName: string | null;
  isSupportedNetwork: boolean;
  onConnect: () => void;
  onNetworkSwitch: () => void;
}) {
  const networkLabel = isSupportedNetwork
    ? `✓ ${networkName}`
    : chainId !== null
      ? `Chain ${chainId}`
      : 'Unknown network';

  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold">IAM dApp</h1>
            <span className="text-sm text-blue-100">Decentralized Identity & Access</span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Network Status */}
            {isConnected && (
              <div className="flex items-center space-x-2">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${isSupportedNetwork ? 'bg-green-500' : 'bg-yellow-500'}`}>
                  {networkLabel}
                </div>
                {!isSupportedNetwork && (
                  <button
                    onClick={onNetworkSwitch}
                    className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm rounded-md transition"
                  >
                    Switch Network
                  </button>
                )}
              </div>
            )}

            {/* Wallet Status */}
            {isConnected ? (
              <button className="px-4 py-2 bg-white text-blue-600 font-medium rounded-md hover:bg-blue-50 transition">
                {formatAddress(address)}
              </button>
            ) : (
              <button
                onClick={onConnect}
                className="px-4 py-2 bg-white text-blue-600 font-medium rounded-md hover:bg-blue-50 transition"
              >
                Connect MetaMask
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
