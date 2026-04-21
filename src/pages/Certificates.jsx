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
  Globe,
  Tag
} from 'lucide-react';
import { useAll } from '../hooks/useAll';
import { toast } from 'sonner';
import TableActions from '../components/TableActions';

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
  const [companySuggestions, setCompanySuggestions] = useState([]);

  const { 
    certificates, 
    isLoading, 
    errors,
    fetchCertificates,
    deleteCertificate,
    renewCertificate,
    getCertificateById,
    downloadCertificate,
    companies,
    products,
    applications,
    baseUrl
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
    if (activeTab !== 'all') {
      let tabMatch = false;
      switch (activeTab) {
        case 'active':
          tabMatch = cert.status === 'active' || cert.status === 'Active';
          break;
        case 'expiring_soon':
          tabMatch = cert.status?.toLowerCase() === 'expiring soon';
          break;
        case 'expired':
          tabMatch = cert.status === 'expired' || cert.status === 'Expired';
          break;
        case 'renewal':
          tabMatch = cert.status === 'pending_renewal' || cert.status === 'Renewal';
          break;
        case 'revoked':
          tabMatch = cert.status === 'revoked' || cert.status === 'Revoked';
          break;
        default:
          tabMatch = true;
          break;
      }
      if (!tabMatch) return false;
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
    const certDate = cert.issueDate ? new Date(cert.issueDate) : null;
    if (certDate) {
      certDate.setHours(0, 0, 0, 0); // Normalize time
    }
    
    if (filter.dateFrom && certDate) {
      const fromDate = new Date(filter.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      if (certDate < fromDate) return false;
    }
    if (filter.dateTo && certDate) {
      const toDate = new Date(filter.dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (certDate > toDate) return false;
    }

    if (filter.status && cert.status?.toLowerCase() !== filter.status.toLowerCase()) {
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
      case 'expiring soon':
        return { bg: 'bg-orange-100', text: 'text-orange-800', icon: Clock };
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
        // toast.success("Certificate deleted!");
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
      toast.loading("Downloading certificate...", { id: "download" });
      
      // Use the downloadCertificate function from your hook
      const blob = await downloadCertificate(certId);
      
      if (!blob) {
        throw new Error("No certificate data received");
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // Get certificate for filename
      const certificate = certificates.find(cert => 
        cert.id === certId || cert._id === certId
      );
      
      // Use certificate number or ID for filename with correct extension
      if (certificate?.pdfPath) {
        const viewUrl = certificate.pdfPath.startsWith('http') ? certificate.pdfPath : `${baseUrl}${certificate.pdfPath}`;
        window.open(viewUrl, '_blank', 'noopener,noreferrer');
      }

      const mimeExt = blob.type.split('/')[1] || 'pdf';
      const ext = mimeExt === 'jpeg' ? 'jpg' : mimeExt;
      const fileName = `certificate_${certificate?.certificateNumber || certId}.${ext}`;
      link.href = url;
      link.download = fileName;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.dismiss("download");
      toast.success("Certificate downloaded!");
      
    } catch (error) {
      console.error("Download error:", error);
      toast.dismiss("download");
      toast.error("Failed to download certificate");
    }
  };

  // Handle Download Label
  const handleDownloadLabel = async (certId, specificPath = null) => {
    try {
      const certificate = certificates.find(cert => cert.id === certId || cert._id === certId);
      if (!certificate) {
        toast.error("Certificate not found");
        return;
      }

      // Support both old labelPath and new labelPaths
      const targetPath = specificPath || certificate.labelPath || (certificate.labelPaths && certificate.labelPaths[0]);
      
      if (!targetPath) {
        toast.error("No label found for this certificate");
        return;
      }
      
      const token = JSON.parse(localStorage.getItem("accessToken"));
      const downloadUrl = targetPath.startsWith('http') ? targetPath : `${baseUrl}${targetPath}`;

      toast.loading("Downloading label...", { id: "download-label" });
      
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');

      const response = await fetch(downloadUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to fetch file");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const mimeExt = blob.type.split('/')[1] || 'png';
      const ext = mimeExt === 'jpeg' ? 'jpg' : mimeExt;
      
      link.setAttribute('download', `Label_${certificate.certificateNumber || 'certificate'}.${ext}`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.dismiss("download-label");
      toast.success("Label downloaded!");
    } catch (err) {
      console.error("Error downloading label:", err);
      toast.dismiss("download-label");
      toast.error("Failed to download label.");
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
      expiring_soon: certificates.filter(c => 
        c.status?.toLowerCase() === 'expiring soon'
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
    { id: 'expiring_soon', label: 'Expiring Soon', count: tabCounts.expiring_soon },
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
                className="p-2 cursor-pointer hover:bg-gray-100 rounded-lg transition-colors duration-200"
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
                  className="px-4 py-2 bg-[#00853b] cursor-pointer text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Certificate
                </button>
                {/* Handle multiple labels (array) */}
                {selectedCertificate?.labelPaths?.length > 0 ? (
                  selectedCertificate.labelPaths.map((path, index) => (
                    <div key={index} className="detail-item full-width" style={{ marginTop: index === 0 ? '20px' : '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '8px', borderRadius: '8px' }}>
                            <Tag size={18} color="#0ea5e9" />
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Label Order {selectedCertificate.labelPaths.length > 1 ? index + 1 : ''}</p>
                            <p style={{ margin: 0, fontWeight: 500, fontSize: '14px', color: '#1e293b' }}>Product Labeling Guidelines</p>
                          </div>
                        </div>
                        <button 
                          className="download-btn-small" 
                          onClick={() => handleDownloadLabel(selectedCertificate._id, path)}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}
                        >
                          <Download size={14} /> Download
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  /* Backward compatibility for single labelPath */
                  selectedCertificate?.labelPath && (
                    <div className="detail-item full-width" style={{ marginTop: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '8px', borderRadius: '8px' }}>
                            <Tag size={18} color="#0ea5e9" />
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Technical Document</p>
                            <p style={{ margin: 0, fontWeight: 500, fontSize: '14px', color: '#1e293b' }}>Product Labeling Guidelines</p>
                          </div>
                        </div>
                        <button 
                          className="download-btn-small" 
                          onClick={() => handleDownloadLabel(selectedCertificate._id, selectedCertificate.labelPath)}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}
                        >
                          <Download size={14} /> Download
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 cursor-pointer text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg font-medium transition-colors duration-200"
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
              className="flex items-center cursor-pointer gap-2 px-4 py-2.5 bg-[#00853b] text-white rounded-lg hover:bg-green-700 font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
              className={`px-4 py-2.5 rounded-lg cursor-pointer text-sm font-medium transition-all duration-200 flex items-center ${
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
            className="lg:hidden p-2 cursor-pointer hover:bg-gray-100 rounded-lg"
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>
        
        <div className={`${isFilterOpen ? 'block' : 'hidden lg:block'}`}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
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
                        className="w-full cursor-pointer text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="relative">
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#00853b] focus:ring-1 focus:ring-[#00853b] appearance-none"
                  value={filter.status}
                  onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                  disabled={isLoading}
                >
                  <option value="">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Expiring Soon">Expiring Soon</option>
                  <option value="Expired">Expired</option>
                  <option value="Revoked">Revoked</option>
                  <option value="Pending">Pending</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
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
                className="px-4 py-2 text-sm cursor-pointer font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                disabled={isLoading}
              >
                Clear All Filters
              </button>
              {/* {selectedCertificates.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 text-sm cursor-pointer font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  disabled={isLoading}
                >
                  Delete Selected
                </button>
              )} */}
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
            // List View (Table)
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] lg:min-w-0">
                  <thead className="bg-gray-50">
                    <tr>
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
                              <TableActions 
                                actions={[
                                  {
                                    label: 'View Details',
                                    icon: Eye,
                                    onClick: () => handleViewDetails(certId),
                                    disabled: isLoadingDetails
                                  },
                                  {
                                    label: 'Download Certificate',
                                    icon: Download,
                                    onClick: () => handleDownloadCertificate(certId)
                                  },
                                  (cert.labelPath || (cert.labelPaths && cert.labelPaths.length > 0)) && {
                                    label: 'Download Label',
                                    icon: Tag,
                                    onClick: () => handleDownloadLabel(cert._id, cert.labelPaths ? cert.labelPaths[0] : cert.labelPath)
                                  }
                                ].filter(Boolean)}
                              />
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
                            className="px-4 py-2 text-sm cursor-pointer font-medium text-[#00853b] hover:text-green-700"
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
                      <div className="flex items-center space-x-2">
                        <button className="px-3 py-1.5 text-sm cursor-pointer font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                          Previous
                        </button>
                        <button className="px-3 py-1.5 text-sm cursor-pointer font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
      )}

      {/* View Certificate Modal */}
      {isViewModalOpen && <ViewCertificateModal />}
    </div>
  );
};

export default Certificates;