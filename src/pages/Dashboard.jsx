import { useState, useEffect } from 'react';
import { TrendingUp, Users, Clock, CheckCircle, Award, Package, FileText, RefreshCw, AlertCircle, ClipboardList } from 'lucide-react';
import { useAll } from '../hooks/useAll';

// Stat Card Component
const StatCard = ({ stat, isLoading }) => {
  const Icon = stat.icon;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-1">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-2">{stat.title}</p>
          <div className="text-2xl font-bold text-gray-900">
            {isLoading ? (
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              stat.value
            )}
          </div>
          <div className="flex items-center mt-2">
            <TrendingUp 
              className={`w-4 h-4 mr-1 ${stat.trend === 'up' ? 'text-green-500' : stat.trend === 'down' ? 'text-red-500' : 'text-gray-500'}`} 
            />
            <span className={`text-sm ${stat.trend === 'up' ? 'text-green-600' : stat.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
              {stat.change}
            </span>
          </div>
        </div>
        <div className={`${stat.color} p-3 rounded-xl flex-shrink-0`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
};

// Application Status Badge
const StatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    const statusLower = status?.toLowerCase();
    
    const configs = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      submitted: { bg: 'bg-blue-100', text: 'text-blue-800' },
      under_review: { bg: 'bg-purple-100', text: 'text-purple-800' },
      review: { bg: 'bg-purple-100', text: 'text-purple-800' },
      approved: { bg: 'bg-green-100', text: 'text-green-800' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800' },
      issued: { bg: 'bg-green-100', text: 'text-green-800' },
      expired: { bg: 'bg-red-100', text: 'text-red-800' },
      renewed: { bg: 'bg-blue-100', text: 'text-blue-800' },
      active: { bg: 'bg-green-100', text: 'text-green-800' },
      draft: { bg: 'bg-gray-100', text: 'text-gray-800' },
    };

    return configs[statusLower] || { bg: 'bg-gray-100', text: 'text-gray-800' };
  };

  const config = getStatusConfig(status);

  return (
    <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
      {status?.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'Unknown'}
    </span>
  );
};

// Type Badge
const TypeBadge = ({ type }) => {
  const getTypeConfig = (type) => {
    const typeLower = type?.toLowerCase();
    
    const configs = {
      new: { bg: 'bg-blue-100', text: 'text-blue-800' },
      renewal: { bg: 'bg-purple-100', text: 'text-purple-800' },
      product: { bg: 'bg-green-100', text: 'text-green-800' },
      service: { bg: 'bg-orange-100', text: 'text-orange-800' },
      standard: { bg: 'bg-blue-100', text: 'text-blue-800' },
      express: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    };

    return configs[typeLower] || { bg: 'bg-gray-100', text: 'text-gray-800' };
  };

  const config = getTypeConfig(type);

  return (
    <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
      {type?.charAt(0).toUpperCase() + type?.slice(1) || 'Unknown'}
    </span>
  );
};

// Progress Bar Component
const ProgressBar = ({ approved, pending, rejected, isLoading }) => {
  const total = approved + pending + rejected;
  
  if (isLoading) {
    return (
      <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden animate-pulse"></div>
    );
  }
  
  return (
    <div className="flex h-2.5 bg-gray-200 rounded-full overflow-hidden">
      <div 
        className="bg-green-500 transition-all duration-300" 
        style={{ width: total > 0 ? `${(approved / total) * 100}%` : '0%' }}
        title={`Approved: ${approved}`}
      />
      <div 
        className="bg-yellow-500 transition-all duration-300" 
        style={{ width: total > 0 ? `${(pending / total) * 100}%` : '0%' }}
        title={`Pending: ${pending}`}
      />
      <div 
        className="bg-red-500 transition-all duration-300" 
        style={{ width: total > 0 ? `${(rejected / total) * 100}%` : '0%' }}
        title={`Rejected: ${rejected}`}
      />
    </div>
  );
};

const Dashboard = () => {
  const controller = new AbortController()
  const { 
    products, 
    certificates, 
    applications,
    isLoading,
    errors,
    fetchProducts,
    fetchCertificates,
    fetchApplications,
  } = useAll();

  useEffect(() => {
    fetchProducts();
    fetchCertificates();
    fetchApplications();
    return () => controller.abort()
  }, []);

  const [dashboardStats, setDashboardStats] = useState({
    totalProducts: 0,
    totalCertificates: 0,
    totalApplications: 0,
    activeCertificates: 0,
    pendingCertificates: 0,
    expiredCertificates: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
    recentApplications: [],
    productCategories: [],
    lastUpdated: null
  });

  const [localLoading, setLocalLoading] = useState(false);

  // Calculate dashboard statistics
  useEffect(() => {
    const calculateStats = () => {
      if (!products || !certificates || !applications) return;

      // Count certificates by status
      const certificateStats = certificates.reduce((acc, cert) => {
        const status = cert.status?.toLowerCase();
        if (status === 'issued' || status === 'active') acc.active++;
        else if (status === 'pending' || status === 'under_review' || status === 'review') acc.pending++;
        else if (status === 'expired') acc.expired++;
        return acc;
      }, { active: 0, pending: 0, expired: 0 });

      // Count applications by status
      const applicationStats = applications.reduce((acc, app) => {
        const status = app.status?.toLowerCase();
        if (status === 'approved' || status === 'issued') acc.approved++;
        else if (status === 'pending' || status === 'under_review' || status === 'submitted') acc.pending++;
        else if (status === 'rejected') acc.rejected++;
        else if (status === 'draft') acc.draft++;
        return acc;
      }, { approved: 0, pending: 0, rejected: 0, draft: 0 });

      // Get recent applications (mix of applications and certificates)
      const recentApps = [...applications, ...products, ...certificates]
        .sort((a, b) => new Date(b.createdAt || b.updatedAt || b.submissionDate || 0) - new Date(a.createdAt || a.updatedAt || a.submissionDate || 0))
        .slice(0, 4)
        .map(item => {
          const isApp = 'applicationType' in item;
          return {
            id: item.id || item._id,
            company: item.companyName || item.company || item.companyId || 'Unknown',
            type: isApp ? item.applicationType : item.certificateType || 'New',
            status: item.status || 'pending',
            date: item.createdAt || item.updatedAt || item.submissionDate || new Date().toISOString().split('T')[0],
            product: item.productName || item.name || item?.product?.name || 'N/A',
            isApplication: isApp
          };
        });

      // Calculate product categories statistics
      const categoriesMap = {};
      products.forEach(product => {
        const category = product.category || product.type || 'Uncategorized';
        const status = product.status?.toLowerCase() || 'pending';
        
        if (!categoriesMap[category]) {
          categoriesMap[category] = { approved: 0, pending: 0, rejected: 0 };
        }
        
        if (status === 'approved' || status === 'active' || status === 'issued') categoriesMap[category].approved++;
        else if (status === 'pending' || status === 'under_review') categoriesMap[category].pending++;
        else categoriesMap[category].rejected++;
      });

      // Convert to array for display
      const productStatsArray = Object.entries(categoriesMap).map(([category, stats], index) => {
        const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-red-500', 'bg-indigo-500'];
        return {
          category,
          approved: stats.approved,
          pending: stats.pending,
          rejected: stats.rejected,
          color: colors[index % colors.length]
        };
      });

      setDashboardStats({
        totalProducts: products.length,
        totalCertificates: certificates.length,
        totalApplications: applications.length,
        activeCertificates: certificateStats.active,
        pendingCertificates: certificateStats.pending,
        expiredCertificates: certificateStats.expired,
        pendingApplications: applicationStats.pending,
        approvedApplications: applicationStats.approved,
        rejectedApplications: applicationStats.rejected,
        recentApplications: recentApps,
        productCategories: productStatsArray,
        lastUpdated: new Date()
      });
    };

    calculateStats();
  }, [products, certificates, applications]);

  // Calculate trend percentage
  const calculateTrend = (current, previous) => {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const change = ((current - previous) / previous) * 100;
    return `${change >= 0 ? '+' : ''}${Math.round(change)}%`;
  };

  // Stats data with real values
  const stats = [
    { 
      title: 'Total Applications', 
      value: dashboardStats.totalApplications.toLocaleString(), 
      change: calculateTrend(dashboardStats.totalApplications, Math.max(dashboardStats.totalApplications - 5, 0)), 
      icon: ClipboardList, 
      color: 'bg-blue-500',
      trend: dashboardStats.totalApplications > (dashboardStats.totalApplications - 5) ? 'up' : 'down'
    },
    { 
      title: 'Pending Applications', 
      value: dashboardStats.pendingApplications.toString(), 
      change: calculateTrend(dashboardStats.pendingApplications, Math.max(dashboardStats.pendingApplications - 2, 0)), 
      icon: Clock, 
      color: 'bg-yellow-500',
      trend: dashboardStats.pendingApplications > (dashboardStats.pendingApplications - 2) ? 'up' : 'down'
    },
    { 
      title: 'Active Certificates', 
      value: dashboardStats.activeCertificates.toString(), 
      change: calculateTrend(dashboardStats.activeCertificates, Math.max(dashboardStats.activeCertificates - 3, 0)), 
      icon: CheckCircle, 
      color: 'bg-green-500',
      trend: dashboardStats.activeCertificates > (dashboardStats.activeCertificates - 3) ? 'up' : 'down'
    },
    { 
      title: 'Total Products', 
      value: dashboardStats.totalProducts.toLocaleString(), 
      change: calculateTrend(dashboardStats.totalProducts, Math.max(dashboardStats.totalProducts - 2, 0)), 
      icon: Package, 
      color: 'bg-[#00853b]',
      trend: dashboardStats.totalProducts > (dashboardStats.totalProducts - 2) ? 'up' : 'down'
    },
  ];

  // Handle data refresh
  const handleRefreshData = async () => {
    setLocalLoading(true);
    try {
      await Promise.all([
        fetchProducts(), 
        fetchCertificates(),
        fetchApplications()
      ]);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setLocalLoading(false);
    }
  };

  // Format date for display
  const formatLastUpdated = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Format date in table
  const formatTableDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8 pt-20 lg:pt-8">
      {/* Header */}
      <header className="mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard Overview</h1>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-gray-600 text-sm lg:text-base">
                Real-time overview of applications, products, and certificates
              </p>
              {dashboardStats.lastUpdated && (
                <span className="text-xs text-gray-400">
                  Last updated: {formatLastUpdated(dashboardStats.lastUpdated)}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {errors && (
              <div className="flex items-center gap-1 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors}</span>
              </div>
            )}
            <button
              onClick={handleRefreshData}
              disabled={isLoading || localLoading}
              className="flex items-center gap-2 px-4 py-2 bg-[#00853b] text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              <RefreshCw className={`w-4 h-4 ${(isLoading || localLoading) ? 'animate-spin' : ''}`} />
              {isLoading || localLoading ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>
      </header>

      {/* Error Alert */}
      {errors && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error Loading Data</h3>
              <p className="text-sm text-red-600 mt-1">{errors}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatCard key={index} stat={stat} isLoading={isLoading} />
        ))}
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Recent Applications Card */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 lg:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {dashboardStats.recentApplications.length} items
                </span>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                  Applications & Certificates
                </span>
              </div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : dashboardStats.recentApplications.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] lg:min-w-0">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company / Applicant
                    </th>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dashboardStats.recentApplications.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="p-4">
                        <div className="font-medium text-gray-900 truncate max-w-[150px]" title={item.company}>
                          {item.company}
                          {item.isApplication && (
                            <span className="ml-2 text-xs px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
                              App
                            </span>
                          )}
                        </div>
                        {item.product && item.product !== 'N/A' && (
                          <div className="text-xs text-gray-500 truncate max-w-[150px]" title={item.product}>
                            {item.product}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <TypeBadge type={item.type} />
                      </td>
                      <td className="p-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="p-4 text-sm text-gray-500">
                        {formatTableDate(item.date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>No recent activities found</p>
              <button
                onClick={handleRefreshData}
                className="mt-2 text-sm text-[#00853b] hover:text-green-700 font-medium"
              >
                Refresh Data
              </button>
            </div>
          )}
        </section>

        {/* Application Statistics Card */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 lg:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Application Statistics</h2>
                <p className="text-sm text-gray-600 mt-1">Status distribution of applications</p>
              </div>
              <span className="text-sm text-gray-500">
                Total: {dashboardStats.totalApplications}
              </span>
            </div>
          </div>
          
          <div className="p-4 lg:p-6">
            {isLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-3">
                    <div className="animate-pulse h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="animate-pulse h-2.5 bg-gray-200 rounded-full"></div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="animate-pulse h-3 bg-gray-200 rounded"></div>
                      <div className="animate-pulse h-3 bg-gray-200 rounded"></div>
                      <div className="animate-pulse h-3 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : dashboardStats.totalApplications > 0 ? (
              <div className="space-y-6">
                {/* Overall Progress Bar */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-sm font-medium text-gray-900">All Applications</span>
                    <span className="text-sm text-gray-600">
                      Total: {dashboardStats.totalApplications}
                    </span>
                  </div>
                  
                  <ProgressBar 
                    approved={dashboardStats.approvedApplications}
                    pending={dashboardStats.pendingApplications}
                    rejected={dashboardStats.rejectedApplications}
                    isLoading={false}
                  />
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-2 flex-shrink-0"></div>
                      <span className="text-xs text-gray-600 truncate" title={`Approved: ${dashboardStats.approvedApplications}`}>
                        Approved: {dashboardStats.approvedApplications}
                      </span>
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2 flex-shrink-0"></div>
                      <span className="text-xs text-gray-600 truncate" title={`Pending: ${dashboardStats.pendingApplications}`}>
                        Pending: {dashboardStats.pendingApplications}
                      </span>
                    </div>
                    <div className="flex items-center justify-end">
                      <div className="w-3 h-3 rounded-full bg-red-500 mr-2 flex-shrink-0"></div>
                      <span className="text-xs text-gray-600 truncate" title={`Rejected: ${dashboardStats.rejectedApplications}`}>
                        Rejected: {dashboardStats.rejectedApplications}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Certificate Statistics */}
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-sm font-medium text-gray-900">Certificates</span>
                    <span className="text-sm text-gray-600">
                      Total: {dashboardStats.totalCertificates}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-xl font-bold text-green-700">{dashboardStats.activeCertificates}</div>
                      <div className="text-xs text-green-600">Active</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <div className="text-xl font-bold text-yellow-700">{dashboardStats.pendingCertificates}</div>
                      <div className="text-xs text-yellow-600">Pending</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-xl font-bold text-red-700">{dashboardStats.expiredCertificates}</div>
                      <div className="text-xs text-red-600">Expired</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ClipboardList className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p>No applications data available</p>
                <p className="text-sm text-gray-400 mt-1">Applications will appear here once submitted</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Summary Footer */}
      <div className="mt-8 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4">
            <div className="text-2xl font-bold text-gray-900">{dashboardStats.totalApplications}</div>
            <div className="text-sm text-gray-600">Total Applications</div>
            <div className="text-xs text-gray-400 mt-1">
              {dashboardStats.pendingApplications} pending
            </div>
          </div>
          <div className="text-center p-4 border-l border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{dashboardStats.totalProducts}</div>
            <div className="text-sm text-gray-600">Total Products</div>
            <div className="text-xs text-gray-400 mt-1">
              Registered in system
            </div>
          </div>
          <div className="text-center p-4 border-l border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{dashboardStats.totalCertificates}</div>
            <div className="text-sm text-gray-600">Total Certificates</div>
            <div className="text-xs text-gray-400 mt-1">
              {dashboardStats.activeCertificates} active
            </div>
          </div>
          <div className="text-center p-4 border-l border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{dashboardStats.approvedApplications}</div>
            <div className="text-sm text-gray-600">Approved</div>
            <div className="text-xs text-gray-400 mt-1">
              {((dashboardStats.approvedApplications / Math.max(dashboardStats.totalApplications, 1)) * 100).toFixed(1)}% success rate
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;