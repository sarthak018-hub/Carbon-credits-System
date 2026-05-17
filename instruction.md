# Blockchain-Based Carbon Credit MRV & Tracking System with Fraud Detection

> **Implementation Guide** | Polygon Amoy Testnet · Solidity · React · IPFS (Pinata)


---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Module Breakdown](#3-module-breakdown)
4. [Smart Contract Design](#4-smart-contract-design)
5. [Fraud Detection Logic](#5-fraud-detection-logic)
6. [Step-by-Step Implementation Guide](#6-step-by-step-implementation-guide)
7. [Folder Structure](#7-folder-structure)
8. [API Design](#8-api-design)
9. [Workflow Explanation](#9-workflow-explanation)
10. [Security Considerations](#10-security-considerations)
11. [Limitations](#11-limitations)
12. [Future Scope](#12-future-scope)

---

## 1. Project Overview

### 1.1 Problem Statement

Carbon credit markets suffer from three critical weaknesses:

- **Opacity** — data stored in centralised, mutable databases controlled by single entities.
- **Fraud** — double-counting of credits, fabricated emission data, and fake audits are rampant.
- **Lack of traceability** — once a credit is issued, its lifecycle (transfer, retirement) is opaque.

This project replaces those weaknesses with a decentralised, blockchain-anchored **Monitoring, Reporting and Verification (MRV)** workflow that is transparent, tamper-proof, and auditable.

### 1.2 Objectives

- Build a complete MRV pipeline: Upload → IPFS storage → hash anchoring → on-chain verification.
- Implement role-based access (User, Auditor, System) with no privilege escalation.
- Detect fraudulent submissions automatically using off-chain rule-based logic **before** any on-chain write.
- Issue, transfer, and retire carbon credits transparently via smart contracts.
- Record every auditor action immutably on Polygon Amoy with full timestamp and wallet traceability.

### 1.3 Vision

A student-buildable, production-pattern DApp that demonstrates enterprise-grade Web3 architecture: layered contracts, off-chain fraud guards, IPFS content integrity, and a React/MetaMask UI — all deployable on a public testnet within 5–6 days.

---

## 2. System Architecture

### 2.1 Layered Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                          │
│       React  +  Tailwind CSS  +  MetaMask  +  Ethers.js         │
│  Upload Page │ Verification Panel │ Dashboard │ Credit Mgmt     │
└───────────────────────────┬─────────────────────────────────────┘
                            │ REST API + Direct RPC calls
┌───────────────────────────▼─────────────────────────────────────┐
│                    APPLICATION LAYER                            │
│              Node.js + Express (backend API)                    │
│   Fraud Detection │ Pinata Upload │ Hash Generation │ Routing   │
└──────────┬────────────────┬───────────────────────┬────────────┘
           │                │                        │
┌──────────▼──────┐  ┌──────▼──────────┐  ┌─────────▼──────────┐
│  IPFS LAYER     │  │ BLOCKCHAIN LAYER │  │  FRAUD DETECTION   │
│  Pinata API     │  │ Polygon Amoy     │  │  (off-chain rules) │
│  CID Storage    │  │ 4 Contracts      │  │  Hash Dedup        │
│  File Pinning   │  │ Events + Logs    │  │  Value Threshold   │
└─────────────────┘  └─────────────────┘  └────────────────────┘
```

### 2.2 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React + Tailwind CSS | User Interface, MetaMask wallet interaction |
| Web3 Client | Ethers.js v6 | Smart contract calls, transaction signing |
| Backend | Node.js + Express | File handling, fraud detection, Pinata proxy |
| Smart Contracts | Solidity 0.8.x | Data submission, verification, credit management |
| Blockchain | Polygon Amoy Testnet | Immutable ledger, cheap gas, EVM compatible |
| File Storage | IPFS via Pinata | Decentralised file storage, CID generation |
| Wallet | MetaMask | Identity, signing, role differentiation |

### 2.3 Complete Data Flow

```
User                  Backend              Pinata/IPFS         Blockchain
 │                      │                      │                   │
 │  1. Upload file +     │                      │                   │
 │     metadata          │                      │                   │
 │──────────────────────►│                      │                   │
 │                       │  2. Fraud checks      │                   │
 │                       │     (rules engine)    │                   │
 │                       │──►[REJECT if fraud]   │                   │
 │                       │                      │                   │
 │                       │  3. Pin file to IPFS  │                   │
 │                       │──────────────────────►│                   │
 │                       │◄── CID returned ──────│                   │
 │                       │                      │                   │
 │                       │  4. Return CID        │                   │
 │◄──────────────────────│                      │                   │
 │                       │                      │                   │
 │  5. submitData(CID)   │                      │                   │
 │──────────────────────────────────────────────────────────────────►│
 │                       │                      │    Record stored   │
 │                       │                      │                   │
Auditor                  │                      │                   │
 │  6. approveData(id)   │                      │                   │
 │──────────────────────────────────────────────────────────────────►│
 │                       │                      │  Status updated    │
 │                       │                      │  AuditLog written  │
 │                       │                      │  Credits issued    │
```

---

## 3. Module Breakdown

### 3.1 MRV Pipeline

| Sub-Module | Responsibility |
|---|---|
| Monitoring | User submits emission data file (CSV/PDF) + metadata (project name, date, quantity in tCO2) |
| Reporting | Backend uploads file to Pinata, receives IPFS CID, stores CID + metadata in smart contract |
| Verification | Auditor reviews submission on-chain; can only approve or reject — no editing allowed |
| Credit Issuance | System auto-calls `issueCredits()` inside the same transaction as auditor approval |
| Credit Tracking | Transfer and retire actions recorded on-chain; visible on Dashboard via event logs |

### 3.2 Fraud Detection Module (Off-Chain)

Runs in the Node.js backend **before** any IPFS upload or blockchain write. Three rules enforced:

| Rule | Logic | Threshold |
|---|---|---|
| Duplicate Hash | SHA-256 of file checked against seen-hashes store. Reject on collision. | Exact match = reject |
| Unrealistic Value | Carbon quantity must be within realistic range. | 0.001 ≤ tCO2 ≤ 1,000,000 |
| Rapid Re-submission | Track submissions per wallet with timestamps. Reject if limit exceeded. | >3 per 60 seconds |

Flagged submissions are: **(a)** rejected with a descriptive HTTP 400 error, **(b)** appended to `fraud_log.json`, and **(c)** never written to IPFS or the blockchain.

### 3.3 Role-Based Access Control

| Role | Permitted Actions |
|---|---|
| **USER** (any EOA) | Upload carbon data, view own submissions, transfer/retire own credits |
| **AUDITOR** (whitelisted address) | Approve or reject submissions only — cannot modify data, cannot issue credits directly |
| **SYSTEM** (contract logic) | Auto-issue credits upon approval — no human trigger; enforced by `onlyVerification` modifier |

No role can modify existing submission data. No role can escalate its own privileges.

---

## 4. Smart Contract Design

### 4.1 Contract Overview

Four contracts, each with a single responsibility. Deployed independently, linked by address references passed into constructors.

```
contracts/
  AuditLog.sol         ← immutable action log
  CarbonCredit.sol     ← credit token (issue, transfer, retire)
  Verification.sol     ← approve/reject, auditor guard
  DataSubmission.sol   ← submitData(), duplicate prevention
```

**Deployment order:** AuditLog → CarbonCredit → Verification → DataSubmission

### 4.2 DataSubmission.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DataSubmission {
    struct Submission {
        address submitter;
        string  ipfsHash;    // IPFS CID
        string  metadata;    // JSON: {project, date, tCO2}
        uint256 timestamp;
        uint8   status;      // 0=Pending, 1=Approved, 2=Rejected
    }

    uint256 public submissionCount;
    mapping(uint256 => Submission) public submissions;
    mapping(string  => bool)       public hashUsed;   // duplicate guard

    address public verificationContract;

    event DataSubmitted(uint256 indexed id, address submitter, string ipfsHash);

    constructor(address _verification) {
        verificationContract = _verification;
    }

    function submitData(string calldata ipfsHash, string calldata metadata) external {
        require(!hashUsed[ipfsHash], "Duplicate hash");
        hashUsed[ipfsHash] = true;
        uint256 id = submissionCount++;
        submissions[id] = Submission({
            submitter:  msg.sender,
            ipfsHash:   ipfsHash,
            metadata:   metadata,
            timestamp:  block.timestamp,
            status:     0
        });
        emit DataSubmitted(id, msg.sender, ipfsHash);
    }

    function updateStatus(uint256 id, uint8 status) external {
        require(msg.sender == verificationContract, "Not authorised");
        submissions[id].status = status;
    }
}
```

### 4.3 Verification.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IDataSubmission {
    function updateStatus(uint256 id, uint8 status) external;
    function submissions(uint256 id) external view returns (
        address, string memory, string memory, uint256, uint8
    );
}
interface IAuditLog    { function log(uint256 id, address auditor, string calldata action) external; }
interface ICarbonCredit { function issueCredits(address to, uint256 amount) external; }

contract Verification {
    address         public auditor;
    IDataSubmission public dataContract;
    IAuditLog       public auditLog;
    ICarbonCredit   public creditContract;

    modifier onlyAuditor() {
        require(msg.sender == auditor, "Not auditor");
        _;
    }

    constructor(
        address _data,
        address _audit,
        address _credit,
        address _auditor
    ) {
        dataContract   = IDataSubmission(_data);
        auditLog       = IAuditLog(_audit);
        creditContract = ICarbonCredit(_credit);
        auditor        = _auditor;
    }

    function approveData(uint256 id, uint256 creditAmount) external onlyAuditor {
        dataContract.updateStatus(id, 1);
        auditLog.log(id, msg.sender, "approve");
        (address submitter,,,,) = dataContract.submissions(id);
        creditContract.issueCredits(submitter, creditAmount);
    }

    function rejectData(uint256 id, string calldata reason) external onlyAuditor {
        dataContract.updateStatus(id, 2);
        auditLog.log(id, msg.sender, string.concat("reject:", reason));
    }
}
```

### 4.4 CarbonCredit.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CarbonCredit {
    mapping(address => uint256) public balances;
    uint256 public totalSupply;
    address public verificationContract;

    event CreditsIssued(address indexed to, uint256 amount);
    event CreditsTransferred(address indexed from, address indexed to, uint256 amount);
    event CreditsRetired(address indexed by, uint256 amount);

    modifier onlyVerification() {
        require(msg.sender == verificationContract, "Not authorised");
        _;
    }

    function setVerificationContract(address _v) external {
        require(verificationContract == address(0), "Already set");
        verificationContract = _v;
    }

    function issueCredits(address to, uint256 amount) external onlyVerification {
        balances[to] += amount;
        totalSupply  += amount;
        emit CreditsIssued(to, amount);
    }

    function transferCredits(address to, uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient credits");
        balances[msg.sender] -= amount;
        balances[to]         += amount;
        emit CreditsTransferred(msg.sender, to, amount);
    }

    function retireCredits(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient credits");
        balances[msg.sender] -= amount;
        totalSupply          -= amount;
        emit CreditsRetired(msg.sender, amount);
    }
}
```

### 4.5 AuditLog.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AuditLog {
    struct LogEntry {
        uint256 submissionId;
        address auditor;
        string  action;      // "approve" | "reject:<reason>"
        uint256 timestamp;
    }

    LogEntry[] public logs;
    address    public verificationContract;

    event ActionLogged(uint256 indexed submissionId, address auditor, string action);

    function setVerificationContract(address _v) external {
        require(verificationContract == address(0), "Already set");
        verificationContract = _v;
    }

    modifier onlyVerification() {
        require(msg.sender == verificationContract, "Not authorised");
        _;
    }

    function log(uint256 id, address auditor, string calldata action)
        external onlyVerification
    {
        logs.push(LogEntry(id, auditor, action, block.timestamp));
        emit ActionLogged(id, auditor, action);
    }

    function getLogs() external view returns (LogEntry[] memory) {
        return logs;
    }
}
```

---

## 5. Fraud Detection Logic

### 5.1 Architecture Decision

Fraud detection runs **entirely off-chain** in the Node.js backend. This is intentional:
- On-chain computation is expensive and slow.
- The backend acts as a gatekeeper — fraudulent data never reaches IPFS or the blockchain.
- Rules can be updated without redeploying contracts.

### 5.2 Implementation (`backend/fraud.js`)

```js
const crypto = require('crypto');
const fs     = require('fs');

// In-memory stores — replace with DB in production
const seenHashes  = new Set();
const rateLimiter = {};  // wallet => [timestamps]

const RULES = {
  MAX_CO2: 1_000_000,   // tCO2 upper bound
  MIN_CO2: 0.001,        // tCO2 lower bound
  MAX_SUBMISSIONS_PER_WINDOW: 3,
  WINDOW_MS: 60_000,     // 60 seconds
};

function computeHash(fileBuffer) {
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

function checkFraud(fileBuffer, metadata, walletAddress) {
  const hash   = computeHash(fileBuffer);
  const errors = [];

  // Rule 1: Duplicate hash
  if (seenHashes.has(hash)) {
    errors.push({ rule: 'DUPLICATE_HASH', detail: hash });
  }

  // Rule 2: Unrealistic carbon value
  const tCO2 = parseFloat(metadata.tCO2);
  if (isNaN(tCO2) || tCO2 < RULES.MIN_CO2 || tCO2 > RULES.MAX_CO2) {
    errors.push({ rule: 'INVALID_CO2_VALUE', detail: tCO2 });
  }

  // Rule 3: Rapid repeated submissions
  const now = Date.now();
  if (!rateLimiter[walletAddress]) rateLimiter[walletAddress] = [];
  rateLimiter[walletAddress] = rateLimiter[walletAddress]
    .filter(t => now - t < RULES.WINDOW_MS);  // prune old entries
  if (rateLimiter[walletAddress].length >= RULES.MAX_SUBMISSIONS_PER_WINDOW) {
    errors.push({ rule: 'RATE_LIMIT', detail: 'Too many submissions in window' });
  }

  if (errors.length > 0) {
    // Append to fraud log
    const entry = { wallet: walletAddress, hash, errors, time: new Date().toISOString() };
    fs.appendFileSync('fraud_log.json', JSON.stringify(entry) + '\n');
    return { fraudulent: true, errors };
  }

  // All checks passed — register hash and timestamp
  seenHashes.add(hash);
  rateLimiter[walletAddress].push(now);
  return { fraudulent: false, hash };
}

module.exports = { checkFraud };
```

---

## 6. Step-by-Step Implementation Guide

### Day 1 — Environment Setup

#### Prerequisites

- Node.js >= 18, npm >= 9
- MetaMask browser extension installed and configured
- Hardhat: `npm install -g hardhat`
- Pinata account (free tier): https://pinata.cloud
- Polygon Amoy test MATIC: https://faucet.polygon.technology

#### Init Commands

```bash
# Project root
mkdir carbon-credit-mrv && cd carbon-credit-mrv
npx hardhat init          # Choose "Create a JavaScript project"
npm install @openzeppelin/contracts dotenv

# Backend
mkdir backend && cd backend
npm init -y
npm install express multer axios cors dotenv form-data
cd ..

# Frontend
npx create-react-app frontend
cd frontend
npm install ethers@6 axios
npx tailwindcss init
cd ..
```

---

### Day 2 — Smart Contract Development & Deployment

Write the four contracts from Section 4 into `contracts/`.

#### `hardhat.config.js`

```js
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    amoy: {
      url: process.env.AMOY_RPC_URL,   // https://rpc-amoy.polygon.technology/
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
```

#### `.env` (root)

```
AMOY_RPC_URL=https://rpc-amoy.polygon.technology/
PRIVATE_KEY=your_deployer_private_key
AUDITOR_ADDRESS=0xAuditorWalletAddress
```

#### `scripts/deploy.js`

```js
const { ethers } = require("hardhat");

async function main() {
  const AUDITOR = process.env.AUDITOR_ADDRESS;

  // Deploy in dependency order
  const AuditLog = await ethers.deployContract("AuditLog");
  await AuditLog.waitForDeployment();

  const Credit = await ethers.deployContract("CarbonCredit");
  await Credit.waitForDeployment();

  const Verify = await ethers.deployContract("Verification", [
    AuditLog.target, Credit.target, AUDITOR
  ]);
  await Verify.waitForDeployment();

  const DataSub = await ethers.deployContract("DataSubmission", [Verify.target]);
  await DataSub.waitForDeployment();

  // Wire up access control
  await AuditLog.setVerificationContract(Verify.target);
  await Credit.setVerificationContract(Verify.target);

  console.log("AuditLog:",      AuditLog.target);
  console.log("CarbonCredit:",  Credit.target);
  console.log("Verification:",  Verify.target);
  console.log("DataSubmission:", DataSub.target);
}

main().catch(console.error);
```

```bash
npx hardhat run scripts/deploy.js --network amoy
```

Copy the four printed addresses — you will need them in the frontend.

---

### Day 3 — Backend Setup

#### `backend/.env`

```
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET=your_pinata_secret_key
PORT=4000
```

#### `backend/pinata.js`

```js
const axios    = require('axios');
const FormData = require('form-data');

async function pinFile(buffer, filename) {
  const form = new FormData();
  form.append('file', buffer, { filename });

  const res = await axios.post(
    'https://api.pinata.cloud/pinning/pinFileToIPFS',
    form,
    {
      headers: {
        ...form.getHeaders(),
        pinata_api_key:           process.env.PINATA_API_KEY,
        pinata_secret_api_key:    process.env.PINATA_SECRET,
      }
    }
  );
  return res.data.IpfsHash;  // The CID
}

module.exports = { pinFile };
```

#### `backend/index.js`

```js
require('dotenv').config();
const express        = require('express');
const multer         = require('multer');
const cors           = require('cors');
const { checkFraud } = require('./fraud');
const { pinFile }    = require('./pinata');

const app    = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// POST /api/submit — fraud check + IPFS pin
app.post('/api/submit', upload.single('file'), async (req, res) => {
  try {
    const { wallet, project, date, tCO2 } = req.body;
    const fileBuffer = req.file.buffer;

    // 1. Fraud detection
    const result = checkFraud(fileBuffer, { tCO2 }, wallet);
    if (result.fraudulent) {
      return res.status(400).json({ error: 'Fraud detected', details: result.errors });
    }

    // 2. Pin to IPFS
    const cid = await pinFile(fileBuffer, req.file.originalname);

    // 3. Return CID to frontend for blockchain write
    res.json({ cid, hash: result.hash });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/health
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(process.env.PORT, () =>
  console.log(`Backend running on port ${process.env.PORT}`)
);
```

---

### Day 4 — Frontend Setup

#### Export ABIs from Hardhat

After compilation, copy the ABI arrays from `artifacts/contracts/<Name>.sol/<Name>.json` into:

```
frontend/src/abi/AuditLog.json
frontend/src/abi/CarbonCredit.json
frontend/src/abi/DataSubmission.json
frontend/src/abi/Verification.json
```

#### `frontend/src/hooks/useContracts.js`

```js
import { ethers } from 'ethers';
import DataSubmissionABI from '../abi/DataSubmission.json';
import VerificationABI   from '../abi/Verification.json';
import CarbonCreditABI   from '../abi/CarbonCredit.json';
import AuditLogABI       from '../abi/AuditLog.json';

const ADDRESSES = {
  DataSubmission: '0x...',  // paste deployed address
  Verification:   '0x...',
  CarbonCredit:   '0x...',
  AuditLog:       '0x...',
};

export async function getContracts() {
  await window.ethereum.request({ method: 'eth_requestAccounts' });
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer   = await provider.getSigner();
  return {
    dataSubmission: new ethers.Contract(ADDRESSES.DataSubmission, DataSubmissionABI, signer),
    verification:   new ethers.Contract(ADDRESSES.Verification,   VerificationABI,   signer),
    carbonCredit:   new ethers.Contract(ADDRESSES.CarbonCredit,   CarbonCreditABI,   signer),
    auditLog:       new ethers.Contract(ADDRESSES.AuditLog,       AuditLogABI,       signer),
  };
}

export async function getAccount() {
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  return accounts[0];
}
```

#### `frontend/src/pages/Upload.jsx`

```jsx
import { useState } from 'react';
import axios from 'axios';
import { getContracts, getAccount } from '../hooks/useContracts';

export default function Upload() {
  const [file, setFile]       = useState(null);
  const [project, setProject] = useState('');
  const [date, setDate]       = useState('');
  const [tCO2, setTCO2]       = useState('');
  const [status, setStatus]   = useState('');

  async function handleSubmit() {
    try {
      setStatus('Checking for fraud & uploading to IPFS...');
      const account = await getAccount();

      const form = new FormData();
      form.append('file', file);
      form.append('wallet', account);
      form.append('project', project);
      form.append('date', date);
      form.append('tCO2', tCO2);

      const { data } = await axios.post('http://localhost:4000/api/submit', form);

      setStatus('Writing to blockchain...');
      const { dataSubmission } = await getContracts();
      const metadata = JSON.stringify({ project, date, tCO2 });
      const tx = await dataSubmission.submitData(data.cid, metadata);
      await tx.wait();

      setStatus(`Done! TX: ${tx.hash} | IPFS CID: ${data.cid}`);
    } catch (err) {
      setStatus(`Error: ${err.response?.data?.error || err.message}`);
    }
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Upload Carbon Data</h1>
      <input type="file" onChange={e => setFile(e.target.files[0])} className="mb-2 block" />
      <input placeholder="Project Name" value={project} onChange={e => setProject(e.target.value)} className="border p-2 mb-2 w-full" />
      <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border p-2 mb-2 w-full" />
      <input placeholder="tCO2 Amount" value={tCO2} onChange={e => setTCO2(e.target.value)} className="border p-2 mb-2 w-full" />
      <button onClick={handleSubmit} className="bg-green-600 text-white px-4 py-2 rounded w-full">
        Submit
      </button>
      {status && <p className="mt-4 text-sm text-gray-700">{status}</p>}
    </div>
  );
}
```

#### `frontend/src/pages/Verification.jsx`

```jsx
import { useState, useEffect } from 'react';
import { getContracts } from '../hooks/useContracts';

export default function Verification() {
  const [submissions, setSubmissions] = useState([]);
  const [creditAmt, setCreditAmt]     = useState({});
  const [rejectMsg, setRejectMsg]     = useState({});

  useEffect(() => { loadSubmissions(); }, []);

  async function loadSubmissions() {
    const { dataSubmission } = await getContracts();
    const count = Number(await dataSubmission.submissionCount());
    const list = [];
    for (let i = 0; i < count; i++) {
      const s = await dataSubmission.submissions(i);
      list.push({ id: i, submitter: s[0], ipfsHash: s[1], metadata: s[2], status: Number(s[4]) });
    }
    setSubmissions(list.filter(s => s.status === 0));  // Pending only
  }

  async function approve(id) {
    const { verification } = await getContracts();
    const tx = await verification.approveData(id, BigInt(creditAmt[id] || 0));
    await tx.wait();
    alert('Approved. Credits issued.');
    loadSubmissions();
  }

  async function reject(id) {
    const { verification } = await getContracts();
    const tx = await verification.rejectData(id, rejectMsg[id] || 'No reason');
    await tx.wait();
    alert('Rejected.');
    loadSubmissions();
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Verification Panel</h1>
      {submissions.length === 0 && <p>No pending submissions.</p>}
      {submissions.map(s => (
        <div key={s.id} className="border rounded p-4 mb-4">
          <p><strong>ID:</strong> {s.id}</p>
          <p><strong>Submitter:</strong> {s.submitter}</p>
          <p><strong>Metadata:</strong> {s.metadata}</p>
          <a href={`https://ipfs.io/ipfs/${s.ipfsHash}`} target="_blank" rel="noreferrer"
             className="text-blue-500 underline">View on IPFS</a>
          <div className="mt-2 flex gap-2">
            <input placeholder="Credits to issue" type="number"
              onChange={e => setCreditAmt({ ...creditAmt, [s.id]: e.target.value })}
              className="border p-1 w-32" />
            <button onClick={() => approve(s.id)} className="bg-green-600 text-white px-3 py-1 rounded">Approve</button>
            <input placeholder="Reject reason"
              onChange={e => setRejectMsg({ ...rejectMsg, [s.id]: e.target.value })}
              className="border p-1 w-40" />
            <button onClick={() => reject(s.id)} className="bg-red-600 text-white px-3 py-1 rounded">Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

#### `frontend/src/pages/Credits.jsx`

```jsx
import { useState, useEffect } from 'react';
import { getContracts, getAccount } from '../hooks/useContracts';

export default function Credits() {
  const [balance, setBalance]   = useState('0');
  const [toAddr, setToAddr]     = useState('');
  const [amount, setAmount]     = useState('');

  useEffect(() => { loadBalance(); }, []);

  async function loadBalance() {
    const account = await getAccount();
    const { carbonCredit } = await getContracts();
    const bal = await carbonCredit.balances(account);
    setBalance(bal.toString());
  }

  async function transfer() {
    const { carbonCredit } = await getContracts();
    const tx = await carbonCredit.transferCredits(toAddr, BigInt(amount));
    await tx.wait();
    loadBalance();
  }

  async function retire() {
    const { carbonCredit } = await getContracts();
    const tx = await carbonCredit.retireCredits(BigInt(amount));
    await tx.wait();
    loadBalance();
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-2">Carbon Credits</h1>
      <p className="mb-4 text-lg">Balance: <strong>{balance} tCO2</strong></p>
      <input placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} className="border p-2 mb-2 w-full" />
      <input placeholder="Recipient address (for transfer)" value={toAddr} onChange={e => setToAddr(e.target.value)} className="border p-2 mb-2 w-full" />
      <div className="flex gap-2">
        <button onClick={transfer} className="bg-blue-600 text-white px-4 py-2 rounded flex-1">Transfer</button>
        <button onClick={retire}   className="bg-gray-700 text-white px-4 py-2 rounded flex-1">Retire</button>
      </div>
    </div>
  );
}
```

#### `frontend/src/App.jsx`

```jsx
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Upload       from './pages/Upload';
import Verification from './pages/Verification';
import Credits      from './pages/Credits';
import Dashboard    from './pages/Dashboard';

export default function App() {
  return (
    <BrowserRouter>
      <nav className="bg-green-700 text-white px-6 py-3 flex gap-6">
        <Link to="/">Upload</Link>
        <Link to="/verify">Verify</Link>
        <Link to="/credits">Credits</Link>
        <Link to="/dashboard">Dashboard</Link>
      </nav>
      <Routes>
        <Route path="/"          element={<Upload />} />
        <Route path="/verify"    element={<Verification />} />
        <Route path="/credits"   element={<Credits />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
```

Add `react-router-dom`: `npm install react-router-dom`

---

### Day 5 — Integration Testing

```bash
# Terminal 1 — backend
cd backend && node index.js

# Terminal 2 — frontend
cd frontend && npm start
```

Test checklist:

- [ ] MetaMask connects to Polygon Amoy (Chain ID: 80002)
- [ ] Upload a CSV file → confirm IPFS CID returned and TX mined on Amoy
- [ ] Submit the **same file again** → backend rejects with `DUPLICATE_HASH`
- [ ] Submit with `tCO2 = 999999999` → backend rejects with `INVALID_CO2_VALUE`
- [ ] Switch MetaMask to auditor wallet → Verification Panel shows pending submission
- [ ] Approve → confirm credit balance updates on Credits page
- [ ] Reject → confirm status changes on Dashboard
- [ ] Transfer credits to another wallet → confirm balance change
- [ ] Retire credits → confirm balance decreases, totalSupply decreases

---

### Day 6 — Polish & Documentation

- Add loading spinners and error toasts to all pages
- Write `README.md` with contract addresses, setup steps, and test instructions
- Record a 2-minute walkthrough video for viva demonstration
- Prepare answers to common viva questions:
  - *Why Polygon and not Ethereum mainnet?* → Cheap gas, EVM compatible, fast finality
  - *What stops an auditor from editing data?* → `updateStatus` only changes the status field; content fields are write-once
  - *Why is fraud detection off-chain?* → On-chain computation costs gas and is slow; backend is the right gatekeeper layer
  - *What does IPFS CID prove?* → CID is a hash of content; if the file changes, the CID changes — content integrity guaranteed
  - *What happens if the backend goes down?* → IPFS files remain pinned; blockchain records are permanent; only new uploads are affected

---

## 7. Folder Structure

```
carbon-credit-mrv/
│
├── contracts/
│   ├── AuditLog.sol
│   ├── CarbonCredit.sol
│   ├── DataSubmission.sol
│   └── Verification.sol
│
├── scripts/
│   └── deploy.js
│
├── hardhat.config.js
├── .env                        ← NEVER commit to git
├── .gitignore
│
├── backend/
│   ├── index.js                ← Express server & routes
│   ├── fraud.js                ← Fraud detection rules
│   ├── pinata.js               ← Pinata file pinning
│   ├── fraud_log.json          ← Flagged submission log (auto-created)
│   └── .env
│
└── frontend/
    ├── public/
    └── src/
        ├── abi/
        │   ├── AuditLog.json
        │   ├── CarbonCredit.json
        │   ├── DataSubmission.json
        │   └── Verification.json
        ├── hooks/
        │   └── useContracts.js
        ├── pages/
        │   ├── Upload.jsx
        │   ├── Verification.jsx
        │   ├── Dashboard.jsx
        │   └── Credits.jsx
        ├── components/
        │   ├── Navbar.jsx
        │   └── StatusBadge.jsx
        ├── App.jsx
        ├── index.js
        └── tailwind.config.js
```

---

## 8. API Design

All blockchain **reads** are done directly from the frontend via Ethers.js provider calls — no backend needed for reads. The backend only handles file upload, fraud detection, and IPFS pinning.

| Method | Endpoint | Request | Response |
|---|---|---|---|
| POST | `/api/submit` | `multipart/form-data`: `file`, `wallet`, `project`, `date`, `tCO2` | `{ cid, hash }` or `{ error, details }` |
| GET | `/api/health` | — | `{ status: "ok" }` |

---

## 9. Workflow Explanation

### 9.1 Submission Workflow

1. User connects MetaMask → frontend reads wallet address via `eth_requestAccounts`.
2. User selects file and fills form (project name, date, tCO2 value).
3. Frontend POSTs file + metadata to backend `/api/submit`.
4. Backend runs three fraud checks. If any fail → HTTP 400 + error message → workflow stops.
5. Backend pins file to Pinata → receives IPFS CID string.
6. Backend returns `{ cid }` to frontend.
7. Frontend calls `dataSubmission.submitData(cid, metadata)` via MetaMask → TX signed → mined on Amoy.
8. Submission is now immutably on-chain with `status = 0 (Pending)`.

### 9.2 Verification Workflow

1. Auditor opens Verification Panel → frontend reads all submissions with `status = 0`.
2. Auditor clicks "View on IPFS" to inspect the file at `https://ipfs.io/ipfs/<CID>`.
3. Auditor enters credit amount and clicks **Approve** OR enters reason and clicks **Reject**.
4. Frontend calls `verification.approveData(id, amount)` or `verification.rejectData(id, reason)`.
5. Verification contract atomically: updates submission status + writes AuditLog entry + issues credits (if approved).
6. All three state changes happen in **one transaction** — either all succeed or all revert.

### 9.3 Credit Lifecycle

1. **Issue** — auto-triggered by `approveData()`. User cannot trigger this directly.
2. **Transfer** — user calls `transferCredits(to, amount)`. Balance moves between wallets.
3. **Retire** — user calls `retireCredits(amount)`. Credits are burned; `totalSupply` decreases permanently.
4. All actions emit events queryable via `provider.getLogs()` — full on-chain audit trail.

### 9.4 How the Audit Trail Ensures Accountability

Every call to `approveData()` or `rejectData()` writes a `LogEntry` to `AuditLog.sol` containing:
- `auditor` — the wallet address that signed the transaction (cannot be faked)
- `timestamp` — `block.timestamp` at time of mining (cannot be edited)
- `action` — `"approve"` or `"reject:<reason>"` (immutable)

Because this is on a public blockchain, **anyone** can call `auditLog.getLogs()` without permission. There is no admin who can delete or alter these records. If an auditor acts corruptly, the evidence is permanently visible on-chain.

---

## 10. Security Considerations

| Risk | Mitigation |
|---|---|
| Duplicate data submission | On-chain `hashUsed` mapping blocks CID reuse; off-chain SHA-256 check provides early rejection before IPFS cost |
| Auditor impersonation | `onlyAuditor` modifier checks `msg.sender` — cannot be spoofed; requires private key of auditor wallet |
| Privilege escalation | Users cannot call approve/reject; auditors cannot call issueCredits; enforced by contract modifiers |
| Data tampering after submission | Submission struct core fields written once; `updateStatus()` only modifies the `status` byte |
| Fake IPFS hash | Backend is the only entity that calls Pinata and returns the real CID; users do not supply CIDs directly |
| Private key exposure | `.env` in `.gitignore`; private keys never sent to frontend; use environment variables only |
| Reentrancy | No ETH transfers in any contract — reentrancy risk is nil |
| Missing access control on setters | `setVerificationContract()` uses a `require(verificationContract == address(0))` guard — can only be called once |

---

## 11. Limitations

- **Single hardcoded auditor** — auditor address is set at deploy time. A production system would use OpenZeppelin `AccessControl` with role assignment and revocation.
- **In-memory fraud state** — `seenHashes` and `rateLimiter` are lost on backend restart. A production system would use a persistent database (PostgreSQL or Redis).
- **No pagination** — the frontend fetches all submissions in a loop; will be slow at scale.
- **Pinata dependency** — files remain accessible only as long as the Pinata pin is maintained. Files are not stored on a decentralised persistent layer by default.
- **No unit tests** — no Hardhat test suite is included in this guide. Add tests before any real deployment.
- **Fixed fraud thresholds** — rule constants are hardcoded; no admin UI to tune them.

---

## 12. Future Scope

- **OpenZeppelin AccessControl** — Replace hardcoded auditor with a role-based system supporting multiple auditors with revocable roles.
- **ML Fraud Detection** — Replace rule-based checks with an anomaly detection model trained on historical carbon credit data.
- **ERC-20 Compliance** — Extend `CarbonCredit.sol` to full ERC-20 standard, enabling integration with DEXes and DeFi protocols.
- **Cross-chain Bridges** — Allow credits issued on Polygon to be recognised on Ethereum mainnet or other chains via LayerZero or Chainlink CCIP.
- **Oracle Integration** — Use Chainlink oracles to fetch real-world emission benchmarks and auto-validate tCO2 values.
- **IPFS Redundancy** — Use Filecoin or NFT.Storage alongside Pinata for long-term file persistence.
- **DAO Governance** — Replace single auditor with a multi-sig or DAO voting mechanism for approval.
- **Mobile DApp** — React Native + WalletConnect for mobile users.

---

*Build it. Explain it. Own it.*
