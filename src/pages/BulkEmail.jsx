import { useEffect, useState } from 'react';
import { Search, Mail, Filter, Send, RefreshCw, AlertCircle, CheckCircle, Users, XCircle, Lock } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';

const BulkEmail = () => {
  const { user } = useAuth();
  const hasPrivilege = (priv) => {
    if (user?.role === 'super admin') return true;
    return user?.privileges?.includes(priv);
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [clients, setClients] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [showAdmins, setShowAdmins] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const baseUrl = import.meta.env.VITE_BASE_URL;
  const getToken = () => JSON.parse(localStorage.getItem("accessToken"));

  const fetchClients = async () => {
    setIsLoading(true);
    const token = getToken();
    try {
      const response = await axios.get(`${baseUrl}/users/clients`, {
        params: { status: statusFilter, search: searchTerm },
        headers: { Authorization: `Bearer ${token}` }
      });
      setClients(response.data.users);
      // Auto-select clients but keep existing admin selections
      setSelectedEmails(prev => {
        const clientEmails = response.data.users.map(u => u.email);
        const nonClientEmails = prev.filter(email => !clientEmails.includes(email));
        return [...new Set([...nonClientEmails, ...clientEmails])];
      });
    } catch (error) {
      console.error('Error fetching clients:', error);
      setMessage({ type: 'error', text: 'Failed to fetch clients' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdmins = async () => {
    const token = getToken();
    try {
      const response = await axios.get(`${baseUrl}/users/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdmins(response.data.users || []);
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  useEffect(() => {
    fetchClients();
  }, [statusFilter, searchTerm]);

  const handleSelectAllClients = (e) => {
    if (e.target.checked) {
      const clientEmails = clients.map(u => u.email);
      setSelectedEmails(prev => [...new Set([...prev, ...clientEmails])]);
    } else {
      const clientEmails = clients.map(u => u.email);
      setSelectedEmails(prev => prev.filter(email => !clientEmails.includes(email)));
    }
  };

  const handleSelectAllAdmins = (e) => {
    if (e.target.checked) {
      const adminEmails = admins.map(a => a.email);
      setSelectedEmails(prev => [...new Set([...prev, ...adminEmails])]);
    } else {
      const adminEmails = admins.map(a => a.email);
      setSelectedEmails(prev => prev.filter(email => !adminEmails.includes(email)));
    }
  };

  const handleSelectEmail = (email) => {
    if (selectedEmails.includes(email)) {
      setSelectedEmails(selectedEmails.filter(e => e !== email));
    } else {
      setSelectedEmails([...selectedEmails, email]);
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (selectedEmails.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one recipient' });
      return;
    }
    if (!subject || !content) {
      setMessage({ type: 'error', text: 'Subject and content are required' });
      return;
    }

    setIsSending(true);
    setMessage({ type: '', text: '' });
    const token = getToken();
    try {
      await axios.post(`${baseUrl}/users/bulk-email`, {
        emails: selectedEmails,
        subject,
        content
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: `Email successfully sent to ${selectedEmails.length} recipients` });
      setSubject('');
      setContent('');
    } catch (error) {
      console.error('Error sending bulk email:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to send bulk email' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 pt-20 lg:pt-8">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Bulk Email</h1>
        <p className="text-gray-600 mt-1">Send custom emails to filtered clients based on certificate status</p>
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-medium">{message.text}</span>
          <button onClick={() => setMessage({ type: '', text: '' })} className="ml-auto">
            <XCircle className="w-5 h-5 opacity-50 hover:opacity-100" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recipients Selection */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#00853b]" />
              Filter Recipients
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Certificate Status</label>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    className="pl-10 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#00853b] focus:ring-1 focus:ring-[#00853b] outline-none"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Clients</option>
                    <option value="Active">Active Certificate</option>
                    <option value="Expiring Soon">Expiring Soon</option>
                    <option value="Expired">Expired Certificate</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Search Name</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search company name..."
                    className="pl-10 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#00853b] focus:ring-1 focus:ring-[#00853b] outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Clients ({clients.filter(c => selectedEmails.includes(c.email)).length}/{clients.length})</span>
                  <label className="flex items-center gap-2 text-sm text-[#00853b] cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={clients.length > 0 && clients.every(c => selectedEmails.includes(c.email))}
                      onChange={handleSelectAllClients}
                      className="rounded border-gray-300 text-[#00853b] focus:ring-[#00853b]"
                    />
                    Select All Clients
                  </label>
                </div>

                <div className="max-h-[250px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="w-6 h-6 text-[#00853b] animate-spin" />
                    </div>
                  ) : clients.length > 0 ? (
                    clients.map((client) => (
                      <label
                        key={client.registrationNo}
                        className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all cursor-pointer ${
                          selectedEmails.includes(client.email)
                            ? 'bg-[#00853b]/5 border-[#00853b]/20 shadow-sm'
                            : 'bg-white border-gray-100 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedEmails.includes(client.email)}
                          onChange={() => handleSelectEmail(client.email)}
                          className="mt-1 rounded border-gray-300 text-[#00853b] focus:ring-[#00853b]"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{client.companyName}</p>
                          <p className="text-xs text-gray-500 truncate">{client.email}</p>
                        </div>
                      </label>
                    ))
                  ) : (
                    <p className="text-center py-8 text-sm text-gray-500">No clients found matching filters</p>
                  )}
                </div>
              </div>

              {/* Admins Section */}
              <div className="pt-4 border-t border-gray-100 mt-4">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer font-medium mb-3">
                  <input
                    type="checkbox"
                    checked={showAdmins}
                    onChange={(e) => setShowAdmins(e.target.checked)}
                    className="rounded border-gray-300 text-[#00853b] focus:ring-[#00853b]"
                  />
                  Show Admin List
                </label>

                {showAdmins && (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">Admins ({admins.filter(a => selectedEmails.includes(a.email)).length}/{admins.length})</span>
                      <label className="flex items-center gap-2 text-sm text-[#00853b] cursor-pointer font-medium">
                        <input
                          type="checkbox"
                          checked={admins.length > 0 && admins.every(a => selectedEmails.includes(a.email))}
                          onChange={handleSelectAllAdmins}
                          className="rounded border-gray-300 text-[#00853b] focus:ring-[#00853b]"
                        />
                        Select All Admins
                      </label>
                    </div>

                    <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {admins.length > 0 ? (
                        admins.map((admin) => (
                          <label
                            key={admin._id || admin.email}
                            className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all cursor-pointer ${
                              selectedEmails.includes(admin.email)
                                ? 'bg-[#00853b]/5 border-[#00853b]/20 shadow-sm'
                                : 'bg-white border-gray-100 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedEmails.includes(admin.email)}
                              onChange={() => handleSelectEmail(admin.email)}
                              className="mt-1 rounded border-gray-300 text-[#00853b] focus:ring-[#00853b]"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{admin.fullName || admin.companyName || 'Admin'}</p>
                              <p className="text-xs text-gray-500 truncate">{admin.email}</p>
                            </div>
                          </label>
                        ))
                      ) : (
                        <p className="text-center py-4 text-sm text-gray-500">No admins found</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Email Composer */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSendEmail} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#00853b]" />
                Compose Message
              </h3>
            </div>

            <div className="p-6 space-y-4 flex-grow">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject Line</label>
                <input
                  type="text"
                  placeholder="Enter email subject..."
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#00853b] focus:ring-1 focus:ring-[#00853b] outline-none"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="flex-grow flex flex-col min-h-[400px]">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Message Body</label>
                <textarea
                  placeholder="Type your message here... Use standard text formatting. We will automatically add the greeting and footer."
                  required
                  className="w-full flex-grow rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-[#00853b] focus:ring-1 focus:ring-[#00853b] outline-none resize-none"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                <p className="mt-2 text-[11px] text-gray-500 italic">
                  Note: This email will be sent from support@halalcert.com.ng on behalf of the HDI Team.
                </p>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Sending to <span className="font-bold text-gray-900">{selectedEmails.length}</span> recipients
              </div>
              <button
                type="submit"
                disabled={isSending || selectedEmails.length === 0}
                onClick={(e) => {
                  if (!hasPrivilege('Application Officer') && !hasPrivilege('Certificate Officer')) {
                    e.preventDefault();
                    toast.error('You do not have permission to send bulk emails');
                    return;
                  }
                }}
                className="flex items-center gap-2 px-8 py-3 bg-[#00853b] text-white rounded-lg hover:bg-green-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Sending Emails...
                  </>
                ) : (
                  <>
                    {!hasPrivilege('Application Officer') && !hasPrivilege('Certificate Officer') ? <Lock className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                    Send Bulk Email
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BulkEmail;
