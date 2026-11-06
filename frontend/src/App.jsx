import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:5000/api/subscriptions';

export default function App() {
  const [data, setData] = useState({ summary: {}, patterns: { byPlan: [], byTenure: [], byReason: [] }, records: [] });
  const [filters, setFilters] = useState({ plan: '', tenureBand: '' });
  const [form, setForm] = useState({
    customerId: '',
    plan: 'Basic',
    tenureMonths: '',
    status: 'Active',
    cancellationReason: 'Not Applicable'
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const params = new URLSearchParams();
      if (filters.plan) params.append('plan', filters.plan);
      if (filters.tenureBand) params.append('tenureBand', filters.tenureBand);

      const res = await fetch(`${API_URL}?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch data');
      setData(json);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  const handleSeed = async () => {
    setErrorMsg('');
    setStatusMsg('');
    try {
      const res = await fetch(`${API_URL}/seed`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setStatusMsg(json.message);
      fetchDashboardData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setStatusMsg('');
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setStatusMsg(`Added record for ${json.data.customerId}`);
      setForm({ customerId: '', plan: 'Basic', tenureMonths: '', status: 'Active', cancellationReason: 'Not Applicable' });
      fetchDashboardData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      setLoading(true);
      setErrorMsg('');
      setStatusMsg('');
      try {
        const text = event.target.result;
        const rows = text.split('\n').filter(row => row.trim() !== '');
        const headers = rows[0].split(',').map(h => h.trim());

        const newRecords = [];
        for (let i = 1; i < rows.length; i++) {
          const values = rows[i].split(',');
          if (values.length === headers.length) {
            const record = {};
            headers.forEach((header, index) => {
              record[header] = values[index].trim();
            });
            newRecords.push(record);
          }
        }

        const res = await fetch(`${API_URL}/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newRecords)
        });
        
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        
        setStatusMsg(json.message || `Successfully uploaded ${json.count} records!`);
        fetchDashboardData();
      } catch (err) {
        setErrorMsg('Error processing CSV: ' + err.message);
      } finally {
        setLoading(false);
        e.target.value = null; // reset file input
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="container">
      <header className="header">
        <div>
          <h1>CustomerChurn Notebook</h1>
          <p className="subtitle">Customer Retention Pattern Explorer | VINAY S KUMAR (2102508684)</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          
          {/* STYLED FILE UPLOAD COMPONENT */}
          <label className="file-upload-label">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
              <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
            </svg>
            Upload CSV
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileUpload} 
              className="file-upload-input"
            />
          </label>

          <button className="btn-secondary" onClick={handleSeed}>Load / Reset Synthetic Dataset</button>
        </div>
      </header>

      <div className="disclaimer-banner">
        <strong>Observational Pattern Note:</strong> This notebook compares descriptive cancellation rates across subscription plans, tenure bands, and reported reasons. These figures represent historical associations and <em>do not claim causation</em>.
      </div>

      {errorMsg && <div className="alert error">{errorMsg}</div>}
      {statusMsg && <div className="alert success">{statusMsg}</div>}

      {/* Filter Bar */}
      <section className="filter-bar">
        <div className="filter-group">
          <label>Filter by Plan:</label>
          <select value={filters.plan} onChange={(e) => setFilters({ ...filters, plan: e.target.value })}>
            <option value="">All Plans</option>
            <option value="Basic">Basic</option>
            <option value="Standard">Standard</option>
            <option value="Premium">Premium</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Filter by Tenure Band:</label>
          <select value={filters.tenureBand} onChange={(e) => setFilters({ ...filters, tenureBand: e.target.value })}>
            <option value="">All Tenure Bands</option>
            <option value="0-3 Months">0-3 Months</option>
            <option value="4-12 Months">4-12 Months</option>
            <option value="12+ Months">12+ Months</option>
          </select>
        </div>
      </section>

      {/* KPI Summary Cards */}
      <section className="kpi-grid">
        <div className="kpi-card">
          <h3>Total Subscriptions</h3>
          <p className="kpi-value">{data.summary.totalRecords || 0}</p>
        </div>
        <div className="kpi-card">
          <h3>Active Customers</h3>
          <p className="kpi-value active-text">{data.summary.activeCount || 0}</p>
        </div>
        <div className="kpi-card">
          <h3>Cancelled Customers</h3>
          <p className="kpi-value cancel-text">{data.summary.cancelledCount || 0}</p>
        </div>
        <div className="kpi-card">
          <h3>Observed Cancel Rate</h3>
          <p className="kpi-value">{data.summary.overallCancelRate || 0}%</p>
        </div>
      </section>

      {/* Differentiating Feature: Comparative Pattern Explorer */}
      <section className="patterns-grid">
        <div className="card">
          <h2>Cancellation Rate by Plan</h2>
          {data.patterns.byPlan.map((item) => (
            <div key={item.plan} className="bar-row">
              <div className="bar-label">
                <span>{item.plan}</span>
                <span>{item.rate}% ({item.cancelled}/{item.total})</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill plan-fill" style={{ width: `${item.rate}%` }}></div>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <h2>Cancellation Rate by Tenure Band</h2>
          {data.patterns.byTenure.map((item) => (
            <div key={item.tenureBand} className="bar-row">
              <div className="bar-label">
                <span>{item.tenureBand}</span>
                <span>{item.rate}% ({item.cancelled}/{item.total})</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill tenure-fill" style={{ width: `${item.rate}%` }}></div>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <h2>Reported Cancellation Reasons</h2>
          {data.patterns.byReason.map((item) => (
            <div key={item.reason} className="bar-row">
              <div className="bar-label">
                <span>{item.reason}</span>
                <span>{item.shareOfCancelled}% ({item.count})</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill reason-fill" style={{ width: `${item.shareOfCancelled}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Add Record Form & Dataset Table */}
      <section className="bottom-grid">
        <div className="card">
          <h2>Log Subscription Record</h2>
          <form onSubmit={handleCreate} className="record-form">
            <label>Customer ID</label>
            <input
              type="text"
              placeholder="e.g. CUST-121"
              value={form.customerId}
              onChange={(e) => setForm({ ...form, customerId: e.target.value })}
              required
            />

            <label>Plan</label>
            <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
              <option value="Basic">Basic</option>
              <option value="Standard">Standard</option>
              <option value="Premium">Premium</option>
            </select>

            <label>Tenure (Months)</label>
            <input
              type="number"
              min="1"
              placeholder="e.g. 6"
              value={form.tenureMonths}
              onChange={(e) => setForm({ ...form, tenureMonths: e.target.value })}
              required
            />

            <label>Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({
                ...form,
                status: e.target.value,
                cancellationReason: e.target.value === 'Active' ? 'Not Applicable' : 'Too Expensive'
              })}
            >
              <option value="Active">Active</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            {form.status === 'Cancelled' && (
              <>
                <label>Cancellation Reason</label>
                <select
                  value={form.cancellationReason}
                  onChange={(e) => setForm({ ...form, cancellationReason: e.target.value })}
                >
                  <option value="Too Expensive">Too Expensive</option>
                  <option value="Missing Features">Missing Features</option>
                  <option value="Switched Competitor">Switched Competitor</option>
                  <option value="Technical Issues">Technical Issues</option>
                </select>
              </>
            )}

            <button type="submit" className="btn-primary">Add Record</button>
          </form>
        </div>

        <div className="card table-card">
          <h2>Subscription Dataset ({data.records.length} rows)</h2>
          {loading ? <p>Loading records...</p> : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Customer ID</th>
                    <th>Plan</th>
                    <th>Tenure (Mo)</th>
                    <th>Tenure Band</th>
                    <th>Status</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {data.records.map((r) => (
                    <tr key={r._id}>
                      <td>{r.customerId}</td>
                      <td>{r.plan}</td>
                      <td>{r.tenureMonths}</td>
                      <td>{r.tenureBand}</td>
                      <td>
                        <span className={`badge ${r.status === 'Active' ? 'badge-active' : 'badge-cancelled'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td>{r.cancellationReason}</td>
                    </tr>
                  ))}
                  {data.records.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center' }}>
                        No records found. Click "Load / Reset Synthetic Dataset" above to populate data.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}