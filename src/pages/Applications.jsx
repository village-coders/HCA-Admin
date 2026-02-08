import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ChevronDown, 
  Calendar,
  RefreshCw,
  AlertCircle,
  Eye,
  FileText,
  Plus,
  User,
  Building,
  Package,
  Mail,
  Phone,
  Globe,
  File,
  Calendar as CalendarIcon,
  Hash,
  Tag,
  Info,
  ExternalLink,
  FileCheck
} from 'lucide-react';
import { useAll } from '../hooks/useAll';
import { toast } from 'sonner';

const Applications = () => {
  const controller = new AbortController()
  const [filter, setFilter] = useState({
    company: '',
    dateFrom: '',
    dateTo: '',
    status: '',
  });

  const [activeTab, setActiveTab] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedApplications, setSelectedApplications] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);

  const { 
    applications, 
    isLoading, 
    errors,
    fetchApplications,
    approveApplication,
    rejectApplication,
    deleteApplication,
    getApplicationById,
    addCertificate
  } = useAll();

  // Fetch applications on component mount
  useEffect(() => {
    fetchApplications();

    return () => controller.abort()
  }, []);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchApplications();
    setIsRefreshing(false);
  };

  // Filter applications
  const filteredApplications = applications.filter(app => {
    // Tab filter
    switch (activeTab) {
      case 'all':
        break;
      case 'pending':
        return app.status === 'pending' || app.status === 'submitted' || app.status === 'Pending' || app.status === 'Submitted';
      case 'renewal':
        return app.applicationType === 'renewal';
      case 'issued':
        return app.status === 'issued' || app.status === 'Issued';
      case 'approved':
        return app.status === 'approved' || app.status === 'Approved';
      case 'rejected':
        return app.status === 'rejected' || app.status === 'Rejected';
      default:
        break;
    }

    // Custom filter
    if (filter.company && !app.companyName?.toLowerCase().includes(filter.company.toLowerCase()) && 
        !app.company?.toLowerCase().includes(filter.company.toLowerCase())) {
      return false;
    }
    if (filter.dateFrom && app.createdAt && new Date(app.createdAt) < new Date(filter.dateFrom)) {
      return false;
    }
    if (filter.dateTo && app.createdAt && new Date(app.createdAt) > new Date(filter.dateTo)) {
      return false;
    }
    if (filter.status && app.status !== filter.status) {
      return false;
    }
    return true;
  });

  // Format date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Unknown';
    }
  };

  // Format date with time
  const formatDateTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };

  // Handle Approve Application
  const handleApproveApplication = async (appId) => {
    try {
      const result = await approveApplication(appId);
      if (result.success) {
        toast.success("Application approved!");
        
        // Update local state if modal is open
        if (selectedApplication && selectedApplication.id === appId) {
          setSelectedApplication(prev => ({
            ...prev,
            status: 'approved'
          }));
        }
        
        fetchApplications();
      }
    } catch (error) {
      toast.error("Failed to approve application");
      console.log(error);
      
    }
  };

  // Handle Issue Certificate
  const handleIssueCertificate = async (appId) => {
    setIsIssuing(true);
    try {
      const result = await addCertificate(appId);
      console.log(result);
      
      if (result.success) {
        toast.success("Certificate issued successfully!");
        
        // Update local state if modal is open
        if (selectedApplication && (selectedApplication.id === appId || selectedApplication._id === appId)) {
          setSelectedApplication(prev => ({
            ...prev,
            status: 'issued',
            certificateId: result.data?.certificate?._id
          }));
        }
        
        // Refresh applications list to show updated status
        fetchApplications();
      }
    } catch (error) {
      console.error("Issue certificate error:", error);
      toast.error("Failed to issue certificate");
    } finally {
      setIsIssuing(false);
    }
  };

  const handleRejectApplication = async (appId) => {
    const reason = prompt("Enter rejection reason:");
    if (reason) {
      try {
        await rejectApplication(appId, reason);
        toast.success("Application rejected!");
        // Update local state if modal is open
        if (selectedApplication && (selectedApplication.id === appId || selectedApplication._id === appId)) {
          setSelectedApplication(prev => ({
            ...prev,
            status: 'rejected',
            rejectionReason: reason
          }));
        }
        fetchApplications();
      } catch (error) {
        toast.error("Failed to reject application");
        console.log(error)
      }
    }
  };

  const handleDeleteApplication = async (appId) => {
    if (window.confirm("Are you sure you want to delete this application?")) {
      try {
        await deleteApplication(appId);
        // toast.success("Application deleted!");
        // Close modal if the deleted application is open
        if (selectedApplication && (selectedApplication.id === appId || selectedApplication._id === appId)) {
          setIsViewModalOpen(false);
          setSelectedApplication(null);
        }
        fetchApplications();
      } catch (error) {
        toast.error("Failed to delete application");
        console.log(error)
      }
    }
  };

  const handleViewDetails = async (appId) => {
    setIsLoadingDetails(true);
    try {
      const application = await getApplicationById(appId);
      if (application) {
        setSelectedApplication(application);
        setIsViewModalOpen(true);
      } else {
        toast.error("Failed to load application details");
      }
    } catch (error) {
      toast.error("Failed to load application details");
      console.log(error)
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Handle Download Certificate
  const handleDownloadCertificate = async (appId) => {
    try {
      toast.success("Certificate download initiated!" + appId);
      // Implement actual download logic here
    } catch (error) {
      toast.error("Failed to download certificate");
      console.log(error)
    }
  };

  // Handle bulk selection
  const toggleSelectAll = () => {
    if (selectedApplications.length === filteredApplications.length) {
      setSelectedApplications([]);
    } else {
      setSelectedApplications(filteredApplications.map(app => app.id || app._id));
    }
  };

  const toggleSelectApplication = (appId) => {
    setSelectedApplications(prev => 
      prev.includes(appId) 
        ? prev.filter(id => id !== appId)
        : [...prev, appId]
    );
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedApplications.length === 0) {
      toast.warning("No applications selected");
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedApplications.length} selected applications?`)) {
      try {
        const deletePromises = selectedApplications.map(id => deleteApplication(id));
        await Promise.all(deletePromises);
        setSelectedApplications([]);
        toast.success(`${selectedApplications.length} applications deleted successfully!`);
        fetchApplications();
      } catch (error) {
        toast.error("Failed to delete some applications");
        console.log(error);
        
      }
    }
  };

  // Handle bulk issue
  const handleBulkIssue = async () => {
    if (selectedApplications.length === 0) {
      toast.warning("No applications selected");
      return;
    }

    // Filter only approved applications
    const approvedApplications = selectedApplications.filter(appId => {
      const app = applications.find(a => a.id === appId || a._id === appId);
      return app && (app.status === 'Submitted');
    });

    if (approvedApplications.length === 0) {
      toast.warning("No approved applications selected. Please approve applications first.");
      return;
    }

    if (window.confirm(`Are you sure you want to issue certificates for ${approvedApplications.length} approved applications?`)) {
      setIsIssuing(true);
      try {
        const results = [];
        for (const appId of approvedApplications) {
          try {
            const result = await addCertificate(appId);
            results.push({ appId, success: result.success });
            // Small delay to prevent overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            results.push({ appId, success: false, error: error.message });
          }
        }
        
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        
        if (successful > 0) {
          toast.success(`${successful} certificates issued successfully!`);
        }
        if (failed > 0) {
          toast.error(`${failed} certificates failed to issue`);
        }
        
        setSelectedApplications([]);
        fetchApplications();
      } catch (error) {
        toast.error("Failed to issue some certificates");
        console.error("Bulk issue error:", error);
      } finally {
        setIsIssuing(false);
      }
    }
  };

  // Handle bulk export
  const handleBulkExport = () => {
    if (selectedApplications.length === 0) {
      toast.warning("No applications selected");
      return;
    }
    
    toast.success(`Exporting ${selectedApplications.length} applications`);
  };

  // Calculate tab counts
  const getTabCounts = () => {
    return {
      all: applications.length,
      pending: applications.filter(a => 
        a.status === 'pending' || a.status === 'submitted' || 
        a.status === 'Pending' || a.status === 'Submitted'
      ).length,
      renewal: applications.filter(a => a.applicationType === 'renewal').length,
      approved: applications.filter(a => 
        a.status === 'approved' || a.status === 'Approved'
      ).length,
      issued: applications.filter(a => 
        a.status === 'issued' || a.status === 'Issued'
      ).length,
      rejected: applications.filter(a => 
        a.status === 'rejected' || a.status === 'Rejected'
      ).length,
    };
  };

  const tabCounts = getTabCounts();

  const tabs = [
    { id: 'all', label: 'All Applications', count: tabCounts.all },
    { id: 'pending', label: 'Pending', count: tabCounts.pending },
    { id: 'renewal', label: 'Renewal', count: tabCounts.renewal },
    { id: 'approved', label: 'Approved', count: tabCounts.approved },
    { id: 'issued', label: 'Issued', count: tabCounts.issued },
    { id: 'rejected', label: 'Rejected', count: tabCounts.rejected },
  ];

  // Get status badge configuration
  const getStatusConfig = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'pending':
      case 'submitted':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock };
      case 'approved':
        return { bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircle };
      case 'issued':
        return { bg: 'bg-green-100', text: 'text-green-800', icon: FileCheck };
      case 'rejected':
        return { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle };
      case 'under_review':
      case 'review':
        return { bg: 'bg-purple-100', text: 'text-purple-800', icon: Clock };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', icon: FileText };
    }
  };

  // Get type badge configuration
  const getTypeConfig = (type) => {
    const typeLower = type?.toLowerCase();
    return typeLower === 'renewal' 
      ? { bg: 'bg-purple-100', text: 'text-purple-800' }
      : { bg: 'bg-blue-100', text: 'text-blue-800' };
  };

  // Close modal
  const closeModal = () => {
    setIsViewModalOpen(false);
    setSelectedApplication(null);
  };

  // View Modal Component
  const ViewApplicationModal = () => {
    if (!selectedApplication) return null;

    const statusConfig = getStatusConfig(selectedApplication.status);
    const StatusIcon = statusConfig.icon;
    const typeConfig = getTypeConfig(selectedApplication.applicationType);
    const appId = selectedApplication.id || selectedApplication._id;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Modal Header */}
          <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Application #{selectedApplication.applicationNumber || appId.slice(-8)}
                </h2>
                <p className="text-sm text-gray-600">
                  Submitted on {formatDateTime(selectedApplication.createdAt || selectedApplication.submissionDate)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                <StatusIcon className="w-4 h-4 mr-1" />
                {selectedApplication.status?.charAt(0).toUpperCase() + selectedApplication.status?.slice(1) || 'Unknown'}
              </span>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="p-6">
              {/* Application Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Company Information */}
                <div className="bg-gray-50 rounded-lg p-5">
                  <div className="flex items-center mb-4">
                    <Building className="w-5 h-5 text-gray-500 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Company Name</p>
                      <p className="font-medium text-gray-900">
                        {selectedApplication.companyName || selectedApplication.company || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Company Address</p>
                      <p className="font-medium text-gray-900">
                        {selectedApplication.companyAddress || 'N/A'}
                      </p>
                    </div>
                    {selectedApplication.companyWebsite && (
                      <div>
                        <p className="text-sm text-gray-600">Website</p>
                        <a 
                          href={selectedApplication.companyWebsite} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          {selectedApplication.companyWebsite}
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Applicant Information */}
                <div className="bg-gray-50 rounded-lg p-5">
                  <div className="flex items-center mb-4">
                    <User className="w-5 h-5 text-gray-500 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Applicant Information</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Applicant Name</p>
                      <p className="font-medium text-gray-900">
                        {selectedApplication.applicantName || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium text-gray-900">
                        {selectedApplication.applicantEmail || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium text-gray-900">
                        {selectedApplication.applicantPhone || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Product Information */}
                <div className="bg-gray-50 rounded-lg p-5">
                  <div className="flex items-center mb-4">
                    <Package className="w-5 h-5 text-gray-500 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Product Information</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Product Name</p>
                      <p className="font-medium text-gray-900">
                        {selectedApplication.productName || selectedApplication.product || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Product Category</p>
                      <p className="font-medium text-gray-900">
                        {selectedApplication.productCategory || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Application Type</p>
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${typeConfig.bg} ${typeConfig.text}`}>
                        {selectedApplication.applicationType?.charAt(0).toUpperCase() + selectedApplication.applicationType?.slice(1) || 'New'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Application Details */}
                <div className="bg-gray-50 rounded-lg p-5">
                  <div className="flex items-center mb-4">
                    <Info className="w-5 h-5 text-gray-500 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Application Details</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Application ID</p>
                      <p className="font-medium text-gray-900">
                        {appId || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Submission Date</p>
                      <p className="font-medium text-gray-900">
                        {formatDateTime(selectedApplication.createdAt || selectedApplication.submissionDate)}
                      </p>
                    </div>
                    {selectedApplication.updatedAt && (
                      <div>
                        <p className="text-sm text-gray-600">Last Updated</p>
                        <p className="font-medium text-gray-900">
                          {formatDateTime(selectedApplication.updatedAt)}
                        </p>
                      </div>
                    )}
                    {selectedApplication.rejectionReason && (
                      <div>
                        <p className="text-sm text-red-600">Rejection Reason</p>
                        <p className="font-medium text-red-700">
                          {selectedApplication.rejectionReason}
                        </p>
                      </div>
                    )}
                    {selectedApplication.certificateId && (
                      <div>
                        <p className="text-sm text-green-600">Certificate ID</p>
                        <p className="font-medium text-green-700">
                          {selectedApplication.certificateId}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Attached Documents */}
              {(selectedApplication.documents || selectedApplication.files) && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Attached Documents</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(selectedApplication.documents || selectedApplication.files || {}).map(([key, value]) => (
                      <div key={key} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200">
                        <div className="flex items-center">
                          <File className="w-5 h-5 text-gray-500 mr-3" />
                          <div>
                            <p className="font-medium text-gray-900 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </p>
                            <p className="text-sm text-gray-600">
                              {typeof value === 'string' ? value : 'Document'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Notes */}
              {selectedApplication.notes && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-gray-800">{selectedApplication.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {selectedApplication.status?.toLowerCase() === 'pending' || 
                 selectedApplication.status?.toLowerCase() === 'submitted' ? (
                  <>
                    <button
                      onClick={() => handleApproveApplication(appId)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors duration-200 flex items-center"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleIssueCertificate(appId)}
                      disabled={isIssuing}
                      className="px-4 py-2 bg-[#00853b] text-white rounded-lg hover:bg-green-700 font-medium transition-colors duration-200 flex items-center disabled:opacity-50"
                    >
                      <FileCheck className={`w-4 h-4 mr-2 ${isIssuing ? 'animate-spin' : ''}`} />
                      {isIssuing ? 'Issuing...' : 'Issue Certificate'}
                    </button>
                    <button
                      onClick={() => handleRejectApplication(appId)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors duration-200 flex items-center"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </button>
                  </>
                ) : selectedApplication.status?.toLowerCase() === 'approved' ? (
                  <>
                    <button
                      onClick={() => handleIssueCertificate(appId)}
                      disabled={isIssuing}
                      className="px-4 py-2 bg-[#00853b] text-white rounded-lg hover:bg-green-700 font-medium transition-colors duration-200 flex items-center disabled:opacity-50"
                    >
                      <FileCheck className={`w-4 h-4 mr-2 ${isIssuing ? 'animate-spin' : ''}`} />
                      {isIssuing ? 'Issuing...' : 'Issue Certificate'}
                    </button>
                    <button
                      onClick={() => handleRejectApplication(appId)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors duration-200 flex items-center"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </button>
                  </>
                ) : selectedApplication.status?.toLowerCase() === 'issued' ? (
                  <>
                    <button
                      onClick={() => handleDownloadCertificate(appId)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors duration-200 flex items-center"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Certificate
                    </button>
                    <button
                      onClick={() => handleIssueCertificate(appId)}
                      disabled={isIssuing}
                      className="px-4 py-2 bg-[#00853b] text-white rounded-lg hover:bg-green-700 font-medium transition-colors duration-200 flex items-center disabled:opacity-50"
                    >
                      <FileCheck className={`w-4 h-4 mr-2 ${isIssuing ? 'animate-spin' : ''}`} />
                      {isIssuing ? 'Issuing...' : 'Re-issue Certificate'}
                    </button>
                  </>
                ) : null}
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg font-medium transition-colors duration-200"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDeleteApplication(appId)}
                  className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium transition-colors duration-200 flex items-center"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 lg:p-8 pt-20 lg:pt-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Applications</h1>
            <p className="text-gray-600 mt-1">Manage and review certification applications</p>
          </div>
          <div className="flex items-center gap-3">
            {errors && (
              <div className="flex items-center gap-1 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors}</span>
              </div>
            )}
            <button
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#00853b] text-white rounded-lg hover:bg-green-700 font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading || isRefreshing ? 'animate-spin' : ''}`} />
              {isLoading || isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button className="px-4 py-2.5 bg-[#00853b] text-white rounded-lg hover:bg-green-700 font-medium transition-colors duration-200 inline-flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              New Application
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              disabled={isLoading}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center ${
                activeTab === tab.id
                  ? 'bg-[#00853b] text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {tab.label}
              <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${
                activeTab === tab.id ? 'bg-white/20' : 'bg-gray-100'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>
        
        <div className={`${isFilterOpen ? 'block' : 'hidden lg:block'}`}>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search company..."
                  className="pl-10 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#00853b] focus:ring-1 focus:ring-[#00853b]"
                  value={filter.company}
                  onChange={(e) => setFilter({ ...filter, company: e.target.value })}
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="relative">
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#00853b] focus:ring-1 focus:ring-[#00853b] appearance-none"
                  value={filter.status}
                  onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                  disabled={isLoading}
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="submitted">Submitted</option>
                  <option value="approved">Approved</option>
                  <option value="issued">Issued</option>
                  <option value="rejected">Rejected</option>
                  <option value="under_review">Under Review</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  className="pl-10 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#00853b] focus:ring-1 focus:ring-[#00853b]"
                  value={filter.dateFrom}
                  onChange={(e) => setFilter({ ...filter, dateFrom: e.target.value })}
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  className="pl-10 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#00853b] focus:ring-1 focus:ring-[#00853b]"
                  value={filter.dateTo}
                  onChange={(e) => setFilter({ ...filter, dateTo: e.target.value })}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600">
              {selectedApplications.length > 0 && (
                <span>{selectedApplications.length} applications selected</span>
              )}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setFilter({ company: '', dateFrom: '', dateTo: '', status: '' })}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                disabled={isLoading}
              >
                Clear All Filters
              </button>
              {selectedApplications.length > 0 && (
                <>
                  <button
                    onClick={handleBulkIssue}
                    disabled={isIssuing}
                    className="px-4 py-2 text-sm font-medium bg-[#00853b] text-white hover:bg-green-700 rounded-lg transition-colors duration-200 disabled:opacity-50 flex items-center gap-2"
                  >
                    <FileCheck className={`w-4 h-4 ${isIssuing ? 'animate-spin' : ''}`} />
                    {isIssuing ? 'Issuing...' : 'Issue Selected'}
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    disabled={isLoading}
                  >
                    Delete Selected
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Applications Table */}
      {!isLoading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] lg:min-w-0">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    <input
                      type="checkbox"
                      checked={selectedApplications.length === filteredApplications.length && filteredApplications.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-[#00853b] focus:ring-[#00853b]"
                    />
                  </th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Application</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredApplications.length > 0 ? (
                  filteredApplications.map((app) => {
                    const appId = app.id || app._id;
                    const statusConfig = getStatusConfig(app.status);
                    const StatusIcon = statusConfig.icon;
                    const typeConfig = getTypeConfig(app.applicationType);

                    return (
                      <tr key={appId} className="hover:bg-gray-50">
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selectedApplications.includes(appId)}
                            onChange={() => toggleSelectApplication(appId)}
                            className="rounded border-gray-300 text-[#00853b] focus:ring-[#00853b]"
                          />
                        </td>
                        <td className="p-4">
                          <div>
                            <div className="font-medium text-gray-900">#{app.applicationNumber || appId.slice(-8)}</div>
                            <div className="text-sm text-gray-600">
                              {app.companyName || app.company || app.applicantName || 'Unknown Company'}
                            </div>
                            {app.applicantEmail && (
                              <div className="text-xs text-gray-500">{app.applicantEmail}</div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm font-medium text-gray-900">
                            {app.productName || app.product || 'Unknown Product'}
                          </div>
                          {app.productCategory && (
                            <div className="text-xs text-gray-500">{app.productCategory}</div>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${typeConfig.bg} ${typeConfig.text}`}>
                            {app.applicationType?.charAt(0).toUpperCase() + app.applicationType?.slice(1) || 'New'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {app.status?.charAt(0).toUpperCase() + app.status?.slice(1) || 'Unknown'}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-500">
                          {formatDate(app.createdAt || app.submissionDate || app.date)}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handleViewDetails(appId)}
                              disabled={isLoadingDetails}
                              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            
                            {/* Show different buttons based on status */}
                            {app.status?.toLowerCase() === 'pending' || 
                             app.status?.toLowerCase() === 'submitted' ? (
                              <>
                                <button
                                  onClick={() => handleApproveApplication(appId)}
                                  className="px-3 py-1.5 bg-blue-600 cursor-pointer text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                                  title="Approve Application"
                                >
                                  Approve
                                </button>
                                {/* <button
                                  onClick={() => handleIssueCertificate(appId)}
                                  disabled={isIssuing}
                                  className="px-3 py-1.5 bg-[#00853b] text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 flex items-center"
                                  title="Issue Certificate"
                                >
                                  <FileCheck className={`w-3 h-3 mr-1 ${isIssuing ? 'animate-spin' : ''}`} />
                                  Issue
                                </button> */}
                                <button
                                  onClick={() => handleRejectApplication(appId)}
                                  className="px-3 py-1.5 bg-red-600 cursor-pointer text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors duration-200"
                                  title="Reject Application"
                                >
                                  Reject
                                </button>
                              </>
                            ) : app.status?.toLowerCase() === 'approved' ? (
                              <>
                                <button
                                  onClick={() => handleIssueCertificate(appId)}
                                  disabled={isIssuing}
                                  className="px-3 py-1.5 bg-[#00853b] cursor-pointer text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 flex items-center"
                                  title="Issue Certificate"
                                >
                                  <FileCheck className={`w-3 h-3 mr-1 ${isIssuing ? 'animate-spin' : ''}`} />
                                  Issue
                                </button>
                                <button
                                  onClick={() => handleRejectApplication(appId)}
                                  className="px-3 py-1.5 bg-red-600 cursor-pointer text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors duration-200"
                                  title="Reject Application"
                                >
                                  Reject
                                </button>
                              </>
                            ) : app.status?.toLowerCase() === 'issued' ? (
                              <>
                                <button
                                  onClick={() => handleDownloadCertificate(appId)}
                                  className="p-1.5 text-blue-600 cursor-pointer hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                  title="Download Certificate"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                                {/* <button
                                  onClick={() => handleIssueCertificate(appId)}
                                  disabled={isIssuing}
                                  className="px-3 py-1.5 bg-[#00853b] text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 flex items-center"
                                  title="Re-issue Certificate"
                                >
                                  <FileCheck className={`w-3 h-3 mr-1 ${isIssuing ? 'animate-spin' : ''}`} />
                                  Re-issue
                                </button> */}
                              </>
                            ) : null}
                            
                            <button
                              onClick={() => handleDeleteApplication(appId)}
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                              title="Delete Application"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-500">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
                      <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria</p>
                      <button 
                        onClick={() => { 
                          setFilter({ company: '', dateFrom: '', dateTo: '', status: '' });
                          setActiveTab('all');
                        }}
                        className="px-4 py-2 text-sm font-medium text-[#00853b] hover:text-green-700"
                      >
                        Clear filters
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Table Footer */}
          {filteredApplications.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-medium">{filteredApplications.length}</span> of{' '}
                  <span className="font-medium">{applications.length}</span> applications
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={handleBulkExport}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50"
                    disabled={selectedApplications.length === 0}
                  >
                    Export Selected ({selectedApplications.length})
                  </button>
                  {selectedApplications.length > 0 && (
                    <button
                      onClick={handleBulkIssue}
                      disabled={isIssuing}
                      className="px-3 py-1.5 text-sm font-medium bg-[#00853b] text-white hover:bg-green-700 rounded-lg transition-colors duration-200 disabled:opacity-50 flex items-center gap-2"
                    >
                      <FileCheck className={`w-4 h-4 ${isIssuing ? 'animate-spin' : ''}`} />
                      {isIssuing ? 'Issuing...' : `Issue ${selectedApplications.length}`}
                    </button>
                  )}
                  <div className="flex items-center space-x-2">
                    <button className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                      Previous
                    </button>
                    <button className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View Application Modal */}
      {isViewModalOpen && <ViewApplicationModal />}
    </div>
  );
};

export default Applications;