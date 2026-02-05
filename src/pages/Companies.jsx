import { useEffect, useState } from 'react';
import { Search, Building2, Package, Users, XCircle, CheckCircle, Filter, RefreshCw, AlertCircle, Mail, Phone, Calendar } from 'lucide-react';
import { useAll } from '../hooks/useAll';

const Companies = () => {
  const controller = new AbortController()
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { fetchCompanies, companies, isLoading, errors } = useAll();

  useEffect(() => {
    fetchCompanies();

    return () => controller.abort()
  }, []);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCompanies();
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

  // Get approval rate
  const getApprovalRate = (company) => {
    if (!company.totalProducts || company.totalProducts === 0) return 0;
    return Math.round((company.approvedProducts / company.totalProducts) * 100);
  };

  // Filter companies
  const filteredCompanies = companies.filter(company => {
    // Search filter
    if (searchTerm && 
        !company.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !company.registrationNo?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !company.email?.toLowerCase().includes(searchTerm.toLowerCase()))  {
      return false;
    }

    // Tab filter
    switch (activeTab) {
      case 'all':
        return true;
      case 'non-approved':
        return company.approvedProducts === 0 || !company.approvedProducts;
      case 'lists':
        return company.approvedProducts > 0;
      case 'applications':
        return company.totalApplications > 0;
      default:
        return true;
    }
  });

  // Calculate tab counts
  const getTabCounts = () => {
    return {
      all: companies.length,
      'non-approved': companies.filter(c => c.approvedProducts === 0 || !c.approvedProducts).length,
      lists: companies.filter(c => c.approvedProducts > 0).length,
      applications: companies.filter(c => c.totalApplications > 0).length,
    };
  };

  const tabCounts = getTabCounts();

  const tabs = [
    { id: 'all', label: 'All Companies', count: tabCounts.all },
    { id: 'lists', label: 'With Approved Products', count: tabCounts.lists },
    { id: 'non-approved', label: 'No Approved Products', count: tabCounts['non-approved'] },
    { id: 'applications', label: 'Has Applications', count: tabCounts.applications },
  ];

  return (
    <div className="p-4 lg:p-8 pt-20 lg:pt-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Companies</h1>
            <p className="text-gray-600 mt-1">
              {companies.length} registered companies • {companies.filter(c => c.approvedProducts > 0).length} with approved products
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
              className="flex items-center gap-2 px-4 py-2.5 bg-[#00853b] text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-xl bg-gray-200"></div>
                    <div className="ml-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
                <div className="h-2 bg-gray-200 rounded-full"></div>
                <div className="flex justify-between">
                  <div className="h-6 bg-gray-200 rounded w-24"></div>
                  <div className="h-6 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Companies Grid */}
      {!isLoading && !isRefreshing && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {filteredCompanies.map((company) => (
              <div key={company.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden group hover:-translate-y-1">
                <div className="p-6">
                  {/* Company Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-xl bg-[#00853b]/10 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-[#00853b]" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-bold text-gray-900 truncate max-w-[150px]" title={company.companyName}>
                          {company.companyName || 'Unknown Company'}
                        </h3>
                        <p className="text-sm text-gray-600 truncate max-w-[150px]" title={company.email}>
                          {company.email || 'No email'}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      company.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {company.status || 'Active'}
                    </span>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-3 mb-6">
                    {company.phone && company.phone !== 'No phone' && (
                      <div className="flex items-center text-gray-600">
                        <Phone className="w-4 h-4 mr-3 text-gray-400 flex-shrink-0" />
                        <span className="text-sm truncate" title={company.phone}>
                          {company.phone}
                        </span>
                      </div>
                    )}
                    {company.email && company.email !== 'No email' && (
                      <div className="flex items-center text-gray-600">
                        <Mail className="w-4 h-4 mr-3 text-gray-400 flex-shrink-0" />
                        <span className="text-sm truncate" title={company.email}>
                          {company.email}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-3 text-gray-400 flex-shrink-0" />
                      <span className="text-sm">
                        Registered: {formatDate(company.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="pt-6 border-t border-gray-200">
                    {/* Applications */}
                    {company.totalApplications > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">Applications</span>
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {company.approvedApplications || 0} / {company.totalApplications}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${company.totalApplications > 0 ? ((company.approvedApplications || 0) / company.totalApplications) * 100 : 0}%` 
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Product Stats */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Package className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">Products</span>
                        </div>
                        <div className="flex items-center">
                          {company.approvedProducts > 0 ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                              <span className="text-sm font-medium text-green-600">
                                {getApprovalRate(company)}% approved
                              </span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 mr-1 text-yellow-500" />
                              <span className="text-sm font-medium text-yellow-600">
                                No approved products
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div 
                          className="bg-[#00853b] h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${getApprovalRate(company)}%` }}
                        />
                      </div>
                      
                      {/* Stats */}
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Approved: {company.approvedProducts || 0}</span>
                        <span>Total: {company.totalProducts || 0}</span>
                      </div>
                    </div>

                    {/* Additional Stats */}
                    {(company.totalApplications > 0 || company.totalCertificates > 0) && (
                      <div className="flex justify-between text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                        {company.totalApplications > 0 && (
                          <span>{company.totalApplications} applications</span>
                        )}
                        {company.totalCertificates > 0 && (
                          <span>{company.totalCertificates} certificates</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between mt-6 pt-6 border-t border-gray-200">
                    <button 
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                      onClick={() => {
                        // Navigate to company details
                        console.log('View details for:', company.companyName);
                      }}
                    >
                      View Details
                    </button>
                    <button 
                      className="px-4 py-2 bg-[#00853b] text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors duration-200"
                      onClick={() => {
                        // Navigate to manage products
                        console.log('Manage products for:', company.companyName);
                      }}
                    >
                      View Activities
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredCompanies.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm 
                  ? 'Try adjusting your search term' 
                  : activeTab !== 'all' 
                    ? `No companies match the "${tabs.find(t => t.id === activeTab)?.label}" filter`
                    : 'No companies registered yet'}
              </p>
              <button 
                onClick={() => { setSearchTerm(''); setActiveTab('all'); }}
                className="px-4 py-2 text-sm font-medium text-[#00853b] hover:text-green-700"
              >
                Clear filters
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Companies;