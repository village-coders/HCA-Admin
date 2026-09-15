import React, { useState, useRef, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import axios from "axios";
import { toast } from "sonner";
import {
  Search, MessageSquare, RefreshCw, Send, Paperclip, XCircle,
  Download, File, Clock, CheckCircle, AlertCircle, Lock,
  Filter, User, Building, Calendar, ChevronDown, Eye, FileText,
  ExternalLink, Image as ImageIcon, X
} from "lucide-react";
import { format, isValid } from "date-fns";
import { useSocket } from "../contexts/SocketContext";

const STATUS_CONFIG = {
  open:          { label: "Open",        color: "text-blue-700",  bg: "bg-blue-50",   border: "border-blue-200",  icon: AlertCircle },
  "in-progress": { label: "In Progress", color: "text-amber-700", bg: "bg-amber-50",  border: "border-amber-200", icon: Clock },
  resolved:      { label: "Resolved",    color: "text-green-700", bg: "bg-green-50",  border: "border-green-200", icon: CheckCircle },
  closed:        { label: "Closed",      color: "text-gray-600",  bg: "bg-gray-100",  border: "border-gray-200",  icon: Lock }
};

const PRIORITY_CONFIG = {
  Low:    { color: "text-green-700",  bg: "bg-green-50"  },
  Medium: { color: "text-amber-700",  bg: "bg-amber-50"  },
  High:   { color: "text-red-700",    bg: "bg-red-50"    },
  Urgent: { color: "text-purple-700", bg: "bg-purple-50" }
};

const STATUS_OPTIONS = ["all", "open", "in-progress", "resolved", "closed"];

function AdminMessages() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedImageModal, setSelectedImageModal] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const searchTimeout = useRef(null);

  const baseUrl = import.meta.env.VITE_BASE_URL;
  const { socket } = useSocket();

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => fetchTickets(), 400);
    return () => clearTimeout(searchTimeout.current);
  }, [searchQuery]);

  useEffect(() => {
    if (!selectedTicket) return;
    fetchTicketMessages(selectedTicket._id);
  }, [selectedTicket?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Real-time socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewTicket = ({ ticket }) => {
      setTickets(prev => [ticket, ...prev]);
      toast.info(`New ticket: ${ticket.ticketNumber} — ${ticket.title}`);
    };

    const handleTicketReply = ({ ticketId, message, status }) => {
      if (selectedTicket?._id === ticketId) {
        setMessages(prev => {
          const exists = prev.some(m => m._id === message._id);
          if (exists) return prev;
          return [...prev, message];
        });
      }
      setTickets(prev =>
        prev.map(t => t._id === ticketId ? { ...t, lastRepliedAt: new Date().toISOString(), status } : t)
      );
    };

    socket.on("new-ticket", handleNewTicket);
    socket.on("ticket-reply", handleTicketReply);

    return () => {
      socket.off("new-ticket", handleNewTicket);
      socket.off("ticket-reply", handleTicketReply);
    };
  }, [socket, selectedTicket]);

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const token = JSON.parse(localStorage.getItem("accessToken"));
      const params = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery;

      const res = await axios.get(`${baseUrl}/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (res.data.status === "success") {
        setTickets(res.data.data.tickets || []);
      }
    } catch (err) {
      if (!axios.isCancel(err)) console.error("Failed to fetch tickets:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTicketMessages = async (ticketId) => {
    try {
      setIsLoadingMessages(true);
      const token = JSON.parse(localStorage.getItem("accessToken"));
      const res = await axios.get(`${baseUrl}/tickets/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === "success") {
        setMessages(res.data.data.messages || []);
      }
    } catch (err) {
      console.error("Failed to load ticket messages:", err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && attachments.length === 0) {
      toast.error("Please type a reply");
      return;
    }
    if (!selectedTicket) return;

    setIsSending(true);
    try {
      const token = JSON.parse(localStorage.getItem("accessToken"));
      const formData = new FormData();
      formData.append("content", newMessage);
      attachments.forEach(f => formData.append("attachments", f));

      const res = await axios.post(`${baseUrl}/tickets/${selectedTicket._id}/reply`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });

      if (res.data.status === "success") {
        const sentMsg = { ...res.data.data, senderType: "admin" };
        setMessages(prev => [...prev, sentMsg]);
        setSelectedTicket(prev => ({ ...prev, status: res.data.ticketStatus || prev.status }));
        setTickets(prev =>
          prev.map(t => t._id === selectedTicket._id
            ? { ...t, status: res.data.ticketStatus || t.status, lastRepliedAt: new Date().toISOString() }
            : t
          )
        );
        setNewMessage("");
        setAttachments([]);
        toast.success("Reply sent!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reply");
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedTicket || updatingStatus) return;
    setUpdatingStatus(true);
    try {
      const token = JSON.parse(localStorage.getItem("accessToken"));
      const res = await axios.put(`${baseUrl}/tickets/${selectedTicket._id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === "success") {
        setSelectedTicket(prev => ({ ...prev, status }));
        setTickets(prev => prev.map(t => t._id === selectedTicket._id ? { ...t, status } : t));
        toast.success(`Ticket marked as ${status}`);
      }
    } catch (err) {
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const formatTime = (d) => {
    if (!d) return "—";
    const date = new Date(d);
    if (!isValid(date)) return "—";
    return format(date, "hh:mm a");
  };

  const formatDate = (d) => {
    if (!d) return "";
    const date = new Date(d);
    if (!isValid(date)) return "";
    const today = new Date();
    if (today.toDateString() === date.toDateString()) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (yesterday.toDateString() === date.toDateString()) return "Yesterday";
    return format(date, "MMM dd, yyyy");
  };

  const isImageAttachment = (att) => {
    if (!att) return false;
    if (att.fileType && typeof att.fileType === 'string' && att.fileType.startsWith("image/")) return true;
    if (att.url && typeof att.url === 'string' && /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(att.url)) return true;
    if (att.filename && typeof att.filename === 'string' && /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(att.filename)) return true;
    return false;
  };

  const totalOpen = tickets.filter(t => t.status === "open").length;
  const totalInProgress = tickets.filter(t => t.status === "in-progress").length;

  return (
    <div className="dash">
      <Sidebar />
      <main className="content">
        <div className="p-4 lg:p-8 pt-20 lg:pt-8">
          {/* Page Header */}
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Support Tickets</h1>
              <p className="text-gray-500 mt-1 text-sm">Manage and respond to customer support requests</p>
            </div>
            <button
              onClick={fetchTickets}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total", value: tickets.length, icon: MessageSquare, color: "text-indigo-600", bg: "bg-indigo-50" },
              { label: "Open", value: totalOpen, icon: AlertCircle, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "In Progress", value: totalInProgress, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
              { label: "Resolved", value: tickets.filter(t => t.status === "resolved").length, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" }
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm">
                <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{s.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Main 2-panel layout */}
          <div className="flex gap-5" style={{ height: "calc(100vh - 320px)", minHeight: "500px" }}>
            {/* Left: Ticket List */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden" style={{ width: "360px", flexShrink: 0 }}>
              {/* Filters */}
              <div className="p-4 border-b border-gray-100">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tickets..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:border-[#00853b] focus:ring-1 focus:ring-[#00853b] outline-none"
                  />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {STATUS_OPTIONS.map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors capitalize ${statusFilter === s ? "bg-[#00853b] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                      {s === "all" ? "All" : s.replace("-", " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ticket items */}
              <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="flex justify-center items-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00853b]"></div>
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center p-6">
                    <MessageSquare className="w-10 h-10 text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">No tickets found</p>
                    <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
                  </div>
                ) : (
                  tickets.map(ticket => {
                    const sc = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
                    const pc = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.Medium;
                    const isSelected = selectedTicket?._id === ticket._id;
                    const StatusIcon = sc.icon;
                    return (
                      <div
                        key={ticket._id}
                        onClick={() => setSelectedTicket(ticket)}
                        className={`p-4 cursor-pointer border-b border-gray-50 transition-all ${isSelected ? "bg-green-50 border-l-4 border-l-[#00853b]" : "hover:bg-gray-50 border-l-4 border-l-transparent"}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs font-bold text-[#00853b] font-mono">{ticket.ticketNumber}</span>
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${sc.bg} ${sc.color} border ${sc.border}`}>
                            <StatusIcon className="w-3 h-3" /> {sc.label}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-gray-800 truncate mb-1.5">{ticket.title}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pc.bg} ${pc.color}`}>{ticket.priority}</span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-400 truncate max-w-[80px]">
                              {ticket.company?.companyName || ticket.company?.fullName || "Unknown"}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">{formatDate(ticket.lastRepliedAt)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: Ticket Detail */}
            <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
              {!selectedTicket ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-10">
                  <MessageSquare className="w-16 h-16 text-gray-200 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-400">Select a ticket to view</h3>
                  <p className="text-sm text-gray-400 mt-2">Click on any ticket from the list to view its conversation</p>
                </div>
              ) : (
                <>
                  {/* Ticket header */}
                  <div className="p-5 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-[#00853b] font-mono">{selectedTicket.ticketNumber}</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-xs text-gray-500">{selectedTicket.category}</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-xs text-gray-500">
                            {selectedTicket.company?.companyName || selectedTicket.company?.fullName}
                          </span>
                        </div>
                        <h2 className="text-base font-bold text-gray-900 truncate">{selectedTicket.title}</h2>
                      </div>
                      {/* Status changer */}
                      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        {(() => {
                          const sc = STATUS_CONFIG[selectedTicket.status] || STATUS_CONFIG.open;
                          const pc = PRIORITY_CONFIG[selectedTicket.priority] || PRIORITY_CONFIG.Medium;
                          return (
                            <>
                              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${pc.bg} ${pc.color}`}>{selectedTicket.priority}</span>
                              <div className="relative group">
                                <button className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${sc.bg} ${sc.color} ${sc.border} cursor-pointer`} disabled={updatingStatus}>
                                  <sc.icon className="w-3.5 h-3.5" /> {sc.label} <ChevronDown className="w-3 h-3" />
                                </button>
                                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 hidden group-hover:block min-w-[140px]">
                                  {["open", "in-progress", "resolved", "closed"].map(s => {
                                    const c = STATUS_CONFIG[s];
                                    const SI = c.icon;
                                    return (
                                      <button key={s} onClick={() => handleUpdateStatus(s)}
                                        className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-left hover:bg-gray-50 capitalize first:rounded-t-xl last:rounded-b-xl ${selectedTicket.status === s ? "bg-gray-50" : ""}`}>
                                        <SI className={`w-3.5 h-3.5 ${c.color}`} /> {c.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    {isLoadingMessages ? (
                      <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00853b]"></div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
                        <p className="text-gray-500">No messages yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((msg, i) => {
                          const isAdmin = msg.senderType === "admin";
                          const showDate = i === 0 || formatDate(messages[i - 1].createdAt) !== formatDate(msg.createdAt);
                          return (
                            <div key={msg._id || i}>
                              {showDate && (
                                <div className="flex items-center justify-center my-4">
                                  <div className="px-4 py-1 bg-white border border-gray-200 rounded-full">
                                    <span className="text-xs text-gray-500">{formatDate(msg.createdAt)}</span>
                                  </div>
                                </div>
                              )}
                              <div className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                                <div className="max-w-[70%]">
                                  <p className={`text-xs font-medium mb-1 ${isAdmin ? "text-right text-gray-500" : "text-gray-500"}`}>
                                    {isAdmin ? "You (Admin)" : (msg.sender?.fullName || "User")}
                                  </p>
                                  <div className={`rounded-2xl px-4 py-3 ${isAdmin
                                    ? "bg-[#00853b] text-white rounded-br-none"
                                    : "bg-white border border-gray-200 rounded-bl-none text-gray-800"
                                  }`}>
                                    {msg.content && <p className="text-sm leading-relaxed">{msg.content}</p>}
                                    {msg.attachments?.length > 0 && (
                                      <div className="mt-2.5 space-y-2">
                                        {msg.attachments.map((att, ai) => {
                                          const isImg = isImageAttachment(att);
                                          if (isImg) {
                                            return (
                                              <div key={ai} className="group/att relative rounded-xl overflow-hidden border border-black/10 shadow-sm bg-black/5 max-w-sm">
                                                <img
                                                  src={att.url}
                                                  alt={att.filename || "Attachment image"}
                                                  className="w-full max-h-60 object-cover cursor-pointer transition-transform duration-200 group-hover/att:scale-[1.02]"
                                                  onClick={() => setSelectedImageModal({ url: att.url, filename: att.filename })}
                                                  loading="lazy"
                                                />
                                                <div className={`flex items-center justify-between p-2 text-xs backdrop-blur-sm ${isAdmin ? "bg-black/40 text-white" : "bg-white/90 text-gray-700 border-t border-gray-100"}`}>
                                                  <div className="flex items-center gap-1.5 truncate mr-2">
                                                    <ImageIcon className="w-3.5 h-3.5 flex-shrink-0" />
                                                    <span className="truncate font-medium">{att.filename}</span>
                                                    {att.size ? <span className="opacity-70 text-[10px]">({(att.size / 1024).toFixed(0)} KB)</span> : null}
                                                  </div>
                                                  <div className="flex items-center gap-1">
                                                    <button
                                                      type="button"
                                                      onClick={() => setSelectedImageModal({ url: att.url, filename: att.filename })}
                                                      className="p-1 hover:bg-white/20 rounded transition-colors"
                                                      title="View Full Image"
                                                    >
                                                      <Eye className="w-3.5 h-3.5" />
                                                    </button>
                                                    <a
                                                      href={att.url}
                                                      download={att.filename}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="p-1 hover:bg-white/20 rounded transition-colors"
                                                      title="Download Image"
                                                    >
                                                      <Download className="w-3.5 h-3.5" />
                                                    </a>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          }
                                          return (
                                            <div
                                              key={ai}
                                              className={`flex items-center justify-between gap-3 text-xs rounded-xl p-3 border transition-colors ${isAdmin ? "bg-white/15 border-white/20 text-white" : "bg-white border-gray-200 text-gray-800 shadow-sm hover:border-gray-300"}`}
                                            >
                                              <div className="flex items-center gap-2.5 min-w-0">
                                                <div className={`p-2 rounded-lg ${isAdmin ? "bg-white/20 text-white" : "bg-green-50 text-[#00853b]"}`}>
                                                  <FileText className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                  <p className="font-semibold truncate max-w-[160px] sm:max-w-[220px]">{att.filename}</p>
                                                  <p className={`text-[11px] ${isAdmin ? "text-white/70" : "text-gray-400"}`}>
                                                    {att.size ? `${(att.size / 1024).toFixed(0)} KB` : "Document"}
                                                  </p>
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                                <a
                                                  href={att.url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium ${isAdmin ? "hover:bg-white/20 text-white" : "hover:bg-gray-100 text-blue-600"}`}
                                                  title="Open document in new tab"
                                                >
                                                  <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                                <a
                                                  href={att.url}
                                                  download={att.filename}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium ${isAdmin ? "hover:bg-white/20 text-white" : "hover:bg-gray-100 text-gray-700"}`}
                                                  title="Download document"
                                                >
                                                  <Download className="w-3.5 h-3.5" />
                                                </a>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                  <p className={`text-xs text-gray-400 mt-1 ${isAdmin ? "text-right" : ""}`}>
                                    {formatTime(msg.createdAt)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>

                  {/* Reply box */}
                  {selectedTicket.status === "closed" ? (
                    <div className="p-4 border-t border-gray-100 bg-gray-50 text-center">
                      <p className="text-sm text-gray-400 flex items-center justify-center gap-2">
                        <Lock className="w-4 h-4" /> This ticket is closed
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSendReply} className="p-4 border-t border-gray-100 bg-white">
                      {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {attachments.map((f, i) => (
                            <div key={i} className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-3 py-1 text-xs">
                              <Paperclip className="w-3 h-3 text-gray-500" />
                              <span className="text-gray-700 max-w-[100px] truncate">{f.name}</span>
                              <button type="button" onClick={() => setAttachments(prev => prev.filter((_, pi) => pi !== i))}
                                className="text-gray-400 hover:text-red-500">
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2 items-end">
                        <button type="button" onClick={() => fileInputRef.current.click()}
                          className="p-2.5 bg-gray-100 rounded-lg text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors flex-shrink-0">
                          <Paperclip className="w-4 h-4" />
                          <input ref={fileInputRef} type="file" multiple style={{ display: "none" }}
                            onChange={e => setAttachments(prev => [...prev, ...Array.from(e.target.files)])} />
                        </button>
                        <input
                          type="text"
                          value={newMessage}
                          onChange={e => setNewMessage(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendReply(e); } }}
                          placeholder="Type your reply to the client..."
                          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#00853b] focus:ring-1 focus:ring-[#00853b] outline-none"
                        />
                        <button type="submit" disabled={isSending}
                          className={`px-4 py-2.5 bg-[#00853b] text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors ${isSending ? "opacity-60 cursor-not-allowed" : "hover:bg-green-700"}`}>
                          <Send className="w-4 h-4" />
                          {isSending ? "Sending..." : "Reply"}
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Image Lightbox Modal */}
        {selectedImageModal && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedImageModal(null)}
          >
            <div
              className="relative max-w-4xl max-h-[90vh] bg-gray-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-3 bg-gray-800 text-white border-b border-gray-700">
                <span className="font-medium text-sm truncate max-w-md">{selectedImageModal.filename || "Image Preview"}</span>
                <div className="flex items-center gap-2">
                  <a
                    href={selectedImageModal.url}
                    download={selectedImageModal.filename}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => setSelectedImageModal(null)}
                    className="p-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/40">
                <img
                  src={selectedImageModal.url}
                  alt={selectedImageModal.filename}
                  className="max-h-[75vh] max-w-full object-contain rounded-lg"
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminMessages;