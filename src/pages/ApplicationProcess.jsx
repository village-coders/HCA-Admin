import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  ArrowLeft, CheckCircle, Circle, ChevronDown, ChevronUp, 
  Upload, Calendar, Loader2, FileText, Award, XCircle, Download,
  AlertCircle
} from 'lucide-react';
import './ApplicationProcess.css';

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

// The 9 main process steps
const STEPS = [
  { id: 1, label: 'APPLICATION RECEIVED' },
  { id: 2, label: 'APPLICATION ACCEPTED' },
  { id: 3, label: 'INVOICE SENT' },
  { id: 4, label: 'PAYMENT RECEIVED' },
  { id: 5, label: 'PRODUCT RECEIVED' },
  { id: 6, label: 'AUDIT SESSION', hasSubSteps: true },
  { id: 7, label: 'APPLICATION SUCCESSFUL FOR CERTIFICATION' },
  { id: 8, label: "SHARI'A BOARD REVIEW" },
  { id: 9, label: 'CERTIFICATE PROCESSING' },
  { id: 10, label: 'SEND CERTIFICATE' },
];

const AUDIT_SUB_STEPS = [
  { id: 1, label: 'Schedule Audit Date', type: 'date' },
  { id: 2, label: 'Audited', type: 'confirm' },
  { id: 3, label: 'NC Report (Upload)', type: 'upload' },
  { id: 4, label: 'NC Report Closed', type: 'confirm' },
  { id: 5, label: 'Audit Report Submitted', type: 'display' },
  { id: 6, label: 'Confirm Audit Report Received', type: 'confirm' },
];

// Split steps into rows (5 + 4)
const ROW_ONE = STEPS.slice(0, 5);
const ROW_TWO = STEPS.slice(5, 10);

function StepBar({ step, currentStep, isCompleted, isActive, onClick }) {
  return (
    <div
      className="step-item"
      onClick={() => onClick(step)}
      style={{ cursor: 'pointer', flex: 1, textAlign: 'center', padding: '0 8px' }}
    >
      {/* Label */}
      <div style={{
        fontSize: '11px',
        fontWeight: 600,
        color: isCompleted ? '#15803d' : isActive ? '#1e40af' : '#6b7280',
        marginBottom: '10px',
        minHeight: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 1.3,
      }}>
        {step.label}
      </div>
      {/* Progress Bar + Circle */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Line */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: '6px',
          backgroundColor: isCompleted ? '#22c55e' : '#e5e7eb',
          transform: 'translateY(-50%)',
          borderRadius: '3px',
        }} />
        {/* Circle */}
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          backgroundColor: isCompleted ? '#22c55e' : isActive ? '#fff' : '#fff',
          border: isCompleted ? '3px solid #22c55e' : isActive ? '3px solid #3b82f6' : '3px solid #d1d5db',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 2,
          transition: 'all 0.3s ease',
          boxShadow: isActive ? '0 0 0 4px rgba(59,130,246,0.2)' : 'none',
        }}>
          {isCompleted && <CheckCircle style={{ width: 16, height: 16, color: '#fff', fill: '#22c55e' }} />}
          {isActive && !isCompleted && <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#3b82f6' }} />}
        </div>
      </div>
    </div>
  );
}

export default function ApplicationProcess() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeStep, setActiveStep] = useState(null);
  const [auditExpanded, setAuditExpanded] = useState(false);
  const [activeAuditSubStep, setActiveAuditSubStep] = useState(null);

  // Form state
  const [auditDate, setAuditDate] = useState('');
  const [auditTime, setAuditTime] = useState('');
  const [auditLeadName, setAuditLeadName] = useState('');
  const [auditLeadEmail, setAuditLeadEmail] = useState('');
  const [auditLeadPhone, setAuditLeadPhone] = useState('');
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [ncReportFile, setNcReportFile] = useState(null);
  const [auditReportFile, setAuditReportFile] = useState(null);

  const [certNumber, setCertNumber] = useState('');
  const [certExpiryDate, setCertExpiryDate] = useState('');
  const [certFile, setCertFile] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const getToken = () => JSON.parse(localStorage.getItem('accessToken'));

  const fetchApplication = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE_URL}/applications/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setApplication(data);
      if (data.applicationNumber) {
        setCertNumber(data.applicationNumber);
      }
      
      if (data.processData?.audit) {
        if (data.processData.audit.scheduledDate) setAuditDate(new Date(data.processData.audit.scheduledDate).toISOString().split('T')[0]);
        if (data.processData.audit.scheduledTime) setAuditTime(data.processData.audit.scheduledTime);
        if (data.processData.audit.leadAuditorName) setAuditLeadName(data.processData.audit.leadAuditorName);
        if (data.processData.audit.leadAuditorEmail) setAuditLeadEmail(data.processData.audit.leadAuditorEmail);
        if (data.processData.audit.leadAuditorPhone) setAuditLeadPhone(data.processData.audit.leadAuditorPhone);
      }
    } catch (err) {
      toast.error('Failed to load application');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleDownloadCertificate = async () => {
    try {
      const { data: certs } = await axios.get(`${API_BASE_URL}/certificates?applicationId=${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      
      const cert = certs.find(c => c.applicationId?._id === id || c.applicationId === id);
      
      if (!cert) {
        toast.error('Certificate record not found');
        return;
      }

      // If pdfPath is an external URL, open it directly in a new tab
      if (cert.pdfPath && cert.pdfPath.startsWith('http') && !cert.pdfPath.includes('/api/files/')) {
        window.open(cert.pdfPath, '_blank');
        toast.success("Opening certificate in new tab...");
        return;
      }

      window.open(cert.pdfPath, '_blank')
      const response = await fetch(cert.pdfPath);

      const blob = response.blob()

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Certificate_${application.applicationNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast.error('Failed to download certificate');
    }
  };

  useEffect(() => { fetchApplication(); }, [fetchApplication]);

  const currentStep = Math.max(application?.processStep || 1, 2);
  const processData = application?.processData || {};
  const auditSubStep = processData?.audit?.subStep || 0;

  const isStepCompleted = (stepId) => {
    if (stepId === 1) return true; // Application received is always complete
    if (stepId < currentStep) return true;
    if (stepId === 6 && currentStep >= 7) return true;
    if (stepId === 10 && application?.status === 'Issued') return true;
    return false;
  };

  const isStepActive = (stepId) => stepId === currentStep;
  const canActivateStep = (stepId) => stepId === 1 || stepId <= currentStep;

  const handleStepClick = (step) => {
    if (!canActivateStep(step.id)) {
      toast.info('Complete previous steps first');
      return;
    }
    if (activeStep?.id === step.id) {
      setActiveStep(null);
      setAuditExpanded(false);
    } else {
      setActiveStep(step);
      if (step.id === 6) setAuditExpanded(true);
      else setAuditExpanded(false);
    }
  };

  const submitStep = async (stepId, subStep = null, extraData = null, file = null, additionalBody = {}) => {
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('step', stepId);
      if (subStep) formData.append('subStep', subStep);
      if (extraData) formData.append('data', extraData);
      if (file) formData.append('file', file);
      
      // Append additional body fields (like certNumber, expiryDate)
      Object.keys(additionalBody).forEach(key => {
        formData.append(key, additionalBody[key]);
      });

      const { data } = await axios.patch(
        `${API_BASE_URL}/applications/${id}/process`,
        formData,
        { headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'multipart/form-data' } }
      );
      setApplication(data.application);
      toast.success('Step updated successfully!');
      setActiveStep(null);
      setAuditExpanded(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update step');
    } finally {
      setSaving(false);
    }
  };

  // Improved: manual certificate issuance
  const handleIssueCertificate = async () => {
    if (!certFile || !certExpiryDate || !certNumber) {
      toast.error('Please provide certificate file, number and expiry date');
      return;
    }
    await submitStep(10, null, null, certFile, { certNumber, expiryDate: certExpiryDate });
  };

  // Reject application
  const handleRejectApplication = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    try {
      setRejecting(true);
      await axios.put(
        `${API_BASE_URL}/applications/${id}/reject`,
        { reason: rejectReason },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      toast.success('Application rejected successfully');
      setShowRejectForm(false);
      setRejectReason('');
      await fetchApplication();
      setActiveStep(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject application');
    } finally {
      setRejecting(false);
    }
  };

  const renderActionPanel = () => {
    if (!activeStep) return null;

    const step = activeStep;
    const isComplete = isStepCompleted(step.id);
    const isCurrentActive = isStepActive(step.id);

    if (step.id === 1) {
      return (
        <div className="action-panel">
          <h2 style={{ textAlign: 'center', fontWeight: 700, fontSize: '20px', marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            APPLICATION RECEIVED
          </h2>
          <div className="details-grid">
            <div className="details-card">
              <h3>Application Details</h3>
              <table className="details-table">
                <tbody>
                  <tr><td>Application Number:</td><td>{application?.applicationNumber}</td></tr>
                  <tr><td>Application Date:</td><td>{new Date(application?.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td></tr>
                  <tr><td>Application Category:</td><td>{application?.category}</td></tr>
                  <tr><td>Application Status:</td><td><span className="status-pill">{application?.status}</span></td></tr>
                </tbody>
              </table>
            </div>
            <div className="details-card">
              <h3>Company Details</h3>
              <table className="details-table">
                <tbody>
                  <tr><td>Company Name:</td><td>{application?.company?.companyName}</td></tr>
                  <tr><td>Registration No:</td><td>{application?.company?.registrationNo}</td></tr>
                  <tr><td>Email:</td><td>{application?.company?.email}</td></tr>
                  <tr><td>Phone:</td><td>{application?.company?.phone || 'N/A'}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    if (step.id === 2) {
      if (isComplete && application?.status !== 'Rejected') return <CompletedPanel label="Application Accepted" timestamp={processData?.acceptedAt} />;
      if (application?.status === 'Rejected') {
        return (
          <div className="action-panel" style={{ borderLeft: '4px solid #dc2626' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <XCircle size={28} color="#dc2626" />
              <div>
                <h2 style={{ marginBottom: 0 }}>Application Rejected</h2>
                <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>Reason: {application?.reason || 'No reason provided'}</p>
              </div>
            </div>
          </div>
        );
      }
      return (
        <div className="action-panel">
          <h2>Accept or Reject Application</h2>
          <p>Review this application and choose to accept or reject it. A rejection requires a written reason.</p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '20px' }}>
            <button className="action-btn-primary" onClick={() => { setShowRejectForm(false); submitStep(2); }} disabled={saving}>
              {saving ? <Loader2 className="spin" size={16} /> : <CheckCircle size={16} />}
              {saving ? 'Processing...' : 'Accept Application'}
            </button>
            <button
              className="action-btn-primary"
              style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
              onClick={() => setShowRejectForm(prev => !prev)}
              disabled={saving}
            >
              <XCircle size={16} />
              Reject Application
            </button>
          </div>

          {showRejectForm && (
            <div style={{ marginTop: '20px', padding: '16px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '8px' }}>
                Reason for Rejection <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Describe why this application is being rejected..."
                rows={4}
                className="form-input"
                style={{ resize: 'vertical', width: '100%' }}
              />
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  className="action-btn-primary"
                  style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
                  onClick={handleRejectApplication}
                  disabled={rejecting || !rejectReason.trim()}
                >
                  {rejecting ? <Loader2 className="spin" size={14} /> : <XCircle size={14} />}
                  {rejecting ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
                <button
                  onClick={() => { setShowRejectForm(false); setRejectReason(''); }}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: '14px' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (step.id === 3) {
      if (isComplete && processData?.invoiceFile) {
        return (
          <CompletedPanel label="Invoice Sent" timestamp={processData?.invoiceSentAt}>
            <a href={`${processData.invoiceFile}`} target="_blank" rel="noreferrer" className="file-link">
              <FileText size={16} /> View Invoice
            </a>
          </CompletedPanel>
        );
      }
      return (
        <div className="action-panel">
          <h2>Upload Invoice</h2>
          <p>Upload the invoice document to send to the applicant.</p>
          <div className="upload-area" onClick={() => document.getElementById('invoice-upload').click()}>
            <Upload size={32} color="#9ca3af" />
            <p>{invoiceFile ? invoiceFile.name : 'Click to select invoice file'}</p>
            <span>PDF, DOC, DOCX up to 10MB</span>
          </div>
          <input type="file" id="invoice-upload" hidden accept=".pdf,.doc,.docx" onChange={e => setInvoiceFile(e.target.files[0])} />
          <button className="action-btn-primary" onClick={() => submitStep(3, null, null, invoiceFile)} disabled={saving || !invoiceFile}>
            {saving ? <Loader2 className="spin" size={16} /> : <Upload size={16} />}
            {saving ? 'Uploading...' : 'Upload & Send Invoice'}
          </button>
        </div>
      );
    }

    if (step.id === 4) {
      if (isComplete) return <CompletedPanel label="Payment Received" timestamp={processData?.paymentConfirmedAt} />;
      return (
        <div className="action-panel">
          <h2>Confirm Payment</h2>
          <p>Confirm that payment has been received from the applicant.</p>
          <button className="action-btn-primary" onClick={() => submitStep(4)} disabled={saving}>
            {saving ? <Loader2 className="spin" size={16} /> : <CheckCircle size={16} />}
            {saving ? 'Processing...' : 'Confirm Payment Received'}
          </button>
        </div>
      );
    }

    if (step.id === 5) {
      if (isComplete) return <CompletedPanel label="Product Approval Forms Received" timestamp={processData?.productFormsReceivedAt} />;
      return (
        <div className="action-panel">
          <h2>Product Approval Forms</h2>
          <p>Confirm that all product approval forms have been received from the applicant.</p>
          <button className="action-btn-primary" onClick={() => submitStep(5)} disabled={saving}>
            {saving ? <Loader2 className="spin" size={16} /> : <CheckCircle size={16} />}
            {saving ? 'Processing...' : 'Confirm Forms Received'}
          </button>
        </div>
      );
    }

    if (step.id === 6) {
      return (
        <div className="action-panel">
          <h2>Audit Session</h2>
          <p>Manage the audit process through the following sub-steps. Each must be completed in order.</p>
          <div className="audit-substeps">
            {AUDIT_SUB_STEPS.map((sub) => {
              const subCompleted = auditSubStep >= sub.id;
              const subActive = auditSubStep === sub.id - 1 && currentStep === 6;
              const canAccessSub = true; // Unlocked to allow out-of-order changes
              return (
                <div key={sub.id} className={`audit-substep ${subCompleted ? 'completed' : subActive ? 'active' : 'pending'} ${!canAccessSub ? 'locked' : ''}`}>
                  <div className="substep-header" onClick={() => canAccessSub && setActiveAuditSubStep(activeAuditSubStep === sub.id ? null : sub.id)}>
                    <div className="substep-indicator">
                      {subCompleted ? <CheckCircle size={18} color="#22c55e" fill="#22c55e" /> : <Circle size={18} color={subActive ? '#3b82f6' : '#d1d5db'} />}
                      <span>{sub.label}</span>
                    </div>
                    {canAccessSub && <ChevronDown size={16} style={{ transform: activeAuditSubStep === sub.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />}
                  </div>

                  {/* Sub-step action form */}
                  {activeAuditSubStep === sub.id && canAccessSub && (
                    <div className="substep-form">
                      {sub.type === 'date' && (
                        <>
                          {processData?.audit?.auditRejected && (
                            <div className="mb-4 bg-red-50 p-4 rounded-xl border border-red-100 flex gap-3 text-red-800 text-sm" style={{ marginBottom: '16px' }}>
                              <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                              <div>
                                <p style={{ fontWeight: 600, marginBottom: '4px' }}>Previous Schedule Rejected by Client</p>
                                <p style={{ margin: 0 }}>Reason: {processData.audit.rejectReason || 'No reason provided.'}</p>
                              </div>
                            </div>
                          )}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                              <label>Audit Date</label>
                              <input type="date" value={auditDate} onChange={e => setAuditDate(e.target.value)} className="form-input" />
                            </div>
                            <div>
                              <label>Audit Time</label>
                              <input type="time" value={auditTime} onChange={e => setAuditTime(e.target.value)} className="form-input" />
                            </div>
                            <div>
                              <label>Lead Auditor Name</label>
                              <input type="text" placeholder="Full name" value={auditLeadName} onChange={e => setAuditLeadName(e.target.value)} className="form-input" />
                            </div>
                            <div>
                              <label>Lead Auditor Email</label>
                              <input type="email" placeholder="auditor@example.com" value={auditLeadEmail} onChange={e => setAuditLeadEmail(e.target.value)} className="form-input" />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                              <label>Lead Auditor Phone</label>
                              <input type="tel" placeholder="+234 000 000 0000" value={auditLeadPhone} onChange={e => setAuditLeadPhone(e.target.value)} className="form-input" />
                            </div>
                          </div>
                          <button
                            className="action-btn-primary sm"
                            onClick={() => {
                              if (!auditDate || !auditLeadName || !auditLeadEmail || !auditLeadPhone) return;
                              const payload = JSON.stringify({
                                date: auditDate,
                                time: auditTime,
                                leadAuditorName: auditLeadName,
                                leadAuditorEmail: auditLeadEmail,
                                leadAuditorPhone: auditLeadPhone,
                              });
                              submitStep(6, 1, payload);
                            }}
                            disabled={saving || !auditDate || !auditLeadName || !auditLeadEmail || !auditLeadPhone}
                          >
                            {saving ? <Loader2 className="spin" size={14} /> : <Calendar size={14} />}
                            {subCompleted ? 'Update Audit Schedule' : 'Schedule Audit'}
                          </button>
                        </>
                      )}
                      {sub.type === 'confirm' && (
                        <button className="action-btn-primary sm" onClick={() => submitStep(6, sub.id)} disabled={saving}>
                          {saving ? <Loader2 className="spin" size={14} /> : <CheckCircle size={14} />}
                          {sub.id === 2 ? 'Mark as Audited' : sub.id === 4 ? 'Mark NC as Closed' : 'Confirm Audit Report Received'}
                        </button>
                      )}
                      {sub.type === 'display' && (
                        <div className="substep-display">
                          {processData?.audit?.auditReportFile && (
                            <div className="file-info">
                              <p>Audit report uploaded.</p>
                              <a href={`${processData.audit.auditReportFile}`} target="_blank" rel="noreferrer" className="file-link">
                                <FileText size={16} /> View Client Report
                              </a>
                            </div>
                          )}
                          <div className="upload-area sm" onClick={() => document.getElementById(`audit-upload-${sub.id}`).click()}>
                            <Upload size={20} color="#9ca3af" />
                            <p>{auditReportFile?.name || 'Re-upload/Upload on client behalf'}</p>
                          </div>
                          <input
                            id={`audit-upload-${sub.id}`}
                            type="file"
                            hidden
                            accept=".pdf,.doc,.docx"
                            onChange={e => setAuditReportFile(e.target.files[0])}
                          />
                          <button
                            className="action-btn-primary sm"
                            onClick={() => submitStep(6, 5, null, auditReportFile)}
                            disabled={saving || !auditReportFile}
                          >
                            {saving ? <Loader2 className="spin" size={14} /> : <Upload size={14} />}
                            {processData?.audit?.auditReportFile ? 'Update' : 'Upload'} Audit Report
                          </button>
                        </div>
                      )}
                      {sub.type === 'upload' && sub.id === 3 && (
                        <>
                          <div className="upload-area sm" onClick={() => document.getElementById(`audit-upload-${sub.id}`).click()}>
                            <Upload size={20} color="#9ca3af" />
                            <p>{ncReportFile?.name || 'Click to select NC file'}</p>
                          </div>
                          <input
                            id={`audit-upload-${sub.id}`}
                            type="file"
                            hidden
                            accept=".pdf,.doc,.docx"
                            onChange={e => setNcReportFile(e.target.files[0])}
                          />
                          <button
                            className="action-btn-primary sm"
                            onClick={() => submitStep(6, 3, null, ncReportFile)}
                            disabled={saving || !ncReportFile}
                          >
                            {saving ? <Loader2 className="spin" size={14} /> : <Upload size={14} />}
                            Upload NC Report
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Completed state */}
                  {subCompleted && activeAuditSubStep !== sub.id && (
                    <div className="substep-completed">
                      <span style={{ color: '#15803d', fontSize: '13px' }}>
                        ✓ Completed
                        {sub.id === 1 && processData?.audit?.scheduledDate
                          ? ` — ${new Date(processData.audit.scheduledDate).toLocaleDateString()}${processData.audit.scheduledTime ? ` at ${processData.audit.scheduledTime}` : ''}${processData.audit.leadAuditorName ? ` | Lead: ${processData.audit.leadAuditorName}` : ''}`
                          : ''}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (step.id === 7) {
      if (isComplete) return <CompletedPanel label="Application Successful for Certification" timestamp={processData?.certificationApprovedAt} />;
      return (
        <div className="action-panel">
          <h2>Confirm Certification Approval</h2>
          <p>Confirm that the application has been successfully reviewed and approved for Halal certification.</p>
          <button className="action-btn-primary" onClick={() => submitStep(7)} disabled={saving}>
            {saving ? <Loader2 className="spin" size={16} /> : <Award size={16} />}
            {saving ? 'Processing...' : 'Confirm Approval for Certification'}
          </button>
        </div>
      );
    }

    if (step.id === 8) {
      if (isComplete) return <CompletedPanel label="Sent to Shari'a Board" timestamp={processData?.shariaBoardSentAt} />;
      return (
        <div className="action-panel">
          <h2>Shari'a Board Review</h2>
          <div className="mb-6 bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              Applications sent to the Shari'a Board will be listed in the dedicated <strong>Shari'a Board</strong> page for formal endorsement.
            </p>
          </div>
          <p>Proceed to send this application for Shari'a Board formal review.</p>
          <button className="action-btn-primary" onClick={() => submitStep(8)} disabled={saving}>
            {saving ? <Loader2 className="spin" size={16} /> : <Award size={16} />}
            {saving ? 'Processing...' : "Send to Shari'a Board"}
          </button>
        </div>
      );
    }

    if (step.id === 9) {
      if (isComplete) return <CompletedPanel label="Certificate Processing Started" timestamp={processData?.processingStartedAt} />;
      return (
        <div className="action-panel">
          <h2>Certificate Processing</h2>
          <p>Begin processing the Halal certificate for this application.</p>
          <button className="action-btn-primary" onClick={() => submitStep(9)} disabled={saving}>
            {saving ? <Loader2 className="spin" size={16} /> : <Loader2 size={16} />}
            {saving ? 'Starting...' : 'Start Certificate Processing'}
          </button>
        </div>
      );
    }

    if (step.id === 10) {
      if (application?.status === 'Issued') {
        return (
          <CompletedPanel label="Certificate Issued" timestamp={processData?.issuedAt}>
            <div style={{ marginTop: '16px' }}>
              <button 
                className="action-btn-primary" 
                onClick={handleDownloadCertificate}
                style={{ width: 'auto', padding: '10px 24px' }}
              >
                <Download size={18} />
                Download Issued Certificate
              </button>
            </div>
          </CompletedPanel>
        );
      }
      return (
        <div className="action-panel">
          <h2>Issue Certificate</h2>
          <p>Please enter the certificate details and upload the final document. This will complete the certification process.</p>
          
          <div className="details-grid" style={{ marginTop: '20px', gap: '20px' }}>
            <div className="details-card" style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px', display: 'block' }}>
                    Certificate Number
                  </label>
                  <input 
                    type="text" 
                    value={certNumber} 
                    onChange={e => setCertNumber(e.target.value)} 
                    placeholder="Enter certificate number"
                    className="form-input"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px', display: 'block' }}>
                    Expiry Date
                  </label>
                  <input 
                    type="date" 
                    value={certExpiryDate} 
                    onChange={e => setCertExpiryDate(e.target.value)} 
                    className="form-input"
                  />
                </div>
              </div>
            </div>
            
            <div className="details-card" style={{ padding: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px', display: 'block' }}>
                Certificate Document (Final PDF)
              </label>
              <div className="upload-area" onClick={() => document.getElementById('cert-upload').click()} style={{ minHeight: '120px' }}>
                <Upload size={24} color="#9ca3af" />
                <p style={{ fontSize: '13px', margin: '8px 0' }}>{certFile ? certFile.name : 'Click to select certificate file'}</p>
                <span style={{ fontSize: '11px', color: '#6b7280' }}>Only PDF files supported</span>
              </div>
              <input 
                type="file" 
                id="cert-upload" 
                hidden 
                accept=".pdf" 
                onChange={e => setCertFile(e.target.files[0])} 
              />
            </div>
          </div>

          <button 
            className="action-btn-primary success" 
            onClick={handleIssueCertificate} 
            disabled={saving || !certFile || !certExpiryDate || !certNumber}
            style={{ marginTop: '24px', width: '100%', maxWidth: '300px', marginInline: 'auto' }}
          >
            {saving ? <Loader2 className="spin" size={16} /> : <Award size={16} />}
            {saving ? 'Issuing Certificate...' : 'Complete Issue Certificate'}
          </button>
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Loader2 className="spin" size={32} color="#00853b" />
      </div>
    );
  }

  return (
    <div className="process-page">
      {/* Header */}
      <div className="process-header">
        <button className="back-button" onClick={() => navigate('/applications')}>
          <ArrowLeft size={18} /> Back to Applications
        </button>
        <div>
          <h1>Application Processing</h1>
          <p>#{application?.applicationNumber} — {application?.company?.companyName}</p>
        </div>
        <div className="header-badge" style={{ backgroundColor: getStatusColor(application?.status) + '20', color: getStatusColor(application?.status), border: `1px solid ${getStatusColor(application?.status)}40` }}>
          {application?.status}
        </div>
      </div>

      {/* Stepper */}
      <div className="stepper-card">
        {/* Row 1: Steps 1–5 */}
        <div className="stepper-row">
          {ROW_ONE.map(step => (
            <StepBar
              key={step.id}
              step={step}
              currentStep={currentStep}
              isCompleted={isStepCompleted(step.id)}
              isActive={isStepActive(step.id)}
              onClick={handleStepClick}
            />
          ))}
        </div>
        {/* Row 2: Steps 6–9 */}
        <div className="stepper-row" style={{ marginTop: '48px' }}>
          {ROW_TWO.map(step => (
            <StepBar
              key={step.id}
              step={step}
              currentStep={currentStep}
              isCompleted={isStepCompleted(step.id)}
              isActive={isStepActive(step.id)}
              onClick={handleStepClick}
            />
          ))}
        </div>
      </div>

      {/* Action Panel */}
      {renderActionPanel()}
    </div>
  );
}

function CompletedPanel({ label, timestamp, children }) {
  return (
    <div className="action-panel completed">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <CheckCircle size={28} color="#22c55e" fill="#22c55e" />
        <div>
          <h2 style={{ marginBottom: 0 }}>{label}</h2>
          {timestamp && <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>Completed: {new Date(timestamp).toLocaleString()}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function getStatusColor(status) {
  const map = {
    'Submitted': '#4361ee', 'Accepted': '#16a34a', 'Issued': '#16a34a',
    'Rejected': '#dc2626', "With Shari'a Board": '#f59e0b', 'Renewal': '#f59e0b'
  };
  return map[status] || '#6b7280';
}
