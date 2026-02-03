import { useState, useEffect } from 'react';
import { 
  Search, 
  Download, 
  Eye, 
  Calendar, 
  Award, 
  Filter, 
  ChevronDown,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  ExternalLink,
  Building,
  Package,
  User,
  Info,
  Mail,
  Phone,
  Globe
} from 'lucide-react';
import { useAll } from '../hooks/useAll';
import { toast } from 'sonner';

const Certificates = () => {
  const controller = new AbortController()
  const [filter, setFilter] = useState({
    search: '',
    company: '',
    dateFrom: '',
    dateTo: '',
    status: '',
  });

  const [activeTab, setActiveTab] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCertificates, setSelectedCertificates] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [companySuggestions, setCompanySuggestions] = useState([]);

  const { 
    certificates, 
    isLoading, 
    errors,
    fetchCertificates,
    deleteCertificate,
    renewCertificate,
    getCertificateById,
    companies,
    products,
    applications
  } = useAll();

  // Fetch certificates on component mount
  useEffect(() => {
    fetchCertificates();

    return () => controller.abort()
  }, []);

  // Update company suggestions when companies or filter changes
  useEffect(() => {
    if (filter.company && companies.length > 0) {
      const searchTerm = filter.company.toLowerCase();
      const suggestions = companies
        .filter(company => 
          company.companyName?.toLowerCase().includes(searchTerm) ||
          company.name?.toLowerCase().includes(searchTerm) ||
          company.registrationNo?.toLowerCase().includes(searchTerm)
        )
        .slice(0, 5); // Limit to 5 suggestions
      setCompanySuggestions(suggestions);
    } else {
      setCompanySuggestions([]);
    }
  }, [filter.company, companies]);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCertificates();
    setIsRefreshing(false);
  };

  // Get company name from certificate
  const getCompanyNameFromCert = (cert) => {
    // Try different possible fields for company name
    if (cert.companyName) return cert.companyName;
    if (cert.company?.name) return cert.company.name;
    if (cert.company?.companyName) return cert.company.companyName;
    
    // If companyId exists, find company from companies array
    if (cert.companyId && companies.length > 0) {
      const company = companies.find(c => 
        c._id === cert.companyId || 
        c.id === cert.companyId || 
        c.registrationNo === cert.companyId
      );
      return company?.companyName || company?.name || 'Unknown Company';
    }
    
    return 'Unknown Company';
  };

  // Get company ID from certificate
  const getCompanyIdFromCert = (cert) => {
    if (cert.companyId) return cert.companyId;
    if (cert.company?._id) return cert.company._id;
    if (cert.company?.id) return cert.company.id;
    if (cert.company?.registrationNo) return cert.company.registrationNo;
    return null;
  };

  // Filter certificates with improved company search
  const filteredCertificates = certificates.filter(cert => {
    // Tab filter
    switch (activeTab) {
      case 'all':
        break;
      case 'active':
        return cert.status === 'active' || cert.status === 'Active';
      case 'expired':
        return cert.status === 'expired' || cert.status === 'Expired';
      case 'renewal':
        return cert.status === 'pending_renewal' || cert.status === 'Renewal';
      case 'revoked':
        return cert.status === 'revoked' || cert.status === 'Revoked';
      default:
        break;
    }

    const searchTerm = filter.search.toLowerCase();
    const companyTerm = filter.company.toLowerCase();
    const companyName = getCompanyNameFromCert(cert).toLowerCase();

    // Search filter (searches multiple fields)
    if (filter.search) {
      const matchesSearch = 
        cert.certificateNumber?.toLowerCase().includes(searchTerm) ||
        companyName.includes(searchTerm) ||
        cert.product?.name?.toLowerCase().includes(searchTerm) ||
        cert.standard?.toLowerCase().includes(searchTerm) ||
        cert.certificateType?.toLowerCase().includes(searchTerm);
      
      if (!matchesSearch) return false;
    }

    // Company filter (improved search)
    if (filter.company) {
      // Check if company name matches
      if (!companyName.includes(companyTerm)) {
        // Also check company ID if available
        const companyId = getCompanyIdFromCert(cert);
        if (!companyId?.toLowerCase().includes(companyTerm)) {
          return false;
        }
      }
    }

    // Date filters
    if (filter.dateFrom && cert.issueDate && new Date(cert.issueDate) < new Date(filter.dateFrom)) {
      return false;
    }
    if (filter.dateTo && cert.issueDate && new Date(cert.issueDate) > new Date(filter.dateTo)) {
      return false;
    }
    if (filter.status && cert.status !== filter.status) {
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

  // Get status badge configuration
  const getStatusConfig = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'active':
        return { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle };
      case 'expired':
        return { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle };
      case 'revoked':
        return { bg: 'bg-gray-100', text: 'text-gray-800', icon: XCircle };
      case 'pending_renewal':
      case 'renewal':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', icon: Clock };
    }
  };

  // Calculate days until expiry
  const getDaysUntilExpiry = (expiryDate) => {
    try {
      const expiry = new Date(expiryDate);
      const today = new Date();
      const diffTime = expiry - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return null;
    }
  };

  // Get expiry status
  const getExpiryStatus = (expiryDate, status) => {
    if (status?.toLowerCase() === 'expired' || status?.toLowerCase() === 'revoked') {
      return { text: 'Expired', color: 'text-red-600', bg: 'bg-red-50' };
    }
    
    const daysUntilExpiry = getDaysUntilExpiry(expiryDate);
    if (daysUntilExpiry === null) return { text: 'Unknown', color: 'text-gray-600', bg: 'bg-gray-50' };
    
    if (daysUntilExpiry < 0) return { text: 'Expired', color: 'text-red-600', bg: 'bg-red-50' };
    if (daysUntilExpiry <= 30) return { text: `Expires in ${daysUntilExpiry} days`, color: 'text-yellow-600', bg: 'bg-yellow-50' };
    if (daysUntilExpiry <= 90) return { text: `Expires in ${daysUntilExpiry} days`, color: 'text-orange-600', bg: 'bg-orange-50' };
    return { text: `Valid for ${daysUntilExpiry} days`, color: 'text-green-600', bg: 'bg-green-50' };
  };

  // Handle Delete Certificate
  const handleDeleteCertificate = async (certId) => {
    if (window.confirm("Are you sure you want to delete this certificate?")) {
      try {
        await deleteCertificate(certId);
        toast.success("Certificate deleted!");
        // Close modal if the deleted certificate is open
        if (selectedCertificate && selectedCertificate.id === certId) {
          setIsViewModalOpen(false);
          setSelectedCertificate(null);
        }
        fetchCertificates();
      } catch (error) {
        toast.error("Failed to delete certificate")
        console.log(error);
      }
    }
  };

  // Handle Renew Certificate
  const handleRenewCertificate = async (certId) => {
    if (window.confirm("Are you sure you want to renew this certificate?")) {
      try {
        await renewCertificate(certId);
        toast.success("Certificate renewal initiated!");
        fetchCertificates();
      } catch (error) {
        toast.error("Failed to renew certificate");
        console.log(error)
      }
    }
  };

  const handleViewDetails = async (certId) => {
    setIsLoadingDetails(true);
    try {
      const certificate = await getCertificateById(certId);
      if (certificate) {
        setSelectedCertificate(certificate);
        setIsViewModalOpen(true);
      } else {
        toast.error("Failed to load certificate details");
      }
    } catch (error) {
      toast.error("Failed to load certificate details");
      console.log(error)
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Handle Download Certificate
  const handleDownloadCertificate = async (certId) => {
    try {
      toast.success("Certificate download initiated!" + certId);
      // Implement actual download logic here
      // You might want to add a download function in your AllProvider
    } catch (error) {
      toast.error("Failed to download certificate");
      console.log(error)
    }
  };

  // Handle bulk selection
  const toggleSelectAll = () => {
    if (selectedCertificates.length === filteredCertificates.length) {
      setSelectedCertificates([]);
    } else {
      setSelectedCertificates(filteredCertificates.map(cert => cert.id || cert._id));
    }
  };

  const toggleSelectCertificate = (certId) => {
    setSelectedCertificates(prev => 
      prev.includes(certId) 
        ? prev.filter(id => id !== certId)
        : [...prev, certId]
    );
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedCertificates.length === 0) {
      toast.warning("No certificates selected");
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedCertificates.length} selected certificates?`)) {
      try {
        const deletePromises = selectedCertificates.map(id => deleteCertificate(id));
        await Promise.all(deletePromises);
        setSelectedCertificates([]);
        toast.success(`${selectedCertificates.length} certificates deleted successfully!`);
        fetchCertificates();
      } catch (error) {
        toast.error("Failed to delete some certificates");
        console.log(error)
      }
    }
  };

  // Calculate tab counts
  const getTabCounts = () => {
    return {
      all: certificates.length,
      active: certificates.filter(c => 
        c.status === 'active' || c.status === 'Active'
      ).length,
      expired: certificates.filter(c => 
        c.status === 'expired' || c.status === 'Expired'
      ).length,
      renewal: certificates.filter(c => 
        c.status === 'pending_renewal' || c.status === 'Renewal'
      ).length,
      revoked: certificates.filter(c => 
        c.status === 'revoked' || c.status === 'Revoked'
      ).length,
    };
  };

  const tabCounts = getTabCounts();

  const tabs = [
    { id: 'all', label: 'All Certificates', count: tabCounts.all },
    { id: 'active', label: 'Active', count: tabCounts.active },
    { id: 'expired', label: 'Expired', count: tabCounts.expired },
    { id: 'renewal', label: 'Renewal', count: tabCounts.renewal },
    { id: 'revoked', label: 'Revoked', count: tabCounts.revoked },
  ];

  // Close modal
  const closeModal = () => {
    setIsViewModalOpen(false);
    setSelectedCertificate(null);
  };

  // Get company name by ID
  // const getCompanyName = (companyId) => {
  //   if (!companyId) return 'Unknown Company';
  //   const company = companies.find(c => 
  //     c.registrationNo === companyId || 
  //     c._id === companyId || 
  //     c.id === companyId
  //   );
  //   return company?.companyName?.charAt(0)?.toUpperCase() + company?.companyName?.slice(1) || 
  //          company?.name?.charAt(0)?.toUpperCase() + company?.name?.slice(1) || 
  //          'Unknown Company';
  // };

  // Get product name by ID
  const getProductName = (productId) => {
    if (!productId) return 'Unknown Product';
    const product = products.find(p => p.id === productId || p._id === productId);
    return product?.name || 'Unknown Product';
  };

  // Get application by ID
  const getApplication = (applicationId) => {
    if (!applicationId) return null;
    return applications.find(a => a._id === applicationId._id || a._id === applicationId);
  };

  // Handle company suggestion click
  const handleCompanySuggestionClick = (companyName) => {
    setFilter({ ...filter, company: companyName });
    setCompanySuggestions([]);
  };

  // View Modal Component
  const ViewCertificateModal = () => {
    if (!selectedCertificate) return null;

    const statusConfig = getStatusConfig(selectedCertificate.status);
    const StatusIcon = statusConfig.icon;
    const certId = selectedCertificate.id || selectedCertificate._id;
    const expiryStatus = getExpiryStatus(selectedCertificate.expiryDate, selectedCertificate.status);
    const application = getApplication(selectedCertificate.applicationId);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Modal Header */}
          <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedCertificate.certificateNumber || `Certificate #${certId.slice(-8)}`}
                </h2>
                <p className="text-sm text-gray-600">
                  Issued on {formatDateTime(selectedCertificate.issueDate)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                <StatusIcon className="w-4 h-4 mr-1" />
                {selectedCertificate.status?.charAt(0).toUpperCase() + selectedCertificate.status?.slice(1) || 'Unknown'}
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
              {/* Certificate Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Certificate Information */}
                <div className="bg-gray-50 rounded-lg p-5">
                  <div className="flex items-center mb-4">
                    <Award className="w-5 h-5 text-gray-500 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Certificate Information</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Certificate Number</p>
                      <p className="font-medium text-gray-900">
                        {selectedCertificate.certificateNumber || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Certificate Type</p>
                      <p className="font-medium text-gray-900">
                        {selectedCertificate.certificateType || 'Standard'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Standard</p>
                      <p className="font-medium text-gray-900">
                        {selectedCertificate.standard || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {selectedCertificate.status?.charAt(0).toUpperCase() + selectedCertificate.status?.slice(1) || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>

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
                        {getCompanyNameFromCert(selectedCertificate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Company Address</p>
                      <p className="font-medium text-gray-900">
                        {selectedCertificate.companyAddress || 'N/A'}
                      </p>
                    </div>
                    {selectedCertificate.companyWebsite && (
                      <div>
                        <p className="text-sm text-gray-600">Website</p>
                        <a 
                          href={selectedCertificate.companyWebsite} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          {selectedCertificate.companyWebsite}
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                    )}
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
                        {selectedCertificate.product?.name || getProductName(selectedCertificate.productId) || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Product Category</p>
                      <p className="font-medium text-gray-900">
                        {selectedCertificate.productCategory || 'N/A'}
                      </p>
                    </div>
                    {application && (
                      <div>
                        <p className="text-sm text-gray-600">Application ID</p>
                        <p className="font-medium text-gray-900">
                          #{application.applicationNumber || application.id?.slice(-8)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Validity Information */}
                <div className="bg-gray-50 rounded-lg p-5">
                  <div className="flex items-center mb-4">
                    <Calendar className="w-5 h-5 text-gray-500 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Validity Information</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Issue Date</p>
                      <p className="font-medium text-gray-900">
                        {formatDateTime(selectedCertificate.issueDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Expiry Date</p>
                      <p className="font-medium text-gray-900">
                        {formatDateTime(selectedCertificate.expiryDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Validity Status</p>
                      <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${expiryStatus.bg} ${expiryStatus.color}`}>
                        {expiryStatus.text}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Generated By</p>
                      <p className="font-medium text-gray-900">
                        {selectedCertificate.generatedBy || 'System'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Certificate Metadata */}
              <div className="bg-gray-50 rounded-lg p-5 mb-8">
                <div className="flex items-center mb-4">
                  <Info className="w-5 h-5 text-gray-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Certificate Metadata</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Certificate ID</p>
                    <p className="font-medium text-gray-900">
                      {certId}
                    </p>
                  </div>
                  {selectedCertificate.applicationId && (
                    <div>
                      <p className="text-sm text-gray-600">Application ID</p>
                      <p className="font-medium text-gray-900">
                        {selectedCertificate.applicationId.applicationNumber}
                      </p>
                    </div>
                  )}
                  {selectedCertificate.createdAt && (
                    <div>
                      <p className="text-sm text-gray-600">Created At</p>
                      <p className="font-medium text-gray-900">
                        {formatDateTime(selectedCertificate.createdAt)}
                      </p>
                    </div>
                  )}
                  {selectedCertificate.updatedAt && (
                    <div>
                      <p className="text-sm text-gray-600">Last Updated</p>
                      <p className="font-medium text-gray-900">
                        {formatDateTime(selectedCertificate.updatedAt)}
                      </p>
                    </div>
                  )}
                  {selectedCertificate.revocationReason && (
                    <div className="col-span-full">
                      <p className="text-sm text-red-600">Revocation Reason</p>
                      <p className="font-medium text-red-700">
                        {selectedCertificate.revocationReason}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleDownloadCertificate(certId)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors duration-200 flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Certificate
                </button>
                {(selectedCertificate.status === 'active' || selectedCertificate.status === 'Active') && (
                  <button
                    onClick={() => handleRenewCertificate(certId)}
                    className="px-4 py-2 bg-[#00853b] text-white rounded-lg hover:bg-green-700 font-medium transition-colors duration-200 flex items-center"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Renew Certificate
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg font-medium transition-colors duration-200"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDeleteCertificate(certId)}
                  className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium transition-colors duration-200 flex items-center"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Delete Certificate
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
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Certificates</h1>
            <p className="text-gray-600 mt-1">Manage issued certificates</p>
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
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 text-sm font-medium ${
                  viewMode === 'grid' 
                    ? 'bg-[#00853b] text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 text-sm font-medium ${
                  viewMode === 'list' 
                    ? 'bg-[#00853b] text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                List
              </button>
            </div>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search certificates..."
                  className="pl-10 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#00853b] focus:ring-1 focus:ring-[#00853b]"
                  value={filter.search}
                  onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by company name..."
                  className="pl-10 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#00853b] focus:ring-1 focus:ring-[#00853b]"
                  value={filter.company}
                  onChange={(e) => setFilter({ ...filter, company: e.target.value })}
                  disabled={isLoading}
                />
                {companySuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                    {companySuggestions.map((company) => (
                      <button
                        key={company._id || company.id}
                        type="button"
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"
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
              {selectedCertificates.length > 0 && (
                <span>{selectedCertificates.length} certificates selected</span>
              )}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setFilter({ search: '', company: '', dateFrom: '', dateTo: '', status: '' });
                  setCompanySuggestions([]);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                disabled={isLoading}
              >
                Clear All Filters
              </button>
              {selectedCertificates.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  disabled={isLoading}
                >
                  Delete Selected
                </button>
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

      {/* Certificates Display */}
      {!isLoading && (
        <>
          {viewMode === 'grid' ? (
            // Grid View
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {filteredCertificates.length > 0 ? (
                filteredCertificates.map((cert) => {
                  const certId = cert.id || cert._id;
                  const statusConfig = getStatusConfig(cert.status);
                  const expiryStatus = getExpiryStatus(cert.expiryDate, cert.status);
                  const StatusIcon = statusConfig.icon;
                  const companyName = getCompanyNameFromCert(cert);
                  const productName = cert.product?.name || getProductName(cert.productId);

                  return (
                    <div key={certId} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden group">
                      <div className="p-6">
                        {/* Certificate Header */}
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center">
                            <div className="w-12 h-12 rounded-lg bg-[#00853b]/10 flex items-center justify-center">
                              <Award className="w-6 h-6 text-[#00853b]" />
                            </div>
                            <div className="ml-4">
                              <h3 className="text-lg font-bold text-gray-900">{cert.certificateNumber || `CERT-${certId.slice(-8)}`}</h3>
                              <p className="text-sm text-gray-600">Certificate ID</p>
                            </div>
                          </div>
                          <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {cert.status?.charAt(0).toUpperCase() + cert.status?.slice(1) || 'Unknown'}
                          </span>
                        </div>
                        
                        {/* Certificate Details */}
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Company</p>
                            <p className="font-medium text-gray-900">{companyName}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Product</p>
                            <p className="font-medium text-gray-900">
                              {productName?.charAt(0)?.toUpperCase() + productName?.slice(1)}
                            </p>
                          </div>
                          
                          {/* Dates */}
                          <div className="pt-4 border-t border-gray-200">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-600 mb-1">Issue Date</p>
                                <div className="flex items-center">
                                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                  <span className="font-medium text-gray-900">{formatDate(cert.issueDate)}</span>
                                </div>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600 mb-1">Expiry Date</p>
                                <div className="flex items-center">
                                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                  <span className={`font-medium ${expiryStatus.color}`}>
                                    {formatDate(cert.expiryDate)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="mt-3">
                              <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${expiryStatus.bg} ${expiryStatus.color}`}>
                                {expiryStatus.text}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex justify-between mt-6 pt-6 border-t border-gray-200">
                          <button 
                            onClick={() => handleViewDetails(certId)}
                            disabled={isLoadingDetails}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 inline-flex items-center disabled:opacity-50"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </button>
                          <button 
                            onClick={() => handleDownloadCertificate(certId)}
                            className="px-4 py-2 bg-[#00853b] text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors duration-200 inline-flex items-center"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No certificates found</h3>
                  <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria</p>
                  <button 
                    onClick={() => { 
                      setFilter({ search: '', company: '', dateFrom: '', dateTo: '', status: '' });
                      setActiveTab('all');
                      setCompanySuggestions([]);
                    }}
                    className="px-4 py-2 text-sm font-medium text-[#00853b] hover:text-green-700"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          ) : (
            // List View (Table)
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] lg:min-w-0">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                        <input
                          type="checkbox"
                          checked={selectedCertificates.length === filteredCertificates.length && filteredCertificates.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded border-gray-300 text-[#00853b] focus:ring-[#00853b]"
                        />
                      </th>
                      <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Certificate</th>
                      <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                      <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                      <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                      <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredCertificates.length > 0 ? (
                      filteredCertificates.map((cert) => {
                        const certId = cert.id || cert._id;
                        const statusConfig = getStatusConfig(cert.status);
                        const expiryStatus = getExpiryStatus(cert.expiryDate, cert.status);
                        const StatusIcon = statusConfig.icon;
                        const companyName = getCompanyNameFromCert(cert);
                        const productName = cert.product?.name || getProductName(cert.productId);

                        return (
                          <tr key={certId} className="hover:bg-gray-50">
                            <td className="p-4">
                              <input
                                type="checkbox"
                                checked={selectedCertificates.includes(certId)}
                                onChange={() => toggleSelectCertificate(certId)}
                                className="rounded border-gray-300 text-[#00853b] focus:ring-[#00853b]"
                              />
                            </td>
                            <td className="p-4">
                              <div>
                                <div className="font-medium text-gray-900">{cert.certificateNumber || `CERT-${certId.slice(-8)}`}</div>
                                <div className="text-sm text-gray-600">
                                  {cert.certificateType || 'Standard Certificate'}
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="text-sm font-medium text-gray-900">
                                {companyName}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="text-sm font-medium text-gray-900">
                                {productName}
                              </div>
                              {cert.standard && (
                                <div className="text-xs text-gray-500">{cert.standard}</div>
                              )}
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col gap-1">
                                <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {cert.status?.charAt(0).toUpperCase() + cert.status?.slice(1) || 'Unknown'}
                                </span>
                                <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${expiryStatus.bg} ${expiryStatus.color}`}>
                                  {expiryStatus.text}
                                </span>
                              </div>
                            </td>
                            <td className="p-4 text-sm text-gray-500">
                              {formatDate(cert.issueDate)}
                            </td>
                            <td className="p-4 text-sm text-gray-500">
                              <span className={expiryStatus.color}>
                                {formatDate(cert.expiryDate)}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center space-x-2">
                                <button 
                                  onClick={() => handleViewDetails(certId)}
                                  disabled={isLoadingDetails}
                                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDownloadCertificate(certId)}
                                  className="p-1.5 text-[#00853b] hover:bg-green-50 rounded-lg transition-colors duration-200"
                                  title="Download Certificate"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                                {(cert.status === 'active' || cert.status === 'Active') && (
                                  <button
                                    onClick={() => handleRenewCertificate(certId)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                    title="Renew Certificate"
                                  >
                                    <RefreshCw className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteCertificate(certId)}
                                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                  title="Delete Certificate"
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
                        <td colSpan="8" className="p-8 text-center text-gray-500">
                          <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No certificates found</h3>
                          <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria</p>
                          <button 
                            onClick={() => { 
                              setFilter({ search: '', company: '', dateFrom: '', dateTo: '', status: '' });
                              setActiveTab('all');
                              setCompanySuggestions([]);
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
              {filteredCertificates.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-sm text-gray-600">
                      Showing <span className="font-medium">{filteredCertificates.length}</span> of{' '}
                      <span className="font-medium">{certificates.length}</span> certificates
                    </div>
                    <div className="flex items-center space-x-2">
                      {selectedCertificates.length > 0 && (
                        <button
                          onClick={handleBulkDelete}
                          className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        >
                          Delete Selected ({selectedCertificates.length})
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
        </>
      )}

      {/* View Certificate Modal */}
      {isViewModalOpen && <ViewCertificateModal />}
    </div>
  );
};

export default Certificates;