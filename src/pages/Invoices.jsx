import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Search, 
  Send, 
  CheckCircle, 
  Clock, 
  Filter, 
  RefreshCw,
  MoreVertical,
  X,
  CreditCard,
  Building,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useAll } from '../hooks/useAll';
import { toast } from 'sonner';

const Invoices = () => {
  const { 
    invoices,
    companies, 
    isLoading, 
    fetchInvoices,
    fetchCompanies,
    issueInvoice,
    createInvoice,
    approvePayment
  } = useAll();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  
  const [issueAmount, setIssueAmount] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isApprovingId, setIsApprovingId] = useState(null);

  useEffect(() => {
    fetchInvoices();
    if (companies.length === 0) fetchCompanies();
  }, []);

  const handleRefresh = async () => {
    await fetchInvoices();
    toast.success('Invoices refreshed');
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.userId?.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || invoice.status?.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage) || 1;
  const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'requested':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'issued':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleOpenCreateModal = () => {
    setIssueAmount('');
    setIssueDescription('');
    setSelectedClient('');
    setIsCreateModalOpen(true);
  };

  const handleOpenProofModal = (invoice) => {
    setSelectedInvoice(invoice);
    setIsProofModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!issueAmount || isNaN(issueAmount)) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!selectedClient) {
      toast.error('Please select a client');
      return;
    }

    setIsSubmitting(true);
    const result = await createInvoice({
      userId: selectedClient,
      amount: parseFloat(issueAmount),
      description: issueDescription
    });
    setIsSubmitting(false);

    if (result.success) {
      setIsCreateModalOpen(false);
      setIssueAmount('');
      setIssueDescription('');
      setSelectedClient('');
    }
  };

  const handleApprovePayment = async (invoiceId) => {
    setIsApprovingId(invoiceId);
    const result = await approvePayment(invoiceId);
    setIsApprovingId(null);
    if(result.success) {
       setIsProofModalOpen(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="p-4 lg:p-8 pt-20 lg:pt-8 min-h-screen bg-gray-50/50">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-500 mt-1">Manage and track all companies payments</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-[#00853b] text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Create Invoice
          </button>
          <button 
            onClick={handleRefresh}
            className="p-2.5 bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-lg shadow-sm transition-all duration-200 disabled:opacity-50"
            disabled={isLoading}
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by invoice # or company..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:w-48">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select 
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none appearance-none cursor-pointer text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="waiting for admin approval">Pending Approval</option>
                <option value="issued">Issued</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="p-3 bg-yellow-100 rounded-lg text-yellow-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Pending Approvals</p>
            <p className="text-2xl font-bold text-gray-900">{invoices.filter(i => i.status === 'Waiting for admin approval').length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Awaiting Payment</p>
            <p className="text-2xl font-bold text-gray-900">{invoices.filter(i => i.status === 'Issued').length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-lg text-green-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Paid</p>
            <p className="text-2xl font-bold text-gray-900">{invoices.filter(i => i.status === 'Paid').length}</p>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice Info</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4"><div className="h-12 bg-gray-50 rounded-lg w-full"></div></td>
                  </tr>
                ))
              ) : filteredInvoices.length > 0 ? (
                paginatedInvoices.map((invoice) => (
                  <tr key={invoice._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg text-gray-500">
                          <Receipt className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{invoice.invoiceNumber}</p>
                          <p className="text-xs text-gray-500">{formatDate(invoice.createdAt)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <p className="text-sm font-medium text-gray-900">{invoice.userId?.companyName || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{invoice.userId?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900">
                        {invoice.currency} {invoice.amount?.toLocaleString() || '---'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusStyle(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {invoice.status === 'Waiting for admin approval' && (
                        <button 
                          onClick={() => handleOpenProofModal(invoice)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
                        >
                          <Search className="w-3.5 h-3.5" />
                          View Proof
                        </button>
                      )}
                      {invoice.status === 'Requested' && (
                        <button 
                          onClick={() => handleOpenIssueModal(invoice)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-[#00853b] text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Set Amount
                        </button>
                      )}
                      {invoice.status === 'Paid' && (
                        <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                          <CheckCircle className="w-4 h-4" />
                          Paid
                        </span>
                      )}
                      {invoice.status === 'Issued' && (
                        <span className="text-gray-400 text-sm italic">Sent to User</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Receipt className="w-12 h-12 text-gray-200" />
                      <p>No invoices found matching your search</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Footer */}
        {filteredInvoices.length > 0 && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredInvoices.length)}</span> of{' '}
                <span className="font-medium">{filteredInvoices.length}</span> invoices
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setCurrentPage(p => p - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition-colors duration-200 disabled:opacity-50 border border-gray-300 shadow-sm"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600 px-2">Page {currentPage} of {totalPages}</span>
                <button 
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition-colors duration-200 disabled:opacity-50 border border-gray-300 shadow-sm"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Send className="w-5 h-5 text-[#00853b]" />
                Create New Invoice
              </h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Select Client</label>
                  <select
                    required
                    className="w-full pl-3 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                  >
                    <option value="" disabled>-- Select a Client Company --</option>
                    {companies.map(c => (
                      <option key={c._id} value={c._id}>{c.companyName} ({c.email})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Invoice Amount (NGN)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="number" 
                      required
                      placeholder="0.00"
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                      value={issueAmount}
                      onChange={(e) => setIssueAmount(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 italic">Currency for this invoice is fixed to NGN (Naira)</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description (Optional)</label>
                  <textarea 
                    placeholder="e.g. Initial Inspection Fee"
                    rows="2"
                    className="w-full pl-3 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-[#00853b] text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Create Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Proof Approval Modal */}
      {isProofModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsProofModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-gray-500" />
                Review Payment Proof
              </h3>
              <button 
                onClick={() => setIsProofModalOpen(false)}
                className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Uploaded Evidence</p>
                <div className="bg-gray-100 rounded-lg p-2 border border-gray-200 flex justify-center max-h-[400px] overflow-hidden">
                  {selectedInvoice?.proofOfPayment ? (
                    <img 
                      src={selectedInvoice.proofOfPayment} 
                      alt="Proof of Payment" 
                      className="object-contain w-full h-full rounded shadow-sm"
                    />
                  ) : (
                    <p className="py-8 text-gray-500">No image available.</p>
                  )}
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsProofModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={() => handleApprovePayment(selectedInvoice._id)}
                  disabled={isApprovingId === selectedInvoice._id}
                  className="flex-1 px-4 py-2.5 bg-[#00853b] text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isApprovingId === selectedInvoice._id ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Approve Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
