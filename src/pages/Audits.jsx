import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  User, 
  Search, 
  Filter, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  MoreVertical,
  X,
  Building,
  MapPin,
  RefreshCw,
  FileText,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  Eye,
  Download,
  ExternalLink
} from 'lucide-react';
import { useAll } from '../hooks/useAll';
import { toast } from 'sonner';
import TableActions from '../components/TableActions';

const Audits = () => {
  const { 
    audits, 
    applications, 
    isLoading, 
    fetchAudits,
    fetchApplications,
    scheduleAudit,
    addAuditCorrection,
    completeAudit,
    uploadAuditReport,
    sendCorrectionReminder,
    resendAuditCorrection
  } = useAll();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [correctionIssue, setCorrectionIssue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportFile, setReportFile] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [scheduleForm, setScheduleForm] = useState({
    applicationId: '',
    staffName: '',
    auditorEmail: '',
    auditorPhone: '',
    scheduledDate: '',
    scheduledTime: ''
  });

  useEffect(() => {
    fetchAudits();
    fetchApplications();
  }, []);

  const handleRefresh = async () => {
    await Promise.all([fetchAudits(), fetchApplications()]);
    toast.success('Audit data refreshed');
  };

  const filteredAudits = audits.filter(audit => {
    const matchesSearch = 
      audit.applicationId?.applicationNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      audit.staffName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      audit.userId?.companyName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || audit.status?.toLowerCase() === statusFilter.toLowerCase().replace(' ', '');
    
    return matchesSearch && matchesStatus;
  });

  const getEligibleApplications = () => {
    // Only applications that don't have an audit or are approved can be scheduled
    // This is a simplified filter; in production, you might want more complex logic
    return applications.filter(app => 
      (app.status === 'Accepted' || app.status === 'Submitted') && 
      !audits.some(audit => audit.applicationId?._id === app._id || audit.applicationId === app._id)
    );
  };

  const getStatusBadge = (status) => {
    const styles = {
      scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
      accepted: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      rejected: 'bg-red-100 text-red-700 border-red-200',
      correctionneeded: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      completed: 'bg-green-100 text-green-700 border-green-200',
    };
    
    const normalizedStatus = status?.toLowerCase().replace(/\s/g, '') || '';
    return styles[normalizedStatus] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduleForm.applicationId || !scheduleForm.staffName || !scheduleForm.scheduledDate || !scheduleForm.scheduledTime) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    const result = await scheduleAudit(scheduleForm);
    setIsSubmitting(false);

    if (result.success) {
      setIsScheduleModalOpen(false);
      setScheduleForm({
        applicationId: '',
        staffName: '',
        auditorEmail: '',
        auditorPhone: '',
        scheduledDate: '',
        scheduledTime: ''
      });
    }
  };

  const handleReportUpload = async (e) => {
    e.preventDefault();
    if (!reportFile || !selectedAudit) return;

    setIsSubmitting(true);
    const result = await uploadAuditReport(selectedAudit._id, reportFile);
    setIsSubmitting(false);

    if (result.success) {
      setIsReportModalOpen(false);
      setReportFile(null);
      setSelectedAudit(null);
    }
  };

  const handleSendReminder = async (id) => {
    await sendCorrectionReminder(id);
  };

  const handleResendCorrection = async (auditId, correctionId) => {
    if (window.confirm('Mark this correction as unacceptable and resend to client?')) {
      await resendAuditCorrection(auditId, correctionId);
    }
  };

  const handleCorrectionSubmit = async (e) => {
    e.preventDefault();
    if (!correctionIssue) {
      toast.error('Please describe the issue');
      return;
    }

    setIsSubmitting(true);
    const result = await addAuditCorrection(selectedAudit._id, correctionIssue);
    setIsSubmitting(false);

    if (result.success) {
      setIsCorrectionModalOpen(false);
      setCorrectionIssue('');
      setSelectedAudit(null);
    }
  };

  const handleComplete = async (id) => {
    if (window.confirm('Are you sure you want to mark this audit as completed?')) {
      const result = await completeAudit(id);
      if (result.success) {
        toast.success('Audit marked as completed');
      }
    }
  };

  return (
    <div className="p-4 lg:p-8 pt-20 lg:pt-8 min-h-screen bg-gray-50/50">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Audit Management</h1>
          <p className="text-gray-500 mt-1">Schedule and monitor certification site audits</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            className="p-2.5 bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-lg shadow-sm transition-all duration-200"
            disabled={isLoading}
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {/* <button 
            onClick={() => setIsScheduleModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#00853b] text-white rounded-lg shadow-sm hover:bg-green-700 transition-all font-semibold"
          >
            <Plus className="w-5 h-5" />
            Schedule Audit
          </button> */}
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search audits by application, company or staff..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="relative md:w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select 
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none appearance-none cursor-pointer text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="correctionneeded">Correction Needed</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit List (Table) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Application</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Auditor</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Scheduled Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="6" className="px-6 py-8">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : filteredAudits.length > 0 ? (
                filteredAudits.map((audit) => {
                  const statusBadge = getStatusBadge(audit.status);
                  return (
                    <tr key={audit._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-bold text-gray-900">{audit.applicationId?.applicationNumber || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <Building className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900">{audit.userId?.companyName || 'Unknown Company'}</div>
                            <div className="text-xs text-gray-500">{audit.userId?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-xs">
                            {audit.staffName?.charAt(0) || 'A'}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900">{audit.staffName}</div>
                            {audit.auditorEmail && <div className="text-[10px] text-gray-500">{audit.auditorEmail}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            {new Date(audit.scheduledDate).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            {audit.scheduledTime}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${statusBadge}`}>
                          {audit.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <TableActions 
                          actions={[
                            {
                              label: 'View Details',
                              icon: Eye,
                              onClick: () => { setSelectedAudit(audit); setIsViewModalOpen(true); }
                            },
                            (audit.status === 'Accepted' || audit.status === 'Correction Needed') && {
                              label: 'Upload Audit Report',
                              icon: FileText,
                              onClick: () => { setSelectedAudit(audit); setIsReportModalOpen(true); }
                            },
                            (audit.status === 'Accepted' || audit.status === 'Correction Needed') && {
                              label: 'Flag Non Conformant',
                              icon: AlertTriangle,
                              onClick: () => { setSelectedAudit(audit); setIsCorrectionModalOpen(true); }
                            },
                            (audit.status === 'Accepted' || audit.status === 'Correction Needed') && {
                              label: 'Mark Complete',
                              icon: CheckCircle,
                              onClick: () => handleComplete(audit._id)
                            },
                            audit.status === 'Correction Needed' && {
                              label: 'Send Reminder',
                              icon: RefreshCw,
                              onClick: () => handleSendReminder(audit._id)
                            },
                            audit.auditReport && {
                              label: 'View Audit Report',
                              icon: ExternalLink,
                              onClick: () => window.open(audit.auditReport, '_blank')
                            },
                            audit.ncReport && {
                              label: 'View NC Report',
                              icon: ExternalLink,
                              onClick: () => window.open(audit.ncReport, '_blank')
                            }
                          ].filter(Boolean)} 
                        />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <Calendar className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900">No audits found</h3>
                    <p className="text-gray-500 max-w-xs mx-auto mt-1">Start by scheduling an audit for a submitted application.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Audit Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsScheduleModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#00853b]" />
                Schedule New Site Audit
              </h3>
              <button 
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleScheduleSubmit} className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Select Company</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select 
                      required
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none appearance-none cursor-pointer"
                      value={scheduleForm.applicationId}
                      onChange={(e) => setScheduleForm({...scheduleForm, applicationId: e.target.value})}
                    >
                      <option value="">Choose a company application...</option>
                      {getEligibleApplications().map(app => (
                        <option key={app._id} value={app._id}>
                          {app.company.companyName} ({app.applicationNumber})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Lead Auditor Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      required
                      placeholder="Auditor Full Name"
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                      value={scheduleForm.staffName}
                      onChange={(e) => setScheduleForm({...scheduleForm, staffName: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Auditor Email</label>
                    <div className="relative">
                      <MoreVertical className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="email" 
                        required
                        placeholder="email@example.com"
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                        value={scheduleForm.auditorEmail}
                        onChange={(e) => setScheduleForm({...scheduleForm, auditorEmail: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Auditor Phone</label>
                    <div className="relative">
                      <MoreVertical className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="tel" 
                        required
                        placeholder="+234..."
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                        value={scheduleForm.auditorPhone}
                        onChange={(e) => setScheduleForm({...scheduleForm, auditorPhone: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Scheduled Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="date" 
                        required
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                        value={scheduleForm.scheduledDate}
                        onChange={(e) => setScheduleForm({...scheduleForm, scheduledDate: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Scheduled Time</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="time" 
                        required
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                        value={scheduleForm.scheduledTime}
                        onChange={(e) => setScheduleForm({...scheduleForm, scheduledTime: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-2 px-8 py-3 bg-[#00853b] text-white rounded-xl font-bold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Calendar className="w-5 h-5" />}
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Flag Non conformant/Correction Modal */}
      {isCorrectionModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsCorrectionModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-red-50/50">
              <h3 className="text-lg font-bold text-red-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Audit Non Conformant / Correction
              </h3>
              <button 
                onClick={() => setIsCorrectionModalOpen(false)}
                className="p-1.5 hover:bg-red-100/50 rounded-lg transition-colors text-red-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCorrectionSubmit} className="p-6">
              <div className="mb-4 bg-orange-50 p-4 rounded-xl border border-orange-100 flex gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <p className="text-xs text-orange-800 leading-relaxed">
                  Flagging a Non Conformant will notify the user. They must resolve this issue before the audit can be marked as complete.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description of Finding</label>
                <textarea 
                  required
                  placeholder="Describe what needs to be corrected..."
                  rows={4}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all resize-none"
                  value={correctionIssue}
                  onChange={(e) => setCorrectionIssue(e.target.value)}
                />
              </div>

              <div className="mt-8 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsCorrectionModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                  Flag Non Conformant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Audit Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsReportModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-blue-50/50">
              <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Upload Audit Report
              </h3>
              <button 
                onClick={() => setIsReportModalOpen(false)}
                className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleReportUpload} className="p-6">
              <div className="mb-4 bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 leading-relaxed">
                  Uploading the audit report will notify the client and make it available for download in their portal.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Audit Report (PDF)</label>
                <input 
                  type="file" 
                  required
                  accept=".pdf"
                  onChange={(e) => setReportFile(e.target.files[0])}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>

              <div className="mt-8 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting || !reportFile}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Audit Details Modal */}
      {isViewModalOpen && selectedAudit && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsViewModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                Audit Report & Details
              </h3>
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Audit Information */}
                <div>
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Audit Information</h4>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                        <Calendar className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Scheduled Date</div>
                        <div className="text-sm font-bold text-gray-900">{new Date(selectedAudit.scheduledDate).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                        <Clock className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Scheduled Time</div>
                        <div className="text-sm font-bold text-gray-900">{selectedAudit.scheduledTime}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Lead Auditor</div>
                        <div className="text-sm font-bold text-gray-900">{selectedAudit.staffName}</div>
                        {selectedAudit.auditorEmail && <div className="text-[10px] text-gray-500">{selectedAudit.auditorEmail}</div>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Company & Application Info */}
                <div>
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Company Details</h4>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-50 rounded-lg shrink-0">
                        <Building className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Company Name</div>
                        <div className="text-sm font-bold text-gray-900">{selectedAudit.userId?.companyName || 'N/A'}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-50 rounded-lg shrink-0">
                        <ShieldCheck className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Application Number</div>
                        <div className="text-sm font-bold text-gray-900">{selectedAudit.applicationId?.applicationNumber || 'N/A'}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-orange-50 rounded-lg shrink-0">
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Status</div>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(selectedAudit.status)}`}>
                          {selectedAudit.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rejection Info (If applicable) */}
                {selectedAudit.status === 'Rejected' && selectedAudit.rejectReason && (
                  <div className="md:col-span-2">
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-start gap-4 text-red-800">
                      <div className="p-2 bg-red-100 rounded-lg shrink-0">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-bold text-sm mb-1">Audit Rejected by Client</p>
                        <p className="text-sm">{selectedAudit.rejectReason}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reports Section */}
                <div className="md:col-span-2">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Audit Reports</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className={`p-4 rounded-xl border-2 border-dashed flex items-center justify-between ${selectedAudit.auditReport ? 'bg-blue-50/50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${selectedAudit.auditReport ? 'bg-blue-100' : 'bg-gray-100'}`}>
                          <FileText className={`w-5 h-5 ${selectedAudit.auditReport ? 'text-blue-600' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">Audit Report</div>
                          <div className="text-xs text-gray-500">{selectedAudit.auditReport ? 'Available for view' : 'Not uploaded yet'}</div>
                        </div>
                      </div>
                      {selectedAudit.auditReport && (
                        <button 
                          onClick={() => window.open(selectedAudit.auditReport, '_blank')}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                      )}
                    </div>

                    <div className={`p-4 rounded-xl border-2 border-dashed flex items-center justify-between ${selectedAudit.ncReport ? 'bg-indigo-50/50 border-indigo-100' : 'bg-gray-50 border-gray-100'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${selectedAudit.ncReport ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                          <AlertTriangle className={`w-5 h-5 ${selectedAudit.ncReport ? 'text-indigo-600' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">NC Report</div>
                          <div className="text-xs text-gray-500">{selectedAudit.ncReport ? 'Available for view' : 'No finding reported'}</div>
                        </div>
                      </div>
                      {selectedAudit.ncReport && (
                        <button 
                          onClick={() => window.open(selectedAudit.ncReport, '_blank')}
                          className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Corrections List */}
                {selectedAudit.corrections?.length > 0 && (
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Non-Conformance & Corrections</h4>
                    <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-gray-100 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-2 text-xs font-bold text-gray-600">Finding / Issue</th>
                            <th className="px-4 py-2 text-xs font-bold text-gray-600">Status</th>
                            <th className="px-4 py-2 text-xs font-bold text-gray-600">Date Reported</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {selectedAudit.corrections.map((corr, idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-3 text-sm text-gray-900">{corr.issue}</td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                                  corr.status === 'Resolved' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                }`}>
                                  {corr.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                                {new Date(selectedAudit.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Audits;
