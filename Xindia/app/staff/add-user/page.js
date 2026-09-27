'use client';

import { useState, useEffect } from 'react';
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
  Upload,
  Image as ImageIcon,
  Video,
  Trash2,
  ExternalLink,
  Navigation,
  Sparkles,
  Check,
  Search,
} from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Identity & GST Auto-Fill', icon: ShieldCheck },
  { id: 2, label: 'Location & GPS Coordinates', icon: MapPin },
  { id: 3, label: 'Factory & Operations', icon: Factory },
  { id: 4, label: 'Media & Branding', icon: ImageIcon },
  { id: 5, label: 'Taxonomy, KYC & Decision', icon: Award },
];

export default function StaffAddUserPage() {
  const [activeStep, setActiveStep] = useState(1);

  // Staff Representative Attribution
  const [employeeId, setEmployeeId] = useState('');

  // Step 1: GST Auto-Fill & Basic Identity
  const [gstInput, setGstInput] = useState('');
  const [gstLoading, setGstLoading] = useState(false);
  const [gstVerifiedData, setGstVerifiedData] = useState(null);
  const [gstError, setGstError] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyOwner, setCompanyOwner] = useState('');

  // Step 2: Location & Dual Coordinates
  const [fullAddress, setFullAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('');

  // Step 3: Business Identity & Operations
  const [businessType, setBusinessType] = useState('Manufacturer');
  const [legalStatus, setLegalStatus] = useState('Private Limited');
  const [yearOfEstablishment, setYearOfEstablishment] = useState('');
  const [aboutFactory, setAboutFactory] = useState('');
  const [factorySize, setFactorySize] = useState('');
  const [machinesCount, setMachinesCount] = useState('');
  const [employeesCount, setEmployeesCount] = useState('');
  const [monthlyCapacity, setMonthlyCapacity] = useState('');
  const [exportPercentage, setExportPercentage] = useState('');
  const [primaryProductsStr, setPrimaryProductsStr] = useState('');
  const [capabilitiesStr, setCapabilitiesStr] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [buyerContactPhone, setBuyerContactPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');

  // Step 4: Media, Visual Branding & Factory Video
  const [logoUrl, setLogoUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [factoryPhotos, setFactoryPhotos] = useState([]); // Array of strings (URLs)
  const [videoMode, setVideoMode] = useState('youtube'); // 'youtube' | 'file'
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // Step 5: Taxonomy, KYC Documents & Verification Decision
  const [categoriesList, setCategoriesList] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [gstDocUrl, setGstDocUrl] = useState('');
  const [uploadingGstDoc, setUploadingGstDoc] = useState(false);
  const [kycDocs, setKycDocs] = useState([]); // [{ title, fileUrl, fileType, originalName, fileSize }]
  const [kycDocTitle, setKycDocTitle] = useState('');
  const [uploadingKyc, setUploadingKyc] = useState(false);
  const [verificationAction, setVerificationAction] = useState('RAISE_REQUEST'); // 'RAISE_REQUEST' | 'VERIFY_INSTANT'

  // General Status & Loading
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [resultData, setResultData] = useState(null);

  // Auto-load staff Employee ID from profile on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('admin_profile');
      if (stored) {
        const profile = JSON.parse(stored);
        if (profile.employeeId) {
          setEmployeeId(profile.employeeId);
        }
      }
    } catch (_) {}

    // Load active categories
    fetch('/api/admin/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.categories)) {
          setCategoriesList(data.categories);
        }
      })
      .catch((err) => console.warn('Failed to load categories:', err.message));
  }, []);

  // Live GSTIN Verification & Auto-Fill Handler
  const handleVerifyGst = async () => {
    if (!gstInput.trim()) {
      setGstError('Please enter a 15-character GSTIN number');
      return;
    }
    const clean = gstInput.trim().toUpperCase();
    if (clean.length !== 15) {
      setGstError(`GSTIN must be exactly 15 characters (entered ${clean.length})`);
      return;
    }

    setGstLoading(true);
    setGstError('');
    try {
      const res = await fetch('/api/admin/staff/verify-gst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gstin: clean }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.gstData) {
        const g = data.gstData;
        setGstVerifiedData(g);
        if (g.tradeName || g.legalName) {
          setCompanyName(g.tradeName || g.legalName);
        }
        if (g.businessType) {
          if (g.businessType.toLowerCase().includes('pvt') || g.businessType.toLowerCase().includes('company')) {
            setLegalStatus('Private Limited');
          } else if (g.businessType.toLowerCase().includes('proprietorship')) {
            setLegalStatus('Proprietorship');
          } else if (g.businessType.toLowerCase().includes('partnership') || g.businessType.toLowerCase().includes('llp')) {
            setLegalStatus('Partnership / LLP');
          }
        }
        if (g.registeredAddress) {
          setFullAddress(g.registeredAddress);
        }
        if (g.city) setCity(g.city);
        if (g.stateName) setState(g.stateName);
        if (g.pincode) setPincode(g.pincode);
      } else {
        setGstError(data.message || 'GSTIN verification failed. Please verify format.');
      }
    } catch (err) {
      setGstError('Network error connecting to GST verification service.');
    } finally {
      setGstLoading(false);
    }
  };

  // Browser GPS Capture Handler
  const handleCaptureGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    setGpsStatus('Requesting current device coordinates...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setLatitude(String(lat));
        setLongitude(String(lng));
        setGpsLoading(false);
        setGpsStatus(`GPS coordinates captured: ${lat}, ${lng}`);
      },
      (err) => {
        setGpsLoading(false);
        setGpsStatus(`Unable to retrieve GPS coordinates: ${err.message}`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // File Upload Helper
  const uploadFiles = async (files) => {
    const formData = new FormData();
    for (const f of files) {
      formData.append('files', f);
    }
    const res = await fetch('/api/admin/staff/upload-media', {
      method: 'POST',
      body: formData,
    });
    return await res.json();
  };

  // Logo Upload
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const data = await uploadFiles([file]);
      if (data.success && data.urls?.[0]) {
        setLogoUrl(data.urls[0]);
      } else {
        alert(data.message || 'Failed to upload logo.');
      }
    } catch (_) {
      alert('Error uploading logo file.');
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  // Cover Image Upload
  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const data = await uploadFiles([file]);
      if (data.success && data.urls?.[0]) {
        setCoverImageUrl(data.urls[0]);
      } else {
        alert(data.message || 'Failed to upload cover banner.');
      }
    } catch (_) {
      alert('Error uploading cover banner.');
    } finally {
      setUploadingCover(false);
      e.target.value = '';
    }
  };

  // Factory Plant Photos Multi-Upload (up to 10)
  const handlePhotosUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (factoryPhotos.length + files.length > 10) {
      alert(`You can only upload up to 10 factory photos. Currently selected: ${factoryPhotos.length}`);
      return;
    }
    setUploadingPhotos(true);
    try {
      const data = await uploadFiles(files);
      if (data.success && Array.isArray(data.urls)) {
        setFactoryPhotos((prev) => [...prev, ...data.urls].slice(0, 10));
      } else {
        alert(data.message || 'Failed to upload photos.');
      }
    } catch (_) {
      alert('Error uploading photos.');
    } finally {
      setUploadingPhotos(false);
      e.target.value = '';
    }
  };

  // Factory Video File Upload
  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    try {
      const data = await uploadFiles([file]);
      if (data.success && data.urls?.[0]) {
        setUploadedVideoUrl(data.urls[0]);
      } else {
        alert(data.message || 'Failed to upload video.');
      }
    } catch (_) {
      alert('Error uploading video file.');
    } finally {
      setUploadingVideo(false);
      e.target.value = '';
    }
  };

  // GST Document (REG-06) Upload
  const handleGstDocUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingGstDoc(true);
    try {
      const data = await uploadFiles([file]);
      if (data.success && data.urls?.[0]) {
        setGstDocUrl(data.urls[0]);
      } else {
        alert(data.message || 'Failed to upload GST certificate.');
      }
    } catch (_) {
      alert('Error uploading GST certificate.');
    } finally {
      setUploadingGstDoc(false);
      e.target.value = '';
    }
  };

  // Business KYC Document Upload (up to 20 files)
  const handleAddKycDoc = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (kycDocs.length >= 20) {
      alert('Maximum 20 business KYC documents allowed.');
      return;
    }
    const docTitle = kycDocTitle.trim() || file.name.replace(/\.[^/.]+$/, '');
    setUploadingKyc(true);
    try {
      const data = await uploadFiles([file]);
      if (data.success && data.files?.[0]) {
        const uploaded = data.files[0];
        setKycDocs((prev) => [
          ...prev,
          {
            title: docTitle,
            fileUrl: uploaded.url,
            fileType: uploaded.type,
            originalName: uploaded.name,
            fileSize: uploaded.size,
          },
        ]);
        setKycDocTitle('');
      } else {
        alert(data.message || 'Failed to upload document.');
      }
    } catch (_) {
      alert('Error uploading document.');
    } finally {
      setUploadingKyc(false);
      e.target.value = '';
    }
  };

  // YouTube Embed Formatter
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes('youtube.com')) {
        const v = parsed.searchParams.get('v');
        if (v) return `https://www.youtube.com/embed/${v}`;
      } else if (parsed.hostname.includes('youtu.be')) {
        const v = parsed.pathname.replace('/', '');
        if (v) return `https://www.youtube.com/embed/${v}`;
      }
    } catch (_) {}
    return url;
  };

  // Navigation Steps Validation
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
        setStatusMsg({ type: 'error', text: 'Please enter a valid 10-digit mobile phone number.' });
        return;
      }
      if (!companyName.trim()) {
        setStatusMsg({ type: 'error', text: 'Company Name is required. Use GST auto-fill or enter manually.' });
        return;
      }
    } else if (activeStep === 2) {
      if (!city.trim() || !state.trim()) {
        setStatusMsg({ type: 'error', text: 'City and State are required for geographical directory indexing.' });
        return;
      }
    }
    setStatusMsg(null);
    setActiveStep((prev) => Math.min(prev + 1, 5));
  };

  const handlePrev = () => {
    setStatusMsg(null);
    setActiveStep((prev) => Math.max(prev - 1, 1));
  };

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);
    setResultData(null);

    const primaryProducts = primaryProductsStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const capabilities = capabilitiesStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    // Resolved factory video (either direct URL or YouTube embed)
    let finalVideoUrl = '';
    if (videoMode === 'youtube' && youtubeUrl.trim()) {
      finalVideoUrl = getYouTubeEmbedUrl(youtubeUrl.trim());
    } else if (videoMode === 'file' && uploadedVideoUrl.trim()) {
      finalVideoUrl = uploadedVideoUrl.trim();
    }

    // Resolved office coordinates
    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);
    const officeLocation =
      !isNaN(latNum) && !isNaN(lngNum) && (latNum !== 0 || lngNum !== 0)
        ? { latitude: latNum, longitude: lngNum }
        : null;

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
          companyName: companyName.trim(),
          companyOwner: companyOwner.trim() || `${firstName.trim()} ${lastName.trim()}`.trim(),
          fullAddress: fullAddress.trim(),
          location: city.trim() ? `${city.trim()}, ${state.trim()}` : fullAddress.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          officeLocation,
          businessType,
          legalStatus,
          yearOfEstablishment: yearOfEstablishment.trim(),
          aboutFactory: aboutFactory.trim(),
          factorySize: factorySize.trim(),
          machinesCount: machinesCount ? Number(machinesCount) : undefined,
          employeesCount: employeesCount ? Number(employeesCount) : undefined,
          monthlyCapacity: monthlyCapacity.trim(),
          exportPercentage: exportPercentage.trim(),
          manufacturingCategories: selectedCategoryIds,
          primaryProducts,
          capabilities,
          gstNumber: gstInput.trim().toUpperCase(),
          gstDocumentUrl: gstDocUrl,
          businessPhone: businessPhone.trim() || phone.trim(),
          alternatePhone: alternatePhone.trim(),
          buyerContactPhone: buyerContactPhone.trim() || phone.trim(),
          whatsappNumber: whatsappNumber.trim() || phone.trim(),
          companyEmail: companyEmail.trim() || email.trim(),
          logo: logoUrl,
          coverImage: coverImageUrl,
          factoryPhotos,
          factoryVideo: finalVideoUrl,
          businessDocuments: kycDocs,
          verificationAction,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg({ type: 'success', text: data.message || 'Seller onboarded successfully!' });
        setResultData({
          ...data,
          verificationAction,
        });
        setActiveStep(1);
      } else {
        setStatusMsg({ type: 'error', text: data.message || 'Failed to onboard seller.' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Network error connecting to backend.' });
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categoriesList.filter((cat) =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  return (
    <div className="admin-page" style={{ maxWidth: 1040, margin: '0 auto', padding: '24px 16px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link
            href="/admin/staff"
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              color: '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={16} /> Staff Desk
          </Link>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
              Staff Seller Onboarding Wizard
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
              Full-featured merchant registration with GPS mapping, media dropzones, and instant or queued verification.
            </p>
          </div>
        </div>

        {/* Staff Attribution Card */}
        <div
          style={{
            padding: '8px 14px',
            borderRadius: 10,
            background: 'rgba(15, 23, 42, 0.04)',
            border: '1px solid #CBD5E1',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Award size={18} style={{ color: '#E8581C' }} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>Active Verifier ID</div>
            <input
              type="text"
              placeholder="e.g. EMP-0104"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                fontWeight: 700,
                fontSize: 13,
                color: '#0F172A',
                outline: 'none',
                width: 110,
              }}
            />
          </div>
        </div>
      </div>

      {/* Success Result Modal / Banner */}
      {resultData && (
        <div
          style={{
            marginBottom: 24,
            padding: 24,
            borderRadius: 14,
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            boxShadow: '0 4px 12px rgba(22, 163, 74, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <CheckCircle2 size={26} style={{ color: '#16A34A', flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: '#15803D' }}>
                🎉 Seller Onboarded Successfully!
              </h3>
              <p style={{ margin: '0 0 12px', fontSize: 13, color: '#166534' }}>
                <strong>{resultData.user?.companyName || resultData.user?.name}</strong> has been registered.
                {resultData.verificationAction === 'VERIFY_INSTANT' ? (
                  <span style={{ color: '#047857', fontWeight: 600 }}>
                    {' '}Account verified & verified badge granted immediately.
                  </span>
                ) : (
                  <span style={{ color: '#B45309', fontWeight: 600 }}>
                    {' '}Verification request queued into Admin Review Desk.
                  </span>
                )}
              </p>
              {resultData.staff && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: '#DCFCE7', borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#15803D' }}>
                  <Award size={14} /> +1 Score credited to {resultData.staff.employeeId || resultData.staff.username} (Total Score: {resultData.staff.onboardedScore})
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status Warning / Error */}
      {statusMsg && (
        <div
          style={{
            marginBottom: 20,
            padding: '12px 16px',
            borderRadius: 8,
            backgroundColor: statusMsg.type === 'error' ? '#FEF2F2' : '#F0FDF4',
            color: statusMsg.type === 'error' ? '#991B1B' : '#166534',
            border: `1px solid ${statusMsg.type === 'error' ? '#FCA5A5' : '#BBF7D0'}`,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {statusMsg.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Main Wizard Card */}
      <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        {/* Step Indicator Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
          {STEPS.map((s) => {
            const Icon = s.icon;
            const isCurrent = activeStep === s.id;
            const isCompleted = activeStep > s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveStep(s.id)}
                style={{
                  flex: 1,
                  padding: '14px 12px',
                  border: 'none',
                  borderBottom: isCurrent ? '3px solid #E8581C' : '3px solid transparent',
                  background: isCurrent ? '#FFFFFF' : 'transparent',
                  color: isCurrent ? '#0F172A' : isCompleted ? '#16A34A' : '#64748B',
                  fontWeight: isCurrent ? 700 : 600,
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {isCompleted ? <Check size={16} /> : <Icon size={16} />}
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Wizard Form Body */}
        <div style={{ padding: '28px 24px' }}>
          <form onSubmit={handleSubmit}>
            {/* ── STEP 1: GST & Identity ── */}
            {activeStep === 1 && (
              <div>
                {/* GST Auto-Fill Card */}
                <div
                  style={{
                    marginBottom: 24,
                    padding: 20,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
                    border: '1px solid #CBD5E1',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Sparkles size={18} style={{ color: '#E8581C' }} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                      Step 1.1: Live GSTIN Verification & Instant Auto-Fill
                    </span>
                  </div>
                  <p style={{ margin: '0 0 14px', fontSize: 13, color: '#64748B' }}>
                    Enter the 15-digit GSTIN to auto-fill company legal name, trade name, address, and entity type.
                  </p>

                  <div style={{ display: 'flex', gap: 10, maxWidth: 540 }}>
                    <input
                      type="text"
                      maxLength={15}
                      placeholder="e.g. 27AAACG0561D1Z4"
                      value={gstInput}
                      onChange={(e) => setGstInput(e.target.value.toUpperCase())}
                      style={{
                        flex: 1,
                        padding: '11px 14px',
                        borderRadius: 8,
                        border: '1px solid #94A3B8',
                        fontSize: 14,
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyGst}
                      disabled={gstLoading}
                      style={{
                        padding: '11px 20px',
                        borderRadius: 8,
                        background: '#0F172A',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: 13,
                        border: 'none',
                        cursor: gstLoading ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      {gstLoading ? 'Verifying...' : 'Verify & Auto-Fill'}
                    </button>
                  </div>

                  {gstError && (
                    <div style={{ marginTop: 10, color: '#EF4444', fontSize: 12, fontWeight: 600 }}>
                      ⚠️ {gstError}
                    </div>
                  )}

                  {gstVerifiedData && (
                    <div
                      style={{
                        marginTop: 14,
                        padding: 12,
                        borderRadius: 8,
                        background: '#DCFCE7',
                        border: '1px solid #86EFAC',
                        color: '#166534',
                        fontSize: 12,
                      }}
                    >
                      <strong>✅ Verified:</strong> {gstVerifiedData.legalName || gstVerifiedData.tradeName || 'Valid GSTIN'} |{' '}
                      {gstVerifiedData.businessType} | {gstVerifiedData.stateName}
                    </div>
                  )}
                </div>

                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>
                  Contact & Enterprise Identity
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 14, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                      Last Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Patel"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 14, boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                      Mobile Phone (10 digits) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 14, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="seller@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 14, boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                      Company / Enterprise Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Polymer Industries"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 14, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                      Key Person / Proprietor Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Patel"
                      value={companyOwner}
                      onChange={(e) => setCompanyOwner(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 14, boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                  <button
                    type="button"
                    onClick={handleNext}
                    style={{
                      padding: '11px 24px',
                      borderRadius: 8,
                      background: '#E8581C',
                      color: '#FFFFFF',
                      fontSize: 14,
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    Next: Location & GPS <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2: Location & Dual GPS Coordinates ── */}
            {activeStep === 2 && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                  Step 2: Plant Location & Coordinates
                </h3>
                <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748B' }}>
                  Capturing GPS coordinates ensures the seller appears immediately on the XIndia Map & Industrial Hub Directory.
                </p>

                {/* GPS Capture Action Card */}
                <div
                  style={{
                    marginBottom: 20,
                    padding: 16,
                    borderRadius: 10,
                    background: '#F0F9FF',
                    border: '1px solid #BAE6FD',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Navigation size={22} style={{ color: '#0284C7' }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0369A1' }}>Dual Location Capture (Fixes Map Visibility)</div>
                      <div style={{ fontSize: 12, color: '#0C4A6E' }}>
                        {gpsStatus || 'Capture current physical position via device GPS'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCaptureGps}
                    disabled={gpsLoading}
                    style={{
                      padding: '9px 16px',
                      borderRadius: 6,
                      background: '#0284C7',
                      color: '#FFFFFF',
                      fontSize: 12,
                      fontWeight: 700,
                      border: 'none',
                      cursor: gpsLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {gpsLoading ? 'Acquiring...' : 'Capture GPS'}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                      Latitude (e.g. 19.0760)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="19.0760"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 14, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                      Longitude (e.g. 72.8777)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="72.8777"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 14, boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Full Registered Address
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Plot No. 42, GIDC Industrial Estate, Phase 2"
                    value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 24 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ahmedabad"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 14, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Gujarat"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 14, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                      Pincode
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 382445"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 14, boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
                  <button type="button" onClick={handlePrev} style={{ padding: '11px 20px', borderRadius: 8, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    style={{
                      padding: '11px 24px',
                      borderRadius: 8,
                      background: '#E8581C',
                      color: '#FFFFFF',
                      fontSize: 14,
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    Next: Factory Details <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Factory Operations ── */}
            {activeStep === 3 && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>
                  Step 3: Factory Infrastructure & Capacity
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Business Type</label>
                    <select
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 14 }}
                    >
                      <option value="Manufacturer">Manufacturer</option>
                      <option value="OEM">OEM Specialist</option>
                      <option value="Custom Fabrication">Custom Fabrication</option>
                      <option value="Exporter">Exporter</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Legal Entity</label>
                    <select
                      value={legalStatus}
                      onChange={(e) => setLegalStatus(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 14 }}
                    >
                      <option value="Private Limited">Private Limited</option>
                      <option value="Proprietorship">Proprietorship</option>
                      <option value="Partnership / LLP">Partnership / LLP</option>
                      <option value="Public Limited">Public Limited</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Year Established</label>
                    <input
                      type="number"
                      placeholder="e.g. 2012"
                      value={yearOfEstablishment}
                      onChange={(e) => setYearOfEstablishment(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 14, boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Factory Size</label>
                    <input
                      type="text"
                      placeholder="e.g. 25,000 sq ft"
                      value={factorySize}
                      onChange={(e) => setFactorySize(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 14, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Machines Count</label>
                    <input
                      type="number"
                      placeholder="e.g. 14"
                      value={machinesCount}
                      onChange={(e) => setMachinesCount(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 14, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Employees Count</label>
                    <input
                      type="number"
                      placeholder="e.g. 45"
                      value={employeesCount}
                      onChange={(e) => setEmployeesCount(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 14, boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Monthly Capacity</label>
                    <input
                      type="text"
                      placeholder="e.g. 50,000 units / month"
                      value={monthlyCapacity}
                      onChange={(e) => setMonthlyCapacity(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 14, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Export Percentage</label>
                    <input
                      type="text"
                      placeholder="e.g. 25%"
                      value={exportPercentage}
                      onChange={(e) => setExportPercentage(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 14, boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>About Factory Infrastructure</label>
                  <textarea
                    rows={3}
                    placeholder="Describe manufacturing lines, cleanrooms, testing labs, or tooling capabilities..."
                    value={aboutFactory}
                    onChange={(e) => setAboutFactory(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
                  <button type="button" onClick={handlePrev} style={{ padding: '11px 20px', borderRadius: 8, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    style={{
                      padding: '11px 24px',
                      borderRadius: 8,
                      background: '#E8581C',
                      color: '#FFFFFF',
                      fontSize: 14,
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    Next: Media & Branding <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 4: Media, Visual Branding & Video ── */}
            {activeStep === 4 && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>
                  Step 4: Visual Branding & Factory Media
                </h3>

                {/* Logo & Cover Dropzones */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                  {/* Logo */}
                  <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, padding: 16, background: '#F8FAFC' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>Company Logo</div>
                    {logoUrl ? (
                      <div style={{ position: 'relative', width: 90, height: 90, borderRadius: 8, overflow: 'hidden', border: '1px solid #CBD5E1' }}>
                        <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#FFF' }} />
                        <button
                          type="button"
                          onClick={() => setLogoUrl('')}
                          style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(239, 68, 68, 0.9)', color: '#FFF', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 100, border: '2px dashed #CBD5E1', borderRadius: 8, cursor: 'pointer', background: '#FFF' }}>
                        <Upload size={20} style={{ color: '#64748B', marginBottom: 4 }} />
                        <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{uploadingLogo ? 'Uploading...' : 'Upload Logo (PNG/JPG)'}</span>
                        <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} style={{ display: 'none' }} />
                      </label>
                    )}
                  </div>

                  {/* Cover Banner */}
                  <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, padding: 16, background: '#F8FAFC' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>Cover Banner</div>
                    {coverImageUrl ? (
                      <div style={{ position: 'relative', width: '100%', height: 90, borderRadius: 8, overflow: 'hidden', border: '1px solid #CBD5E1' }}>
                        <img src={coverImageUrl} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => setCoverImageUrl('')}
                          style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(239, 68, 68, 0.9)', color: '#FFF', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 100, border: '2px dashed #CBD5E1', borderRadius: 8, cursor: 'pointer', background: '#FFF' }}>
                        <ImageIcon size={20} style={{ color: '#64748B', marginBottom: 4 }} />
                        <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{uploadingCover ? 'Uploading...' : 'Upload Cover Banner'}</span>
                        <input type="file" accept="image/*" onChange={handleCoverUpload} disabled={uploadingCover} style={{ display: 'none' }} />
                      </label>
                    )}
                  </div>
                </div>

                {/* Factory Photos (up to 10) */}
                <div style={{ marginBottom: 24, border: '1px solid #E2E8F0', borderRadius: 12, padding: 18, background: '#F8FAFC' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>
                      Factory & Plant Photos ({factoryPhotos.length} / 10)
                    </div>
                    <label
                      style={{
                        padding: '6px 14px',
                        borderRadius: 6,
                        background: '#0F172A',
                        color: '#FFF',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: factoryPhotos.length >= 10 || uploadingPhotos ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Upload size={14} /> {uploadingPhotos ? 'Uploading...' : 'Add Photos'}
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handlePhotosUpload}
                        disabled={factoryPhotos.length >= 10 || uploadingPhotos}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>

                  {factoryPhotos.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: '#94A3B8', fontSize: 13 }}>
                      No factory photos uploaded yet. You can add up to 10 photos of manufacturing lines and machinery.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                      {factoryPhotos.map((photoUrl, idx) => (
                        <div key={idx} style={{ position: 'relative', height: 90, borderRadius: 8, overflow: 'hidden', border: '1px solid #CBD5E1' }}>
                          <img src={photoUrl} alt={`Plant ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button
                            type="button"
                            onClick={() => setFactoryPhotos((prev) => prev.filter((_, i) => i !== idx))}
                            style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(239, 68, 68, 0.9)', color: '#FFF', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Dual Factory Video: YouTube Embed OR Direct Upload */}
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, padding: 18, background: '#F8FAFC', marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Video size={16} style={{ color: '#E8581C' }} /> Factory Tour Video (Optional)
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => setVideoMode('youtube')}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          border: 'none',
                          cursor: 'pointer',
                          background: videoMode === 'youtube' ? '#E8581C' : '#E2E8F0',
                          color: videoMode === 'youtube' ? '#FFF' : '#475569',
                        }}
                      >
                        YouTube URL
                      </button>
                      <button
                        type="button"
                        onClick={() => setVideoMode('file')}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          border: 'none',
                          cursor: 'pointer',
                          background: videoMode === 'file' ? '#E8581C' : '#E2E8F0',
                          color: videoMode === 'file' ? '#FFF' : '#475569',
                        }}
                      >
                        Direct Video Upload
                      </button>
                    </div>
                  </div>

                  {videoMode === 'youtube' ? (
                    <div>
                      <input
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, boxSizing: 'border-box', marginBottom: 12 }}
                      />
                      {youtubeUrl.trim() && (
                        <div style={{ maxWidth: 440, height: 220, borderRadius: 8, overflow: 'hidden', border: '1px solid #CBD5E1' }}>
                          <iframe
                            src={getYouTubeEmbedUrl(youtubeUrl.trim())}
                            title="Factory Video Preview"
                            style={{ width: '100%', height: '100%', border: 'none' }}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      {uploadedVideoUrl ? (
                        <div style={{ maxWidth: 440 }}>
                          <video src={uploadedVideoUrl} controls style={{ width: '100%', borderRadius: 8, border: '1px solid #CBD5E1' }} />
                          <button
                            type="button"
                            onClick={() => setUploadedVideoUrl('')}
                            style={{ marginTop: 8, color: '#EF4444', background: 'none', border: 'none', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            Remove Video
                          </button>
                        </div>
                      ) : (
                        <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 110, border: '2px dashed #CBD5E1', borderRadius: 8, cursor: 'pointer', background: '#FFF' }}>
                          <Video size={24} style={{ color: '#64748B', marginBottom: 4 }} />
                          <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
                            {uploadingVideo ? 'Uploading MP4 video...' : 'Upload Factory Video (MP4 / WebM ≤50MB)'}
                          </span>
                          <input type="file" accept="video/mp4,video/webm" onChange={handleVideoUpload} disabled={uploadingVideo} style={{ display: 'none' }} />
                        </label>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
                  <button type="button" onClick={handlePrev} style={{ padding: '11px 20px', borderRadius: 8, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    style={{
                      padding: '11px 24px',
                      borderRadius: 8,
                      background: '#E8581C',
                      color: '#FFFFFF',
                      fontSize: 14,
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    Next: Taxonomy & KYC <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 5: Taxonomy, KYC Documents & Verification Decision ── */}
            {activeStep === 5 && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>
                  Step 5: Taxonomy, Business KYC & Verification Decision
                </h3>

                {/* Real Category Taxonomy Selector */}
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, padding: 18, background: '#F8FAFC', marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                    Primary Manufacturing Categories ({selectedCategoryIds.length} selected)
                  </div>
                  <div style={{ position: 'relative', marginBottom: 12 }}>
                    <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: '#94A3B8' }} />
                    <input
                      type="text"
                      placeholder="Filter categories (e.g. CNC, Polymers, Electronics)..."
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 150, overflowY: 'auto', padding: 4 }}>
                    {filteredCategories.map((cat) => {
                      const isSelected = selectedCategoryIds.includes(cat.slug || cat._id);
                      return (
                        <button
                          key={cat._id}
                          type="button"
                          onClick={() => {
                            const val = cat.slug || cat._id;
                            setSelectedCategoryIds((prev) =>
                              isSelected ? prev.filter((c) => c !== val) : [...prev, val]
                            );
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 20,
                            border: `1px solid ${isSelected ? '#E8581C' : '#CBD5E1'}`,
                            background: isSelected ? '#E8581C' : '#FFFFFF',
                            color: isSelected ? '#FFFFFF' : '#334155',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Primary Products & Capabilities */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                      Primary Products (comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="HDPE Bottles, Caps, Injection Molds"
                      value={primaryProductsStr}
                      onChange={(e) => setPrimaryProductsStr(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                      Special Capabilities (comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="ISO 9001, Clean Room Class 10000, 24/7 Production"
                      value={capabilitiesStr}
                      onChange={(e) => setCapabilitiesStr(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* GST Document & KYC Documents Dropzones */}
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, padding: 18, background: '#F8FAFC', marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 12 }}>
                    Business KYC & Regulatory Compliance
                  </div>

                  {/* GST Form REG-06 */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: '#FFF', borderRadius: 8, border: '1px solid #CBD5E1', marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>GST Registration Certificate (Form REG-06)</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>
                        {gstDocUrl ? '✅ Certificate uploaded and ready for attachment' : 'Upload official PDF or scan of GSTIN certificate'}
                      </div>
                    </div>
                    {gstDocUrl ? (
                      <button
                        type="button"
                        onClick={() => setGstDocUrl('')}
                        style={{ color: '#EF4444', background: 'none', border: 'none', fontSize: 12, cursor: 'pointer' }}
                      >
                        Remove
                      </button>
                    ) : (
                      <label style={{ padding: '6px 12px', borderRadius: 6, background: '#0F172A', color: '#FFF', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        {uploadingGstDoc ? 'Uploading...' : 'Upload PDF / Scan'}
                        <input type="file" accept="application/pdf,image/*" onChange={handleGstDocUpload} disabled={uploadingGstDoc} style={{ display: 'none' }} />
                      </label>
                    )}
                  </div>

                  {/* Additional Business KYC Docs (up to 20) */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>
                        Additional Business KYC Documents ({kycDocs.length} / 20)
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                      <input
                        type="text"
                        placeholder="Document label (e.g. MSME Udyam, ISO 9001, Factory License)..."
                        value={kycDocTitle}
                        onChange={(e) => setKycDocTitle(e.target.value)}
                        style={{ flex: 1, padding: '7px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12 }}
                      />
                      <label style={{ padding: '7px 14px', borderRadius: 6, background: '#E8581C', color: '#FFF', fontSize: 12, fontWeight: 600, cursor: kycDocs.length >= 20 || uploadingKyc ? 'not-allowed' : 'pointer' }}>
                        {uploadingKyc ? 'Uploading...' : 'Upload File'}
                        <input type="file" accept="application/pdf,image/*" onChange={handleAddKycDoc} disabled={kycDocs.length >= 20 || uploadingKyc} style={{ display: 'none' }} />
                      </label>
                    </div>

                    {kycDocs.map((doc, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          background: '#FFF',
                          borderRadius: 6,
                          border: '1px solid #E2E8F0',
                          marginBottom: 6,
                          fontSize: 12,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <FileText size={14} style={{ color: '#E8581C' }} />
                          <span style={{ fontWeight: 600, color: '#1E293B' }}>{doc.title}</span>
                          <span style={{ color: '#94A3B8', fontSize: 11 }}>({(doc.fileSize / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setKycDocs((prev) => prev.filter((_, i) => i !== idx))}
                          style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11 }}
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Verification Decision Action */}
                <div style={{ border: '2px solid #E2E8F0', borderRadius: 12, padding: 18, background: '#FFFFFF', marginBottom: 24 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>
                    Verification & Badging Decision
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {/* Option 1: Raise Request */}
                    <div
                      onClick={() => setVerificationAction('RAISE_REQUEST')}
                      style={{
                        padding: 14,
                        borderRadius: 10,
                        border: `2px solid ${verificationAction === 'RAISE_REQUEST' ? '#E8581C' : '#E2E8F0'}`,
                        background: verificationAction === 'RAISE_REQUEST' ? 'rgba(232, 88, 28, 0.04)' : '#FFF',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <input
                          type="radio"
                          name="vAction"
                          checked={verificationAction === 'RAISE_REQUEST'}
                          onChange={() => setVerificationAction('RAISE_REQUEST')}
                        />
                        <span style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>
                          Raise Request for Verification
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: '#64748B', paddingLeft: 22 }}>
                        Queues request into the central Verification Audit Dashboard for verifier assignment and document review.
                      </p>
                    </div>

                    {/* Option 2: Instant Verify */}
                    <div
                      onClick={() => setVerificationAction('VERIFY_INSTANT')}
                      style={{
                        padding: 14,
                        borderRadius: 10,
                        border: `2px solid ${verificationAction === 'VERIFY_INSTANT' ? '#16A34A' : '#E2E8F0'}`,
                        background: verificationAction === 'VERIFY_INSTANT' ? 'rgba(22, 163, 74, 0.04)' : '#FFF',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <input
                          type="radio"
                          name="vAction"
                          checked={verificationAction === 'VERIFY_INSTANT'}
                          onChange={() => setVerificationAction('VERIFY_INSTANT')}
                        />
                        <span style={{ fontWeight: 700, fontSize: 13, color: '#16A34A' }}>
                          Verify & Grant Badge Instantly
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: '#64748B', paddingLeft: 22 }}>
                        Select if you are physically present on-site at the manufacturer's facility and have inspected premises directly.
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
                  <button type="button" onClick={handlePrev} style={{ padding: '11px 20px', borderRadius: 8, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: '13px 28px',
                      borderRadius: 10,
                      background: loading ? '#94A3B8' : '#0F172A',
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
                    {loading ? 'Finalizing & Onboarding...' : 'Complete Onboarding & Credit Score (+1)'}
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
