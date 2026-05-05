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
  FileCheck,
  AlertTriangle,
  Factory,
  MapPin,
  Briefcase,
  Layers,
  Globe2,
  Award,
  CheckSquare,
  Trash2,
  Activity
} from 'lucide-react';
import { useAll } from '../hooks/useAll';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import TableActions from '../components/TableActions';
import { Lock } from 'lucide-react';

const Applications = () => {
  const { user } = useAuth();
  const hasPrivilege = (priv) => {
    if (user?.role === 'super admin') return true;
    return user?.privileges?.includes(priv);
  };
  const navigate = useNavigate();
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [activeDetailTab, setActiveDetailTab] = useState('overview');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [companySuggestions, setCompanySuggestions] = useState([]);

  // Reset pagination when filter or tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, activeTab]);

  const { 
    applications, 
    isLoading, 
    errors,
    fetchApplications,
    acceptApplication,
    rejectApplication,
    deleteApplication,
    getApplicationById,
    addCertificate,
    companies
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

  // Handle company search suggestions
  useEffect(() => {
    if (filter.company.trim()) {
      const suggestions = companies.filter(c => 
        (c.companyName?.toLowerCase().includes(filter.company.toLowerCase()) ||
         c.name?.toLowerCase().includes(filter.company.toLowerCase()))
      ).slice(0, 5);
      setCompanySuggestions(suggestions);
    } else {
      setCompanySuggestions([]);
    }
  }, [filter.company, companies]);

  const handleCompanySuggestionClick = (companyName) => {
    setFilter({ ...filter, company: companyName });
    setCompanySuggestions([]);
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
      case 'accepted':
        return app.status === 'accepted' || app.status === 'Accepted';
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

  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage) || 1;
  const paginatedApplications = filteredApplications.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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

  // Handle Accept Application
  const handleAcceptApplication = async (appId) => {
    setIsAcceptingId(appId);
    try {
      const result = await acceptApplication(appId);
      if (result.success) {
        toast.success("Application accepted!");
        
        // Update local state if modal is open
        if (selectedApplication && selectedApplication.id === appId) {
          setSelectedApplication(prev => ({
            ...prev,
            status: 'accepted'
          }));
        }
        
        fetchApplications();
      }
    } catch (error) {
      toast.error("Failed to accept application");
      console.log(error);
      
    } finally {
      setIsAcceptingId(null);
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
      setIsRejectingId(appId);
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
      } finally {
        setIsRejectingId(null);
      }
    }
  };

  const handleDeleteApplication = async (appId) => {
    if (window.confirm("Are you sure you want to delete this application?")) {
      setIsDeletingId(appId);
      try {
        await deleteApplication(appId);
        // Close modal if the deleted application is open
        if (selectedApplication && (selectedApplication.id === appId || selectedApplication._id === appId)) {
          setIsViewModalOpen(false);
          setSelectedApplication(null);
        }
        fetchApplications();
      } catch (error) {
        toast.error("Failed to delete application");
        console.log(error)
      } finally {
        setIsDeletingId(null);
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
        setActiveDetailTab('overview');
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
      setIsBulkDeleting(true);
      try {
        const deletePromises = selectedApplications.map(id => deleteApplication(id));
        await Promise.all(deletePromises);
        setSelectedApplications([]);
        toast.success(`${selectedApplications.length} applications deleted successfully!`);
        fetchApplications();
      } catch (error) {
        toast.error("Failed to delete some applications");
        console.log(error);
      } finally {
        setIsBulkDeleting(false);
      }
    }
  };

  // Handle bulk issue
  const handleBulkIssue = async () => {
    if (selectedApplications.length === 0) {
      toast.warning("No applications selected");
      return;
    }

    // Filter only accepted applications
    const acceptedApplications = selectedApplications.filter(appId => {
      const app = applications.find(a => a.id === appId || a._id === appId);
      return app && (app.status === 'Submitted');
    });

    if (acceptedApplications.length === 0) {
      toast.warning("No accepted applications selected. Please accept applications first.");
      return;
    }

    if (window.confirm(`Are you sure you want to issue certificates for ${acceptedApplications.length} accepted applications?`)) {
      setIsIssuing(true);
      try {
        const results = [];
        for (const appId of acceptedApplications) {
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
      accepted: applications.filter(a => 
        a.status === 'accepted' || a.status === 'Accepted'
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
    { id: 'accepted', label: 'Accepted', count: tabCounts.accepted },
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
      case 'accepted':
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

  // Get yes/no badge
  const getYesNoBadge = (value) => {
    return value === 'yes' 
      ? <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Yes</span>
      : <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">No</span>;
  };

  // Close modal
  const closeModal = () => {
    setIsViewModalOpen(false);
    setSelectedApplication(null);
  };

  // View Modal Component
  const ViewApplicationModal = () => {
    if (!selectedApplication) return null;

    const baseUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:5000/api';
    const getDocumentUrl = (path) => {
      if (!path) return '#';
      if (path.startsWith('http')) return path;
      if (path.startsWith('/api/')) return `${baseUrl.replace('/api', '')}${path}`;
      if (path.startsWith('/files/')) return `${baseUrl.replace('/api', '')}/api${path}`;
      return `${baseUrl.replace('/api', '')}/api/files/${path}`;
    };

    const statusConfig = getStatusConfig(selectedApplication.status);
    const StatusIcon = statusConfig.icon;
    const typeConfig = getTypeConfig(selectedApplication.applicationType);
    const appId = selectedApplication.id || selectedApplication._id;

    const detailTabs = [
      { id: 'overview', label: 'Overview', icon: Info },
      { id: 'documents', label: 'Documents', icon: File },
      { id: 'halal-history', label: 'Halal History', icon: Award },
      { id: 'product-composition', label: 'Product Composition', icon: Package },
      { id: 'facilities', label: 'Facilities', icon: Factory },
      { id: 'markets', label: 'Markets', icon: Globe2 },
      { id: 'audit-report', label: 'Audit Report', icon: FileText },
    ];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
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

          {/* Detail Tabs */}
          <div className="border-b border-gray-200 px-6">
            <div className="flex space-x-4">
              {detailTabs.map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDetailTab(tab.id)}
                    className={`py-3 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors duration-200 ${
                      activeDetailTab === tab.id
                        ? 'border-[#00853b] text-[#00853b]'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <TabIcon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modal Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
            <div className="p-6">
              {/* Overview Tab */}
              {activeDetailTab === 'overview' && (
                <div className="space-y-6">
                  {/* Company Information */}
                  <div className="bg-gray-50 rounded-lg p-5">
                    <div className="flex items-center mb-4">
                      <Building className="w-5 h-5 text-gray-500 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Company Name</p>
                        <p className="font-medium text-gray-900">
                          {selectedApplication.company?.companyName || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Company Registration No.</p>
                        <p className="font-medium text-gray-900">
                          {selectedApplication.company?.registrationNo || 'N/A'}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600">Address</p>
                        <p className="font-medium text-gray-900">
                          {selectedApplication.company?.address || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Applicant Information */}
                  <div className="bg-gray-50 rounded-lg p-5">
                    <div className="flex items-center mb-4">
                      <User className="w-5 h-5 text-gray-500 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900">Primary Contact</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-medium text-gray-900">
                          {selectedApplication.applicantName || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Position/Title</p>
                        <p className="font-medium text-gray-900">
                          {selectedApplication.positionTitle || 'N/A'}
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
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Product Name</p>
                        <p className="font-medium text-gray-900">
                          {selectedApplication.productName || selectedApplication.product || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Category</p>
                        <p className="font-medium text-gray-900">
                          {selectedApplication.category || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Market Type</p>
                        <p className="font-medium text-gray-900">
                          {selectedApplication.marketType || 'N/A'}
                          {selectedApplication.marketType === 'Other' && selectedApplication.marketTypeOther && 
                            ` - ${selectedApplication.marketTypeOther}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Brand Type</p>
                        <p className="font-medium text-gray-900">
                          {selectedApplication.brandType || 'N/A'}
                          {selectedApplication.brandType === 'Other' && selectedApplication.brandTypeOther && 
                            ` - ${selectedApplication.brandTypeOther}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Food Safety Programs */}
                  {selectedApplication.foodSafetyPrograms && selectedApplication.foodSafetyPrograms.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-5">
                      <div className="flex items-center mb-4">
                        <CheckSquare className="w-5 h-5 text-gray-500 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-900">Food Safety Programs</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedApplication.foodSafetyPrograms.map((program, index) => (
                          <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {program}
                          </span>
                        ))}
                        {selectedApplication.foodSafetyPrograms.includes('Other') && selectedApplication.otherFoodSafetyProgram && (
                          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                            Other: {selectedApplication.otherFoodSafetyProgram}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Authorized By */}
                  {selectedApplication.authorizedBy && (
                    <div className="bg-gray-50 rounded-lg p-5">
                      <div className="flex items-center mb-4">
                        <User className="w-5 h-5 text-gray-500 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-900">Authorized By</h3>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Name</p>
                          <p className="font-medium text-gray-900">
                            {selectedApplication.authorizedBy.name || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Position/Title</p>
                          <p className="font-medium text-gray-900">
                            {selectedApplication.authorizedBy.positionTitle || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Date Authorized</p>
                          <p className="font-medium text-gray-900">
                            {formatDate(selectedApplication.authorizedBy.dateAuthorized)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Application Details */}
                  <div className="bg-gray-50 rounded-lg p-5">
                    <div className="flex items-center mb-4">
                      <Info className="w-5 h-5 text-gray-500 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900">Application Details</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Application ID</p>
                        <p className="font-medium text-gray-900">{appId || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Application Type</p>
                        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${typeConfig.bg} ${typeConfig.text}`}>
                          {selectedApplication.applicationType?.charAt(0).toUpperCase() + selectedApplication.applicationType?.slice(1) || 'New'}
                        </span>
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
                        <div className="col-span-2">
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
              )}

              {/* Documents Tab */}
              {activeDetailTab === 'documents' && (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Supporting Documents</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { label: 'MANCAP Certificate', field: 'mancapDocument', compulsory: false },
                        { label: 'NAFDAC Certificate', field: 'nafdacDocument', compulsory: false },
                        { label: 'CAC Document', field: 'cacDocument', compulsory: true },
                        { label: 'Company Profile', field: 'companyProfileDocument', compulsory: true },
                        { label: 'Raw Materials List', field: 'rawMaterialsDocument', compulsory: false },
                      ].map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                          <div>
                            <div className="flex items-center gap-2">
                              <FileText className="w-5 h-5 text-gray-400" />
                              <span className="font-medium text-gray-900">{doc.label}</span>
                              {doc.compulsory && <span className="text-xs text-red-500 font-medium">*</span>}
                            </div>
                            <span className="text-xs text-gray-500 mt-1 block">
                              {selectedApplication[doc.field] ? 'Document provided' : 'Not provided'}
                            </span>
                          </div>
                          {selectedApplication[doc.field] && (
                            <a 
                              href={getDocumentUrl(selectedApplication[doc.field])} 
                              target="_blank" 
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md text-sm font-medium transition-colors"
                            >
                              View
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Halal History Tab */}
              {activeDetailTab === 'halal-history' && (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Halal Certification History</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-2">
                          Has the company ever applied for Halal certification previously?
                        </p>
                        {getYesNoBadge(selectedApplication.hasAppliedBefore)}
                        {selectedApplication.hasAppliedBefore === 'yes' && selectedApplication.previousHalalAgency && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">Previous Halal Agency:</p>
                            <p className="font-medium text-gray-900">{selectedApplication.previousHalalAgency}</p>
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 mb-2">
                          Has the factory ever been supervised before?
                        </p>
                        {getYesNoBadge(selectedApplication.hasBeenSupervisedBefore)}
                        {selectedApplication.hasBeenSupervisedBefore === 'yes' && selectedApplication.supervisingHalalAgency && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">Supervising Halal Agency:</p>
                            <p className="font-medium text-gray-900">{selectedApplication.supervisingHalalAgency}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Product Composition Tab */}
              {activeDetailTab === 'product-composition' && (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Composition</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Uses pork or pork derivatives?</p>
                        {getYesNoBadge(selectedApplication.usesPorkOrDerivatives)}
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Uses animal meat or derivatives?</p>
                        {getYesNoBadge(selectedApplication.usesAnimalMeatOrDerivatives)}
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Uses gelatin or capsule?</p>
                        {getYesNoBadge(selectedApplication.usesGelatinOrCapsule)}
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Contains alcohol?</p>
                        {getYesNoBadge(selectedApplication.containsAlcohol)}
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Additives/flavour contain alcohol?</p>
                        {getYesNoBadge(selectedApplication.additivesOrFlavourContainAlcohol)}
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Uses glycerine or derivatives?</p>
                        {getYesNoBadge(selectedApplication.usesGlycerineOrDerivatives)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Facilities Tab */}
              {activeDetailTab === 'facilities' && (
                <div className="space-y-6">
                  {/* Manufacturing Facility */}
                  {selectedApplication.manufacturingFacility && (
                    <div className="bg-gray-50 rounded-lg p-5">
                      <div className="flex items-center mb-4">
                        <Factory className="w-5 h-5 text-gray-500 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-900">Manufacturing Facility</h3>
                      </div>
                      
                      {Object.keys(selectedApplication.manufacturingFacility).some(key => selectedApplication.manufacturingFacility[key]) ? (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Company/Plant Name</p>
                            <p className="font-medium text-gray-900">
                              {selectedApplication.manufacturingFacility?.companyName || 'N/A'}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-sm text-gray-600">Address</p>
                            <p className="font-medium text-gray-900">
                              {selectedApplication.manufacturingFacility.address || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Local Govt. Area</p>
                            <p className="font-medium text-gray-900">
                              {selectedApplication.manufacturingFacility.localGovtArea || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">City</p>
                            <p className="font-medium text-gray-900">
                              {selectedApplication.manufacturingFacility.city || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">State</p>
                            <p className="font-medium text-gray-900">
                              {selectedApplication.manufacturingFacility.state || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Country</p>
                            <p className="font-medium text-gray-900">
                              {selectedApplication.manufacturingFacility.country || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Plant Contact</p>
                            <p className="font-medium text-gray-900">
                              {selectedApplication.manufacturingFacility.plantContact || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Position/Title</p>
                            <p className="font-medium text-gray-900">
                              {selectedApplication.manufacturingFacility.positionTitle || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Telephone No.</p>
                            <p className="font-medium text-gray-900">
                              {selectedApplication.manufacturingFacility.telephoneNo || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Email Address</p>
                            <p className="font-medium text-gray-900">
                              {selectedApplication.manufacturingFacility.emailAddress || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Government Plant Code</p>
                            <p className="font-medium text-gray-900">
                              {selectedApplication.manufacturingFacility.governmentPlantCode || 'N/A'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">Same as company address</p>
                      )}
                    </div>
                  )}

                  {/* Additional Facilities */}
                  {selectedApplication.additionalFacilities && selectedApplication.additionalFacilities.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-5">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Manufacturing Locations</h3>
                      
                      {selectedApplication.additionalFacilities.map((facility, index) => (
                        <div key={index} className="mb-6 last:mb-0 border-b border-gray-200 pb-6 last:border-0 last:pb-0">
                          <h4 className="font-medium text-gray-900 mb-3">Facility #{index + 1}</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Company/Plant Name</p>
                              <p className="font-medium text-gray-900">{facility?.companyName || 'N/A'}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-sm text-gray-600">Address</p>
                              <p className="font-medium text-gray-900">{facility.address || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Local Govt. Area</p>
                              <p className="font-medium text-gray-900">{facility.localGovtArea || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">City</p>
                              <p className="font-medium text-gray-900">{facility.city || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">State</p>
                              <p className="font-medium text-gray-900">{facility.state || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Country</p>
                              <p className="font-medium text-gray-900">{facility.country || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Plant Contact</p>
                              <p className="font-medium text-gray-900">{facility.plantContact || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Position/Title</p>
                              <p className="font-medium text-gray-900">{facility.positionTitle || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Telephone No.</p>
                              <p className="font-medium text-gray-900">{facility.telephoneNo || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Email Address</p>
                              <p className="font-medium text-gray-900">{facility.emailAddress || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Packaging Plant */}
                  {selectedApplication.packagingPlant && selectedApplication.packagingPlant.exists && (
                    <div className="bg-gray-50 rounded-lg p-5">
                      <div className="flex items-center mb-4">
                        <Package className="w-5 h-5 text-gray-500 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-900">Packaging Plant</h3>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Company/Plant Name</p>
                          <p className="font-medium text-gray-900">
                            {selectedApplication.packagingPlant?.companyName || 'N/A'}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-sm text-gray-600">Address</p>
                          <p className="font-medium text-gray-900">
                            {selectedApplication.packagingPlant.address || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Local Govt. Area</p>
                          <p className="font-medium text-gray-900">
                            {selectedApplication.packagingPlant.localGovtArea || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">City</p>
                          <p className="font-medium text-gray-900">
                            {selectedApplication.packagingPlant.city || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">State</p>
                          <p className="font-medium text-gray-900">
                            {selectedApplication.packagingPlant.state || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Country</p>
                          <p className="font-medium text-gray-900">
                            {selectedApplication.packagingPlant.country || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Plant Contact</p>
                          <p className="font-medium text-gray-900">
                            {selectedApplication.packagingPlant.plantContact || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Position/Title</p>
                          <p className="font-medium text-gray-900">
                            {selectedApplication.packagingPlant.positionTitle || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Telephone No.</p>
                          <p className="font-medium text-gray-900">
                            {selectedApplication.packagingPlant.telephoneNo || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Email Address</p>
                          <p className="font-medium text-gray-900">
                            {selectedApplication.packagingPlant.emailAddress || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Markets Tab */}
              {activeDetailTab === 'markets' && (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Markets</h3>
                    
                    {selectedApplication.geographicMarkets && selectedApplication.geographicMarkets.length > 0 ? (
                      <div>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {selectedApplication.geographicMarkets.map((market, index) => (
                            <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                              {market}
                            </span>
                          ))}
                        </div>
                        {selectedApplication.geographicMarkets.includes('Other') && selectedApplication.geographicMarketsOther && (
                          <div>
                            <p className="text-sm text-gray-600">Other market specified:</p>
                            <p className="font-medium text-gray-900">{selectedApplication.geographicMarketsOther}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No geographic markets specified</p>
                    )}
                  </div>
                </div>
              )}

              {/* Audit Report Tab */}
              {activeDetailTab === 'audit-report' && (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Audit Reports</h3>
                    {selectedApplication.processData?.audit?.auditReportFile ? (
                      <div className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">Final Audit Report</h4>
                          <p className="text-sm text-gray-500">Document uploaded by the lead auditor after completion.</p>
                        </div>
                        <a 
                          href={getDocumentUrl(selectedApplication.processData.audit.auditReportFile)} 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium rounded-lg text-sm transition-colors"
                        >
                          View Report
                        </a>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No audit report has been attached to this application yet.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Notes */}
              {selectedApplication.description && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-gray-800">{selectedApplication.description}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="border-t border-gray-200 px-6 py-2 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg font-medium transition-colors duration-200"
                >
                  Close
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
            <div className="relative">
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
                {companySuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {companySuggestions.map((company) => (
                      <button
                        key={company._id || company.id}
                        type="button"
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 border-b last:border-0 border-gray-100"
                        onClick={() => handleCompanySuggestionClick(company.companyName || company.name)}
                      >
                        <div className="font-medium">{company.companyName || company.name}</div>
                        {company.registrationNo && (
                          <div className="text-xs text-gray-500">Reg: {company.registrationNo}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
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
                  <option value="accepted">Accepted</option>
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
                <span>{applications.length} Applications</span>
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
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Application ID</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedApplications.length > 0 ? (
                  paginatedApplications.map((app) => {
                    const appId = app.id || app._id;
                    const statusConfig = getStatusConfig(app.status);
                    const StatusIcon = statusConfig.icon;
                    const typeConfig = getTypeConfig(app.applicationType);

                    return (
                      <tr key={appId} className="hover:bg-gray-50">
                        <td className="p-4">
                          <div>
                            <div className="font-medium text-gray-900">{app.company?.companyName}</div>
                            {/* <div className="text-sm text-gray-600">
                              
                            </div> */}
                            {app.company?.email && (
                              <div className="text-xs text-gray-500">{app.company?.email}</div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm font-medium text-gray-900">
                            #{app.applicationNumber  || 'N/A'}
                          </div>
                          
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
                          <TableActions 
                            actions={[
                              {
                                label: 'Processing',
                                icon: Activity,
                                onClick: () => navigate(`/applications/${appId}/process`)
                              },
                              {
                                label: 'View Details',
                                icon: Eye,
                                onClick: () => handleViewDetails(appId)
                              }
                            ].filter(Boolean)}
                          />
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
                  Showing <span className="font-medium">{Math.min(filteredApplications.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredApplications.length, currentPage * itemsPerPage)}</span> of{' '}
                  <span className="font-medium">{filteredApplications.length}</span> applications
                </div>
                <div className="flex items-center space-x-2">
                  {totalPages > 1 && (
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 bg-white border border-gray-300 shadow-sm rounded-lg transition-colors duration-200 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-600 px-2">Page {currentPage} of {totalPages}</span>
                      <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 bg-white border border-gray-300 shadow-sm rounded-lg transition-colors duration-200 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
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