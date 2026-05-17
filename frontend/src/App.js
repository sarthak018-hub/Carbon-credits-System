import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import './App.css';
import WalletConnect from './components/WalletConnect';
import SubmitData from './components/SubmitData';
import Dashboard from './components/Dashboard';

function App() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [networkId, setNetworkId] = useState(null);
  const [loading, setLoading] = useState(false);
  const POLYGON_AMOY_CHAIN_ID = 80002;

  const connectWallet = async () => {
    try {
      setLoading(true);
      if (!window.ethereum) {
        alert('Please install MetaMask');
        return;
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const networkId = parseInt(chainId, 16);

      if (networkId !== POLYGON_AMOY_CHAIN_ID) {
        await switchNetwork();
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      setProvider(provider);
      setAccount(accounts[0]);
      setNetworkId(networkId);

      // Initialize contract
      const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
      if (contractAddress) {
        const contract = new ethers.Contract(
          contractAddress,
          require('./abi/CarbonCreditMRV.json'),
          signer
        );
        setContract(contract);
      }
    } catch (error) {
      console.error('❌ Connection error:', error);
      alert('Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const switchNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x' + POLYGON_AMOY_CHAIN_ID.toString(16) }],
      });
    } catch (error) {
      if (error.code === 4902) {
        alert('Please add Polygon Amoy network to MetaMask');
      }
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setContract(null);
    setNetworkId(null);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🌍 Carbon Credit MRV System</h1>
        <WalletConnect
          account={account}
          networkId={networkId}
          onConnect={connectWallet}
          onDisconnect={disconnectWallet}
          loading={loading}
        />
      </header>

      <main className="main">
        {!account ? (
          <div className="welcome">
            <h2>Welcome to Carbon Credit Tracking</h2>
            <p>Connect your wallet to get started</p>
          </div>
        ) : (
          <>
            <SubmitData contract={contract} account={account} provider={provider} />
            <Dashboard contract={contract} account={account} />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
