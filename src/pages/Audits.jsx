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
  ChevronRight
} from 'lucide-react';
import { useAll } from '../hooks/useAll';
import { toast } from 'sonner';

const Audits = () => {
  const { 
    audits, 
    applications, 
    isLoading, 
    fetchAudits,
    fetchApplications,
    scheduleAudit,
    addAuditCorrection,
    completeAudit 
  } = useAll();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [correctionIssue, setCorrectionIssue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [scheduleForm, setScheduleForm] = useState({
    applicationId: '',
    staffName: '',
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
      (app.status === 'Approved' || app.status === 'Submitted') && 
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
        scheduledDate: '',
        scheduledTime: ''
      });
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
          <button 
            onClick={() => setIsScheduleModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#00853b] text-white rounded-lg shadow-sm hover:bg-green-700 transition-all font-semibold"
          >
            <Plus className="w-5 h-5" />
            Schedule Audit
          </button>
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

      {/* Audit Grid/List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-64 bg-white rounded-2xl border border-gray-100 animate-pulse shadow-sm"></div>
          ))
        ) : filteredAudits.length > 0 ? (
          filteredAudits.map((audit) => (
            <div 
              key={audit._id} 
              className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 group"
            >
              {/* Card Title Strip */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-gray-900">{audit.applicationId?.applicationNumber || 'N/A'}</span>
                </div>
                <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${getStatusBadge(audit.status)}`}>
                  {audit.status}
                </span>
              </div>

              {/* Card Content */}
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Building className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{audit.userId?.companyName || 'Unknown Company'}</h4>
                    <p className="text-xs text-gray-500">{audit.userId?.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase">Scheduled Date</span>
                    </div>
                    <p className="text-xs font-bold text-gray-900">{new Date(audit.scheduledDate).toDateString()}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase">Time</span>
                    </div>
                    <p className="text-xs font-bold text-gray-900">{audit.scheduledTime}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Assigned Staff</span>
                    <p className="text-xs font-bold text-gray-900">{audit.staffName}</p>
                  </div>
                </div>
              </div>

              {/* Card Footer/Actions */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <div className="flex gap-2">
                  {(audit.status === 'Accepted' || audit.status === 'Correction Needed') && (
                    <button 
                      onClick={() => { setSelectedAudit(audit); setIsCorrectionModalOpen(true); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-lg text-xs font-bold transition-colors"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Flag Problem
                    </button>
                  )}
                </div>
                
                <div className="flex gap-2">
                  {(audit.status === 'Accepted' || audit.status === 'Correction Needed') && (
                    <button 
                      onClick={() => handleComplete(audit._id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded-lg text-xs font-bold transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Mark Complete
                    </button>
                  )}
                  {audit.status === 'Scheduled' && (
                    <span className="text-xs text-gray-400 italic">Waiting for User</span>
                  )}
                  {audit.status === 'Completed' && (
                    <span className="flex items-center gap-1 text-green-600 font-bold text-xs">
                      <ShieldCheck className="w-4 h-4" />
                      CERTIFIED
                    </span>
                  )}
                </div>
              </div>

              {/* Correction Summary (if needed) */}
              {audit.status === 'Correction Needed' && (
                <div className="px-6 pb-4">
                  <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-red-700 uppercase">Pending Issues</span>
                      <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[9px] font-bold">
                        {audit.corrections.filter(c => c.status === 'Pending').length}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 bg-white rounded-2xl border border-gray-100 text-center">
            <Calendar className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">No audits found</h3>
            <p className="text-gray-500 max-w-xs mx-auto mt-1">
              Start by scheduling an audit for a submitted application.
            </p>
          </div>
        )}
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Select Application</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select 
                      required
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none appearance-none cursor-pointer"
                      value={scheduleForm.applicationId}
                      onChange={(e) => setScheduleForm({...scheduleForm, applicationId: e.target.value})}
                    >
                      <option value="">Choose an application...</option>
                      {getEligibleApplications().map(app => (
                        <option key={app._id} value={app._id}>
                          {app.applicationNumber} - {app.companyName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Assigned Audit Staff</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. John Doe, Lead Auditor"
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                      value={scheduleForm.staffName}
                      onChange={(e) => setScheduleForm({...scheduleForm, staffName: e.target.value})}
                    />
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

      {/* Flag Issue/Correction Modal */}
      {isCorrectionModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsCorrectionModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-red-50/50">
              <h3 className="text-lg font-bold text-red-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Audit Finding / Correction
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
                  Flagging a problem will notify the user. They must resolve this issue before the audit can be marked as complete.
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
                  Flag Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Audits;
