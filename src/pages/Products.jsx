import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
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
  Building,
  Package,
  Info,
  ExternalLink,
  Edit,
  Trash2
} from 'lucide-react';
import { useAll } from '../hooks/useAll';
import { toast } from 'sonner';

const Products = () => {
  const controller = new AbortController()
  const [filter, setFilter] = useState({
    name: '',
    company: '',
    dateFrom: '',
    dateTo: '',
    status: '',
  });

  const [activeTab, setActiveTab] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const { 
    products, 
    isLoading, 
    errors,
    fetchProducts,
    approveProduct,
    rejectProduct,
    deleteProduct,
    getProductById,
    companies
  } = useAll();

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
    
    return () => controller.abort()
  }, []);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchProducts();
    setIsRefreshing(false);
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    // Tab filter
    switch (activeTab) {
      case 'all':
        break;
      case 'pending':
        return product.status === 'pending' || product.status === 'Pending';
      case 'approved':
        return product.status === 'approved' || product.status === 'Approved';
      case 'rejected':
        return product.status === 'rejected' || product.status === 'Rejected';
      default:
        break;
    }

    // Custom filter
    if (filter.name && !product.name?.toLowerCase().includes(filter.name.toLowerCase())) {
      return false;
    }
    if (filter.company && !product.companyName?.toLowerCase().includes(filter.company.toLowerCase()) && 
        !product.company?.toLowerCase().includes(filter.company.toLowerCase())) {
      return false;
    }
    if (filter.dateFrom && product.createdAt && new Date(product.createdAt) < new Date(filter.dateFrom)) {
      return false;
    }
    if (filter.dateTo && product.createdAt && new Date(product.createdAt) > new Date(filter.dateTo)) {
      return false;
    }
    if (filter.status && product.status !== filter.status) {
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

  // Handle Approve Product
  const handleApproveProduct = async (productId, reason = "") => {
    try {
      await approveProduct(productId, reason);
      toast.success("Product approved successfully!");
      
      // Update local state if modal is open
      if (selectedProduct && selectedProduct.id === productId) {
        setSelectedProduct(prev => ({
          ...prev,
          status: 'approved'
        }));
      }
      
      fetchProducts();
    } catch (error) {
      toast.error("Failed to approve product");
      console.log(error)
    }
  };

  const handleRejectProduct = async (productId) => {
    const reason = prompt("Enter rejection reason:");
    if (reason) {
      try {
        await rejectProduct(productId, reason);
        toast.success("Product rejected!");
        
        // Update local state if modal is open
        if (selectedProduct && selectedProduct.id === productId) {
          setSelectedProduct(prev => ({
            ...prev,
            status: 'rejected',
            rejectionReason: reason
          }));
        }
        
        fetchProducts();
      } catch (error) {
        toast.error("Failed to reject product");
        console.log(error)
      }
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(productId);
        toast.success("Product deleted!");
        
        // Close modal if the deleted product is open
        if (selectedProduct && selectedProduct.id === productId) {
          setIsViewModalOpen(false);
          setSelectedProduct(null);
        }
        
        fetchProducts();
      } catch (error) {
        toast.error("Failed to delete product");
        console.log(error)
      }
    }
  };

  const handleViewDetails = async (productId) => {
    setIsLoadingDetails(true);
    try {
      const product = await getProductById(productId);
      if (product) {
        setSelectedProduct(product);
        setIsViewModalOpen(true);
      } else {
        toast.error("Failed to load product details");
      }
    } catch (error) {
      toast.error("Failed to load product details");
      console.log(error)
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Handle bulk selection
  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(product => product.id || product._id));
    }
  };

  const toggleSelectProduct = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) {
      toast.warning("No products selected");
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedProducts.length} selected products?`)) {
      try {
        const deletePromises = selectedProducts.map(id => deleteProduct(id));
        await Promise.all(deletePromises);
        setSelectedProducts([]);
        toast.success(`${selectedProducts.length} products deleted successfully!`);
        fetchProducts();
      } catch (error) {
        toast.error("Failed to delete some products");
        console.log(error)
      }
    }
  };

  // Handle bulk approve
  const handleBulkApprove = async () => {
    if (selectedProducts.length === 0) {
      toast.warning("No products selected");
      return;
    }

    // Filter only pending products
    const pendingProducts = selectedProducts.filter(productId => {
      const product = products.find(p => p.id === productId || p._id === productId);
      return product && (product.status.toLowerCase() === 'pending' || product.status.toLowerCase() === 'requested');
    });

    if (pendingProducts.length === 0) {
      toast.warning("No pending products selected");
      return;
    }

    console.log(pendingProducts);
    

    if (window.confirm(`Are you sure you want to approve ${pendingProducts.length} selected products?`)) {
      try {
        const approvePromises = pendingProducts.map(id => approveProduct(id));
        await Promise.all(approvePromises);
        setSelectedProducts([]);
        
        // toast.success(`${pendingProducts.length} products approved successfully!`);
        fetchProducts();
      } catch (error) {
        toast.error("Failed to approve some products");
        console.log(error);
        
      }
    }
  };

  // Calculate tab counts
  const getTabCounts = () => {
    return {
      all: products.length,
      pending: products.filter(p => 
        p.status === 'pending' || p.status === 'Pending'
      ).length,
      approved: products.filter(p => 
        p.status === 'approved' || p.status === 'Approved'
      ).length,
      rejected: products.filter(p => 
        p.status === 'rejected' || p.status === 'Rejected'
      ).length,
    };
  };

  const tabCounts = getTabCounts();

  const tabs = [
    { id: 'all', label: 'All Products', count: tabCounts.all },
    { id: 'pending', label: 'Pending', count: tabCounts.pending },
    { id: 'approved', label: 'Approved', count: tabCounts.approved },
    { id: 'rejected', label: 'Rejected', count: tabCounts.rejected },
  ];

  // Get status badge configuration
  const getStatusConfig = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'pending':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock };
      case 'approved':
        return { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle };
      case 'rejected':
        return { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', icon: Clock };
    }
  };

  // Get company name by ID
  const getCompanyName = (companyId) => {
    if (!companyId) return 'Unknown Company';
    const company = companies.find(c => c.id === companyId || c._id === companyId);
    return company?.companyName || company?.name || 'Unknown Company';
  };

  // Close modal
  const closeModal = () => {
    setIsViewModalOpen(false);
    setSelectedProduct(null);
  };

  // View Modal Component
  const ViewProductModal = () => {
    if (!selectedProduct) return null;

    const statusConfig = getStatusConfig(selectedProduct.status);
    const StatusIcon = statusConfig.icon;
    const productId = selectedProduct.id || selectedProduct._id;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Modal Header */}
          <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedProduct.name || 'Unnamed Product'}
                </h2>
                <p className="text-sm text-gray-600">
                  Product ID: #{productId?.slice(-8)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                <StatusIcon className="w-4 h-4 mr-1" />
                {selectedProduct?.status?.charAt(0).toUpperCase() + selectedProduct?.status?.slice(1) || 'Unknown'}
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
              {/* Product Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
                        {selectedProduct.name || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Product Description</p>
                      <p className="font-medium text-gray-900">
                        {selectedProduct.description || 'No description provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Product Market Type</p>
                      <p className="font-medium text-gray-900">
                        {selectedProduct.marketType || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Product Code</p>
                      <p className="font-medium text-gray-900">
                        {selectedProduct?._id.slice(-8) || 'N/A'}
                      </p>
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
                        {getCompanyName(selectedProduct?.companyId) || selectedProduct?.companyName || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Company Address</p>
                      <p className="font-medium text-gray-900">
                        {selectedProduct?.address || 'N/A'}
                      </p>
                    </div>
                    {selectedProduct.companyWebsite && (
                      <div>
                        <p className="text-sm text-gray-600">Website</p>
                        <a 
                          href={selectedProduct.companyWebsite} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          {selectedProduct.companyWebsite}
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Technical Specifications */}
                <div className="bg-gray-50 rounded-lg p-5">
                  <div className="flex items-center mb-4">
                    <Info className="w-5 h-5 text-gray-500 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Technical Specifications</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Model Number</p>
                      <p className="font-medium text-gray-900">
                        {selectedProduct.modelNumber || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Manufacturing Date</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(selectedProduct.manufacturingDate) || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Expiry Date</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(selectedProduct.expiryDate) || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Batch Number</p>
                      <p className="font-medium text-gray-900">
                        {selectedProduct.batchNumber || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submission Details */}
                <div className="bg-gray-50 rounded-lg p-5">
                  <div className="flex items-center mb-4">
                    <Info className="w-5 h-5 text-gray-500 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Submission Details</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Product ID</p>
                      <p className="font-medium text-gray-900">
                        {productId || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Submission Date</p>
                      <p className="font-medium text-gray-900">
                        {formatDateTime(selectedProduct.createdAt || selectedProduct.submissionDate)}
                      </p>
                    </div>
                    {selectedProduct.updatedAt && (
                      <div>
                        <p className="text-sm text-gray-600">Last Updated</p>
                        <p className="font-medium text-gray-900">
                          {formatDateTime(selectedProduct.updatedAt)}
                        </p>
                      </div>
                    )}
                    {selectedProduct.rejectionReason && (
                      <div>
                        <p className="text-sm text-red-600">Rejection Reason</p>
                        <p className="font-medium text-red-700">
                          {selectedProduct.rejectionReason}
                        </p>
                      </div>
                    )}
                    {selectedProduct.approvalNotes && (
                      <div>
                        <p className="text-sm text-green-600">Approval Notes</p>
                        <p className="font-medium text-green-700">
                          {selectedProduct.approvalNotes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Attached Documents */}
              {(selectedProduct.documents || selectedProduct.files) && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Attached Documents</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(selectedProduct.documents || selectedProduct.files || {}).map(([key, value]) => (
                      <div key={key} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200">
                        <div className="flex items-center">
                          <FileText className="w-5 h-5 text-gray-500 mr-3" />
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
              {selectedProduct.notes && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-gray-800">{selectedProduct.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {selectedProduct.status?.toLowerCase() === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApproveProduct(productId)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors duration-200 flex items-center"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Product
                    </button>
                    <button
                      onClick={() => handleRejectProduct(productId)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors duration-200 flex items-center"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Product
                    </button>
                  </>
                )}
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors duration-200 flex items-center"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Product
                </button>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg font-medium transition-colors duration-200"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDeleteProduct(productId)}
                  className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium transition-colors duration-200 flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Product
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
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-600 mt-1">Manage and review product submissions</p>
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
              New Product
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search product..."
                  className="pl-10 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#00853b] focus:ring-1 focus:ring-[#00853b]"
                  value={filter.name}
                  onChange={(e) => setFilter({ ...filter, name: e.target.value })}
                  disabled={isLoading}
                />
              </div>
            </div>
            
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
              {selectedProducts.length > 0 && (
                <span>{selectedProducts.length} products selected</span>
              )}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setFilter({ name: '', company: '', dateFrom: '', dateTo: '', status: '' })}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                disabled={isLoading}
              >
                Clear All Filters
              </button>
              {selectedProducts.length > 0 && (
                <>
                  <button
                    onClick={handleBulkApprove}
                    className="px-4 py-2 text-sm font-medium bg-[#00853b] text-white hover:bg-green-700 rounded-lg transition-colors duration-200"
                    disabled={isLoading}
                  >
                    Approve Selected
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

      {/* Products Table */}
      {!isLoading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] lg:min-w-0">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-[#00853b] focus:ring-[#00853b]"
                    />
                  </th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Market Type</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => {
                    const productId = product.id || product._id;
                    const statusConfig = getStatusConfig(product.status);
                    const StatusIcon = statusConfig.icon;

                    return (
                      <tr key={productId} className="hover:bg-gray-50">
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(productId)}
                            onChange={() => toggleSelectProduct(productId)}
                            className="rounded border-gray-300 text-[#00853b] focus:ring-[#00853b]"
                          />
                        </td>
                        <td className="p-4">
                          <div>
                            <div className="font-medium text-gray-900">{product.name || 'Unnamed Product'}</div>
                            <div className="text-sm text-gray-600">
                              {product?._id?.slice(-8) || 'No product code'}
                            </div>
                            {product.description && (
                              <div className="text-xs text-gray-500 truncate max-w-xs">
                                {product.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm font-medium text-gray-900">
                            {getCompanyName(product.companyId) || product.companyName || 'Unknown Company'}
                          </div>
                          {product.companyEmail && (
                            <div className="text-xs text-gray-500">{product.companyEmail}</div>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${product.marketType ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                            {product.marketType || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {product?.status?.charAt(0).toUpperCase() + product?.status?.slice(1) || 'Unknown'}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-500">
                          {formatDate(product?.createdAt || product?.submissionDate)}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handleViewDetails(productId)}
                              disabled={isLoadingDetails}
                              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            
                            {product.status?.toLowerCase() === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApproveProduct(productId)}
                                  className="px-3 py-1.5 bg-[#00853b] text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors duration-200"
                                  title="Approve Product"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectProduct(productId)}
                                  className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors duration-200"
                                  title="Reject Product"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            
                            <button
                              onClick={() => handleDeleteProduct(productId)}
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-500">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                      <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria</p>
                      <button 
                        onClick={() => { 
                          setFilter({ name: '', company: '', dateFrom: '', dateTo: '', status: '' });
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
          {filteredProducts.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-medium">{filteredProducts.length}</span> of{' '}
                  <span className="font-medium">{products.length}</span> products
                </div>
                <div className="flex items-center space-x-2">
                  {selectedProducts.length > 0 && (
                    <>
                      <button
                        onClick={handleBulkApprove}
                        className="px-3 py-1.5 text-sm font-medium bg-[#00853b] text-white hover:bg-green-700 rounded-lg transition-colors duration-200"
                      >
                        Approve Selected ({selectedProducts.length})
                      </button>
                      <button
                        onClick={handleBulkDelete}
                        className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      >
                        Delete Selected
                      </button>
                    </>
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

      {/* View Product Modal */}
      {isViewModalOpen && <ViewProductModal />}
    </div>
  );
};

export default Products;