'use client';

import { useState } from 'react';
import Link from 'next/link';
import { UserPlus, CheckCircle2, AlertCircle, ArrowLeft, Shield, Building2, Phone, User, MapPin, Award } from 'lucide-react';

export default function StaffAddUserPage() {
  const [employeeId, setEmployeeId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [location, setLocation] = useState('');
  const [businessType, setBusinessType] = useState('Manufacturer');
  const [email, setEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [resultData, setResultData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employeeId.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter your Employee ID to receive onboarding score credit.' });
      return;
    }
    if (!firstName.trim() || !phone.trim()) {
      setStatusMsg({ type: 'error', text: 'Seller First Name and Phone Number are required.' });
      return;
    }

    setLoading(true);
    setStatusMsg(null);
    setResultData(null);

    try {
      const res = await fetch('/api/admin/staff/onboard-seller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: employeeId.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          companyName: companyName.trim(),
          location: location.trim(),
          businessType,
          email: email.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg({ type: 'success', text: data.message || 'Seller onboarded successfully!' });
        setResultData(data);
        // Reset seller fields, preserve employeeId for fast next entry
        setFirstName('');
        setLastName('');
        setPhone('');
        setCompanyName('');
        setLocation('');
        setEmail('');
      } else {
        setStatusMsg({ type: 'error', text: data.message || 'Failed to onboard seller.' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Network error. Please check your connection and try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', padding: '40px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        
        {/* Navigation Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <Link
            href="/admin/staff"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#475569', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}
          >
            <ArrowLeft size={16} /> Back to Staff Dashboard
          </Link>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#FF5E13', backgroundColor: '#FFF3EB', padding: '4px 10px', borderRadius: 20 }}>
            XINDIA Representative Portal
          </span>
        </div>

        {/* Main Card */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #E2E8F0', padding: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
              <UserPlus size={24} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0F172A' }}>Onboard New Seller</h1>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748B' }}>
                Register a seller account on behalf of the merchant. Increments your score by +1.
              </p>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: '20px 0' }} />

          {statusMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 16px',
                borderRadius: 10,
                marginBottom: 20,
                fontSize: 13,
                fontWeight: 600,
                backgroundColor: statusMsg.type === 'success' ? '#DCFCE7' : '#FEE2E2',
                color: statusMsg.type === 'success' ? '#166534' : '#991B1B',
                border: `1px solid ${statusMsg.type === 'success' ? '#86EFAC' : '#FCA5A5'}`,
              }}
            >
              {statusMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {resultData && resultData.staff && (
            <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#15803D', fontWeight: 700, fontSize: 14 }}>
                <Award size={18} /> Staff Score Credited!
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#166534' }}>
                Employee ID <strong>{resultData.staff.employeeId}</strong> score is now{' '}
                <strong style={{ fontSize: 16 }}>{resultData.staff.onboardedScore}</strong> onboarded sellers.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Staff ID Section */}
            <div style={{ backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, border: '1px solid #E2E8F0', marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                Your Employee ID *
              </label>
              <input
                type="text"
                placeholder="e.g. EMP-104 or Salesman ID"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid #CBD5E1',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#0F172A',
                  backgroundColor: '#FFFFFF',
                  outline: 'none',
                }}
              />
              <span style={{ display: 'block', fontSize: 11, color: '#64748B', marginTop: 4 }}>
                Points are linked directly to your Employee ID on the Staff Dashboard.
              </span>
            </div>

            {/* Seller Contact Info */}
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 12 }}>Seller Information</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  First Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rajesh"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sharma"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                Mobile Number (10 digits) *
              </label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                Company / Enterprise Name
              </label>
              <input
                type="text"
                placeholder="e.g. Apex Polymer Industries"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Location / City
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ahmedabad, Gujarat"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Business Type
                </label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, backgroundColor: '#FFFFFF' }}
                >
                  <option value="Manufacturer">Manufacturer</option>
                  <option value="Exporter">Exporter</option>
                  <option value="OEM / ODM Supplier">OEM / ODM Supplier</option>
                  <option value="Wholesaler">Wholesaler</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                Email Address (Optional)
              </label>
              <input
                type="email"
                placeholder="e.g. contact@apexpolymers.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px 20px',
                borderRadius: 10,
                backgroundColor: loading ? '#94A3B8' : '#2563EB',
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 700,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <UserPlus size={18} />
              {loading ? 'Onboarding Seller...' : 'Onboard Seller (+1 Score)'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
