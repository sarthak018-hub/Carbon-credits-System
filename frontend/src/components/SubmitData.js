import React, { useState } from 'react';
import axios from 'axios';

function SubmitData({ contract, account, provider }) {
  const [formData, setFormData] = useState({
    description: '',
    creditsRequested: '',
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      if (!file) {
        alert('Please select a file');
        return;
      }

      if (!formData.creditsRequested || formData.creditsRequested <= 0) {
        alert('Please enter valid credits');
        return;
      }

      // Step 1: Upload to IPFS via backend
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const uploadRes = await axios.post(
        'http://localhost:3001/api/ipfs/upload',
        uploadFormData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      const { cid, fileHash } = uploadRes.data;

      // Step 2: Fraud detection
      const fraudRes = await axios.post(
        'http://localhost:3001/api/fraud/detect',
        {
          fileHash,
          creditsRequested: parseInt(formData.creditsRequested),
        }
      );

      if (fraudRes.data.isFraud) {
        setResult({
          type: 'error',
          message: `⚠️ Fraud Detected: ${fraudRes.data.reason}`,
        });
        return;
      }

      // Step 3: Submit to blockchain
      const tx = await contract.submitCarbonData(cid, parseInt(formData.creditsRequested));
      await tx.wait();

      setResult({
        type: 'success',
        message: `✅ Submission successful! CID: ${cid}`,
        cid,
        submissionId: tx.hash,
      });

      setFormData({ description: '', creditsRequested: '' });
      setFile(null);
    } catch (error) {
      console.error('❌ Error:', error);
      setResult({
        type: 'error',
        message: `Error: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>📤 Submit Carbon Data</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>File (PDF, CSV, or JSON)</label>
          <input
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.csv,.json"
            required
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describe your carbon reduction project..."
          />
        </div>

        <div className="form-group">
          <label>Carbon Credits Requested</label>
          <input
            type="number"
            name="creditsRequested"
            value={formData.creditsRequested}
            onChange={handleInputChange}
            placeholder="e.g., 1000"
            min="1"
            max="1000000"
            required
          />
        </div>

        <button type="submit" className="button" disabled={loading}>
          {loading ? 'Submitting...' : '🚀 Submit'}
        </button>
      </form>

      {result && (
        <div className={`alert ${result.type}`} style={{ marginTop: '15px' }}>
          {result.message}
          {result.cid && <div style={{ marginTop: '10px' }}>IPFS CID: {result.cid}</div>}
        </div>
      )}
    </div>
  );
}

export default SubmitData;
