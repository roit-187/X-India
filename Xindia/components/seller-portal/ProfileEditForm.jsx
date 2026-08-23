'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  Upload,
  Youtube,
  Trash2,
  Building2,
  Image as ImageIcon,
  Factory,
  Layers,
  PhoneCall,
  Award,
  Lock,
  Plus,
  X,
  ShieldCheck,
  ClipboardList,
} from 'lucide-react';
import YouTubePlayer from '@/components/common/YouTubePlayer';
import { extractYouTubeId, isValidYouTubeUrl } from '@/lib/youtube';

const BUSINESS_TYPES = [
  'Manufacturer',
  'Exporter',
  'OEM / ODM Supplier',
  'Wholesaler',
  'Trader',
  'Distributor',
  'Other',
];

const LEGAL_STATUSES = [
  'Private Limited (Pvt Ltd)',
  'Public Limited',
  'Limited Liability Partnership (LLP)',
  'Partnership Firm',
  'Sole Proprietorship',
  'Other',
];

const CERTIFICATION_SUGGESTIONS = [
  'ISO 9001:2015',
  'ISO 14001',
  'ISO 45001',
  'GMP Certified',
  'CE Certified',
  'FDA Registered',
  'OEKO-TEX Standard 100',
  'ZED Gold',
  'BIS Certified',
  'FSSAI Certified',
  'RoHS Compliant',
];

export default function ProfileEditForm({ initialData, onUpdateSuccess }) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      companyName: initialData?.companyName || initialData?.name || '',
      companyOwner: initialData?.companyOwner || '',
      businessType: initialData?.businessType || 'Manufacturer',
      legalStatus: initialData?.legalStatus || 'Private Limited (Pvt Ltd)',
      yearOfEstablishment: initialData?.yearOfEstablishment ? String(initialData.yearOfEstablishment) : '',
      gstNumber: initialData?.gstNumber || '',
      description: initialData?.description || '',
      introVideo: initialData?.introVideo || '',
      factorySize: initialData?.factorySize || '',
      machinesCount: initialData?.machinesCount ? String(initialData.machinesCount) : '',
      employeesCount: initialData?.employeesCount ? String(initialData.employeesCount) : '',
      monthlyCapacity: initialData?.monthlyCapacity || '',
      exportPercentage: initialData?.exportPercentage || '',
      aboutFactory: initialData?.aboutFactory || '',
      factoryVideo: initialData?.factoryVideo || '',
      buyerContactPhone: initialData?.buyerContactPhone || '',
      businessPhone: initialData?.businessPhone || '',
      whatsappNumber: initialData?.whatsappNumber || '',
      companyEmail: initialData?.companyEmail || '',
      address: initialData?.address || '',
    },
  });

  const [openSection, setOpenSection] = useState('onboarding');
  const [availableCategories, setAvailableCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Categories state (array of category IDs)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState(() => {
    return (initialData?.categories || []).map((c) => (typeof c === 'string' ? c : c._id));
  });

  // Certifications: separate immutable (already saved) from newly added
  const initialCerts = useMemo(() => {
    return Array.isArray(initialData?.certifications) ? initialData.certifications : [];
  }, [initialData]);

  const [lockedCertifications, setLockedCertifications] = useState(initialCerts);
  const [newCertifications, setNewCertifications] = useState([]);
  const [certInput, setCertInput] = useState('');

  // Media states
  const [existingPhotos, setExistingPhotos] = useState(initialData?.manufacturingPlants || []);
  const [removedPhotos, setRemovedPhotos] = useState([]);
  const [newPhotoFiles, setNewPhotoFiles] = useState([]);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(initialData?.logo || '');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(initialData?.coverImage || '');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch available categories from server
  useEffect(() => {
    async function loadCategories() {
      try {
        setLoadingCategories(true);
        const res = await fetch('/api/seller/categories');
        const data = await res.json();
        if (data.success && Array.isArray(data.categories)) {
          setAvailableCategories(data.categories);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoadingCategories(false);
      }
    }
    loadCategories();
  }, []);

  const toggleSection = (sec) => {
    setOpenSection(openSection === sec ? null : sec);
  };

  const toggleCategory = (categoryId) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  const handleAddNewCert = (certName) => {
    const clean = (certName || certInput).trim();
    if (!clean) return;
    if (lockedCertifications.includes(clean) || newCertifications.includes(clean)) {
      setCertInput('');
      return;
    }
    setNewCertifications((prev) => [...prev, clean]);
    setCertInput('');
  };

  const handleRemoveNewCert = (cert) => {
    setNewCertifications((prev) => prev.filter((c) => c !== cert));
  };

  // Logo file upload handler
  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  // Cover file upload handler
  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = () => setCoverPreview(reader.result);
    reader.readAsDataURL(file);
  };

  // Additional Factory Photos handlers
  const handleAddPhotos = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setNewPhotoFiles((prev) => [...prev, ...files]);
  };

  const handleRemoveExistingPhoto = (url) => {
    setExistingPhotos((prev) => prev.filter((u) => u !== url));
    setRemovedPhotos((prev) => [...prev, url]);
  };

  const handleRemoveNewPhoto = (index) => {
    setNewPhotoFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const onSubmit = async (values) => {
    setSubmitting(true);
    setFormError('');
    setSuccessMessage('');

    try {
      const formData = new FormData();

      // Identity & Onboarding Details
      formData.append('companyName', values.companyName.trim());
      formData.append('companyOwner', values.companyOwner ? values.companyOwner.trim() : '');
      formData.append('businessType', values.businessType || '');
      formData.append('legalStatus', values.legalStatus || '');
      formData.append('yearOfEstablishment', values.yearOfEstablishment || '');
      formData.append('gstNumber', values.gstNumber ? values.gstNumber.toUpperCase().trim() : '');
      formData.append('description', values.description ? values.description.trim() : '');
      formData.append('introVideo', values.introVideo ? values.introVideo.trim() : '');

      // Factory Specs
      formData.append('factorySize', values.factorySize ? values.factorySize.trim() : '');
      formData.append('machinesCount', values.machinesCount || '');
      formData.append('employeesCount', values.employeesCount || '');
      formData.append('monthlyCapacity', values.monthlyCapacity ? values.monthlyCapacity.trim() : '');
      formData.append('exportPercentage', values.exportPercentage ? values.exportPercentage.trim() : '');
      formData.append('aboutFactory', values.aboutFactory ? values.aboutFactory.trim() : '');
      formData.append('factoryVideo', values.factoryVideo ? values.factoryVideo.trim() : '');

      // Contact & Location
      formData.append('buyerContactPhone', values.buyerContactPhone ? values.buyerContactPhone.trim() : '');
      formData.append('businessPhone', values.businessPhone ? values.businessPhone.trim() : '');
      formData.append('whatsappNumber', values.whatsappNumber ? values.whatsappNumber.trim() : '');
      formData.append('companyEmail', values.companyEmail ? values.companyEmail.trim() : '');
      formData.append('address', values.address ? values.address.trim() : '');

      // Categories
      formData.append('categories', JSON.stringify(selectedCategoryIds));

      // Certifications: All locked + newly added
      const combinedCerts = [...lockedCertifications, ...newCertifications];
      formData.append('certifications', JSON.stringify(combinedCerts));

      // Files
      if (logoFile) formData.append('logo', logoFile);
      if (coverFile) formData.append('coverImage', coverFile);

      newPhotoFiles.forEach((file) => {
        formData.append('manufacturingPlants', file);
      });

      if (removedPhotos.length > 0) {
        formData.append('removeFactoryPhotos', JSON.stringify(removedPhotos));
      }

      const res = await fetch('/api/seller/portfolio', {
        method: 'PATCH',
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMessage('Profile details updated and synchronized successfully!');
        setNewCertifications([]);
        setNewPhotoFiles([]);
        setRemovedPhotos([]);
        if (onUpdateSuccess) onUpdateSuccess();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setFormError(data.message || 'Failed to update profile details.');
      }
    } catch (err) {
      console.error(err);
      setFormError('A network error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalPhotosCount = existingPhotos.length + newPhotoFiles.length;

  const renderHeader = (title, sectionKey, IconComponent, isMandatory = false) => {
    const isOpen = openSection === sectionKey;
    return (
      <div
        className={`seller-accordion-header ${isOpen ? 'open' : ''}`}
        onClick={() => toggleSection(sectionKey)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: isOpen ? 'var(--sp-primary)' : 'var(--sp-gray-bg)',
              color: isOpen ? '#fff' : 'var(--sp-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconComponent size={18} />
          </div>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--sp-text)' }}>{title}</div>
            <div style={{ fontSize: 12, color: 'var(--sp-text-med)' }}>
              {isMandatory ? (
                <span style={{ color: '#E8581C', fontWeight: 600 }}>Required Profile Section</span>
              ) : (
                <span style={{ color: '#10B981', fontWeight: 600 }}>Optional Showcase</span>
              )}
            </div>
          </div>
        </div>
        <div>
          {isOpen ? <ChevronUp size={20} color="var(--sp-text-med)" /> : <ChevronDown size={20} color="var(--sp-text-med)" />}
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="seller-portfolio-form">
      {/* Alert Messages */}
      {formError && (
        <div
          style={{
            background: '#FEE2E2',
            border: '1px solid #EF4444',
            color: '#B91C1C',
            padding: '14px 16px',
            borderRadius: 10,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13.5,
          }}
        >
          <AlertCircle size={20} color="#EF4444" style={{ flexShrink: 0 }} />
          <span>{formError}</span>
        </div>
      )}

      {successMessage && (
        <div
          style={{
            background: '#D1FAE5',
            border: '1px solid #10B981',
            color: '#047857',
            padding: '14px 16px',
            borderRadius: 10,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13.5,
          }}
        >
          <CheckCircle size={20} color="#10B981" style={{ flexShrink: 0 }} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ─── 1. Onboarding Details & Business Identity ─────────────────── */}
      <div className="seller-accordion">
        {renderHeader('1. Onboarding Details & Business Identity', 'onboarding', ClipboardList, true)}
        {openSection === 'onboarding' && (
          <div className="seller-accordion-body">
            <div className="seller-form-grid-2">
              <div className="seller-field-group">
                <label className="seller-field-label">
                  Company / Manufacturing Unit Name <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  className="seller-input"
                  style={{ width: '100%' }}
                  placeholder="e.g. Apex Precision Polymers Pvt Ltd"
                  {...register('companyName', { required: true })}
                />
                {errors.companyName && (
                  <span style={{ fontSize: 11.5, color: '#EF4444' }}>Company name is required.</span>
                )}
              </div>

              <div className="seller-field-group">
                <label className="seller-field-label">CEO / Founder / Owner Name</label>
                <input
                  className="seller-input"
                  style={{ width: '100%' }}
                  placeholder="e.g. Rajesh Kumar Sharma"
                  {...register('companyOwner')}
                />
                <span className="seller-field-hint">Displayed on verified buyer opportunity and trust cards.</span>
              </div>
            </div>

            <div className="seller-form-grid-3">
              <div className="seller-field-group">
                <label className="seller-field-label">Business Type</label>
                <select className="seller-input" style={{ width: '100%' }} {...register('businessType')}>
                  {BUSINESS_TYPES.map((bt) => (
                    <option key={bt} value={bt}>
                      {bt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="seller-field-group">
                <label className="seller-field-label">Legal Status</label>
                <select className="seller-input" style={{ width: '100%' }} {...register('legalStatus')}>
                  {LEGAL_STATUSES.map((ls) => (
                    <option key={ls} value={ls}>
                      {ls}
                    </option>
                  ))}
                </select>
              </div>

              <div className="seller-field-group">
                <label className="seller-field-label">Established Year</label>
                <input
                  type="number"
                  className="seller-input"
                  style={{ width: '100%' }}
                  placeholder="e.g. 2008"
                  {...register('yearOfEstablishment')}
                />
              </div>
            </div>

            <div className="seller-field-group">
              <label className="seller-field-label">GSTIN / Tax Registration Number</label>
              <input
                className="seller-input"
                style={{ width: '100%', textTransform: 'uppercase' }}
                placeholder="e.g. 27AABCU9603R1ZM"
                {...register('gstNumber')}
              />
              <span className="seller-field-hint">Your 15-digit GSTIN helps establish verified authenticity with B2B buyers.</span>
            </div>

            <div className="seller-field-group">
              <label className="seller-field-label">Short Tagline / Headline</label>
              <input
                className="seller-input"
                style={{ width: '100%' }}
                placeholder="e.g. Precision CNC Machining & High-Tension Fastener Manufacturer"
                {...register('description')}
              />
            </div>

            {/* Founder / Seller Intro Video */}
            <div className="seller-field-group" style={{ marginTop: 16 }}>
              <label className="seller-field-label">
                Founder / Seller Intro Video (YouTube Link) - Optional
              </label>
              <p style={{ fontSize: 12.5, color: 'var(--sp-text-med)', marginBottom: 10 }}>
                Optional video of the founder or leadership team introducing the company, production vision, and quality standards to prospective buyers.
              </p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    className="seller-input"
                    style={{ width: '100%', paddingLeft: 36 }}
                    placeholder="e.g. https://www.youtube.com/watch?v=... or https://youtu.be/..."
                    {...register('introVideo')}
                  />
                  <Youtube
                    size={18}
                    color="#DC2626"
                    style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  />
                </div>
                {watch('introVideo') && (
                  <button
                    type="button"
                    className="seller-btn seller-btn-secondary"
                    onClick={() => setValue('introVideo', '', { shouldDirty: true })}
                    title="Remove intro video link"
                    style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#EF4444', borderColor: '#FCA5A5' }}
                  >
                    <Trash2 size={16} />
                    Clear
                  </button>
                )}
              </div>

              {watch('introVideo') ? (
                extractYouTubeId(watch('introVideo')) ? (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#10B981', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle size={15} />
                      Connected Founder Intro Video — Live Preview:
                    </div>
                    <div style={{ maxWidth: 480, border: '1px solid var(--sp-border)', borderRadius: 12, overflow: 'hidden' }}>
                      <YouTubePlayer videoUrl={watch('introVideo')} />
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                    <AlertCircle size={15} />
                    Please enter a valid YouTube video or Shorts link (e.g. https://youtu.be/xyz).
                  </div>
                )
              ) : null}
            </div>

            {/* Logo & Banner */}
            <div className="seller-form-grid-2" style={{ marginTop: 20 }}>
              {/* Logo */}
              <div className="seller-field-group">
                <label className="seller-field-label">Company Official Logo (1:1)</label>
                {logoPreview ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logoPreview}
                      alt="Logo Preview"
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 12,
                        objectFit: 'cover',
                        border: '1px solid var(--sp-border)',
                      }}
                    />
                    <div>
                      <label
                        className="seller-btn seller-btn-secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}
                      >
                        <Upload size={14} /> Change Logo
                        <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
                      </label>
                      <span style={{ display: 'block', fontSize: 11.5, color: 'var(--sp-text-med)', marginTop: 4 }}>
                        Recommended: Square 400x400 PNG/JPG
                      </span>
                    </div>
                  </div>
                ) : (
                  <label className="seller-media-dropzone" style={{ display: 'block' }}>
                    <Upload size={24} color="var(--sp-primary)" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--sp-text)' }}>Click to upload Logo</div>
                    <div style={{ fontSize: 11.5, color: 'var(--sp-text-med)' }}>PNG, JPG or WEBP</div>
                    <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
                  </label>
                )}
              </div>

              {/* Cover Banner */}
              <div className="seller-field-group">
                <label className="seller-field-label">Cover Banner Image (16:9)</label>
                {coverPreview ? (
                  <div style={{ marginBottom: 12 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverPreview}
                      alt="Cover Preview"
                      style={{
                        width: '100%',
                        height: 90,
                        borderRadius: 8,
                        objectFit: 'cover',
                        border: '1px solid var(--sp-border)',
                        marginBottom: 8,
                      }}
                    />
                    <label
                      className="seller-btn seller-btn-secondary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}
                    >
                      <Upload size={14} /> Replace Banner
                      <input type="file" accept="image/*" onChange={handleCoverChange} style={{ display: 'none' }} />
                    </label>
                  </div>
                ) : (
                  <label className="seller-media-dropzone" style={{ display: 'block' }}>
                    <Upload size={24} color="var(--sp-primary)" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--sp-text)' }}>Click to upload Cover Banner</div>
                    <div style={{ fontSize: 11.5, color: 'var(--sp-text-med)' }}>Widescreen 16:9 banner (e.g. 1200x400)</div>
                    <input type="file" accept="image/*" onChange={handleCoverChange} style={{ display: 'none' }} />
                  </label>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── 2. Factory & Manufacturing Infrastructure ──────────────────── */}
      <div className="seller-accordion">
        {renderHeader('2. Factory & Manufacturing Infrastructure', 'factory', Factory, true)}
        {openSection === 'factory' && (
          <div className="seller-accordion-body">
            <div className="seller-form-grid-3">
              <div className="seller-field-group">
                <label className="seller-field-label">Factory / Plant Size</label>
                <input
                  className="seller-input"
                  style={{ width: '100%' }}
                  placeholder="e.g. 35,000 Sq. Ft."
                  {...register('factorySize')}
                />
              </div>

              <div className="seller-field-group">
                <label className="seller-field-label">Operational Machines</label>
                <input
                  type="number"
                  className="seller-input"
                  style={{ width: '100%' }}
                  placeholder="e.g. 24"
                  {...register('machinesCount')}
                />
              </div>

              <div className="seller-field-group">
                <label className="seller-field-label">Total Workforce / Staff</label>
                <input
                  type="number"
                  className="seller-input"
                  style={{ width: '100%' }}
                  placeholder="e.g. 85"
                  {...register('employeesCount')}
                />
              </div>
            </div>

            <div className="seller-form-grid-2">
              <div className="seller-field-group">
                <label className="seller-field-label">Monthly Production Capacity</label>
                <input
                  className="seller-input"
                  style={{ width: '100%' }}
                  placeholder="e.g. 50,000 Units / Month"
                  {...register('monthlyCapacity')}
                />
              </div>

              <div className="seller-field-group">
                <label className="seller-field-label">Export Ratio (%)</label>
                <input
                  className="seller-input"
                  style={{ width: '100%' }}
                  placeholder="e.g. 30%"
                  {...register('exportPercentage')}
                />
              </div>
            </div>

            <div className="seller-field-group">
              <label className="seller-field-label">Factory Machinery & Capabilities Overview</label>
              <textarea
                className="seller-input"
                style={{ width: '100%', minHeight: 90 }}
                placeholder="Highlight your key machinery models (CNC, VMC, Injection Moulding), automated lines, clean rooms, tool rooms, testing laboratories, etc."
                {...register('aboutFactory')}
              />
            </div>

            {/* Factory Video Walkthrough */}
            <div className="seller-field-group">
              <label className="seller-field-label">Factory Tour Video (YouTube Link) - Optional</label>
              <p style={{ fontSize: 12.5, color: 'var(--sp-text-med)', marginBottom: 10 }}>
                Paste a YouTube video link of your plant walkthrough. Make sure video privacy is set to <strong>Public</strong> or <strong>Unlisted</strong>.
              </p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    className="seller-input"
                    style={{ width: '100%', paddingLeft: 36 }}
                    placeholder="e.g. https://www.youtube.com/watch?v=... or https://youtu.be/..."
                    {...register('factoryVideo')}
                  />
                  <Youtube
                    size={18}
                    color="#DC2626"
                    style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  />
                </div>
                {watch('factoryVideo') && (
                  <button
                    type="button"
                    className="seller-btn seller-btn-secondary"
                    onClick={() => setValue('factoryVideo', '', { shouldDirty: true })}
                    title="Remove video link"
                    style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#EF4444', borderColor: '#FCA5A5' }}
                  >
                    <Trash2 size={16} />
                    Clear
                  </button>
                )}
              </div>

              {watch('factoryVideo') ? (
                extractYouTubeId(watch('factoryVideo')) ? (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#10B981', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle size={15} />
                      Connected Factory Video — Live Preview:
                    </div>
                    <div style={{ maxWidth: 480, border: '1px solid var(--sp-border)', borderRadius: 12, overflow: 'hidden' }}>
                      <YouTubePlayer videoUrl={watch('factoryVideo')} />
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                    <AlertCircle size={15} />
                    Please enter a valid YouTube video or Shorts link (e.g. https://youtu.be/xyz).
                  </div>
                )
              ) : null}
            </div>

            {/* Photos Gallery */}
            <div className="seller-field-group" style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <label className="seller-field-label">
                    Plant & Machinery Photos ({totalPhotosCount} photos)
                  </label>
                  <span className="seller-field-hint">
                    Upload workshops, assembly lines, testing labs, and plant entrances.
                  </span>
                </div>
                <label
                  className="seller-btn seller-btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}
                >
                  <Plus size={16} /> Add Photos
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleAddPhotos}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              {/* Photos Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                  gap: 12,
                  marginTop: 12,
                }}
              >
                {/* Existing Saved Photos */}
                {existingPhotos.map((url) => (
                  <div
                    key={url}
                    style={{
                      position: 'relative',
                      height: 100,
                      borderRadius: 8,
                      overflow: 'hidden',
                      border: '1px solid var(--sp-border)',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="Plant photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingPhoto(url)}
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        background: 'rgba(0,0,0,0.6)',
                        border: 'none',
                        color: '#fff',
                        borderRadius: '50%',
                        width: 24,
                        height: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                      title="Remove photo"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}

                {/* Newly Added Local Files */}
                {newPhotoFiles.map((file, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: 'relative',
                      height: 100,
                      borderRadius: 8,
                      overflow: 'hidden',
                      border: '2px dashed var(--sp-primary)',
                      background: 'var(--sp-gray-bg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 6,
                      textAlign: 'center',
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--sp-primary)', wordBreak: 'break-all' }}>
                      {file.name.slice(0, 14)}...
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveNewPhoto(idx)}
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        background: '#EF4444',
                        border: 'none',
                        color: '#fff',
                        borderRadius: '50%',
                        width: 22,
                        height: 22,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── 3. Product Categories & Industries ─────────────────────────── */}
      <div className="seller-accordion">
        {renderHeader('3. Product Categories & Industries', 'categories', Layers, false)}
        {openSection === 'categories' && (
          <div className="seller-accordion-body">
            <p style={{ fontSize: 13, color: 'var(--sp-text-med)', marginBottom: 16 }}>
              Select the manufacturing industries and product categories that best describe your production capabilities.
            </p>

            {loadingCategories ? (
              <div style={{ fontSize: 13, color: 'var(--sp-text-med)' }}>Loading categories...</div>
            ) : availableCategories.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--sp-text-med)' }}>No categories configured.</div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {availableCategories.map((cat) => {
                  const isSelected = selectedCategoryIds.includes(cat._id);
                  return (
                    <button
                      key={cat._id}
                      type="button"
                      onClick={() => toggleCategory(cat._id)}
                      style={{
                        padding: '7px 14px',
                        borderRadius: 20,
                        fontSize: 13,
                        fontWeight: 600,
                        border: isSelected ? '1px solid var(--sp-primary)' : '1px solid var(--sp-border)',
                        background: isSelected ? 'rgba(232, 88, 28, 0.1)' : 'var(--sp-surface)',
                        color: isSelected ? 'var(--sp-primary)' : 'var(--sp-text)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {isSelected && <CheckCircle size={14} color="var(--sp-primary)" />}
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── 4. Business Contacts & Factory Location ────────────────────── */}
      <div className="seller-accordion">
        {renderHeader('4. Business Contacts & Factory Location', 'contacts', PhoneCall, true)}
        {openSection === 'contacts' && (
          <div className="seller-accordion-body">
            <div className="seller-form-grid-2">
              <div className="seller-field-group">
                <label className="seller-field-label">
                  Buyer Direct Contact Phone <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="tel"
                  className="seller-input"
                  style={{ width: '100%' }}
                  placeholder="+91 98765 43210"
                  {...register('buyerContactPhone', { required: true })}
                />
                <span className="seller-field-hint">Primary number connected when verified buyers tap Call Now.</span>
                {errors.buyerContactPhone && (
                  <span style={{ fontSize: 11.5, color: '#EF4444' }}>Buyer contact phone is required.</span>
                )}
              </div>

              <div className="seller-field-group">
                <label className="seller-field-label">WhatsApp Business Number</label>
                <input
                  type="tel"
                  className="seller-input"
                  style={{ width: '100%' }}
                  placeholder="+91 98765 43210"
                  {...register('whatsappNumber')}
                />
              </div>
            </div>

            <div className="seller-form-grid-2">
              <div className="seller-field-group">
                <label className="seller-field-label">Office / Landline Phone</label>
                <input
                  type="tel"
                  className="seller-input"
                  style={{ width: '100%' }}
                  placeholder="022-28765432"
                  {...register('businessPhone')}
                />
              </div>

              <div className="seller-field-group">
                <label className="seller-field-label">Official Company Email</label>
                <input
                  type="email"
                  className="seller-input"
                  style={{ width: '100%' }}
                  placeholder="sales@company.com"
                  {...register('companyEmail')}
                />
              </div>
            </div>

            <div className="seller-field-group">
              <label className="seller-field-label">
                Factory & Workshop Physical Address <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <textarea
                className="seller-input"
                style={{ width: '100%', minHeight: 80 }}
                placeholder="Plot / Shed No, Phase / Industrial Area, City, State, Pincode"
                {...register('address', { required: true })}
              />
              {errors.address && (
                <span style={{ fontSize: 11.5, color: '#EF4444' }}>Factory address is required.</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── 5. Certifications & Quality Compliance ──────────────────────── */}
      <div className="seller-accordion">
        {renderHeader('5. Certifications & Quality Compliance', 'certifications', Award, false)}
        {openSection === 'certifications' && (
          <div className="seller-accordion-body">
            {/* Permanent Locked Certifications */}
            {lockedCertifications.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sp-text)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <ShieldCheck size={16} color="#10B981" />
                  Uploaded & Verified Certifications (Permanent):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {lockedCertifications.map((cert) => (
                    <span
                      key={cert}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: '#ECFDF5',
                        border: '1px solid #A7F3D0',
                        color: '#065F46',
                        padding: '6px 12px',
                        borderRadius: 20,
                        fontSize: 12.5,
                        fontWeight: 600,
                      }}
                    >
                      <Lock size={12} color="#059669" />
                      {cert}
                    </span>
                  ))}
                </div>
                <span style={{ display: 'block', fontSize: 11.5, color: 'var(--sp-text-med)', marginTop: 6 }}>
                  Note: Uploaded certifications cannot be removed or deleted from the portal to maintain compliance history.
                </span>
              </div>
            )}

            {/* Newly Added Certifications (Pending Save) */}
            {newCertifications.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sp-primary)', marginBottom: 8 }}>
                  New Certifications to Add:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {newCertifications.map((cert) => (
                    <span
                      key={cert}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: 'rgba(232, 88, 28, 0.08)',
                        border: '1px solid var(--sp-primary)',
                        color: 'var(--sp-primary)',
                        padding: '6px 12px',
                        borderRadius: 20,
                        fontSize: 12.5,
                        fontWeight: 600,
                      }}
                    >
                      {cert}
                      <button
                        type="button"
                        onClick={() => handleRemoveNewCert(cert)}
                        style={{ background: 'none', border: 'none', color: 'var(--sp-primary)', cursor: 'pointer', padding: 0 }}
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Add Certification Controls */}
            <div className="seller-field-group">
              <label className="seller-field-label">Add New Certification</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="seller-input"
                  style={{ flex: 1 }}
                  placeholder="e.g. ISO 9001:2015, CE, GMP, FDA, OEKO-TEX..."
                  value={certInput}
                  onChange={(e) => setCertInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddNewCert();
                    }
                  }}
                />
                <button
                  type="button"
                  className="seller-btn seller-btn-secondary"
                  onClick={() => handleAddNewCert()}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Plus size={16} /> Add
                </button>
              </div>

              {/* Quick suggestions */}
              <div style={{ marginTop: 10 }}>
                <span style={{ fontSize: 11.5, color: 'var(--sp-text-med)', marginRight: 8 }}>Quick Suggestions:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  {CERTIFICATION_SUGGESTIONS.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => handleAddNewCert(sug)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 12,
                        fontSize: 11.5,
                        background: 'var(--sp-gray-bg)',
                        border: '1px solid var(--sp-border)',
                        color: 'var(--sp-text)',
                        cursor: 'pointer',
                      }}
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Save Actions */}
      <div
        style={{
          marginTop: 24,
          paddingTop: 16,
          borderTop: '1px solid var(--sp-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ fontSize: 12.5, color: 'var(--sp-text-med)' }}>
          All profile changes immediately synchronize with your mobile app and web storefront.
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="seller-btn seller-btn-primary"
          style={{ padding: '12px 28px', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          {submitting ? 'Saving Profile...' : 'Save Profile Changes'}
        </button>
      </div>
    </form>
  );
}
