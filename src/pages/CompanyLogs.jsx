import { useEffect, useState } from 'react';
import { Search, RefreshCw, Clock, Building2, User, ShieldAlert, ArrowRight, CheckCircle2, History } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';

const CompanyLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalLogs, setTotalLogs] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const API_BASE_URL = import.meta.env.VITE_BASE_URL;
  const getToken = () => JSON.parse(localStorage.getItem('accessToken'));

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE_URL}/company-logs?page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(searchTerm)}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      if (res.data.status === 'success') {
        setLogs(res.data.logs || []);
        setTotalLogs(res.data.total || 0);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load company edit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.isBuilder || user?.role === 'super admin') {
      fetchLogs();
    } else {
      setLoading(false);
    }
  }, [currentPage, searchTerm, user]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (user && !user.isBuilder && user.role !== 'super admin') {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 inline-block">
          <ShieldAlert className="w-12 h-12 mx-auto mb-2 text-red-600" />
          <h2 className="text-xl font-bold">Access Restricted</h2>
          <p className="text-sm mt-1">Only builder accounts are permitted to view company modification logs.</p>
        </div>
      </div>
    );
  }

  // Stat metrics
  const todayCount = logs.filter(l => {
    const today = new Date().toDateString();
    return new Date(l.createdAt).toDateString() === today;
  }).length;

  const uniqueCompanies = new Set(logs.map(l => l.companyId)).size;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <History className="w-7 h-7 text-[#00853b]" />
            Company Modification Audit Logs
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Tracks edits to company details (Name, Email, Contact Person), showing who changed what before and after.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <History className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Modifications</p>
            <p className="text-2xl font-bold text-gray-900">{totalLogs}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Today's Edits</p>
            <p className="text-2xl font-bold text-green-700">{todayCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Companies Modified</p>
            <p className="text-2xl font-bold text-amber-600">{uniqueCompanies}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search admin or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00853b]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <th className="p-4">Admin User</th>
                <th className="p-4">Company</th>
                <th className="p-4">Changes (Before ➔ After)</th>
                <th className="p-4">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#00853b]" />
                    Loading company edit logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">
                    No company modification logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id || log.id} className="hover:bg-gray-50 transition">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{log.adminName}</p>
                          <p className="text-xs text-gray-500">{log.adminEmail}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-[#00853b]" />
                        <span className="font-semibold text-gray-900">{log.companyName}</span>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="space-y-2">
                        {log.changes && log.changes.length > 0 ? (
                          log.changes.map((change, idx) => (
                            <div key={idx} className="bg-gray-50 p-2 rounded-lg border border-gray-100 text-xs flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-gray-700 bg-gray-200 px-2 py-0.5 rounded">
                                {change.field}:
                              </span>
                              <span className="line-through text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                                {change.before || '(empty)'}
                              </span>
                              <ArrowRight className="w-3 h-3 text-gray-400" />
                              <span className="text-green-700 font-medium bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                                {change.after}
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500">No specific field diff</span>
                        )}
                      </div>
                    </td>

                    <td className="p-4 text-gray-700 whitespace-nowrap text-xs">
                      {formatDate(log.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalLogs > itemsPerPage && (
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <span className="text-xs text-gray-600">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalLogs)} of {totalLogs}
            </span>
            <div className="flex space-x-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="px-3 py-1 bg-white border border-gray-300 rounded text-xs disabled:opacity-50 cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={currentPage * itemsPerPage >= totalLogs}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="px-3 py-1 bg-white border border-gray-300 rounded text-xs disabled:opacity-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyLogs;
