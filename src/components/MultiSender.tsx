'use client'

import React, { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3ModalAccount, useWeb3ModalProvider } from '@web3modal/ethers/react';
import { ERC20_ABI, TOKENS, ETHEREUM_MAINNET, BASE_MAINNET } from '~/lib/constants/evm';

interface TokenAmount {
  token: string;
  amount: string;
}

interface Recipient {
  address: string;
  tokenAmounts: TokenAmount[];
}

const NETWORKS = {
  Ethereum: ETHEREUM_MAINNET,
  Base: BASE_MAINNET,
};

const MultiSender: React.FC = () => {
  const { address, isConnected } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<keyof typeof NETWORKS>('Ethereum');
  const [status, setStatus] = useState<string>('');
  const [newRecipient, setNewRecipient] = useState<Recipient>({ address: '', tokenAmounts: [] });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const getAvailableTokens = useCallback(() => {
    const usedTokens = new Set(newRecipient.tokenAmounts.map(ta => ta.token));
    return Object.keys(TOKENS[selectedNetwork]).filter(token => !usedTokens.has(token));
  }, [selectedNetwork, newRecipient.tokenAmounts]);

  const handleAddTokenRow = () => {
    const availableTokens = getAvailableTokens();
    if (availableTokens.length > 0) {
      setNewRecipient(prev => ({
        ...prev,
        tokenAmounts: [...prev.tokenAmounts, { token: availableTokens[0], amount: '' }]
      }));
    }
  };

  const handleRemoveTokenRow = (index: number) => {
    setNewRecipient(prev => ({
      ...prev,
      tokenAmounts: prev.tokenAmounts.filter((_, i) => i !== index)
    }));
  };

  const handleTokenChange = (index: number, token: string) => {
    setNewRecipient(prev => ({
      ...prev,
      tokenAmounts: prev.tokenAmounts.map((ta, i) => 
        i === index ? { ...ta, token } : ta
      )
    }));
  };

  const handleAmountChange = (index: number, amount: string) => {
    setNewRecipient(prev => ({
      ...prev,
      tokenAmounts: prev.tokenAmounts.map((ta, i) => 
        i === index ? { ...ta, amount } : ta
      )
    }));
  };

  const handleAddRecipient = () => {
    if (newRecipient.address && newRecipient.tokenAmounts.length > 0) {
      setRecipients(prev => [...prev, newRecipient]);
      setNewRecipient({ address: '', tokenAmounts: [] });
    }
  };

  const handleRemoveRecipient = (index: number) => {
    setRecipients(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditRecipient = (index: number) => {
    setNewRecipient(recipients[index]);
    setEditingIndex(index);
  };

  const handleUpdateRecipient = () => {
    if (editingIndex !== null && newRecipient.address && newRecipient.tokenAmounts.length > 0) {
      setRecipients(prev => prev.map((recipient, index) => 
        index === editingIndex ? newRecipient : recipient
      ));
      setNewRecipient({ address: '', tokenAmounts: [] });
      setEditingIndex(null);
    }
  };
  const handleCsvUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').slice(1);  // First column is address, rest are tokens
        const newRecipients: Recipient[] = lines.slice(1).map(line => {
          const [address, ...amounts] = line.split(',');
          const tokenAmounts: TokenAmount[] = [];
          headers.forEach((token, index) => {
            if (amounts[index] && amounts[index].trim() !== '') {
              tokenAmounts.push({ token: token.trim(), amount: amounts[index].trim() });
            }
          });
          return { address, tokenAmounts };
        });
        setRecipients(newRecipients);
      };
      reader.readAsText(file);
    }
  }, []);
  
  const handleExportCsv = () => {
    const tokens = Array.from(new Set(recipients.flatMap(r => r.tokenAmounts.map(ta => ta.token))));
    const csvContent = "data:text/csv;charset=utf-8," 
      + "address," + tokens.join(',') + "\n"
      + recipients.map(r => {
        const amounts = tokens.map(token => {
          const tokenAmount = r.tokenAmounts.find(ta => ta.token === token);
          return tokenAmount ? tokenAmount.amount : '';
        });
        return `${r.address},${amounts.join(',')}`;
      }).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "recipients.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMultiSend = async () => {
    setStatus('')
    if (!walletProvider || !isConnected) {
      setStatus('Please connect your wallet first.');
      return;
    }

    try {
      const ethersProvider = new ethers.BrowserProvider(walletProvider);
      const signer = await ethersProvider.getSigner();

      for (const recipient of recipients) {
        for (const { token, amount } of recipient.tokenAmounts) {
          const tokenInfo = TOKENS[selectedNetwork][token as keyof typeof TOKENS[typeof selectedNetwork]];

          if (tokenInfo.address) {
            // ERC20 token transfer
            const tokenContract = new ethers.Contract(tokenInfo.address, ERC20_ABI, signer);
            const tokenAmount = ethers.parseUnits(amount, tokenInfo.decimals);
            await tokenContract.transfer(recipient.address, tokenAmount);
          } else {
            // Native ETH transfer
            const tx = {
              to: recipient.address,
              value: ethers.parseEther(amount)
            };
            await signer.sendTransaction(tx);
          }
        }
      }

      setStatus('All transactions completed successfully.');
    } catch (error) {
      console.error('Multi-send error:', error);
      setStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="flex flex-col bg-gray-900">
    <div className="container mx-auto px-4 py-8 flex-grow overflow-hidden">
      <div className="max-w-3xl mx-auto space-y-6">
      {/* Network selection */}
      <select
        value={selectedNetwork}
        onChange={(e) => setSelectedNetwork(e.target.value as keyof typeof NETWORKS)}
        className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
      >
        {Object.keys(NETWORKS).map((network) => (
          <option key={network} value={network}>{network}</option>
        ))}
      </select>

      {/* Recipient input */}
      <div className="flex flex-col gap-2">
        <input
          type="text"
          placeholder="Recipient Address"
          value={newRecipient.address}
          onChange={(e) => setNewRecipient(prev => ({...prev, address: e.target.value}))}
          className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
        />
        
        {newRecipient.tokenAmounts.map((ta, index) => (
          <div key={index} className="flex gap-2">
            <select
              value={ta.token}
              onChange={(e) => handleTokenChange(index, e.target.value)}
              className="w-1/3 p-2 bg-gray-800 border border-gray-700 rounded text-white"
            >
              {[ta.token, ...getAvailableTokens()].map((token) => (
                <option key={token} value={token}>{token}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Amount"
              value={ta.amount}
              onChange={(e) => handleAmountChange(index, e.target.value)}
              className="w-1/3 p-2 bg-gray-800 border border-gray-700 rounded text-white"
            />
            <button
              onClick={() => handleRemoveTokenRow(index)}
              className="w-1/3 p-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Remove Token
            </button>
          </div>
        ))}

        <button
          onClick={handleAddTokenRow}
          disabled={getAvailableTokens().length === 0}
          className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-600"
        >
          Add Token
        </button>

        <button
          onClick={editingIndex !== null ? handleUpdateRecipient : handleAddRecipient}
          className="w-full p-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          {editingIndex !== null ? 'Update Recipient' : 'Add Recipient'}
        </button>
      </div>

      {/* Display recipients */}
      <div className="max-h-60 overflow-y-auto bg-gray-800 p-2 rounded">
        {recipients.map((recipient, index) => (
          <div key={index} className="mb-2 border-b border-gray-700 pb-2 flex justify-between items-start">
            <div>
              <span className="font-bold">{recipient.address}</span>
              {recipient.tokenAmounts.map((ta, i) => (
                <span key={i} className="ml-2 text-gray-300">{ta.token}: {ta.amount}</span>
              ))}
            </div>
            <div>
              <button
                onClick={() => handleEditRecipient(index)}
                className="px-2 py-1 mr-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                Edit
              </button>
              <button
                onClick={() => handleRemoveRecipient(index)}
                className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* File upload and export */}
      <div className="flex gap-2">
        <input
          type="file"
          accept=".csv"
          onChange={handleCsvUpload}
          className="flex-grow p-2 bg-gray-800 border border-gray-700 rounded text-white"
        />
        <button
          onClick={handleExportCsv}
          className="p-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Export CSV
        </button>
      </div>

      {/* Send tokens button */}
      <button
        onClick={handleMultiSend}
        disabled={!isConnected || recipients.length === 0}
        className="w-full p-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-600"
      >
        Send Tokens
      </button>

      {status && 
          <div className="mt-4 p-2 bg-gray-800 rounded">
          <p className="text-center text-yellow-400 break-words whitespace-normal overflow-hidden">
            {status}
          </p>
        </div>
      }
    </div>
    </div>
    </div>
  );
};

export default MultiSender;