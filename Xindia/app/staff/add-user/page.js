'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  UserPlus,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Building2,
  Phone,
  User,
  MapPin,
  Award,
  Factory,
  FileText,
  Boxes,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Contact & Account', icon: User },
  { id: 2, label: 'Business & Factory', icon: Factory },
  { id: 3, label: 'Products & Desk', icon: Boxes },
];

export default function StaffAddUserPage() {
  const [activeStep, setActiveStep] = useState(1);

  // Step 1: Representative & Contact Info
  const [employeeId, setEmployeeId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  // Step 2: Business Identity & Operations
  const [companyName, setCompanyName] = useState('');
  const [companyOwner, setCompanyOwner] = useState('');
  const [businessType, setBusinessType] = useState('Manufacturer');
  const [legalStatus, setLegalStatus] = useState('Private Limited');
  const [yearOfEstablishment, setYearOfEstablishment] = useState('');
  const [aboutFactory, setAboutFactory] = useState('');
  const [factorySize, setFactorySize] = useState('');
  const [machinesCount, setMachinesCount] = useState('');
  const [employeesCount, setEmployeesCount] = useState('');
  const [monthlyCapacity, setMonthlyCapacity] = useState('');
  const [exportPercentage, setExportPercentage] = useState('');

  // Step 3: Products, Categories & Contact Desk
  const [categoriesStr, setCategoriesStr] = useState('');
  const [primaryProductsStr, setPrimaryProductsStr] = useState('');
  const [capabilitiesStr, setCapabilitiesStr] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [buyerContactPhone, setBuyerContactPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [resultData, setResultData] = useState(null);

  const handleNext = () => {
    if (activeStep === 1) {
      if (!employeeId.trim()) {
        setStatusMsg({ type: 'error', text: 'Please enter your Employee ID to receive onboarding score credit.' });
        return;
      }
      if (!firstName.trim() || !phone.trim()) {
        setStatusMsg({ type: 'error', text: 'Seller First Name and 10-digit Phone Number are required.' });
        return;
      }
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      if (cleanPhone.length < 10) {
        setStatusMsg({ type: 'error', text: 'Please enter a valid 10-digit phone number.' });
        return;
      }
    } else if (activeStep === 2) {
      if (!companyName.trim()) {
        setStatusMsg({ type: 'error', text: 'Company / Enterprise name is required.' });
        return;
      }
    }
    setStatusMsg(null);
    setActiveStep((prev) => Math.min(prev + 1, 3));
  };

  const handlePrev = () => {
    setStatusMsg(null);
    setActiveStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employeeId.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter your Employee ID to receive credit.' });
      setActiveStep(1);
      return;
    }
    if (!firstName.trim() || !phone.trim()) {
      setStatusMsg({ type: 'error', text: 'Seller First Name and Phone Number are required.' });
      setActiveStep(1);
      return;
    }
    if (!companyName.trim()) {
      setStatusMsg({ type: 'error', text: 'Company Name is required.' });
      setActiveStep(2);
      return;
    }

    setLoading(true);
    setStatusMsg(null);
    setResultData(null);

    const manufacturingCategories = categoriesStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const primaryProducts = primaryProductsStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const capabilities = capabilitiesStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch('/api/admin/staff/onboard-seller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: employeeId.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          fullAddress: fullAddress.trim(),
          location: city.trim() ? `${city.trim()}, ${state.trim()}`.replace(/^, |, $/g, '') : fullAddress.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          companyName: companyName.trim(),
          companyOwner: companyOwner.trim() || `${firstName.trim()} ${lastName.trim()}`.trim(),
          businessType,
          legalStatus,
          yearOfEstablishment: yearOfEstablishment.trim(),
          aboutFactory: aboutFactory.trim(),
          factorySize: factorySize.trim(),
          machinesCount: machinesCount ? Number(machinesCount) : undefined,
          employeesCount: employeesCount ? Number(employeesCount) : undefined,
          monthlyCapacity: monthlyCapacity.trim(),
          exportPercentage: exportPercentage.trim(),
          manufacturingCategories,
          primaryProducts,
          capabilities,
          gstNumber: gstNumber.trim(),
          businessPhone: businessPhone.trim() || phone.trim(),
          alternatePhone: alternatePhone.trim(),
          buyerContactPhone: buyerContactPhone.trim() || phone.trim(),
          whatsappNumber: whatsappNumber.trim() || phone.trim(),
          companyEmail: companyEmail.trim() || email.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg({ type: 'success', text: data.message || 'Seller onboarded successfully!' });
        setResultData(data);
        setActiveStep(1);
        // Clear seller fields
        setFirstName('');
        setLastName('');
        setPhone('');
        setEmail('');
        setFullAddress('');
        setCity('');
        setState('');
        setPincode('');
        setCompanyName('');
        setCompanyOwner('');
        setYearOfEstablishment('');
        setAboutFactory('');
        setFactorySize('');
        setMachinesCount('');
        setEmployeesCount('');
        setMonthlyCapacity('');
        setExportPercentage('');
        setCategoriesStr('');
        setPrimaryProductsStr('');
        setCapabilitiesStr('');
        setGstNumber('');
        setBusinessPhone('');
        setAlternatePhone('');
        setBuyerContactPhone('');
        setWhatsappNumber('');
        setCompanyEmail('');
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
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', padding: '36px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        
        {/* Navigation Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Link
              href="/admin/manufacturers"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#475569', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}
            >
              <ArrowLeft size={16} /> Manufacturers
            </Link>
            <span style={{ color: '#CBD5E1' }}>|</span>
            <Link
              href="/admin/staff"
              style={{ color: '#64748B', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}
            >
              Staff Leaderboard
            </Link>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#E8581C', backgroundColor: '#FFF7ED', border: '1px solid #FFEDD5', padding: '4px 10px', borderRadius: 20 }}>
            XINDIA Representative Portal
          </span>
        </div>

        {/* Main Card */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #E2E8F0', padding: '32px 32px 36px' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
              <UserPlus size={24} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0F172A' }}>Onboard New Seller</h1>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
                Register a verified seller and manufacturer on behalf of the merchant. Automatically credits +1 to your staff profile score.
              </p>
            </div>
          </div>

          {/* Stepper Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', marginBottom: 24, gap: 8 }}>
            {STEPS.map((s) => {
              const Icon = s.icon;
              const isActive = activeStep === s.id;
              const isPassed = activeStep > s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveStep(s.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 16px',
                    border: 'none',
                    borderBottom: isActive ? '2px solid #2563EB' : '2px solid transparent',
                    background: 'none',
                    cursor: 'pointer',
                    color: isActive ? '#2563EB' : isPassed ? '#059669' : '#64748B',
                    fontWeight: isActive ? 700 : 600,
                    fontSize: 13,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      backgroundColor: isActive ? '#2563EB' : isPassed ? '#DCFCE7' : '#F1F5F9',
                      color: isActive ? '#FFFFFF' : isPassed ? '#166534' : '#64748B',
                      fontSize: 11,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                    }}
                  >
                    {isPassed ? '✓' : s.id}
                  </span>
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Status Message */}
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

          {/* Success Banner with Score Credit */}
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

            {/* ────────── STEP 1: Representative & Contact Info ────────── */}
            {activeStep === 1 && (
              <div>
                <div style={{ backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, border: '1px solid #E2E8F0', marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                    Your Employee ID *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. EMP-104 or Staff ID"
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
                    Onboarding credit (+1 score) and seller card attribution will link directly to this Employee ID.
                  </span>
                </div>

                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <User size={16} /> Seller Representative & Account
                </h3>

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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
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
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. contact@business.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    Full Address / Street
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Plot 42, GIDC Industrial Estate, Phase II"
                    value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ahmedabad"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      State
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Gujarat"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      Pincode
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 382445"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="admin-btn admin-btn-primary"
                    style={{ padding: '10px 20px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    Next: Business & Factory <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* ────────── STEP 2: Business Identity & Operations ────────── */}
            {activeStep === 2 && (
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Building2 size={16} /> Business Identity
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      Company / Enterprise Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Apex Polymer Industries"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      Company Owner / MD Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rajesh Sharma"
                      value={companyOwner}
                      onChange={(e) => setCompanyOwner(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
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
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      Legal Status
                    </label>
                    <select
                      value={legalStatus}
                      onChange={(e) => setLegalStatus(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, backgroundColor: '#FFFFFF' }}
                    >
                      <option value="Private Limited">Private Limited</option>
                      <option value="Partnership">Partnership</option>
                      <option value="Proprietorship">Proprietorship</option>
                      <option value="Limited Liability Partnership (LLP)">LLP</option>
                      <option value="Public Limited">Public Limited</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      Year Established
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 2012"
                      value={yearOfEstablishment}
                      onChange={(e) => setYearOfEstablishment(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                    />
                  </div>
                </div>

                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#334155', marginTop: 20, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Factory size={16} /> Factory Scale & Facilities
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      Factory Size (sq. ft.)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 25,000 sq ft"
                      value={factorySize}
                      onChange={(e) => setFactorySize(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      Monthly Capacity
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 50,000 units / 20 tons"
                      value={monthlyCapacity}
                      onChange={(e) => setMonthlyCapacity(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      Machines Count
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 18"
                      value={machinesCount}
                      onChange={(e) => setMachinesCount(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      Total Workforce
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 65"
                      value={employeesCount}
                      onChange={(e) => setEmployeesCount(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      Export % (if any)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 20%"
                      value={exportPercentage}
                      onChange={(e) => setExportPercentage(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    About Factory & Manufacturing Infrastructure
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Brief description of the factory floor, CNC machinery, testing labs, or production lines..."
                    value={aboutFactory}
                    onChange={(e) => setAboutFactory(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="admin-btn admin-btn-secondary"
                    style={{ padding: '10px 18px', fontSize: 13 }}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="admin-btn admin-btn-primary"
                    style={{ padding: '10px 20px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    Next: Products & Desk <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* ────────── STEP 3: Products, Categories & Contact Desk ────────── */}
            {activeStep === 3 && (
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Boxes size={16} /> Products & Capabilities
                </h3>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    Manufacturing Categories (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Polymer Molding, Industrial Rubber, Injection Molded Parts"
                    value={categoriesStr}
                    onChange={(e) => setCategoriesStr(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    Primary Products (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. HDPE Pipes, Nylon Washers, Custom Gaskets"
                    value={primaryProductsStr}
                    onChange={(e) => setPrimaryProductsStr(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    Capabilities / Processing Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Precision CNC, Vacuum Casting, High-Volume Extrusion"
                    value={capabilitiesStr}
                    onChange={(e) => setCapabilitiesStr(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>

                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#334155', marginTop: 20, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={16} /> Regulatory & Contact Desk
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      GST Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 24AAAAA0000A1Z5"
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      Company Official Email
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. sales@apexpolymers.com"
                      value={companyEmail}
                      onChange={(e) => setCompanyEmail(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      Buyer Contact Phone / Hotline
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={buyerContactPhone}
                      onChange={(e) => setBuyerContactPhone(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      WhatsApp Business Number
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      Office Landline / Business Phone
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 079-25831122"
                      value={businessPhone}
                      onChange={(e) => setBusinessPhone(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      Alternate Mobile
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 9825000000"
                      value={alternatePhone}
                      onChange={(e) => setAlternatePhone(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="admin-btn admin-btn-secondary"
                    style={{ padding: '12px 20px', fontSize: 14 }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: '13px 28px',
                      borderRadius: 10,
                      backgroundColor: loading ? '#94A3B8' : '#2563EB',
                      color: '#FFFFFF',
                      fontSize: 14,
                      fontWeight: 700,
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <UserPlus size={18} />
                    {loading ? 'Submitting & Onboarding...' : 'Onboard Complete Seller (+1 Score)'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
