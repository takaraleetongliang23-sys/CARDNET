import React, { useState, useEffect } from "react";
import { Contact, DbStatus } from "../types";
import { 
  Users, Trash2, Edit, Share2, Copy, Search, ExternalLink, Globe, 
  Linkedin, Twitter, Github, Instagram, Plus, RefreshCw, AlertCircle, Database, Server, Check
} from "lucide-react";
import ContactCardFormModal from "./ContactCardFormModal";

export default function Dashboard() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Modal control state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Success message states (for copying)
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Read data
  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorStatus(null);
      
      // Fetch DB Config
      const configRes = await fetch("/api/config");
      if (configRes.ok) {
        const configData = await configRes.json();
        setDbStatus(configData);
      } else {
        console.warn("Could not query backend configuration endpoints");
      }

      // Fetch Contacts
      const contactsRes = await fetch("/api/contacts");
      if (contactsRes.ok) {
        const contactsData = await contactsRes.json();
        setContacts(contactsData);
      } else {
        const errorText = await contactsRes.text();
        console.error("Fetch returned non-ok:", contactsRes.status, errorText);
        let errorMsg = "Failed to process contacts array retrieval";
        try {
          const parsed = JSON.parse(errorText);
          if (parsed.error) errorMsg = parsed.error;
        } catch(e) {
          errorMsg = `Server Error (${contactsRes.status}): ` + errorText.substring(0, 100);
        }
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      setErrorStatus(err?.message || "An error occurred compiling active business cards.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCopyLink = async (id: string) => {
    const publicUrl = `${window.location.origin}/card/${id}`;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  const handleDeleteContact = async (id: string) => {
    const confirmDelete = window.confirm("Are you certain you want to delete this business card?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/contacts/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to delete contact record");
      }
      // Re-fetch
      fetchData();
    } catch (err: any) {
      alert(err?.message || "Error deleting card");
    }
  };

  const handleSaveContact = async (data: Partial<Contact>) => {
    const endpoint = data._id ? `/api/contacts/${data._id}` : "/api/contacts";
    const method = data._id ? "PUT" : "POST";

    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errPayload = await res.json().catch(() => ({}));
      throw new Error(errPayload.error || "Failed to save the digital contact card.");
    }

    // Success! Re-fetch
    fetchData();
  };

  const handleOpenCreateModal = () => {
    setEditingContact(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (contact: Contact) => {
    setEditingContact(contact);
    setIsModalOpen(true);
  };

  // Filter contacts based on search query
  const filteredContacts = contacts.filter((c) => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return true;
    return (
      (c.firstName || "").toLowerCase().includes(term) ||
      (c.lastName || "").toLowerCase().includes(term) ||
      (c.title || "").toLowerCase().includes(term) ||
      (c.organization || "").toLowerCase().includes(term) ||
      (c.email || "").toLowerCase().includes(term) ||
      (c.phone || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col md:flex-row font-sans">
      
      {/* Sidebar navigation */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-zinc-200 flex flex-col justify-between shrink-0 p-6">
        <div>
          {/* Corporate brand header */}
          <div className="p-2 flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">C</div>
            <span className="text-xl font-bold tracking-tight text-zinc-900">CARDNET</span>
          </div>

          {/* Nav groups */}
          <nav className="space-y-1.5">
            <div className="p-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Management</div>
            <button className="w-full flex items-center gap-3 px-3 py-2 bg-zinc-100 text-indigo-600 rounded-lg font-medium text-xs text-left cursor-default select-none">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Contacts</span>
            </button>
          </nav>
        </div>

        {/* Sidebar footer: Database status indicator widget */}
        <div className="p-4 border-t border-zinc-150 bg-zinc-50 rounded-xl select-none mt-8 md:mt-0">
          <div className="flex items-center gap-3">
            {dbStatus ? (
              <>
                <div className="flex h-3 w-3 relative shrink-0">
                  {dbStatus.connected && dbStatus.mode === "database" ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </>
                  ) : dbStatus.configured && !dbStatus.connected ? (
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  ) : (
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Database</span>
                  <span className="text-xs font-semibold text-zinc-700">
                    {dbStatus.connected && dbStatus.mode === "database" ? "MongoDB Connected" : dbStatus.configured && !dbStatus.connected ? "Database Offline" : "Memory Mode (Demo)"}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-zinc-500 text-xs">
                <Server className="w-3.5 h-3.5 animate-pulse text-zinc-400" />
                <span>Synchronizing...</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Panel Content area */}
      <main className="flex-1 p-6 md:p-8 flex flex-col justify-start overflow-y-auto">
        
        {/* Upper Action Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-100 bg-linear-to-r from-zinc-900 to-zinc-700 bg-clip-text text-transparent">Digital Cards Workspace</h2>
            <p className="text-zinc-550 text-xs mt-0.5">
              Securely deploy and manage professional vCards connected to external mobile portals.
            </p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="w-full md:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold hover:shadow transition-all duration-200 shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            type="button"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Contact</span>
          </button>
        </div>

        {/* MongoDB Connection Trouble Notice */}
        {dbStatus && dbStatus.configured && !dbStatus.connected && (
          <div className="mb-6 p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <h4 className="font-bold text-xs text-amber-950">MongoDB Connection Offline (Fallback Active)</h4>
              <p className="text-[11px] text-amber-800 leading-relaxed max-w-4xl">
                The application detected your <code className="px-1.5 py-0.5 bg-amber-100 rounded text-[10px] font-mono select-all font-semibold">MONGODB_URI</code> environment variable, but the connection attempt timed out or was rejected at the SSL/TLS layer.
              </p>
              {dbStatus.error && (
                <div className="bg-amber-100/60 p-2.5 rounded-lg border border-amber-200/50 font-mono text-[10px] text-amber-950 overflow-x-auto max-w-full">
                  <span className="font-semibold select-none text-amber-800 uppercase text-[9px] block mb-1">Error Diagnostic Log:</span>
                  {dbStatus.error}
                </div>
              )}
              <div className="text-[11px] text-amber-900 font-semibold pt-1">
                👉 How to solve this:
                <ul className="list-disc pl-4 mt-1 space-y-1 font-normal text-amber-800">
                  <li><strong>Atlas Network Access Filter:</strong> If your database is hosted on MongoDB Atlas, make sure you have added <code className="px-1 py-0.5 bg-amber-150 rounded font-mono select-all text-amber-950 font-semibold">0.0.0.0/0</code> (allow access from anywhere) to the Network Access IP Access List, as Cloud Run container IP addresses are dynamic.</li>
                  <li><strong>Check Credentials & Database Name:</strong> Verify that the username, password, and target database parameters in the connection string are written correctly.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Search Field & Stats */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white border border-zinc-200 rounded-2xl p-4 mb-6 shadow-xs">
          <div className="relative w-full md:w-96">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-zinc-200 rounded-lg bg-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-800"
            />
          </div>

          <div className="text-zinc-450 text-[10px] font-mono uppercase tracking-widest shrink-0">
            Records cataloged: {contacts.length} cards {searchQuery ? `(matched: ${filteredContacts.length})` : ""}
          </div>
        </div>

        {/* Error States display with Refresh Trigger if connection fails */}
        {errorStatus ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-lg mx-auto my-12">
            <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-3" />
            <h4 className="text-zinc-900 text-sm font-semibold">Active Database Fetch Blocked</h4>
            <p className="text-rose-700 text-xs leading-relaxed mt-1 mb-4">
              {errorStatus}
            </p>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-700 text-xs font-bold transition flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
              type="button"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry system reload</span>
            </button>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-24 select-none">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-zinc-500 text-xs font-mono tracking-widest uppercase mt-4">
              Synchronizing server ledger...
            </p>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="border border-dashed border-zinc-200 bg-white rounded-2xl py-24 px-6 text-center shadow-xs">
            <p className="text-zinc-500 text-sm">
              {searchQuery ? "Your active filters do not match any live contacts." : "The corporate card net ledger is currently blank."}
            </p>
            {!searchQuery && (
              <button
                onClick={handleOpenCreateModal}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs transition active:scale-95 cursor-pointer font-semibold shadow-xs"
                type="button"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create first business card</span>
              </button>
            )}
          </div>
        ) : (
          /* Grid list of catalog cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContacts.map((contact) => {
              const initials = ((contact.firstName?.trim()?.charAt(0) || "") + (contact.lastName?.trim()?.charAt(0) || "")).toUpperCase() || "CN";
              return (
                <div
                  key={contact._id}
                  className="bg-white border border-zinc-200 rounded-2xl p-5 hover:border-zinc-300 transition flex flex-col justify-between shadow-xs relative group overflow-hidden"
                >
                  {/* Decorative subtle background angle */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-50/20 to-transparent rounded-full pointer-events-none" />

                  {/* High Card Identity */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {/* Avatar Circle fallback */}
                      <div className="w-12 h-12 rounded-full border border-zinc-150 bg-indigo-50 font-bold text-indigo-700 text-sm flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                        {contact.avatar ? (
                          <img
                            src={contact.avatar}
                            alt={`${contact.firstName} ${contact.lastName}`}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="truncate max-w-[150px]">
                        <h3 className="font-bold text-zinc-900 text-sm leading-tight">
                          {`${contact.firstName} ${contact.lastName}`}
                        </h3>
                        <p className="text-xs text-zinc-550 leading-tight truncate mt-0.5">{contact.title}</p>
                        {contact.organization && (
                          <span className="text-[10px] text-zinc-400 font-mono tracking-wider truncate block mt-0.5">
                            {contact.organization}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* View external public card link icon */}
                    <a
                      href={`/card/${contact._id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 transition active:scale-95"
                      title="Open external shared card workspace in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Middle Metadata indicators */}
                  <div className="border-t border-zinc-100 pt-3.5 mt-2 text-xs text-zinc-600 space-y-1.5">
                    {contact.email && (
                      <p className="truncate flex items-center gap-2">
                        <span className="w-1 h-1 bg-zinc-300 rounded-full animate-pulse" />
                        <span>{contact.email}</span>
                      </p>
                    )}
                    {contact.phone && (
                      <p className="truncate flex items-center gap-2">
                        <span className="w-1 h-1 bg-zinc-300 rounded-full" />
                        <span>{contact.phone}</span>
                      </p>
                    )}

                    {/* Social profiles presence badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1.5">
                      {contact.linkedin && <span className="px-2 py-0.5 bg-zinc-100 rounded text-[9px] font-medium text-zinc-650">LinkedIn</span>}
                      {contact.twitter && <span className="px-2 py-0.5 bg-zinc-100 rounded text-[9px] font-medium text-zinc-650">Twitter (X)</span>}
                      {contact.github && <span className="px-2 py-0.5 bg-zinc-100 rounded text-[9px] font-medium text-zinc-650">GitHub</span>}
                      {contact.instagram && <span className="px-2 py-0.5 bg-zinc-100 rounded text-[9px] font-medium text-zinc-650">Instagram</span>}
                    </div>
                  </div>

                  {/* Card lower interaction deck buttons (copy, edit, delete) */}
                  <div className="flex items-center justify-between border-t border-zinc-100 pt-3.5 mt-4">
                    <button
                      onClick={() => handleCopyLink(contact._id)}
                      className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold tracking-wide uppercase transition active:scale-95 flex items-center gap-1.5 cursor-pointer select-none ${
                        copiedId === contact._id
                          ? "bg-green-50 border-green-200 text-green-700"
                          : "bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-zinc-900"
                      }`}
                      type="button"
                    >
                      {copiedId === contact._id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-green-600" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Copy Portal Link</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(contact)}
                        className="p-1.5 bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-800 rounded-lg transition active:scale-95 cursor-pointer"
                        title="Edit credentials configuration"
                        type="button"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteContact(contact._id)}
                        className="p-1.5 bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 text-zinc-400 hover:text-rose-600 rounded-lg transition active:scale-95 cursor-pointer"
                        title="Revoke and delete digital card"
                        type="button"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Pop-up editing / creation modals panel */}
      <ContactCardFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveContact}
        contact={editingContact}
      />
    </div>
  );
}
