import React from 'react';

function WalletConnect({ account, networkId, onConnect, onDisconnect, loading }) {
  const formatAddress = (addr) => `${addr?.slice(0, 6)}...${addr?.slice(-4)}`;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      {account ? (
        <>
          <span style={{ fontSize: '14px', color: '#666' }}>
            {networkId === 80002 ? '✅ Polygon Amoy' : '❌ Wrong Network'}
          </span>
          <span style={{ fontSize: '14px', color: '#667eea', fontWeight: 'bold' }}>
            {formatAddress(account)}
          </span>
          <button
            className="button"
            onClick={onDisconnect}
            style={{ padding: '8px 16px', fontSize: '14px' }}
          >
            Disconnect
          </button>
        </>
      ) : (
        <button
          className="button"
          onClick={onConnect}
          disabled={loading}
          style={{ padding: '10px 20px' }}
        >
          {loading ? 'Connecting...' : 'Connect MetaMask'}
        </button>
      )}
    </div>
  );
}

export default WalletConnect;
