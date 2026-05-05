import { useEffect, useState } from 'react';
import { Search, Building2, Package, Users, XCircle, CheckCircle, Filter, RefreshCw, AlertCircle, Mail, Phone, Calendar, MoreVertical, Eye, Activity } from 'lucide-react';
import { useAll } from '../hooks/useAll';
import TableActions from '../components/TableActions';

const Companies = () => {
  const controller = new AbortController()
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
 
  const { fetchCompanies, fetchProducts, fetchCertificates, fetchApplications, companies, isLoading, errors, products, applications } = useAll();

  // Reset pagination when search or tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab]);

  useEffect(() => {
    fetchCompanies();

    return () => controller.abort()
  }, []);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchCompanies(),
      fetchProducts(),
      fetchCertificates(),
      fetchApplications()
    ]);
    setIsRefreshing(false);
  };

  // Format date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Unknown';
    }
  };

  // Get company stats (calculated dynamically)
  const getCompanyStats = (registrationNo) => {
    if (!registrationNo) return { totalApps: 0, approvedApps: 0, totalProds: 0, approvedProds: 0 };
    
    const regLower = registrationNo.toLowerCase();
    const companyApps = applications?.filter(a => a.companyId?.toLowerCase() === regLower) || [];
    const companyProds = products?.filter(p => p.companyId?.toLowerCase() === regLower) || [];
    
    return {
      totalApps: companyApps.length,
      approvedApps: companyApps.filter(a => ['Issued', 'Accepted', 'Successful'].includes(a.status)).length,
      totalProds: companyProds.length,
      approvedProds: companyProds.filter(p => p.status === 'approved' || p.status === 'Approved' || p.status === 'registered').length
    };
  };

  // Get approval rate
  const getApprovalRate = (company) => {
    const stats = getCompanyStats(company.registrationNo);
    if (!stats.totalProds || stats.totalProds === 0) return 0;
    return Math.round((stats.approvedProds / stats.totalProds) * 100);
  };

  // Filter companies
  const filteredCompanies = companies.filter(company => {
    // Search filter
    if (searchTerm && 
        !company.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !company.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !company.registrationNo?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !company.email?.toLowerCase().includes(searchTerm.toLowerCase()))  {
      return false;
    }

    // Tab filter
    const stats = getCompanyStats(company.registrationNo);
    switch (activeTab) {
      case 'all':
        return true;
      case 'non-approved':
        return stats.approvedProds === 0;
      case 'lists':
        return stats.approvedProds > 0;
      case 'applications':
        return stats.totalApps > 0;
      default:
        return true;
    }
  });

  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage) || 1;
  const paginatedCompanies = filteredCompanies.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Handle View Details
  const handleViewDetails = (company) => {
    setSelectedCompany(company);
    setIsViewModalOpen(true);
  };

  // Calculate tab counts
  const getTabCounts = () => {
    return {
      all: companies.length,
      'non-approved': companies.filter(c => {
         const stats = getCompanyStats(c.registrationNo);
         return stats.approvedProds === 0;
      }).length,
      lists: companies.filter(c => {
         const stats = getCompanyStats(c.registrationNo);
         return stats.approvedProds > 0;
      }).length,
      applications: companies.filter(c => {
         const stats = getCompanyStats(c.registrationNo);
         return stats.totalApps > 0;
      }).length,
    };
  };

  const tabCounts = getTabCounts();

  const tabs = [
    { id: 'all', label: 'All Companies', count: tabCounts.all },
    { id: 'lists', label: 'With Approved Products', count: tabCounts.lists },
    { id: 'non-approved', label: 'No Approved Products', count: tabCounts['non-approved'] },
    { id: 'applications', label: 'Has Applications', count: tabCounts.applications },
  ];

  // View Modal Component
  const ViewCompanyModal = () => {
    if (!selectedCompany) return null;

    // Get company specific products and applications if they are loaded in AllProvider
    const stats = getCompanyStats(selectedCompany.registrationNo);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Modal Header */}
          <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#00853b]/10 rounded-lg">
                <Building2 className="w-6 h-6 text-[#00853b]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedCompany.companyName || 'Unknown Company'}
                </h2>
                <p className="text-sm text-gray-600">
                  Reg No: {selectedCompany.registrationNo || 'N/A'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsViewModalOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <XCircle className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="bg-gray-50 rounded-lg p-5">
                  <div className="flex items-center mb-4 border-b border-gray-200 pb-2">
                    <Users className="w-5 h-5 text-gray-500 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Primary Contact</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Contact Person</p>
                      <p className="text-gray-900">{selectedCompany.fullName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Email Address</p>
                      <p className="text-gray-900 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {selectedCompany.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Phone Number</p>
                      <p className="text-gray-900 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {selectedCompany.phone || selectedCompany.contact || 'N/A'}
                      </p>
                    </div>
                    {selectedCompany.website && (
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Website</p>
                        <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="text-[#00853b] hover:underline flex items-center gap-2 text-sm">
                          <Activity className="w-4 h-4" />
                          {selectedCompany.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Address Details */}
                <div className="bg-gray-50 rounded-lg p-5">
                  <div className="flex items-center mb-4 border-b border-gray-200 pb-2">
                    <Activity className="w-5 h-5 text-gray-500 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Address & Location</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Physical Address</p>
                      <p className="text-gray-900">{selectedCompany.address || 'N/A'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 font-medium">LGA</p>
                        <p className="text-gray-900">{selectedCompany.lga || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">City</p>
                        <p className="text-gray-900">{selectedCompany.city || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">State</p>
                        <p className="text-gray-900">{selectedCompany.state || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Country</p>
                        <p className="text-gray-900">{selectedCompany.country || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Engagement Statistics */}
                <div className="bg-gray-50 rounded-lg p-5 md:col-span-2">
                  <div className="flex items-center mb-4 border-b border-gray-200 pb-2">
                    <Activity className="w-5 h-5 text-gray-500 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Certification Overview</h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
                      <p className="text-2xl font-bold text-gray-900">{stats.totalApps}</p>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Total Apps</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
                      <p className="text-2xl font-bold text-[#00853b]">{stats.approvedApps}</p>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Approved Apps</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
                      <p className="text-2xl font-bold text-gray-900">{stats.totalProds}</p>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Total Products</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
                      <p className="text-2xl font-bold text-[#00853b]">{stats.approvedProds}</p>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Approved Products</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end">
            <button
              onClick={() => setIsViewModalOpen(false)}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium transition-colors duration-200"
            >
              Close
            </button>
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
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Companies</h1>
            <p className="text-gray-600 mt-1">
              {companies.length} registered companies • {companies.filter(c => getCompanyStats(c.registrationNo).approvedProds > 0).length} with approved products
            </p>
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
              className="flex items-center gap-2 px-4 py-2.5 bg-[#00853b] text-white rounded-lg hover:bg-green-700 cursor-pointer transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
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

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search companies by name, registration number or email..."
            className="pl-10 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#00853b] focus:ring-1 focus:ring-[#00853b] disabled:opacity-50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Loading State */}
      {(isLoading || isRefreshing) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-gray-50">
                <tr>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <th key={i} className="p-4"><div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div></th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}>
                    {[1, 2, 3, 4, 5, 6].map((j) => (
                      <td key={j} className="p-4"><div className="h-8 bg-gray-100 rounded w-full animate-pulse"></div></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Companies Grid */}
      {!isLoading && !isRefreshing && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Info</th>
                  <th className="p-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Stats</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedCompanies.length > 0 ? (
                  paginatedCompanies.map((company) => (
                    <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-lg bg-[#00853b]/10 flex items-center justify-center shrink-0">
                            <Building2 className="w-5 h-5 text-[#00853b]" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-bold text-gray-900">{company.companyName || 'Unknown'}</div>
                            <div className="text-xs text-gray-500">Registered: {formatDate(company.createdAt)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-900 font-medium">
                        {company.registrationNo || 'N/A'}
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-xs text-gray-600">
                            <Mail className="w-3.5 h-3.5 mr-2 text-gray-400" />
                            {company.email}
                          </div>
                          {company.phone && company.phone !== 'No phone' && (
                            <div className="flex items-center text-xs text-gray-600">
                              <Phone className="w-3.5 h-3.5 mr-2 text-gray-400" />
                              {company.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {(() => {
                           const stats = getCompanyStats(company.registrationNo);
                           return (
                             <div className="flex items-center justify-center gap-4">
                               <div className="text-center" title="Applications (Approved / Total)">
                                 <div className="text-sm font-semibold text-gray-900">{stats.approvedApps}/{stats.totalApps}</div>
                                 <div className="text-[10px] text-gray-500 uppercase">Apps</div>
                               </div>
                               <div className="text-center" title="Products (Approved / Total)">
                                 <div className="text-sm font-semibold text-[#00853b]">{stats.approvedProds}/{stats.totalProds}</div>
                                 <div className="text-[10px] text-gray-500 uppercase">Products</div>
                               </div>
                             </div>
                           );
                        })()}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          company.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {company.status === 'Active' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {company.status || 'Active'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <TableActions 
                          actions={[
                            {
                              label: 'View Details',
                              icon: Eye,
                              onClick: () => handleViewDetails(company)
                            },
                            {
                              label: 'View Activities',
                              icon: Activity,
                              onClick: () => console.log('Manage products for:', company.companyName)
                            }
                          ]}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-12 text-center">
                      <div className="flex flex-col items-center">
                        <Building2 className="w-12 h-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No companies found</h3>
                        <p className="text-gray-500 mb-4">Try adjusting your search term or filters</p>
                        <button 
                          onClick={() => { setSearchTerm(''); setActiveTab('all'); }}
                          className="text-sm font-medium text-[#00853b] hover:text-green-700 underline"
                        >
                          Clear all filters
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Table Footer / Pagination */}
          {filteredCompanies.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-sm text-gray-600 font-medium">
                  Showing <span className="font-bold text-gray-900">{Math.min(filteredCompanies.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredCompanies.length, currentPage * itemsPerPage)}</span> of{' '}
                  <span className="font-bold text-gray-900">{filteredCompanies.length}</span> companies
                </div>
                
                {totalPages > 1 && (
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-white hover:text-[#00853b] bg-gray-100 border border-gray-200 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      Previous
                    </button>
                    <div className="px-3 py-1.5 text-sm font-semibold text-white bg-[#00853b] rounded-lg shadow-sm">
                      Page {currentPage} of {totalPages}
                    </div>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-white hover:text-[#00853b] bg-gray-100 border border-gray-200 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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

      {/* View Company Modal */}
      {isViewModalOpen && <ViewCompanyModal />}
    </div>
  );
};

export default Companies;