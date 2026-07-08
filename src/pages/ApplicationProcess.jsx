import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  ArrowLeft, CheckCircle, Circle, ChevronDown, ChevronUp,
  Upload, Calendar, Loader2, FileText, Award, XCircle, Download,
  AlertCircle, Lock, Bell
} from 'lucide-react';
import './ApplicationProcess.css';
import { useAuth } from '../hooks/useAuth';


const API_BASE_URL = import.meta.env.VITE_BASE_URL;

// The 9 main process steps (step 1 label becomes dynamic based on category)
const BASE_STEPS = [
  { id: 1, label: 'APPLICATION RECEIVED' },
  { id: 2, label: 'APPLICATION ACCEPTED' },
  { id: 4, label: 'INVOICE SENT' },
  { id: 5, label: 'PAYMENT RECEIVED' },
  { id: 6, label: 'AUDIT SESSION', hasSubSteps: true },
  { id: 7, label: "INITIATE SHARI'A LOGSHEET" },
  { id: 8, label: "SHARI'A BOARD REVIEW" },
  { id: 9, label: 'APPLICATION SUCCESSFUL' },
  { id: 10, label: 'ISSUE CERTIFICATE' },
];

const AUDIT_SUB_STEPS = [
  { id: 1, label: 'Schedule Audit Date', type: 'date' },
  { id: 2, label: 'Assign Auditors', type: 'auditors' },
  { id: 3, label: 'Audited', type: 'confirm' },
  { id: 4, label: 'NC Report (Upload)', type: 'upload' },
  { id: 5, label: 'NC Report Closed', type: 'confirm' },
  { id: 6, label: 'Audit Report Submitted', type: 'display' },
  { id: 7, label: 'Confirm Audit Report Received', type: 'confirm' },
];


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
  const { user } = useAuth();

  // Dynamic steps: step 1 label changes based on application category
  const isRenewal = application?.category?.toLowerCase()?.includes('renewal');
  const STEPS = BASE_STEPS.map(s =>
    s.id === 1 ? { ...s, label: isRenewal ? 'RENEWAL APPLICATION' : 'APPLICATION RECEIVED' } : s
  );
  const ROW_ONE = STEPS.slice(0, 5);
  const ROW_TWO = STEPS.slice(5, 10);


  const hasPrivilege = (priv) => {
    if (user?.role === 'super admin') return true;
    return user?.privileges?.includes(priv);
  };

  const [showLogsheetModal, setShowLogsheetModal] = useState(false);
  const [logsheetData, setLogsheetData] = useState({
    companyName: '',
    companyEmail: '',
    auditReportFile: null,
    labResultFile: null,
    additionalDocFiles: []
  });

  const NoPermissionView = ({ privilege }) => (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
      <Lock className="w-8 h-8 text-slate-400 mx-auto mb-3" />
      <h3 className="text-slate-800 font-semibold mb-1">Access Restricted</h3>
      <p className="text-sm text-slate-500">You need <strong>{privilege}</strong> privileges to perform actions in this step.</p>
    </div>
  );

  const [activeAuditSubStep, setActiveAuditSubStep] = useState(null);

  const [admins, setAdmins] = useState([]);


  // Form state
  const [auditDate, setAuditDate] = useState('');
  const [auditTime, setAuditTime] = useState('');
  const [proposedDates, setProposedDates] = useState([
    { date: '', fromTime: '', toDate: '' },
    { date: '', fromTime: '', toDate: '' },
    { date: '', fromTime: '', toDate: '' }
  ]);
  const [auditLeadName, setAuditLeadName] = useState('');
  const [auditLeadEmail, setAuditLeadEmail] = useState('');
  const [auditLeadPhone, setAuditLeadPhone] = useState('');
  const [auditors, setAuditors] = useState([{ name: '', email: '', phone: '', role: 'Lead Auditor' }]);
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [ncReportFile, setNcReportFile] = useState(null);
  const [auditReportFile, setAuditReportFile] = useState(null);
  const [prepDoc1, setPrepDoc1] = useState(null);
  const [prepDoc2, setPrepDoc2] = useState(null);
  const [prepDoc3, setPrepDoc3] = useState(null);

  const [certNumber, setCertNumber] = useState('');
  const [certExpiryDate, setCertExpiryDate] = useState('');
  const [certFiles, setCertFiles] = useState([]);
  const [certLabelFiles, setCertLabelFiles] = useState([]);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const resolveUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/api') ? path.replace('/api', '') : path;
    return `${API_BASE_URL}${cleanPath}`;
  };
  const [appInvoice, setAppInvoice] = useState(null);
  const [appProducts, setAppProducts] = useState([]);

  const getToken = () => JSON.parse(localStorage.getItem('accessToken'));

  const fetchApplication = useCallback(async () => {
    try {
      setLoading(true);
      const [appRes, invRes, prodRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/applications/${id}`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        }),
        axios.get(`${API_BASE_URL}/invoices`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        }),
        axios.get(`${API_BASE_URL}/products/admin-all?applicationId=${id}`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        })
      ]);
      const { data } = appRes;
      setApplication(data);
      const invoices = invRes.data;
      const currentInvoice = invoices.find(inv => inv.applicationId?._id === id || inv.applicationId === id);
      setAppInvoice(currentInvoice || null);

      const productsData = prodRes.data.products || [];
      const currentProducts = productsData.filter(p => p.applicationId?._id === id || p.applicationId === id);
      setAppProducts(currentProducts);

      if (data.applicationNumber) {
        setCertNumber(data.applicationNumber);
      }

      // Pre-fill logsheet data
      setLogsheetData(prev => ({
        ...prev,
        companyName: data.company?.companyName || '',
        companyEmail: data.company?.email || ''
      }));

      if (data.processData?.audit) {
        if (data.processData.audit.scheduledDate) setAuditDate(new Date(data.processData.audit.scheduledDate).toISOString().split('T')[0]);
        if (data.processData.audit.scheduledTime) setAuditTime(data.processData.audit.scheduledTime);
        if (data.processData.audit.leadAuditorName) setAuditLeadName(data.processData.audit.leadAuditorName);
        if (data.processData.audit.leadAuditorEmail) setAuditLeadEmail(data.processData.audit.leadAuditorEmail);
        if (data.processData.audit.leadAuditorPhone) setAuditLeadPhone(data.processData.audit.leadAuditorPhone);
        if (data.processData.audit.proposedDates && data.processData.audit.proposedDates.length === 3) {
          setProposedDates(data.processData.audit.proposedDates.map(pd => ({
            date: pd.date ? new Date(pd.date).toISOString().split('T')[0] : '',
            fromTime: pd.fromTime || pd.time || '',
            toDate: pd.toDate ? new Date(pd.toDate).toISOString().split('T')[0] : '',
            isCounter: pd.isCounter || false
          })));
        }
        if (data.processData.audit.auditors && data.processData.audit.auditors.length > 0) {
          setAuditors(data.processData.audit.auditors);
        } else if (data.processData.audit.leadAuditorName) {
          setAuditors([{
            name: data.processData.audit.leadAuditorName,
            email: data.processData.audit.leadAuditorEmail || '',
            phone: data.processData.audit.leadAuditorPhone || '',
            role: 'Lead Auditor'
          }]);
        }
      }
    } catch (err) {
      toast.error('Failed to load application');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchAdmins = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/users/admin`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setAdmins(data.users || []);
    } catch (err) {
      console.error('Failed to fetch admins:', err);
    }
  }, []);


  const handleDownloadCertificate = async (certPath = null) => {
    try {
      const { data: certs } = await axios.get(`${API_BASE_URL}/certificates?applicationId=${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });

      const cert = certs.find(c => c.applicationId?._id === id || c.applicationId === id);

      if (!cert) {
        toast.error('Certificate record not found');
        return;
      }

      const pathsToDownload = certPath ? [certPath] : (cert.pdfPaths || [cert.pdfPath]);

      if (pathsToDownload.length === 0) {
        toast.error('No certificate files found');
        return;
      }

      toast.loading(`Downloading certificate${pathsToDownload.length > 1 ? 's' : ''}...`, { id: "download-cert" });

      for (let i = 0; i < pathsToDownload.length; i++) {
        const path = pathsToDownload[i];
        const downloadUrl = path.startsWith('http') ? path : `${API_BASE_URL}${path.startsWith('/api') ? path.replace('/api', '') : path}`;

        window.open(downloadUrl, '_blank', 'noopener,noreferrer');

        const response = await fetch(downloadUrl, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        if (!response.ok) throw new Error("Failed to fetch file");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const filename = `Certificate_${application.applicationNumber}${pathsToDownload.length > 1 ? `_${i + 1}` : ''}.pdf`;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
      toast.success("Download started", { id: "download-cert" });
    } catch (err) {
      console.error(err);
      toast.error('Failed to download certificate', { id: "download-cert" });
    }
  };

  const handleDownloadLabel = async (indexOrPath) => {
    try {
      let downloadUrl;
      if (typeof indexOrPath === 'number') {
        const paths = application.processData?.labelFiles || [];
        if (!paths[indexOrPath]) {
          toast.error('Label file not found');
          return;
        }
        downloadUrl = resolveUrl(paths[indexOrPath]);
      } else {
        downloadUrl = resolveUrl(indexOrPath);
      }

      toast.loading("Downloading label order...", { id: "download-label" });
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');

      const response = await fetch(downloadUrl, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!response.ok) throw new Error("Failed to fetch file");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `LabelOrder_${application.applicationNumber}_${typeof indexOrPath === 'number' ? indexOrPath + 1 : 'file'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Label order downloaded", { id: "download-label" });
    } catch (err) {
      console.error(err);
      toast.error('Failed to download label order', { id: "download-label" });
    }
  };

  useEffect(() => { fetchApplication(); }, [fetchApplication]);
  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);
  const currentStep = Math.max(application?.processStep || 1, 2);
  const processData = application?.processData || {};
  const auditSubStep = processData?.audit?.subStep || 0;

  // Automatically set active step on mount/load
  useEffect(() => {
    if (application && !activeStep) {
      const stepToOpen = STEPS.find(s => s.id === currentStep);
      if (stepToOpen) setActiveStep(stepToOpen);
    }
  }, [application, currentStep, activeStep]);


  const isStepCompleted = (stepId) => {
    if (stepId === 1) return true;
    if (stepId < currentStep) return true;
    if (stepId === 6 && currentStep >= 7) return true;
    if (stepId === 7 && processData?.shariaBoardSentAt) return true;
    if (stepId === 8 && processData?.certificationApprovedAt) return true;
    if (stepId === 9 && processData?.processingStartedAt) return true;
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
      if (file) {
        if (Array.isArray(file)) {
          file.forEach(f => formData.append('file', f));
        } else {
          formData.append('file', file);
        }
      }

      // Append additional body fields (like certNumber, expiryDate)
      Object.keys(additionalBody).forEach(key => {
        if (key === 'labelFiles' && Array.isArray(additionalBody[key])) {
          additionalBody[key].forEach(f => formData.append('label', f));
        } else if (key === 'prepFiles' && Array.isArray(additionalBody[key])) {
          additionalBody[key].forEach(f => formData.append('prepDoc', f));
        } else {
          formData.append(key, additionalBody[key]);
        }
      });

      const { data } = await axios.patch(
        `${API_BASE_URL}/applications/${id}/process`,
        formData,
        { headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'multipart/form-data' } }
      );
      setApplication(data.application);

      const stepLabel = (stepId === 6 && subStep)
        ? AUDIT_SUB_STEPS.find(s => s.id === parseInt(subStep))?.label
        : STEPS.find(s => s.id === stepId)?.label || 'Step';

      const formattedLabel = stepLabel.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

      toast.success(`${formattedLabel} Successfully!`);
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
    if (certFiles.length === 0 || !certExpiryDate || !certNumber) {
      toast.error('Please provide certificate files, number and expiry date');
      return;
    }
    await submitStep(10, null, null, certFiles, { certNumber, expiryDate: certExpiryDate, labelFiles: certLabelFiles });
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
      setActiveStep(currentStep);

      // Pre-fill logsheet data
      if (res.data) {
        setLogsheetData({
          companyName: res.data.company?.companyName || '',
          companyEmail: res.data.company?.email || '',
          auditReport: res.data.processData?.audit?.auditReportFile || ''
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject application');
    } finally {
      setRejecting(false);
    }
  };

  const handleApproveProduct = async (productId) => {
    try {
      await axios.put(`${API_BASE_URL}/products/approve/${productId}`, {}, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      toast.success('Product acknowledged');
      fetchApplication();
    } catch (err) {
      toast.error('Failed to approve product');
    }
  };

  const handleRemindNcCorrection = async () => {
    if (!processData?.audit?.auditId) return;
    setSaving(true);
    try {
      await axios.post(`${API_BASE_URL}/audits/${processData.audit.auditId}/nc-remind`, {}, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      toast.success('Reminder sent to client');
      fetchApplication();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reminder');
    } finally {
      setSaving(false);
    }
  };

  const handleRejectProduct = async (productId) => {
    try {
      await axios.put(`${API_BASE_URL}/products/reject/${productId}`, {}, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      toast.success('Product rejected');
      fetchApplication();
    } catch (err) {
      toast.error('Failed to reject product');
    }
  };

  const MAX_FILE_SIZE_MB = 5;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  const handleCreateLogsheet = async () => {
    if (!logsheetData.companyName || !logsheetData.companyEmail || !logsheetData.auditReportFile) {
      toast.error('Please fill all required fields');
      return;
    }
    // Validate audit report size
    if (logsheetData.auditReportFile && logsheetData.auditReportFile.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`Audit report file exceeds ${MAX_FILE_SIZE_MB}MB limit`);
      return;
    }
    // Validate lab result size
    if (logsheetData.labResultFile && logsheetData.labResultFile.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`Lab result file exceeds ${MAX_FILE_SIZE_MB}MB limit`);
      return;
    }
    // Validate additional doc sizes
    for (const doc of logsheetData.additionalDocFiles) {
      if (doc && doc.size > MAX_FILE_SIZE_BYTES) {
        toast.error(`Additional document "${doc.name}" exceeds ${MAX_FILE_SIZE_MB}MB limit`);
        return;
      }
    }

    setSaving(true);
    const formData = new FormData();
    formData.append('applicationId', id);
    formData.append('companyName', logsheetData.companyName);
    formData.append('companyEmail', logsheetData.companyEmail);
    formData.append('auditReport', logsheetData.auditReportFile);
    if (logsheetData.labResultFile) {
      formData.append('labResult', logsheetData.labResultFile);
    }
    for (const doc of logsheetData.additionalDocFiles) {
      if (doc) formData.append('additionalDocuments', doc);
    }

    try {
      await axios.post(`${API_BASE_URL}/logsheets/create`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${getToken()}`
        }
      });
      toast.success('Logsheet created successfully');
      setShowLogsheetModal(false);
      fetchApplication(); // Refresh data
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create logsheet');
    } finally {
      setSaving(false);
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
            {isRenewal ? 'RENEWAL APPLICATION' : 'APPLICATION RECEIVED'}
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

          {/* Products Section */}
          {appProducts.length > 0 && (
            <div className="details-card" style={{ marginTop: '20px' }}>
              <h3>Products Under This Application ({appProducts.length})</h3>
              <table className="details-table" style={{ width: '100%' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Product Name</th>
                    <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Category</th>
                    <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {appProducts.map((product, i) => (
                    <tr key={product._id || i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px', fontSize: '13px' }}>{product.name}</td>
                      <td style={{ padding: '10px', fontSize: '13px', color: '#6b7280' }}>{product.category || product.productCategory || '—'}</td>
                      <td style={{ padding: '10px' }}>
                        <span style={{
                          padding: '2px 10px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'capitalize',
                          background: product.status === 'acknowledged' ? '#dcfce7' : product.status === 'rejected' ? '#fee2e2' : '#fef9c3',
                          color: product.status === 'acknowledged' ? '#15803d' : product.status === 'rejected' ? '#dc2626' : '#92400e'
                        }}>
                          {product.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
            {hasPrivilege('Application Officer') ? (
              <>
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
              </>
            ) : (
              <NoPermissionView privilege="Application Officer" />
            )}
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

    if (step.id === 4) {
      if (isComplete && processData?.invoiceFile) {
        return (
          <CompletedPanel label="Invoice Sent" timestamp={processData?.invoiceSentAt}>
            <a href={resolveUrl(processData.invoiceFile)} target="_blank" rel="noreferrer" className="file-link">
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
          <input type="file" id="invoice-upload" hidden accept=".pdf,.doc,.docx" onChange={e => {
            const file = e.target.files[0];
            if (file && file.size > 5 * 1024 * 1024) {
              toast.error(`File "${file.name}" exceeds the 5MB size limit.`);
              e.target.value = "";
              return;
            }
            setInvoiceFile(file);
          }} />
          {hasPrivilege('Accountant') ? (
            <button className="action-btn-primary" onClick={() => submitStep(4, null, null, invoiceFile)} disabled={saving || !invoiceFile}>
              {saving ? <Loader2 className="spin" size={16} /> : <Upload size={16} />}
              {saving ? 'Uploading...' : 'Upload & Send Invoice'}
            </button>
          ) : (
            <NoPermissionView privilege="Accountant" />
          )}
        </div>

      );
    }

    if (step.id === 5) {
      if (isComplete) return <CompletedPanel label="Payment Received" timestamp={processData?.paymentConfirmedAt} />;
      return (
        <div className="action-panel">
          <h2>Confirm Payment</h2>

          {appInvoice?.proofOfPayment ? (
            <div className="mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-800">Proof of Payment Uploaded</span>
              </div>
              <p className="text-sm text-blue-700" style={{ margin: 0 }}>The applicant has uploaded a proof of payment document for your review.</p>
              <a href={resolveUrl(appInvoice.proofOfPayment)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium w-fit hover:bg-blue-700 transition" style={{ textDecoration: 'none', marginTop: '8px' }}>
                <Download size={16} /> View Document
              </a>
            </div>
          ) : (
            <div className="mb-6 bg-slate-50 p-4 text-slate-600 text-sm border border-slate-200 rounded-xl">
              No proof of payment uploaded by applicant yet.
            </div>
          )}

          <p>Confirm that payment has been received from the applicant.</p>
          {hasPrivilege('Accountant') ? (
            <button className="action-btn-primary" onClick={() => submitStep(5)} disabled={saving}>
              {saving ? <Loader2 className="spin" size={16} /> : <CheckCircle size={16} />}
              {saving ? 'Processing...' : 'Confirm Payment Received'}
            </button>
          ) : (
            <NoPermissionView privilege="Accountant" />
          )}
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
                      {subCompleted ? <CheckCircle size={18} color="#22c55e" fill="white" /> : <Circle size={18} color={subActive ? '#3b82f6' : '#d1d5db'} />}
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

                          {/* Phase 1: No proposed dates yet */}
                          {(!processData?.audit?.status || processData?.audit?.status === 'Rejected' || !processData?.audit?.proposedDates || processData?.audit?.proposedDates.length === 0) && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              <p className="text-sm text-slate-600 font-medium">Propose three date options with a time period for the client to choose from:</p>
                              {[0, 1, 2].map((idx) => (
                                <div key={idx} style={{ padding: '16px', border: '1px dashed #cbd5e1', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Option #{idx + 1}</span>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                      <label style={{ fontSize: '12px', color: '#64748b' }}>Date <span style={{ color: '#ef4444' }}>*</span></label>
                                      <input
                                        type="date"
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                        value={proposedDates[idx]?.date || ''}
                                        onChange={(e) => {
                                          setProposedDates(prev => {
                                            const updated = [...prev];
                                            updated[idx] = { ...updated[idx], date: e.target.value, toDate: e.target.value };
                                            return updated;
                                          });
                                        }}
                                        className="form-input"
                                      />
                                    </div>
                                    <div>
                                      <label style={{ fontSize: '12px', color: '#64748b' }}>Time <span style={{ color: '#ef4444' }}>*</span></label>
                                      <input
                                        type="time"
                                        required
                                        value={proposedDates[idx]?.fromTime || ''}
                                        onChange={(e) => {
                                          setProposedDates(prev => {
                                            const updated = [...prev];
                                            updated[idx] = { ...updated[idx], fromTime: e.target.value };
                                            return updated;
                                          });
                                        }}
                                        className="form-input"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {hasPrivilege('Audit Manager') ? (
                                <button
                                  className="action-btn-primary sm"
                                  style={{ width: 'fit-content' }}
                                  onClick={() => {
                                    const anyEmpty = proposedDates.some(pd => !pd.date || !pd.fromTime);
                                    if (anyEmpty) {
                                      toast.error('Please fill in the date and time for all 3 options.');
                                      return;
                                    }
                                    const payload = JSON.stringify({
                                      action: 'propose',
                                      proposedDates: proposedDates
                                    });
                                    submitStep(6, 1, payload);
                                  }}
                                  disabled={saving}
                                >
                                  {saving ? <Loader2 className="spin" size={14} /> : <Calendar size={14} />}
                                  Propose Dates to Client
                                </button>
                              ) : (
                                <NoPermissionView privilege="Audit Manager" />
                              )}
                            </div>
                          )}

                          {/* Phase 2: Dates are proposed / client countered */}
                          {(processData?.audit?.status === 'Proposed' || processData?.audit?.status === 'Counter Proposed') && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              <p className="text-sm font-semibold text-slate-700">
                                {processData?.audit?.status === 'Proposed'
                                  ? 'Proposed dates sent to client. Waiting for client to accept or propose alternatives.'
                                  : 'Client has countered some of the dates. Please choose one of the options to finalize the date:'}
                              </p>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {(processData?.audit?.proposedDates || []).map((pd, idx) => (
                                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', border: pd.isCounter ? '1px solid #f59e0b' : '1px solid #e2e8f0', borderRadius: '8px', background: pd.isCounter ? '#fffbeb' : '#f8fafc' }}>
                                    <div>
                                      <span style={{ fontWeight: 600, fontSize: '13px', display: 'block', color: '#1e293b' }}>
                                        Option #{idx + 1}: {new Date(pd.date).toLocaleDateString()}
                                        {pd.toDate && pd.date !== pd.toDate
                                          ? ` to ${new Date(pd.toDate).toLocaleDateString()}`
                                          : ''}
                                        {pd.fromTime ? ` at ${pd.fromTime}` : pd.time ? ` at ${pd.time}` : ''}
                                      </span>
                                      {pd.isCounter && (
                                        <span style={{ fontSize: '11px', color: '#d97706', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                          ⚠️ Client Proposed Alternative
                                        </span>
                                      )}
                                    </div>
                                    {hasPrivilege('Audit Manager') && (
                                      <button
                                        type="button"
                                        style={{ background: '#00853b', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                                        onClick={() => {
                                          const payload = JSON.stringify({
                                            action: 'finalizeDate',
                                            date: pd.date,
                                            time: pd.fromTime || pd.time,
                                            fromTime: pd.fromTime || pd.time,
                                            toDate: pd.toDate || pd.date
                                          });
                                          submitStep(6, 1, payload);
                                        }}
                                        disabled={saving}
                                      >
                                        Finalize This Option
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Phase 3: Date concluded — prompt to go to Assign Auditors sub-step */}
                          {processData?.audit?.status === 'Date Concluded' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <span style={{ fontSize: '12px', color: '#047857', fontWeight: 600, textTransform: 'uppercase', display: 'block' }}>Date Concluded ✓</span>
                                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#064e3b' }}>
                                    {new Date(processData.audit.scheduledDate).toLocaleDateString()}
                                    {processData.audit.scheduledToDate && processData.audit.scheduledDate !== processData.audit.scheduledToDate
                                      ? ` to ${new Date(processData.audit.scheduledToDate).toLocaleDateString()}`
                                      : ''} at {processData.audit.scheduledTime}
                                  </span>
                                </div>
                                <span style={{ fontSize: '12px', background: '#d1fae5', color: '#065f46', padding: '4px 10px', borderRadius: '12px', fontWeight: 600 }}>Finalized</span>
                              </div>
                              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Date is confirmed. Please proceed to <strong>Assign Auditors</strong> (sub-step 2) to assign auditors to this session.</p>
                            </div>
                          )}

                          {/* Phase 4: Audit Scheduled */}
                          {processData?.audit?.status === 'Scheduled' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              <p className="text-sm font-semibold text-slate-700">Audit session scheduled. Auditors have been assigned — proceed to mark the audit as completed.</p>
                            </div>
                          )}
                        </>
                      )}
                      {sub.type === 'auditors' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {(processData?.audit?.status !== 'Date Concluded' && processData?.audit?.status !== 'Scheduled' && !processData?.audit?.scheduledDate) && (
                            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Please finalize the audit date first (sub-step 1) before assigning auditors.</p>
                          )}
                          {(processData?.audit?.status === 'Date Concluded' || processData?.audit?.status === 'Scheduled' || processData?.audit?.scheduledDate) && (
                            <>
                              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px 16px', borderRadius: '8px' }}>
                                <span style={{ fontSize: '13px', color: '#047857', fontWeight: 600 }}>Scheduled Date: </span>
                                <span style={{ fontSize: '13px', color: '#064e3b' }}>
                                  {processData.audit.scheduledDate ? new Date(processData.audit.scheduledDate).toLocaleDateString() : 'N/A'}
                                  {processData.audit.scheduledToDate && processData.audit.scheduledDate !== processData.audit.scheduledToDate ? ` to ${new Date(processData.audit.scheduledToDate).toLocaleDateString()}` : ''} at {processData.audit.scheduledTime || 'N/A'}
                                </span>
                              </div>
                              <label style={{ fontWeight: 600, fontSize: '14px' }}>Auditors List * <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 400 }}>(at least 1 Lead Auditor required)</span></label>
                              {auditors.map((auditor, idx) => (
                                <div key={idx} style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '12px', background: '#f8fafc' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <span style={{ fontWeight: 600, fontSize: '13px', color: '#475569' }}>Auditor #{idx + 1}</span>
                                    {auditors.length > 1 && (
                                      <button type="button" onClick={() => setAuditors(prev => prev.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Remove</button>
                                    )}
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                      <label style={{ fontSize: '12px', color: '#64748b' }}>Select Admin User (auto-fill)</label>
                                      <select className="form-input" value={admins.find(a => (a.fullName || a.name) === auditor.name)?._id || ''} onChange={(e) => { const admin = admins.find(a => a._id === e.target.value); if (admin) { setAuditors(prev => { const updated = [...prev]; updated[idx] = { ...updated[idx], name: admin.fullName || admin.name || '', email: admin.email || '', phone: admin.contact || '' }; return updated; }); } }}>
                                        <option value="">--- Select to auto-fill ---</option>
                                        {admins.map(admin => <option key={admin._id} value={admin._id}>{admin.fullName || admin.name} ({admin.email})</option>)}
                                      </select>
                                    </div>
                                    <div>
                                      <label style={{ fontSize: '12px', color: '#64748b' }}>Name *</label>
                                      <input type="text" value={auditor.name} onChange={(e) => { setAuditors(prev => { const updated = [...prev]; updated[idx] = { ...updated[idx], name: e.target.value }; return updated; }); }} placeholder="Full name" className="form-input" />
                                    </div>
                                    <div>
                                      <label style={{ fontSize: '12px', color: '#64748b' }}>Role *</label>
                                      <select value={auditor.role} onChange={(e) => { setAuditors(prev => { const updated = [...prev]; updated[idx] = { ...updated[idx], role: e.target.value }; return updated; }); }} className="form-input">
                                        <option value="Lead Auditor">Lead Auditor</option>
                                        <option value="Shari'a Auditor">Shari'a Auditor</option>
                                        <option value="Normal Auditor">Normal Auditor</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label style={{ fontSize: '12px', color: '#64748b' }}>Email</label>
                                      <input type="email" value={auditor.email} onChange={(e) => { setAuditors(prev => { const updated = [...prev]; updated[idx] = { ...updated[idx], email: e.target.value }; return updated; }); }} placeholder="auditor@example.com" className="form-input" />
                                    </div>
                                    <div>
                                      <label style={{ fontSize: '12px', color: '#64748b' }}>Phone</label>
                                      <input type="tel" value={auditor.phone} onChange={(e) => { setAuditors(prev => { const updated = [...prev]; updated[idx] = { ...updated[idx], phone: e.target.value }; return updated; }); }} placeholder="+234..." className="form-input" />
                                    </div>
                                  </div>
                                </div>
                              ))}
                              <button type="button" onClick={() => setAuditors(prev => [...prev, { name: '', email: '', phone: '', role: 'Normal Auditor' }])} style={{ width: 'fit-content', background: '#e2e8f0', color: '#334155', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>+ Add Another Auditor</button>
                              <div style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '20px', marginBottom: '20px' }}>
                                <label style={{ fontWeight: 600, fontSize: '14px' }}>Preparation Documents for Client</label>
                                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>Upload up to 3 documents needed by the client to prepare for the audit. At least one is required.</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                                  <div>
                                    <label style={{ fontSize: '12px', color: '#64748b' }}>Document 1 (Required) *</label>
                                    <input type="file" onChange={(e) => {
                                      const file = e.target.files[0];
                                      if (file && file.size > 5 * 1024 * 1024) {
                                        toast.error(`File "${file.name}" exceeds the 5MB size limit.`);
                                        e.target.value = "";
                                        return;
                                      }
                                      setPrepDoc1(file);
                                    }} className="form-input" />
                                  </div>
                                  <div>
                                    <label style={{ fontSize: '12px', color: '#64748b' }}>Document 2 (Optional)</label>
                                    <input type="file" onChange={(e) => {
                                      const file = e.target.files[0];
                                      if (file && file.size > 5 * 1024 * 1024) {
                                        toast.error(`File "${file.name}" exceeds the 5MB size limit.`);
                                        e.target.value = "";
                                        return;
                                      }
                                      setPrepDoc2(file);
                                    }} className="form-input" />
                                  </div>
                                  <div>
                                    <label style={{ fontSize: '12px', color: '#64748b' }}>Document 3 (Optional)</label>
                                    <input type="file" onChange={(e) => {
                                      const file = e.target.files[0];
                                      if (file && file.size > 5 * 1024 * 1024) {
                                        toast.error(`File "${file.name}" exceeds the 5MB size limit.`);
                                        e.target.value = "";
                                        return;
                                      }
                                      setPrepDoc3(file);
                                    }} className="form-input" />
                                  </div>
                                </div>
                              </div>
                              {hasPrivilege('Audit Manager') ? (
                                <button
                                  className="action-btn-primary sm"
                                  style={{ marginTop: '8px' }}
                                  onClick={() => {
                                    const hasLead = auditors.some(a => a.role === 'Lead Auditor');
                                    if (!hasLead) { toast.error('Please assign at least one Lead Auditor.'); return; }
                                    const hasEmptyName = auditors.some(a => !a.name.trim());
                                    if (hasEmptyName) { toast.error('Please enter names for all auditors.'); return; }
                                    if (!prepDoc1) { toast.error('Please upload at least Document 1 for the client.'); return; }

                                    const prepFilesArray = [];
                                    if (prepDoc1) prepFilesArray.push(prepDoc1);
                                    if (prepDoc2) prepFilesArray.push(prepDoc2);
                                    if (prepDoc3) prepFilesArray.push(prepDoc3);

                                    submitStep(6, 2, JSON.stringify({ auditors }), null, { prepFiles: prepFilesArray });
                                  }}
                                  disabled={saving || auditors.length === 0}
                                >
                                  {saving ? <Loader2 className="spin" size={14} /> : <CheckCircle size={14} />}
                                  Assign Auditors & Schedule Audit
                                </button>
                              ) : (
                                <NoPermissionView privilege="Audit Manager" />
                              )}
                            </>
                          )}
                        </div>
                      )}
                      {sub.type === 'confirm' && (
                        hasPrivilege('Audit Manager') ? (
                          sub.id === 5 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              {processData?.audit?.ncCorrectionFile ? (
                                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '16px', borderRadius: '8px' }}>
                                  <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#166534', fontWeight: 600 }}>Client submitted corrected actions.</p>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                                    {Array.isArray(processData.audit.ncCorrectionFile) ? (
                                      processData.audit.ncCorrectionFile.map((fileUrl, idx) => (
                                        <a key={idx} href={resolveUrl(fileUrl)} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#15803d', textDecoration: 'underline', fontWeight: 500 }}>
                                          <FileText size={16} /> View Corrected Action Doc #{idx + 1}
                                        </a>
                                      ))
                                    ) : (
                                      <a href={resolveUrl(processData.audit.ncCorrectionFile)} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#15803d', textDecoration: 'underline', fontWeight: 500 }}>
                                        <FileText size={16} /> View Corrected Action
                                      </a>
                                    )}
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button className="action-btn-primary sm" onClick={() => submitStep(6, sub.id)} disabled={saving}>
                                      {saving ? <Loader2 className="spin" size={14} /> : <CheckCircle size={14} />}
                                      Mark NC as Closed
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '16px', borderRadius: '8px' }}>
                                  <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#92400e', fontWeight: 600 }}>Waiting for client to submit NC correction...</p>
                                  {processData?.audit?.ncReminderSentAt && (
                                    <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#b45309' }}>Last reminder sent: {new Date(processData.audit.ncReminderSentAt).toLocaleString()}</p>
                                  )}
                                  <div style={{ display: 'flex', gap: '12px' }}>
                                    <button className="action-btn-secondary sm" onClick={handleRemindNcCorrection} disabled={saving}>
                                      {saving ? <Loader2 className="spin" size={14} /> : <Bell size={14} />}
                                      Remind Client
                                    </button>
                                    <button className="action-btn-primary sm" onClick={() => submitStep(6, sub.id)} disabled={saving}>
                                      {saving ? <Loader2 className="spin" size={14} /> : <CheckCircle size={14} />}
                                      Mark NC as Closed Anyway
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <button className="action-btn-primary sm" onClick={() => submitStep(6, sub.id)} disabled={saving}>
                              {saving ? <Loader2 className="spin" size={14} /> : <CheckCircle size={14} />}
                              {sub.id === 3 ? 'Mark as Audited' : 'Confirm Audit Report Received'}
                            </button>
                          )
                        ) : (
                          <NoPermissionView privilege="Audit Manager" />
                        )
                      )}

                      {sub.type === 'display' && (
                        <div className="substep-display">
                          {processData?.audit?.auditReportFile && (
                            <div className="file-info">
                              <p>Audit report uploaded.</p>
                              <a href={resolveUrl(processData.audit.auditReportFile)} target="_blank" rel="noreferrer" className="file-link">
                                <FileText size={16} /> View Report
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
                            onChange={e => {
                              const file = e.target.files[0];
                              if (file && file.size > 5 * 1024 * 1024) {
                                toast.error(`File "${file.name}" exceeds the 5MB size limit.`);
                                e.target.value = "";
                                return;
                              }
                              setAuditReportFile(file);
                            }}
                          />
                          {hasPrivilege('Audit Manager') ? (
                            <button
                              className="action-btn-primary sm"
                              onClick={() => submitStep(6, 6, null, auditReportFile)}
                              disabled={saving || !auditReportFile}
                            >
                              {saving ? <Loader2 className="spin" size={14} /> : <Upload size={14} />}
                              {processData?.audit?.auditReportFile ? 'Update' : 'Upload'} Audit Report
                            </button>
                          ) : (
                            <NoPermissionView privilege="Audit Manager" />
                          )}
                        </div>

                      )}
                      {sub.type === 'upload' && sub.id === 4 && (
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
                            onChange={e => {
                              const file = e.target.files[0];
                              if (file && file.size > 5 * 1024 * 1024) {
                                toast.error(`File "${file.name}" exceeds the 5MB size limit.`);
                                e.target.value = "";
                                return;
                              }
                              setNcReportFile(file);
                            }}
                          />
                          {hasPrivilege('Audit Manager') ? (
                            <button
                              className="action-btn-primary sm"
                              onClick={() => submitStep(6, 4, null, ncReportFile)}
                              disabled={saving || !ncReportFile}
                            >
                              {saving ? <Loader2 className="spin" size={14} /> : <Upload size={14} />}
                              Upload NC Report
                            </button>
                          ) : (
                            <NoPermissionView privilege="Audit Manager" />
                          )}

                          {processData?.audit?.ncCorrectionFile && (
                            <div style={{ marginTop: '16px', padding: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
                              <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#166534', fontWeight: 600 }}>Client submitted corrected action(s).</p>
                              {Array.isArray(processData.audit.ncCorrectionFile) ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  {processData.audit.ncCorrectionFile.map((fileUrl, idx) => (
                                    <a key={idx} href={resolveUrl(fileUrl)} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#15803d', textDecoration: 'underline', fontWeight: 500 }}>
                                      <FileText size={16} /> View Correction #{idx + 1}
                                    </a>
                                  ))}
                                </div>
                              ) : (
                                <a href={resolveUrl(processData.audit.ncCorrectionFile)} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#15803d', textDecoration: 'underline', fontWeight: 500 }}>
                                  <FileText size={16} /> View Corrected Action
                                </a>
                              )}
                            </div>
                          )}
                        </>

                      )}
                    </div>
                  )}

                  {/* Completed state */}
                  {subCompleted && activeAuditSubStep !== sub.id && (
                    <div className="substep-completed" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ color: '#15803d', fontSize: '13px' }}>
                        ✓ Completed
                        {sub.id === 1 && processData?.audit?.scheduledDate
                          ? ` — ${new Date(processData.audit.scheduledDate).toLocaleDateString()}${processData.audit.scheduledToDate && processData.audit.scheduledDate !== processData.audit.scheduledToDate ? ` to ${new Date(processData.audit.scheduledToDate).toLocaleDateString()}` : ''}${processData.audit.scheduledTime ? ` at ${processData.audit.scheduledTime}` : ''}`
                          : ''}
                        {sub.id === 2 && processData?.audit?.auditors && processData.audit.auditors.length > 0
                          ? ` — ${processData.audit.auditors.length} auditor(s) assigned`
                          : ''}
                      </span>
                      {sub.id === 4 && processData?.audit?.ncReportFile && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <a href={resolveUrl(processData.audit.ncReportFile)} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#2563eb', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                            <FileText size={14} /> View Uploaded NC Report
                          </a>
                          {processData?.audit?.ncCorrectionFile && (
                            <a href={resolveUrl(processData.audit.ncCorrectionFile)} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#15803d', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                              <FileText size={14} /> View Corrected Action
                            </a>
                          )}
                        </div>
                      )}
                      {sub.id === 5 && processData?.audit?.ncCorrectionFile && (
                        <a href={resolveUrl(processData.audit.ncCorrectionFile)} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#15803d', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                          <FileText size={14} /> View Corrected Action
                        </a>
                      )}
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
      if (processData?.shariaBoardSentAt) return <CompletedPanel label="Logsheet Created" timestamp={processData?.shariaBoardSentAt} />;
      return (
        <div className="action-panel">
          <h2>Initiate Shari'a Logsheet</h2>
          <p>Create a formal logsheet to be sent to the Shari'a Board for endorsement.</p>
          {hasPrivilege('Audit Manager') ? (
            <button className="action-btn-primary" onClick={() => setShowLogsheetModal(true)} disabled={saving}>
              <FileText size={16} />
              Create Logsheet
            </button>
          ) : (
            <NoPermissionView privilege="Audit Manager" />
          )}
        </div>
      );
    }

    if (step.id === 8) {
      const isComplete = application?.processStep > 8;
      if (isComplete) return <CompletedPanel label="Shari'a Board Endorsed" timestamp={processData?.certificationApprovedAt} />;
      return (
        <div className="action-panel">
          <h2>Shari'a Board Review</h2>
          <div className="mb-6 bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              This application is currently with the Shari'a Board. Every board member must sign the logsheet before certification is successful.
            </p>
          </div>
          <p>Status: <strong>{processData?.shariaBoardApprovedAt ? 'Board Endorsed, Pending Final Success Marker' : 'Awaiting Board Signatures'}</strong></p>
          <div style={{ marginTop: '16px' }}>
            <button className="action-btn-primary sm" onClick={() => navigate('/sharia-board')} style={{ width: 'auto' }}>
              <Award size={16} />
              Go to Shari'a Board Page
            </button>
          </div>
        </div>
      );
    }

    if (step.id === 9) {
      if (application?.processStep > 9) return <CompletedPanel label="Application Successful" timestamp={processData?.certificationApprovedAt} />;
      return (
        <div className="action-panel">
          <h2>Application Successful</h2>
          <div className="mb-6 bg-green-50 p-4 rounded-xl border border-green-100 flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <p className="text-xs text-green-800 leading-relaxed">
              The Shari'a Board has endorsed this application. You can now proceed to issue the certificate.
            </p>
          </div>
          <p>Approval received on: <strong>{processData?.certificationApprovedAt ? new Date(processData.certificationApprovedAt).toLocaleDateString() : 'N/A'}</strong></p>
          {hasPrivilege('Audit Manager') ? (
            <button className="action-btn-primary" onClick={() => submitStep(9)} disabled={saving}>
              {saving ? <Loader2 className="spin" size={16} /> : <Award size={16} />}
              {saving ? 'Processing...' : 'Confirm for Processing'}
            </button>
          ) : (
            <NoPermissionView privilege="Audit Manager" />
          )}
        </div>
      );
    }

    if (step.id === 10) {
      if (application?.status === 'Issued') {
        return (
          <CompletedPanel label="Certificate Issued" timestamp={processData?.issuedAt}>
            <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {(application.processData?.certificateFiles || []).map((cp, idx) => (
                <button
                  key={`cert-${idx}`}
                  className="action-btn-primary"
                  onClick={() => handleDownloadCertificate(cp)}
                  style={{ width: 'auto', padding: '10px 24px' }}
                >
                  <Download size={18} />
                  Download Certificate {application.processData?.certificateFiles?.length > 1 ? idx + 1 : ''}
                </button>
              ))}
              {application.processData?.labelFiles?.map((lp, idx) => (
                <button
                  key={`label-${idx}`}
                  className="action-btn-secondary"
                  onClick={() => handleDownloadLabel(idx)}
                  style={{ width: 'auto', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', background: '#f3f4f6', color: '#374151', borderRadius: '8px', fontWeight: 500, border: '1px solid #d1d5db', cursor: 'pointer' }}
                >
                  <Download size={18} />
                  Download Label Order {idx + 1}
                </button>
              ))}
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
                    disabled={!hasPrivilege('Certificate Officer')}
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
                    disabled={!hasPrivilege('Certificate Officer')}
                  />
                </div>
              </div>
            </div>

            <div className="details-card" style={{ padding: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px', display: 'block' }}>
                Certificate Document (Final PDF or Image)
              </label>
              <div className="upload-area" onClick={() => hasPrivilege('Certificate Officer') && document.getElementById('cert-upload').click()} style={{ minHeight: '120px', cursor: hasPrivilege('Certificate Officer') ? 'pointer' : 'not-allowed' }}>
                <Upload size={24} color="#9ca3af" />
                <p style={{ fontSize: '13px', margin: '8px 0' }}>
                  {certFiles.length > 0
                    ? `${certFiles.length} file(s) selected`
                    : 'Click to select certificate file(s)'}
                </p>
                {certFiles.length > 0 && (
                  <div style={{ fontSize: '11px', color: '#1e40af', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '5px' }}>
                    {certFiles.map((f, i) => <span key={i} className="bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{f.name}</span>)}
                  </div>
                )}
                <span style={{ fontSize: '11px', color: '#6b7280' }}>PDF, PNG, JPG files supported (Can select multiple)</span>
              </div>
              <input
                type="file"
                id="cert-upload"
                hidden
                multiple
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={e => {
                  if (e.target.files) {
                    const files = Array.from(e.target.files);
                    const oversized = files.find(f => f.size > 5 * 1024 * 1024);
                    if (oversized) {
                      toast.error(`File "${oversized.name}" exceeds the 5MB size limit.`);
                      e.target.value = "";
                      return;
                    }
                    setCertFiles(files);
                  }
                }}
              />
            </div>

            <div className="details-card" style={{ padding: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px', display: 'block' }}>
                Product Label (Optional)
              </label>
              <div className="upload-area" onClick={() => hasPrivilege('Certificate Officer') && document.getElementById('label-upload').click()} style={{ minHeight: '120px', cursor: hasPrivilege('Certificate Officer') ? 'pointer' : 'not-allowed' }}>
                <Upload size={24} color="#9ca3af" />
                <p style={{ fontSize: '13px', margin: '8px 0' }}>
                  {certLabelFiles.length > 0
                    ? `${certLabelFiles.length} label file(s) selected`
                    : 'Click to select label file(s)'}
                </p>
                <span style={{ fontSize: '11px', color: '#6b7280' }}>PDF, PNG, JPG files supported (Select multiple if needed)</span>
              </div>
              <input
                type="file"
                id="label-upload"
                hidden
                multiple
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={e => {
                  const files = Array.from(e.target.files);
                  const oversized = files.find(f => f.size > 5 * 1024 * 1024);
                  if (oversized) {
                    toast.error(`File "${oversized.name}" exceeds the 5MB size limit.`);
                    e.target.value = "";
                    return;
                  }
                  setCertLabelFiles(files);
                }}
              />
            </div>
          </div>

          {hasPrivilege('Certificate Officer') ? (
            <button
              className="action-btn-primary success"
              onClick={handleIssueCertificate}
              disabled={saving || !certFiles || !certExpiryDate || !certNumber}
              style={{ marginTop: '24px', width: '100%', maxWidth: '300px', marginInline: 'auto' }}
            >
              {saving ? <Loader2 className="spin" size={16} /> : <Award size={16} />}
              {saving ? 'Issuing Certificate...' : 'Complete Issue Certificate'}
            </button>
          ) : (
            <div style={{ marginTop: '24px' }}>
              <NoPermissionView privilege="Certificate Officer" />
            </div>
          )}
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

      {/* Logsheet Modal */}
      {showLogsheetModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 9999 }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', width: '100%', maxWidth: '512px', overflow: 'hidden' }}>
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center" style={{ padding: '24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Create Shari'a Logsheet</h3>
              <button onClick={() => setShowLogsheetModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><XCircle size={20} /></button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Company Name</label>
                <input
                  type="text"
                  value={logsheetData.companyName}
                  onChange={e => setLogsheetData({ ...logsheetData, companyName: e.target.value })}
                  className="form-input"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Company Email</label>
                <input
                  type="email"
                  value={logsheetData.companyEmail}
                  onChange={e => setLogsheetData({ ...logsheetData, companyEmail: e.target.value })}
                  className="form-input"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Audit Report (PDF/Doc)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="file"
                    onChange={e => setLogsheetData({ ...logsheetData, auditReportFile: e.target.files[0] })}
                    accept=".pdf,.doc,.docx"
                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '8px' }}
                  />
                  {logsheetData.auditReportFile && <p className="text-xs text-green-600">Selected: {logsheetData.auditReportFile.name}</p>}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Lab Results (Optional, Any format) <span style={{ fontWeight: 400, color: '#9ca3af' }}>— max 5MB</span></label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="file"
                    onChange={e => {
                      const file = e.target.files[0];
                      if (file && file.size > 5 * 1024 * 1024) { toast.error('File exceeds 5MB limit'); e.target.value = ''; return; }
                      setLogsheetData({ ...logsheetData, labResultFile: file });
                    }}
                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '8px' }}
                  />
                  {logsheetData.labResultFile && <p className="text-xs text-green-600">Selected: {logsheetData.labResultFile.name}</p>}
                </div>
              </div>

              {/* Additional Documents */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Additional Documents <span style={{ fontWeight: 400, color: '#9ca3af' }}>— optional, each max 5MB</span></label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {logsheetData.additionalDocFiles.map((doc, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="file"
                        onChange={e => {
                          const file = e.target.files[0];
                          if (file && file.size > 5 * 1024 * 1024) { toast.error(`File "${file.name}" exceeds 5MB limit`); e.target.value = ''; return; }
                          const updated = [...logsheetData.additionalDocFiles];
                          updated[idx] = file;
                          setLogsheetData({ ...logsheetData, additionalDocFiles: updated });
                        }}
                        style={{ flex: 1, padding: '8px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px' }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = logsheetData.additionalDocFiles.filter((_, i) => i !== idx);
                          setLogsheetData({ ...logsheetData, additionalDocFiles: updated });
                        }}
                        style={{ background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', color: '#dc2626', fontWeight: 700, fontSize: '13px' }}
                      >✕</button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setLogsheetData({ ...logsheetData, additionalDocFiles: [...logsheetData.additionalDocFiles, null] })}
                    style={{ alignSelf: 'flex-start', background: '#f0fdf4', border: '1px dashed #86efac', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', color: '#16a34a', fontWeight: 600, fontSize: '13px' }}
                  >+ Add Document</button>
                </div>
              </div>

              <div style={{ marginTop: '12px', display: 'flex', gap: '12px' }}>
                <button
                  className="action-btn-primary"
                  onClick={handleCreateLogsheet}
                  disabled={saving}
                  style={{ flex: 1 }}
                >
                  {saving ? 'Creating...' : 'Confirm & Send to Board'}
                </button>
                <button
                  onClick={() => setShowLogsheetModal(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
    'Successful': '#16a34a', 'Rejected': '#dc2626', "With Shari'a Board": '#f59e0b', 'Renewal': '#f59e0b'
  };
  return map[status] || '#6b7280';
}
