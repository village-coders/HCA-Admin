import { useState, useEffect, useRef } from 'react';
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
  Tag,
  X
} from 'lucide-react';
import { useAll } from '../hooks/useAll';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import TableActions from '../components/TableActions';
import { Lock } from 'lucide-react';

const Certificates = () => {
  const { user } = useAuth();
  const hasPrivilege = (priv) => {
    if (user?.role === 'super admin') return true;
    return user?.privileges?.includes(priv);
  };
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
  const [isRemindingId, setIsRemindingId] = useState(null);
  const [companySuggestions, setCompanySuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const companySearchRef = useRef(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (companySearchRef.current && !companySearchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset pagination when filters or tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, activeTab]);

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

  // Update company suggestions: search both the companies store and names found directly on certificates
  useEffect(() => {
    if (filter.company && filter.company.trim()) {
      const searchTerm = filter.company.toLowerCase().trim();

      // 1. Collect matches from the companies store
      const storeMatches = (companies || []).filter(company => {
        const name = (company.companyName || company.fullName || company.name || '').toLowerCase();
        const regNo = (company.registrationNo || '').toLowerCase();
        const email = (company.email || '').toLowerCase();
        return name.includes(searchTerm) || regNo.includes(searchTerm) || email.includes(searchTerm);
      }).map(c => ({
        _id: c._id || c.id || c.registrationNo,
        companyName: c.companyName || c.fullName || c.name,
        registrationNo: c.registrationNo || '',
        email: c.email || ''
      }));

      // 2. Collect unique company names found directly on certificate objects
      const knownNames = new Set(storeMatches.map(c => c.companyName?.toLowerCase().trim()).filter(Boolean));
      const extraMatches = [];

      (certificates || []).forEach(cert => {
        const resolvedName = getCompanyNameFromCert(cert);
        const candidateNames = [
          resolvedName,
          typeof cert.companyName === 'string' ? cert.companyName : '',
          cert.company?.companyName || '',
          cert.company?.fullName || '',
          cert.company?.name || '',
          cert.companyId?.companyName || '',
          cert.companyId?.fullName || '',
          cert.branchId?.companyName || '',
        ];

        for (const raw of candidateNames) {
          const name = String(raw || '').trim();
          if (name && name.toLowerCase().includes(searchTerm) && !knownNames.has(name.toLowerCase())) {
            knownNames.add(name.toLowerCase());
            extraMatches.push({
              _id: `cert-${name}`,
              companyName: name,
              registrationNo: getCompanyIdFromCert(cert) || '',
              email: ''
            });
            break;
          }
        }
      });

      setCompanySuggestions([...storeMatches, ...extraMatches].slice(0, 8));
    } else {
      setCompanySuggestions([]);
    }
  }, [filter.company, companies, certificates]);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCertificates();
    setIsRefreshing(false);
  };

  // Get company name from certificate
  const getCompanyNameFromCert = (cert) => {
    if (!cert) return '';
    // Direct string property on cert
    if (typeof cert.companyName === 'string' && cert.companyName.trim()) {
      return cert.companyName.trim();
    }
    // Company object on cert
    if (cert.company) {
      if (typeof cert.company === 'string' && cert.company.trim()) {
        // If not a 24-character hexadecimal MongoDB ObjectId, treat as company name
        if (!/^[0-9a-fA-F]{24}$/.test(cert.company.trim())) {
          return cert.company.trim();
        }
      } else if (typeof cert.company === 'object') {
        if (cert.company.companyName) return String(cert.company.companyName).trim();
        if (cert.company.fullName) return String(cert.company.fullName).trim();
        if (cert.company.name) return String(cert.company.name).trim();
      }
    }
    // Populated companyId object
    if (cert.companyId && typeof cert.companyId === 'object') {
      if (cert.companyId.companyName) return String(cert.companyId.companyName).trim();
      if (cert.companyId.fullName) return String(cert.companyId.fullName).trim();
      if (cert.companyId.name) return String(cert.companyId.name).trim();
    }
    // Branch information
    if (cert.branchId && typeof cert.branchId === 'object') {
      if (cert.branchId.companyName) return String(cert.branchId.companyName).trim();
      if (cert.branchId.companyId?.companyName) return String(cert.branchId.companyId.companyName).trim();
      if (cert.branchId.companyId?.fullName) return String(cert.branchId.companyId.fullName).trim();
    }
    // Application information
    if (cert.applicationId) {
      const app = typeof cert.applicationId === 'object'
        ? cert.applicationId
        : (applications || []).find(a => (a._id || a.id) === cert.applicationId);
      if (app) {
        if (app.companyName) return String(app.companyName).trim();
        if (app.company?.companyName) return String(app.company.companyName).trim();
        if (app.company?.fullName) return String(app.company.fullName).trim();
      }
    }
    // Find in companies array by ID, registrationNo, or company ObjectId
    const rawCompanyId = typeof cert.companyId === 'object'
      ? (cert.companyId?._id || cert.companyId?.id || cert.companyId?.registrationNo)
      : (cert.companyId || (typeof cert.company === 'string' && /^[0-9a-fA-F]{24}$/.test(cert.company) ? cert.company : null));

    if (rawCompanyId && Array.isArray(companies) && companies.length > 0) {
      const targetId = String(rawCompanyId).toLowerCase().trim();
      const company = companies.find(c => 
        (c._id && String(c._id).toLowerCase().trim() === targetId) || 
        (c.id && String(c.id).toLowerCase().trim() === targetId) || 
        (c.registrationNo && String(c.registrationNo).toLowerCase().trim() === targetId)
      );
      if (company?.companyName) return String(company.companyName).trim();
      if (company?.fullName) return String(company.fullName).trim();
      if (company?.name) return String(company.name).trim();
    }
    
    return '';
  };

  // Get company ID / Registration No from certificate
  const getCompanyIdFromCert = (cert) => {
    if (!cert) return '';
    if (typeof cert.companyId === 'string') return cert.companyId.trim();
    if (cert.companyId && typeof cert.companyId === 'object') {
      return String(cert.companyId.registrationNo || cert.companyId._id || cert.companyId.id || '').trim();
    }
    if (cert.company?.registrationNo) return String(cert.company.registrationNo).trim();
    if (cert.company?._id) return String(cert.company._id).trim();
    if (cert.company?.id) return String(cert.company.id).trim();
    return '';
  };

  // Get product name by ID — defined here so it is available inside filteredCertificates
  const getProductName = (productId) => {
    if (!productId) return '';
    const product = products.find(p => p.id === productId || p._id === productId);
    return product?.name || '';
  };

  // Pre-process certificates to only show the latest per branch AND hide if there's an active renewal
  const displayCertificates = (() => {
    // 1. Find all branches that have an active renewal processing
    const activeRenewals = applications.filter(app => 
      app.category === "Renewal Application" && 
      !["issued", "rejected", "expired"].includes(app.status?.toLowerCase())
    ).map(app => String(app.branchId?._id || app.branchId || app.companyId));

    // 2. Group certificates by branch and keep the latest
    const latestCertsMap = new Map();
    certificates.forEach(cert => {
      const key = String(cert.branchId?._id || cert.branchId || getCompanyIdFromCert(cert) || cert._id);
      
      // If this branch has an active renewal processing, hide all its old certificates completely
      if (activeRenewals.includes(key)) {
        return;
      }

      const existing = latestCertsMap.get(key);
      if (!existing) {
        latestCertsMap.set(key, cert);
      } else {
        const currentExpiry = new Date(cert.expiryDate).getTime();
        const existingExpiry = new Date(existing.expiryDate).getTime();
        if (currentExpiry > existingExpiry) {
          latestCertsMap.set(key, cert);
        }
      }
    });

    return Array.from(latestCertsMap.values());
  })();

  // Filter certificates with case-insensitive lowercase comparison
  const filteredCertificates = displayCertificates.filter(cert => {
    // 1. Tab filter
    if (activeTab !== 'all') {
      let tabMatch = false;
      const statusLower = String(cert.status || '').toLowerCase().trim();
      switch (activeTab) {
        case 'active':
          tabMatch = statusLower === 'active';
          break;
        case 'expiring_soon':
          tabMatch = statusLower === 'expiring soon';
          break;
        case 'expired':
          tabMatch = statusLower === 'expired';
          break;
        case 'renewal':
          tabMatch = statusLower === 'pending_renewal' || statusLower === 'renewal';
          break;
        case 'revoked':
          tabMatch = statusLower === 'revoked';
          break;
        default:
          tabMatch = true;
          break;
      }
      if (!tabMatch) return false;
    }

    // 2. Company filter (case-insensitive substring match across all company identifiers)
    if (filter.company && filter.company.trim()) {
      const companyInputLower = filter.company.toLowerCase().trim();
      const certCompanyNameLower = (getCompanyNameFromCert(cert) || cert.companyName || '').toLowerCase().trim();
      const certCompanyIdLower = getCompanyIdFromCert(cert).toLowerCase().trim();
      const branchNameLower = String(cert.branchId?.branchName || '').toLowerCase().trim();

      // Also check against resolved company object from companies store
      const rawCompanyId = typeof cert.companyId === 'object'
        ? (cert.companyId?._id || cert.companyId?.id || cert.companyId?.registrationNo)
        : cert.companyId;
      const targetId = rawCompanyId ? String(rawCompanyId).toLowerCase().trim() : '';
      const matchedComp = targetId && Array.isArray(companies)
        ? companies.find(c => 
            (c._id && String(c._id).toLowerCase().trim() === targetId) ||
            (c.id && String(c.id).toLowerCase().trim() === targetId) ||
            (c.registrationNo && String(c.registrationNo).toLowerCase().trim() === targetId)
          )
        : null;

      const compEmail = matchedComp?.email ? String(matchedComp.email).toLowerCase() : '';
      const compFullName = matchedComp?.fullName ? String(matchedComp.fullName).toLowerCase() : '';
      const compRegNo = matchedComp?.registrationNo ? String(matchedComp.registrationNo).toLowerCase() : '';

      const matchesCompany = 
        certCompanyNameLower.includes(companyInputLower) || 
        compFullName.includes(companyInputLower) ||
        compRegNo.includes(companyInputLower) ||
        compEmail.includes(companyInputLower) ||
        certCompanyIdLower.includes(companyInputLower) ||
        branchNameLower.includes(companyInputLower);

      if (!matchesCompany) return false;
    }

    // 3. General search filter (searches multiple fields, all in lowercase)
    if (filter.search && filter.search.trim()) {
      const searchInputLower = filter.search.toLowerCase().trim();
      const certNumberLower = String(cert.certificateNumber || '').toLowerCase().trim();
      const certCompanyNameLower = (getCompanyNameFromCert(cert) || cert.companyName || '').toLowerCase().trim();
      const certCompanyIdLower = getCompanyIdFromCert(cert).toLowerCase().trim();
      const productNames = Array.isArray(cert.product) ? cert.product.join(' ') : String(cert.product || '');
      const productNameLower = (productNames || cert.product?.name || getProductName(cert.productId) || '').toLowerCase().trim();
      const standardLower = String(cert.standard || '').toLowerCase().trim();
      const certTypeLower = String(cert.certificateType || '').toLowerCase().trim();
      const branchNameLower = String(cert.branchId?.branchName || '').toLowerCase().trim();

      const matchesSearch = 
        certNumberLower.includes(searchInputLower) ||
        certCompanyNameLower.includes(searchInputLower) ||
        certCompanyIdLower.includes(searchInputLower) ||
        productNameLower.includes(searchInputLower) ||
        standardLower.includes(searchInputLower) ||
        certTypeLower.includes(searchInputLower) ||
        branchNameLower.includes(searchInputLower);
      
      if (!matchesSearch) return false;
    }

    // 4. Date filters
    const certDate = cert.issueDate ? new Date(cert.issueDate) : null;
    if (certDate && !isNaN(certDate.getTime())) {
      certDate.setHours(0, 0, 0, 0); // Normalize time
    }
    
    if (filter.dateFrom && certDate && !isNaN(certDate.getTime())) {
      const fromDate = new Date(filter.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      if (certDate < fromDate) return false;
    }
    if (filter.dateTo && certDate && !isNaN(certDate.getTime())) {
      const toDate = new Date(filter.dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (certDate > toDate) return false;
    }

    // 5. Status dropdown filter
    if (filter.status && filter.status.trim()) {
      const filterStatusLower = filter.status.toLowerCase().trim();
      const certStatusLower = String(cert.status || '').toLowerCase().trim();
      if (certStatusLower !== filterStatusLower) {
        return false;
      }
    }
    
    return true;
  });

  const totalPages = Math.ceil(filteredCertificates.length / itemsPerPage) || 1;
  const paginatedCertificates = filteredCertificates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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

  // Handle Send Reminder
  const handleSendReminder = async (certId) => {
    setIsRemindingId(certId);
    try {
      const token = JSON.parse(localStorage.getItem('accessToken'));
      const response = await fetch(`${baseUrl}/certificates/${certId}/remind`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success("Renewal reminder sent successfully!");
      } else {
        toast.error(data.message || "Failed to send reminder");
      }
    } catch (error) {
      toast.error("Failed to send reminder");
      console.log(error);
    } finally {
      setIsRemindingId(null);
    }
  };

  // Handle Download Certificate
  const handleDownloadCertificate = async (certId, specificPath = null) => {
    try {
      toast.loading("Downloading certificate...", { id: "download" });
      
      const certificate = certificates.find(cert => 
        cert.id === certId || cert._id === certId
      );

      if (!certificate) {
        throw new Error("Certificate not found");
      }

      // If specificPath is provided, use it. Otherwise use pdfPaths array or pdfPath string.
      const pathsToDownload = specificPath ? [specificPath] : (certificate.pdfPaths?.length > 0 ? certificate.pdfPaths : [certificate.pdfPath]);
      
      if (!pathsToDownload[0] && !specificPath) {
        throw new Error("No certificate path available");
      }

      const token = JSON.parse(localStorage.getItem("accessToken"));

      for (let i = 0; i < pathsToDownload.length; i++) {
        let path = pathsToDownload[i];
        if (!path) continue;

        // Ensure path starts with /api/files if it's just /files/
        if (path.startsWith('/files/')) {
          path = '/api' + path;
        }

        const downloadUrl = path.startsWith('http') ? path : `${baseUrl}${path.startsWith('/api') ? path.replace('/api', '') : path}`;
        
        // Open in new tab
        window.open(downloadUrl, '_blank', 'noopener,noreferrer');

        // Force download
        const response = await fetch(downloadUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) throw new Error("Failed to fetch file");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Determine extension
        let ext = 'pdf';
        if (blob.type) {
          const mimeExt = blob.type.split('/')[1];
          if (mimeExt === 'jpeg') ext = 'jpg';
          else if (mimeExt && mimeExt !== 'octet-stream') ext = mimeExt;
        }

        const fileName = `certificate_${certificate.certificateNumber || certId}${pathsToDownload.length > 1 ? `_${i + 1}` : ''}.${ext}`;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
      
      toast.dismiss("download");
      toast.success("Download started!");
      
    } catch (error) {
      console.error("Download error:", error);
      toast.dismiss("download");
      toast.error(error.message || "Failed to download certificate");
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
      const downloadUrl = targetPath.startsWith('http') ? targetPath : `${baseUrl.replace(/\/api$/, '')}${targetPath.startsWith('/api') ? targetPath : '/api' + targetPath}`;

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
      all: displayCertificates.length,
      active: displayCertificates.filter(c => 
        c.status === 'active' || c.status === 'Active'
      ).length,
      expiring_soon: displayCertificates.filter(c => 
        c.status?.toLowerCase() === 'expiring soon'
      ).length,
      expired: displayCertificates.filter(c => 
        c.status === 'expired' || c.status === 'Expired'
      ).length,
      renewal: displayCertificates.filter(c => 
        c.status === 'pending_renewal' || c.status === 'Renewal'
      ).length,
      revoked: displayCertificates.filter(c => 
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

  // getProductName is defined earlier (before displayCertificates) so it is available during render

  // Get application by ID
  const getApplication = (applicationId) => {
    if (!applicationId) return null;
    return applications.find(a => a._id === applicationId._id || a._id === applicationId);
  };

  // Handle company suggestion click
  const handleCompanySuggestionClick = (companyName) => {
    setFilter(prev => ({ ...prev, company: companyName }));
    setCompanySuggestions([]);
    setShowSuggestions(false);
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
          <div className="border-t border-gray-200 px-6 py-6 bg-gray-50">
            <div className="space-y-6">
              {/* Certificate Files Section */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Certificate Documents
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {selectedCertificate?.pdfPaths?.length > 0 ? (
                    selectedCertificate.pdfPaths.map((path, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-green-50 rounded-md">
                            <Award className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Certificate Part {selectedCertificate.pdfPaths.length > 1 ? index + 1 : ''}</p>
                            <p className="text-xs text-gray-500">Official Certification PDF</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDownloadCertificate(certId, path)}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-[#00853b] text-white text-xs font-medium rounded-md hover:bg-green-700 transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 mr-1" />
                          Download
                        </button>
                      </div>
                    ))
                  ) : (
                    /* Fallback for single path */
                    <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-50 rounded-md">
                          <Award className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Certificate Document</p>
                          <p className="text-xs text-gray-500">Official Certification PDF</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDownloadCertificate(certId)}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-[#00853b] text-white text-xs font-medium rounded-md hover:bg-green-700 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 mr-1" />
                        Download
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Labels Section */}
              {((selectedCertificate?.labelPaths?.length > 0) || selectedCertificate?.labelPath) && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <Tag className="w-4 h-4 mr-2" />
                    Product Labels
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {selectedCertificate?.labelPaths?.length > 0 ? (
                      selectedCertificate.labelPaths.map((path, index) => (
                        <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-50 rounded-md">
                              <Tag className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Label Part {selectedCertificate.labelPaths.length > 1 ? index + 1 : ''}</p>
                              <p className="text-xs text-gray-500">Approved labeling guidelines</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleDownloadLabel(certId, path)}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 mr-1" />
                            Download
                          </button>
                        </div>
                      ))
                    ) : (
                      selectedCertificate?.labelPath && (
                        <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-50 rounded-md">
                              <Tag className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Label Document</p>
                              <p className="text-xs text-gray-500">Approved labeling guidelines</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleDownloadLabel(certId)}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 mr-1" />
                            Download
                          </button>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end">
                <button
                  onClick={closeModal}
                  className="px-6 py-2 cursor-pointer text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg font-semibold transition-colors duration-200 border border-gray-300 shadow-sm"
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
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
            
            <div className="relative" ref={companySearchRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by company name or reg no..."
                  className="pl-10 pr-9 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#00853b] focus:ring-1 focus:ring-[#00853b] transition-colors"
                  value={filter.company}
                  onChange={(e) => {
                    setFilter({ ...filter, company: e.target.value });
                    setShowSuggestions(true);
                  }}
                  onFocus={() => {
                    if (filter.company || companySuggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setShowSuggestions(false);
                    }
                  }}
                  disabled={isLoading}
                  autoComplete="off"
                />
                {filter.company && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilter({ ...filter, company: '' });
                      setCompanySuggestions([]);
                      setShowSuggestions(false);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-0.5 rounded cursor-pointer transition-colors"
                    title="Clear company search"
                    tabIndex={-1}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {showSuggestions && filter.company.trim().length > 0 && (
                  <div className="absolute z-30 w-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-gray-100 animate-in fade-in duration-150">
                    {companySuggestions.length > 0 ? (
                      companySuggestions.map((company) => (
                        <button
                          key={company._id || company.companyName}
                          type="button"
                          className="w-full cursor-pointer text-left px-3.5 py-2.5 hover:bg-emerald-50/70 transition-colors flex items-center justify-between group"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleCompanySuggestionClick(company.companyName);
                          }}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                            <div className="w-7 h-7 rounded-lg bg-gray-100 group-hover:bg-[#00853b]/10 flex items-center justify-center shrink-0 transition-colors">
                              <Building className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#00853b] transition-colors" />
                            </div>
                            <div className="truncate">
                              <div className="font-medium text-gray-900 text-sm group-hover:text-[#00853b] transition-colors truncate">
                                {company.companyName}
                              </div>
                              {company.email && (
                                <div className="text-xs text-gray-500 truncate">{company.email}</div>
                              )}
                            </div>
                          </div>
                          {company.registrationNo && (
                            <span className="shrink-0 text-xs font-mono font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200 group-hover:border-emerald-200 group-hover:bg-emerald-50 group-hover:text-emerald-800 transition-colors">
                              {company.registrationNo}
                            </span>
                          )}
                        </button>
                      ))
                    ) : filter.company.trim().length >= 2 ? (
                      <div className="px-4 py-3 text-xs text-gray-500 text-center">
                        No companies found matching &ldquo;{filter.company}&rdquo;
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
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
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
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
                  setShowSuggestions(false);
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
                      <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manufacturing Facility</th>
                      <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                      {/* <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th> */}
                      <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                      <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                      <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedCertificates.length > 0 ? (
                      paginatedCertificates.map((cert) => {
                        const certId = cert.id || cert._id;
                        const statusConfig = getStatusConfig(cert.status);
                        const expiryStatus = getExpiryStatus(cert.expiryDate, cert.status);
                        const StatusIcon = statusConfig.icon;
                        const companyName = getCompanyNameFromCert(cert) || cert?.companyName || 'N/A';

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
                                {cert.branchId?.branchName || 'N/A'}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="text-sm font-medium text-gray-900">
                                {companyName}
                              </div>
                            </td>
                            {/* <td className="p-4">
                              <div className="text-sm font-medium text-gray-900">
                                {productName}
                              </div>
                              {cert.standard && (
                                <div className="text-xs text-gray-500">{cert.standard}</div>
                              )}
                            </td> */}
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
                                    onClick: () => handleDownloadCertificate(cert._id)
                                  },
                                  (cert.labelPath || (cert.labelPaths && cert.labelPaths.length > 0)) && {
                                    label: 'Download Label',
                                    icon: Tag,
                                    onClick: () => handleDownloadLabel(cert._id, cert.labelPaths ? cert.labelPaths[0] : cert.labelPath)
                                  },
                                  (cert.status?.toLowerCase() === 'expired' || cert.status?.toLowerCase() === 'expiring soon') && {
                                    label: isRemindingId === cert._id ? 'Sending...' : 'Send Reminder',
                                    icon: Mail,
                                    onClick: () => handleSendReminder(cert._id),
                                    disabled: isRemindingId === cert._id
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
              
              {/* Table Footer / Pagination */}
              {filteredCertificates.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-sm text-gray-600 font-medium">
                      Showing <span className="font-semibold text-gray-900">{Math.min(filteredCertificates.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredCertificates.length, currentPage * itemsPerPage)}</span> of{' '}
                      <span className="font-semibold text-gray-900">{filteredCertificates.length}</span> certificates
                    </div>
                    {totalPages > 1 && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-white bg-gray-100 border border-gray-200 shadow-sm rounded-lg transition-colors duration-200 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <span className="text-sm text-gray-600 px-2 font-medium">Page {currentPage} of {totalPages}</span>
                        <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-white bg-gray-100 border border-gray-200 shadow-sm rounded-lg transition-colors duration-200 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    )}
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