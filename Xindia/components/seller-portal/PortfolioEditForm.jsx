'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ChevronDown, ChevronUp, CheckCircle, AlertCircle, Upload } from 'lucide-react';

export default function PortfolioEditForm({ initialData, mandatoryStatus, onUpdateSuccess }) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      portfolioAbout: initialData?.portfolioAbout || '',
      buyerContactPhone: initialData?.buyerContactPhone || '',
      address: initialData?.address || '',
      factorySize: initialData?.factorySize || '',
      machinesCount: initialData?.machinesCount || '',
      employeesCount: initialData?.employeesCount || '',
      monthlyCapacity: initialData?.monthlyCapacity || '',
      exportPercentage: initialData?.exportPercentage || '',
      yearOfEstablishment: initialData?.yearOfEstablishment || '',
      businessType: initialData?.businessType || '',
      legalStatus: initialData?.legalStatus || '',
      factoryVideo: initialData?.factoryVideo || '',
    },
  });

  const [openSection, setOpenSection] = useState('about');
  const [certificationsList, setCertificationsList] = useState(initialData?.certifications || []);
  const [certInput, setCertInput] = useState('');
  const [existingPhotos, setExistingPhotos] = useState(initialData?.manufacturingPlants || []);
  const [removedPhotos, setRemovedPhotos] = useState([]);
  const [newPhotos, setNewPhotos] = useState([]);
  const [logoFile, setLogoFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const toggleSection = (sec) => {
    setOpenSection(openSection === sec ? null : sec);
  };

  const handleAddCert = () => {
    if (certInput.trim() && !certificationsList.includes(certInput.trim())) {
      setCertificationsList([...certificationsList, certInput.trim()]);
      setCertInput('');
    }
  };

  const handleRemoveCert = (cert) => {
    setCertificationsList(certificationsList.filter((c) => c !== cert));
  };

  const handleRemoveExistingPhoto = (url) => {
    setExistingPhotos(existingPhotos.filter((p) => p !== url));
    setRemovedPhotos([...removedPhotos, url]);
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    setFormError('');

    try {
      const formData = new FormData();
      formData.append('video', file);
      const res = await fetch('/api/seller/portfolio/upload-video', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setValue('factoryVideo', data.url);
      } else {
        setFormError(data.message || 'Failed to upload video');
      }
    } catch (err) {
      console.error(err);
      setFormError('Video upload failed');
    } finally {
      setUploadingVideo(false);
    }
  };

  const onSubmit = async (values) => {
    setSubmitting(true);
    setFormError('');

    try {
      const formData = new FormData();
      if (values.portfolioAbout) formData.append('portfolioAbout', values.portfolioAbout);
      if (values.buyerContactPhone) formData.append('buyerContactPhone', values.buyerContactPhone);
      if (values.address) formData.append('address', values.address);
      if (values.factorySize) formData.append('factorySize', values.factorySize);
      if (values.machinesCount) formData.append('machinesCount', values.machinesCount);
      if (values.employeesCount) formData.append('employeesCount', values.employeesCount);
      if (values.monthlyCapacity) formData.append('monthlyCapacity', values.monthlyCapacity);
      if (values.exportPercentage) formData.append('exportPercentage', values.exportPercentage);
      if (values.yearOfEstablishment) formData.append('yearOfEstablishment', values.yearOfEstablishment);
      if (values.businessType) formData.append('businessType', values.businessType);
      if (values.legalStatus) formData.append('legalStatus', values.legalStatus);
      if (values.factoryVideo) formData.append('factoryVideo', values.factoryVideo);

      if (certificationsList.length > 0) {
        formData.append('certifications', JSON.stringify(certificationsList));
      }

      if (logoFile) formData.append('logo', logoFile);
      if (coverFile) formData.append('coverImage', coverFile);

      newPhotos.forEach((file) => {
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
        if (onUpdateSuccess) onUpdateSuccess(resData.manufacturer);
      } else {
        if (resData.code === 'PLAN_REQUIRED') {
          setFormError(resData.message || 'Active subscription plan required to update portfolio.');
        } else {
          setFormError(resData.message || 'Failed to update portfolio');
        }
      }
    } catch (err) {
      console.error(err);
      setFormError('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const renderHeader = (title, key, isMandatory) => {
    const isComplete = mandatoryStatus ? mandatoryStatus[key] : false;
    return (
      <div className="seller-accordion-header" onClick={() => toggleSection(key)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isMandatory && (
            isComplete ? (
              <CheckCircle size={18} color="#10B981" />
            ) : (
              <AlertCircle size={18} color="#F59E0B" />
            )
          )}
          <span>{title}</span>
          {isMandatory && <span style={{ fontSize: 11, color: '#94A3B8' }}>(Required)</span>}
        </div>
        {openSection === key ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {formError && (
        <div style={{ background: '#FEE2E2', border: '1px solid #EF4444', color: '#B91C1C', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
          {formError}
        </div>
      )}

      {/* 1. About Your Business */}
      <div className="seller-accordion">
        {renderHeader('About Your Business', 'about', true)}
        {openSection === 'about' && (
          <div className="seller-accordion-body">
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              Company Overview / About Us (Min 80 chars)
            </label>
            <textarea
              className="seller-input"
              style={{ width: '100%', minHeight: 120 }}
              placeholder="Describe your manufacturing experience, capabilities, specialization..."
              {...register('portfolioAbout', { minLength: 80 })}
            />
            {errors.portfolioAbout && (
              <span style={{ fontSize: 12, color: '#EF4444' }}>About section must be at least 80 characters long</span>
            )}
          </div>
        )}
      </div>

      {/* 2. Contact for Buyers */}
      <div className="seller-accordion">
        {renderHeader('Contact for Buyers', 'buyerContactPhone', true)}
        {openSection === 'buyerContactPhone' && (
          <div className="seller-accordion-body">
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              Buyer Inquiry Phone Number
            </label>
            <input
              type="text"
              className="seller-input"
              style={{ width: '100%' }}
              placeholder="+919876543210"
              {...register('buyerContactPhone')}
            />
          </div>
        )}
      </div>

      {/* 3. Factory Location */}
      <div className="seller-accordion">
        {renderHeader('Factory Location', 'address', true)}
        {openSection === 'address' && (
          <div className="seller-accordion-body">
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              Factory Address
            </label>
            <textarea
              className="seller-input"
              style={{ width: '100%', minHeight: 80 }}
              placeholder="Industrial Area, City, State..."
              {...register('address')}
            />
          </div>
        )}
      </div>

      {/* 4. Company Logo */}
      <div className="seller-accordion">
        {renderHeader('Company Logo', 'logo', true)}
        {openSection === 'logo' && (
          <div className="seller-accordion-body">
            {initialData?.logo && (
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: '#64748B', display: 'block', marginBottom: 4 }}>Current Logo:</span>
                <img src={initialData.logo} alt="Logo" style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover' }} />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
            />
          </div>
        )}
      </div>

      {/* 5. Factory Photos */}
      <div className="seller-accordion">
        {renderHeader('Factory Photos', 'factoryPhotos', true)}
        {openSection === 'factoryPhotos' && (
          <div className="seller-accordion-body">
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>
              Upload minimum 5 factory photos showing machinery, workshop, and infrastructure.
            </p>
            {existingPhotos.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Existing Photos:</span>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {existingPhotos.map((url, idx) => (
                    <div key={idx} style={{ position: 'relative' }}>
                      <img src={url} alt="Factory" style={{ width: 90, height: 90, borderRadius: 6, objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingPhoto(url)}
                        style={{ position: 'absolute', top: 4, right: 4, background: '#EF4444', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', fontSize: 12 }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setNewPhotos(Array.from(e.target.files || []))}
            />
          </div>
        )}
      </div>

      {/* 6. Cover Image */}
      <div className="seller-accordion">
        {renderHeader('Cover Image', 'coverImage', false)}
        {openSection === 'coverImage' && (
          <div className="seller-accordion-body">
            {initialData?.coverImage && (
              <div style={{ marginBottom: 12 }}>
                <img src={initialData.coverImage} alt="Cover" style={{ width: '100%', maxHeight: 150, borderRadius: 8, objectFit: 'cover' }} />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
            />
          </div>
        )}
      </div>

      {/* 7. Factory Tour Video */}
      <div className="seller-accordion">
        {renderHeader('Factory Tour Video', 'factoryVideo', false)}
        {openSection === 'factoryVideo' && (
          <div className="seller-accordion-body">
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>
              Upload a short video tour of your manufacturing facility.
            </p>
            {watch('factoryVideo') && (
              <div style={{ marginBottom: 12, fontSize: 13, color: '#10B981', fontWeight: 600 }}>
                Video attached: {watch('factoryVideo')}
              </div>
            )}
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              disabled={uploadingVideo}
            />
            {uploadingVideo && <span style={{ fontSize: 12, color: '#64748B', marginLeft: 8 }}>Uploading video...</span>}
          </div>
        )}
      </div>

      {/* 8. Certifications */}
      <div className="seller-accordion">
        {renderHeader('Certifications', 'certifications', false)}
        {openSection === 'certifications' && (
          <div className="seller-accordion-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                className="seller-input"
                style={{ flex: 1 }}
                placeholder="e.g. ISO 9001:2015"
                value={certInput}
                onChange={(e) => setCertInput(e.target.value)}
              />
              <button type="button" className="seller-btn seller-btn-secondary" onClick={handleAddCert}>Add</button>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {certificationsList.map((cert, idx) => (
                <span key={idx} style={{ background: '#F1F5F9', padding: '4px 10px', borderRadius: 16, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {cert}
                  <button type="button" onClick={() => handleRemoveCert(cert)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>×</button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 9. Factory Details */}
      <div className="seller-accordion">
        {renderHeader('Factory Details', 'factoryDetails', false)}
        {openSection === 'factoryDetails' && (
          <div className="seller-accordion-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Factory Size</label>
                <input className="seller-input" style={{ width: '100%' }} placeholder="25,000 Sq. Ft." {...register('factorySize')} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Machines Count</label>
                <input type="number" className="seller-input" style={{ width: '100%' }} placeholder="15" {...register('machinesCount')} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Employees Count</label>
                <input type="number" className="seller-input" style={{ width: '100%' }} placeholder="250" {...register('employeesCount')} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Monthly Capacity</label>
                <input className="seller-input" style={{ width: '100%' }} placeholder="50,000 units" {...register('monthlyCapacity')} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Export Percentage</label>
                <input className="seller-input" style={{ width: '100%' }} placeholder="45%" {...register('exportPercentage')} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 10. Business Info */}
      <div className="seller-accordion">
        {renderHeader('Business Info', 'businessInfo', false)}
        {openSection === 'businessInfo' && (
          <div className="seller-accordion-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Year of Establishment</label>
                <input type="number" className="seller-input" style={{ width: '100%' }} placeholder="1998" {...register('yearOfEstablishment')} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Business Type</label>
                <input className="seller-input" style={{ width: '100%' }} placeholder="Manufacturer, Exporter" {...register('businessType')} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Legal Status</label>
                <input className="seller-input" style={{ width: '100%' }} placeholder="Private Limited" {...register('legalStatus')} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" className="seller-btn seller-btn-primary" disabled={submitting}>
          {submitting ? 'Saving Changes...' : 'Save Portfolio Changes'}
        </button>
      </div>
    </form>
  );
}
