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
  ExternalLink,
  ShieldCheck,
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

export default function PortfolioEditForm({ initialData, mandatoryStatus, onUpdateSuccess }) {
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
      portfolioAbout: initialData?.portfolioAbout || '',
      description: initialData?.description || '',
      factorySize: initialData?.factorySize || '',
      machinesCount: initialData?.machinesCount ? String(initialData.machinesCount) : '',
      employeesCount: initialData?.employeesCount ? String(initialData.employeesCount) : '',
      monthlyCapacity: initialData?.monthlyCapacity || '',
      exportPercentage: initialData?.exportPercentage || '',
      aboutFactory: initialData?.aboutFactory || '',
      factoryVideo: initialData?.factoryVideo || '',
      introVideo: initialData?.introVideo || '',
      buyerContactPhone: initialData?.buyerContactPhone || '',
      businessPhone: initialData?.businessPhone || '',
      whatsappNumber: initialData?.whatsappNumber || '',
      companyEmail: initialData?.companyEmail || '',
      address: initialData?.address || '',
    },
  });

  const [openSection, setOpenSection] = useState('identity');
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

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveExistingPhoto = (url) => {
    setExistingPhotos((prev) => prev.filter((p) => p !== url));
    setRemovedPhotos((prev) => [...prev, url]);
  };

  const handleNewPhotosChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) {
      setNewPhotoFiles((prev) => [...prev, ...files]);
    }
  };

  const handleRemoveNewPhoto = (index) => {
    setNewPhotoFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (values) => {
    setSubmitting(true);
    setFormError('');
    setSuccessMessage('');

    try {
      const formData = new FormData();

      // Company Identity
      formData.append('companyName', values.companyName ? values.companyName.trim() : '');
      formData.append('name', values.companyName ? values.companyName.trim() : '');
      formData.append('companyOwner', values.companyOwner ? values.companyOwner.trim() : '');
      formData.append('businessType', values.businessType || '');
      formData.append('legalStatus', values.legalStatus || '');
      formData.append('yearOfEstablishment', values.yearOfEstablishment || '');
      formData.append('gstNumber', values.gstNumber ? values.gstNumber.trim().toUpperCase() : '');
      formData.append('description', values.description ? values.description.trim() : '');
      formData.append('portfolioAbout', values.portfolioAbout ? values.portfolioAbout.trim() : '');

      // Factory Specs
      formData.append('factorySize', values.factorySize ? values.factorySize.trim() : '');
      formData.append('machinesCount', values.machinesCount || '');
      formData.append('employeesCount', values.employeesCount || '');
      formData.append('monthlyCapacity', values.monthlyCapacity ? values.monthlyCapacity.trim() : '');
      formData.append('exportPercentage', values.exportPercentage ? values.exportPercentage.trim() : '');
      formData.append('aboutFactory', values.aboutFactory ? values.aboutFactory.trim() : '');
      formData.append('factoryVideo', values.factoryVideo ? values.factoryVideo.trim() : '');
      formData.append('introVideo', values.introVideo ? values.introVideo.trim() : '');

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
        formData.append('factoryPhotos', file);
      });

      if (removedPhotos.length > 0) {
        formData.append('removeFactoryPhotos', JSON.stringify(removedPhotos));
      }

      const res = await fetch('/api/seller/portfolio', {
        method: 'PATCH',
        body: formData,
      });

      const resData = await res.json();
      if (resData.success) {
        setSuccessMessage('Company details and portfolio updated successfully!');
        // Update locked certifications list to include newly persisted ones
        setLockedCertifications(resData.manufacturer?.certifications || combinedCerts);
        setNewCertifications([]);
        setNewPhotoFiles([]);
        setRemovedPhotos([]);
        if (resData.manufacturer?.manufacturingPlants) {
          setExistingPhotos(resData.manufacturer.manufacturingPlants);
        }
        if (onUpdateSuccess) onUpdateSuccess(resData.manufacturer);
      } else {
        if (resData.code === 'PLAN_REQUIRED') {
          setFormError(resData.message || 'Active subscription plan required to update company details.');
        } else {
          setFormError(resData.message || 'Failed to update company details');
        }
      }
    } catch (err) {
      console.error(err);
      setFormError('An unexpected network error occurred while saving.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderHeader = (title, key, IconComponent, isMandatory) => {
    const isComplete = mandatoryStatus ? mandatoryStatus[key] : false;
    return (
      <div className="seller-accordion-header" onClick={() => toggleSection(key)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {IconComponent && <IconComponent size={18} color="var(--sp-primary)" />}
          <span style={{ fontWeight: 600, fontSize: 14.5 }}>{title}</span>
          {isMandatory && (
            <span style={{ fontSize: 11, color: isComplete ? '#10B981' : '#F59E0B', fontWeight: 600 }}>
              {isComplete ? '(Complete)' : '(Required)'}
            </span>
          )}
        </div>
        {openSection === key ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </div>
    );
  };

  const aboutCharCount = (watch('portfolioAbout') || '').length;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {formError && (
        <div
          style={{
            background: '#FEE2E2',
            border: '1px solid #EF4444',
            color: '#B91C1C',
            padding: '14px 16px',
            borderRadius: 8,
            marginBottom: 20,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <AlertCircle size={18} />
          <span>{formError}</span>
        </div>
      )}

      {successMessage && (
        <div
          style={{
            background: '#ECFDF5',
            border: '1px solid #10B981',
            color: '#065F46',
            padding: '14px 16px',
            borderRadius: 8,
            marginBottom: 20,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <CheckCircle size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ─── 1. Company Identity & Business Profile ─────────────────────── */}
      <div className="seller-accordion">
        {renderHeader('1. Company Identity & Business Profile', 'identity', Building2, true)}
        {openSection === 'identity' && (
          <div className="seller-accordion-body">
            <div className="seller-form-grid-2">
              <div className="seller-field-group">
                <label className="seller-field-label">
                  Company / Brand Name <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  className="seller-input"
                  style={{ width: '100%' }}
                  placeholder="e.g. Apex Polymer Technologies Pvt Ltd"
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
                  placeholder="e.g. Rajesh Sharma"
                  {...register('companyOwner')}
                />
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

            <div className="seller-field-group">
              <div className="seller-field-label">
                <span>
                  Company Overview & Experience (Min 80 chars) <span style={{ color: '#EF4444' }}>*</span>
                </span>
                <span
                  style={{
                    fontSize: 11.5,
                    color: aboutCharCount >= 80 ? '#10B981' : '#F59E0B',
                    fontWeight: 600,
                  }}
                >
                  {aboutCharCount} / 80 min chars
                </span>
              </div>
              <textarea
                className="seller-input"
                style={{ width: '100%', minHeight: 110 }}
                placeholder="Provide a comprehensive introduction to your company, production specializations, quality standards, and industry achievements..."
                {...register('portfolioAbout', { minLength: 80 })}
              />
              {errors.portfolioAbout && (
                <span style={{ fontSize: 12, color: '#EF4444' }}>
                  About overview must be at least 80 characters long to publish.
                </span>
              )}
            </div>

            {/* Founder / Seller Intro Video */}
            <div className="seller-field-group" style={{ marginTop: 16 }}>
              <label className="seller-field-label">
                Founder / Seller Intro Video (YouTube Link)
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
          </div>
        )}
      </div>

      {/* ─── 2. Company Branding & Visuals ──────────────────────────────── */}
      <div className="seller-accordion">
        {renderHeader('2. Company Branding & Visuals', 'branding', ImageIcon, true)}
        {openSection === 'branding' && (
          <div className="seller-accordion-body">
            <div className="seller-form-grid-2">
              {/* Logo */}
              <div className="seller-field-group">
                <label className="seller-field-label">Company Logo</label>
                {logoPreview ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logoPreview}
                      alt="Logo Preview"
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 10,
                        objectFit: 'cover',
                        border: '1px solid var(--sp-border)',
                      }}
                    />
                    <div>
                      <label
                        className="seller-btn seller-btn-secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}
                      >
                        <Upload size={14} /> Replace Logo
                        <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
                      </label>
                      <span className="seller-field-hint" style={{ display: 'block', marginTop: 4 }}>
                        Square image (PNG, JPG), min 200x200px.
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
                <label className="seller-field-label">Cover Banner Image</label>
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

      {/* ─── 3. Factory & Manufacturing Infrastructure ──────────────────── */}
      <div className="seller-accordion">
        {renderHeader('3. Factory & Manufacturing Infrastructure', 'factory', Factory, true)}
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
                <label className="seller-field-label">Total Workforce / Employees</label>
                <input
                  type="number"
                  className="seller-input"
                  style={{ width: '100%' }}
                  placeholder="e.g. 150"
                  {...register('employeesCount')}
                />
              </div>
            </div>

            <div className="seller-form-grid-2">
              <div className="seller-field-group">
                <label className="seller-field-label">Monthly Production Output</label>
                <input
                  className="seller-input"
                  style={{ width: '100%' }}
                  placeholder="e.g. 100,000 units / month"
                  {...register('monthlyCapacity')}
                />
              </div>

              <div className="seller-field-group">
                <label className="seller-field-label">Export Market Share (%)</label>
                <input
                  className="seller-input"
                  style={{ width: '100%' }}
                  placeholder="e.g. 35% Export"
                  {...register('exportPercentage')}
                />
              </div>
            </div>

            <div className="seller-field-group">
              <label className="seller-field-label">About Manufacturing Facilities & Machinery</label>
              <textarea
                className="seller-input"
                style={{ width: '100%', minHeight: 90 }}
                placeholder="Highlight your assembly lines, CNC turning centers, testing laboratories, clean rooms, or packaging infrastructure..."
                {...register('aboutFactory')}
              />
            </div>

            {/* Factory Photos Gallery */}
            <div className="seller-field-group" style={{ marginTop: 16 }}>
              <div className="seller-field-label">
                <span>Factory Photos Gallery (Min 5 recommended)</span>
                <span style={{ fontSize: 12, color: 'var(--sp-text-med)' }}>
                  {existingPhotos.length + newPhotoFiles.length} Photos total
                </span>
              </div>

              {existingPhotos.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--sp-text-med)', display: 'block', marginBottom: 6 }}>
                    Existing Uploaded Photos:
                  </span>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {existingPhotos.map((url, idx) => (
                      <div
                        key={idx}
                        style={{
                          position: 'relative',
                          width: 90,
                          height: 90,
                          borderRadius: 8,
                          overflow: 'hidden',
                          border: '1px solid var(--sp-border)',
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="Factory plant" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingPhoto(url)}
                          title="Remove photo"
                          style={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            background: 'rgba(239, 68, 68, 0.9)',
                            color: '#FFF',
                            border: 'none',
                            borderRadius: '50%',
                            width: 22,
                            height: 22,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Newly picked photos preview */}
              {newPhotoFiles.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#10B981', display: 'block', marginBottom: 6 }}>
                    Newly Selected Photos (Will upload on save):
                  </span>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {newPhotoFiles.map((file, idx) => (
                      <div
                        key={idx}
                        style={{
                          position: 'relative',
                          width: 90,
                          height: 90,
                          borderRadius: 8,
                          overflow: 'hidden',
                          border: '2px solid #10B981',
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={URL.createObjectURL(file)}
                          alt="New preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveNewPhoto(idx)}
                          style={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            background: 'rgba(239, 68, 68, 0.9)',
                            color: '#FFF',
                            border: 'none',
                            borderRadius: '50%',
                            width: 22,
                            height: 22,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <label className="seller-media-dropzone" style={{ display: 'block' }}>
                <Upload size={22} color="var(--sp-primary)" style={{ margin: '0 auto 6px' }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--sp-text)' }}>
                  Click to add factory photos (Multiple images)
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--sp-text-med)' }}>
                  Upload workshop, manufacturing lines, warehouse, and machinery photos
                </div>
                <input type="file" accept="image/*" multiple onChange={handleNewPhotosChange} style={{ display: 'none' }} />
              </label>
            </div>

            {/* YouTube Factory Tour Video */}
            <div className="seller-field-group" style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--sp-border)' }}>
              <label className="seller-field-label">
                <span>Official Factory Tour Video (YouTube)</span>
              </label>
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
                      Connected YouTube Video — Live Preview:
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
          </div>
        )}
      </div>

      {/* ─── 4. Product Categories & Industries ─────────────────────────── */}
      <div className="seller-accordion">
        {renderHeader('4. Product Categories & Industries', 'categories', Layers, true)}
        {openSection === 'categories' && (
          <div className="seller-accordion-body">
            <p style={{ fontSize: 13, color: 'var(--sp-text-med)', marginBottom: 12 }}>
              Select the manufacturing domains and product sectors your factory specializes in. (Selected:{' '}
              <strong>{selectedCategoryIds.length}</strong>)
            </p>

            {loadingCategories ? (
              <div style={{ padding: 16, color: 'var(--sp-text-med)', fontSize: 13 }}>Loading categories...</div>
            ) : availableCategories.length > 0 ? (
              <div className="seller-category-grid">
                {availableCategories.map((cat) => {
                  const isSelected = selectedCategoryIds.includes(cat._id);
                  return (
                    <button
                      type="button"
                      key={cat._id}
                      className={`seller-category-chip ${isSelected ? 'active' : ''}`}
                      onClick={() => toggleCategory(cat._id)}
                    >
                      {cat.name}
                      {isSelected ? <CheckCircle size={14} /> : <Plus size={14} />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--sp-text-med)' }}>No categories configured.</div>
            )}
          </div>
        )}
      </div>

      {/* ─── 5. Business Contacts & Location ────────────────────────────── */}
      <div className="seller-accordion">
        {renderHeader('5. Business Contacts & Location', 'contacts', PhoneCall, true)}
        {openSection === 'contacts' && (
          <div className="seller-accordion-body">
            <div className="seller-form-grid-2">
              <div className="seller-field-group">
                <label className="seller-field-label">
                  Buyer Inquiry Phone Number <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="seller-input"
                  style={{ width: '100%' }}
                  placeholder="+91 98765 43210"
                  {...register('buyerContactPhone', { required: true })}
                />
                <span className="seller-field-hint">Primary number displayed on your storefront for buyer RFQs.</span>
              </div>

              <div className="seller-field-group">
                <label className="seller-field-label">Business Landline / Office Phone</label>
                <input
                  type="text"
                  className="seller-input"
                  style={{ width: '100%' }}
                  placeholder="011-23456789"
                  {...register('businessPhone')}
                />
              </div>
            </div>

            <div className="seller-form-grid-3">
              <div className="seller-field-group">
                <label className="seller-field-label">WhatsApp Business Number</label>
                <input
                  type="text"
                  className="seller-input"
                  style={{ width: '100%' }}
                  placeholder="+91 98765 43210"
                  {...register('whatsappNumber')}
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

      {/* ─── 6. Certifications & Quality Compliance (Immutable) ─────────── */}
      <div className="seller-accordion">
        {renderHeader('6. Certifications & Quality Compliance', 'certifications', Award, false)}
        {openSection === 'certifications' && (
          <div className="seller-accordion-body">
            {/* Locked Certifications list */}
            {lockedCertifications.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <ShieldCheck size={16} color="#059669" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#065F46' }}>
                    Uploaded & Verified Certifications (Permanent):
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {lockedCertifications.map((cert, idx) => (
                    <span key={idx} className="seller-locked-cert" title="Permanent certification record">
                      <Lock size={12} color="#059669" />
                      {cert}
                    </span>
                  ))}
                </div>
                <span className="seller-field-hint" style={{ display: 'block', marginTop: 6, color: '#6B7280' }}>
                  Note: Uploaded certifications cannot be removed or deleted from the portal to maintain compliance history.
                </span>
              </div>
            )}

            {/* Newly added certifications list */}
            {newCertifications.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#1E40AF', display: 'block', marginBottom: 6 }}>
                  Newly Added Certifications (Pending Save):
                </span>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {newCertifications.map((cert, idx) => (
                    <span key={idx} className="seller-new-cert">
                      {cert}
                      <button
                        type="button"
                        onClick={() => handleRemoveNewCert(cert)}
                        title="Remove pending certification"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#1E40AF',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Certification input */}
            <div className="seller-field-group">
              <label className="seller-field-label">Add New Certification</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
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
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 11.5, color: 'var(--sp-text-med)', marginRight: 4 }}>Quick Suggestions:</span>
                {CERTIFICATION_SUGGESTIONS.map((sug) => {
                  const alreadyAdded = lockedCertifications.includes(sug) || newCertifications.includes(sug);
                  if (alreadyAdded) return null;
                  return (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => handleAddNewCert(sug)}
                      style={{
                        background: '#F1F5F9',
                        border: '1px solid #E2E8F0',
                        borderRadius: 14,
                        padding: '3px 8px',
                        fontSize: 11.5,
                        color: '#475569',
                        cursor: 'pointer',
                      }}
                    >
                      + {sug}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div
        style={{
          marginTop: 28,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid var(--sp-border)',
          paddingTop: 20,
        }}
      >
        <span style={{ fontSize: 13, color: 'var(--sp-text-med)' }}>
          All changes immediately synchronize with your public marketplace storefront.
        </span>
        <button
          type="submit"
          className="seller-btn seller-btn-primary"
          disabled={submitting}
          style={{ padding: '10px 24px', fontSize: 15 }}
        >
          {submitting ? 'Saving All Changes...' : 'Save All Company Details'}
        </button>
      </div>
    </form>
  );
}
