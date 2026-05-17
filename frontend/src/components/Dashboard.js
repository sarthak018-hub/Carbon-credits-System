import React, { useState, useEffect } from 'react';

function Dashboard({ contract, account }) {
  const [userCredits, setUserCredits] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (contract && account) {
      loadUserData();
    }
  }, [contract, account]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const credits = await contract.getUserCredits(account);
      setUserCredits({
        active: credits.active.toString(),
        retired: credits.retired.toString(),
        transferred: credits.transferred.toString(),
      });
    } catch (error) {
      console.error('❌ Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const transferCredits = async () => {
    const recipient = prompt('Enter recipient address:');
    const amount = prompt('Enter amount to transfer:');

    if (!recipient || !amount) return;

    try {
      const tx = await contract.transferCredits(recipient, amount);
      await tx.wait();
      alert('✅ Transfer successful!');
      loadUserData();
    } catch (error) {
      alert(`❌ Transfer failed: ${error.message}`);
    }
  };

  const retireCredits = async () => {
    const amount = prompt('Enter amount to retire:');
    if (!amount) return;

    try {
      const tx = await contract.retireCredits(amount);
      await tx.wait();
      alert('✅ Retirement successful!');
      loadUserData();
    } catch (error) {
      alert(`❌ Retirement failed: ${error.message}`);
    }
  };

  return (
    <div className="card">
      <h2>📊 Your Dashboard</h2>

      {userCredits && (
        <div className="grid">
          <div style={{ padding: '15px', background: '#f0f4ff', borderRadius: '8px' }}>
            <h3 style={{ color: '#667eea' }}>Active Credits</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#667eea' }}>
              {userCredits.active}
            </p>
          </div>
          <div style={{ padding: '15px', background: '#f0f4ff', borderRadius: '8px' }}>
            <h3 style={{ color: '#667eea' }}>Retired Credits</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#667eea' }}>
              {userCredits.retired}
            </p>
          </div>
          <div style={{ padding: '15px', background: '#f0f4ff', borderRadius: '8px' }}>
            <h3 style={{ color: '#667eea' }}>Transferred Credits</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#667eea' }}>
              {userCredits.transferred}
            </p>
          </div>
        </div>
      )}

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button className="button" onClick={transferCredits} disabled={loading}>
          💸 Transfer Credits
        </button>
        <button className="button" onClick={retireCredits} disabled={loading}>
          🔥 Retire Credits
        </button>
        <button className="button" onClick={loadUserData} disabled={loading}>
          🔄 Refresh
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
