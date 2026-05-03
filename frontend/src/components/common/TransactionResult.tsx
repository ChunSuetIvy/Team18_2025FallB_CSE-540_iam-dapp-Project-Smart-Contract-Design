export function TransactionResult({
  txHash,
  status,
  message,
}: {
  txHash: string | null;
  status: 'pending' | 'success' | 'error' | null;
  message: string | null;
}) {
  if (!status || !message) return null;

  const bgColor =
    status === 'success'
      ? 'bg-green-50 border-green-200'
      : status === 'error'
        ? 'bg-red-50 border-red-200'
        : 'bg-blue-50 border-blue-200';

  const textColor =
    status === 'success'
      ? 'text-green-800'
      : status === 'error'
        ? 'text-red-800'
        : 'text-blue-800';

  const iconColor =
    status === 'success'
      ? 'text-green-600'
      : status === 'error'
        ? 'text-red-600'
        : 'text-blue-600';

  const icon =
    status === 'success' ? '✓' : status === 'error' ? '✕' : '◆';

  return (
    <div className={`border rounded-lg p-4 ${bgColor}`}>
      <div className="flex items-start space-x-3">
        <div className={`text-2xl ${iconColor}`}>{icon}</div>
        <div className="flex-1">
          <p className={`font-medium ${textColor}`}>{message}</p>
          {txHash && (
            <p className="text-sm mt-2 text-gray-700">
              Transaction hash: {txHash.substring(0, 12)}...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
