import { useEffect, useState } from 'react';
import { Search, RefreshCw, Clock, UserCheck, ShieldAlert, User, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const ImpersonateLogs = () => {
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
        `${API_BASE_URL}/impersonate-logs?page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(searchTerm)}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      if (res.data.status === 'success') {
        setLogs(res.data.logs || []);
        setTotalLogs(res.data.total || 0);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load impersonation logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage, searchTerm]);

  const handleEndSession = async (logId) => {
    try {
      const res = await axios.patch(
        `${API_BASE_URL}/impersonate-logs/${logId}/end`,
        {},
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      if (res.data.status === 'success') {
        toast.success('Impersonation session marked as ended');
        fetchLogs();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error ending session');
    }
  };

  const formatDuration = (startedAt, endedAt) => {
    if (!endedAt) return null;
    const start = new Date(startedAt);
    const end = new Date(endedAt);
    const diffSeconds = Math.max(0, Math.floor((end - start) / 1000));
    if (diffSeconds < 60) return `${diffSeconds}s`;
    const mins = Math.floor(diffSeconds / 60);
    const secs = diffSeconds % 60;
    if (mins < 60) return `${mins}m ${secs}s`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins}m`;
  };

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

  // Stat metrics
  const activeCount = logs.filter(l => !l.endedAt).length;
  const todayCount = logs.filter(l => {
    const today = new Date().toDateString();
    return new Date(l.startedAt).toDateString() === today;
  }).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-[#00853b]" />
            Impersonation Audit Logs
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Tracks admin users who log into client accounts, session start times, and session end times.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Impersonations</p>
            <p className="text-2xl font-bold text-gray-900">{totalLogs}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Sessions</p>
            <p className="text-2xl font-bold text-amber-600">{activeCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Today's Sessions</p>
            <p className="text-2xl font-bold text-green-700">{todayCount}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search admin or client..."
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
                <th className="p-4">Client Impersonated</th>
                <th className="p-4">Started At</th>
                <th className="p-4">Ended At</th>
                <th className="p-4">Duration</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#00853b]" />
                    Loading impersonation logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    No impersonation logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const duration = formatDuration(log.startedAt, log.endedAt);
                  return (
                    <tr key={log._id} className="hover:bg-gray-50 transition">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{log.adminName}</p>
                            <p className="text-xs text-gray-500">{log.adminEmail}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <div>
                          <p className="font-semibold text-gray-900">{log.clientName}</p>
                          <p className="text-xs text-gray-500">{log.clientEmail}</p>
                        </div>
                      </td>

                      <td className="p-4 text-gray-700 whitespace-nowrap">
                        {formatDate(log.startedAt)}
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        {log.endedAt ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-green-600" />
                            {formatDate(log.endedAt)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 animate-pulse">
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            Active Session
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-gray-700 font-mono text-xs whitespace-nowrap">
                        {duration ? (
                          <span>{duration}</span>
                        ) : (
                          <span className="text-amber-600 italic">In progress...</span>
                        )}
                      </td>

                      <td className="p-4 text-right whitespace-nowrap">
                        {!log.endedAt && (
                          <button
                            onClick={() => handleEndSession(log._id)}
                            className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-medium border border-amber-200 rounded-md transition"
                          >
                            Mark Ended
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
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
                className="px-3 py-1 bg-white border border-gray-300 rounded text-xs disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={currentPage * itemsPerPage >= totalLogs}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="px-3 py-1 bg-white border border-gray-300 rounded text-xs disabled:opacity-50"
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

export default ImpersonateLogs;
