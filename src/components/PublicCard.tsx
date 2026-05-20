import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Contact } from "../types";
import { 
  Phone, Mail, MessageSquare, Compass, Globe, Linkedin, Twitter, Github, 
  Instagram, UserPlus, Share2, ArrowLeft, Loader2, QrCode, ClipboardCheck 
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function PublicCard() {
  const { id } = useParams<{ id: string }>();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    async function fetchContact() {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/contacts/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Digital business card not found.");
          }
          if (res.status === 400) {
            throw new Error("Invalid digital business card identifier.");
          }
          throw new Error("Failed to load digital business card.");
        }
        const data = await res.json();
        setContact(data);
      } catch (err: any) {
        setError(err?.message || "An error occurred fetching the digital card.");
      } finally {
        setLoading(false);
      }
    }
    fetchContact();
  }, [id]);

  const getInitials = () => {
    if (!contact) return "CN";
    const f = contact.firstName?.trim()?.charAt(0) || "";
    const l = contact.lastName?.trim()?.charAt(0) || "";
    return (f + l).toUpperCase() || "CN";
  };

  const handleDownloadVCF = () => {
    if (!contact) return;

    // Build vCard payload (vCard Standard 3.0)
    let vCardLines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `N:${contact.lastName || ""};${contact.firstName || ""};;;`,
      `FN:${(contact.firstName + " " + contact.lastName).trim()}`,
      `ORG:${contact.organization || ""}`,
      `TITLE:${contact.title || ""}`,
      `TEL;TYPE=CELL,VOICE:${contact.phone || ""}`,
      `EMAIL;TYPE=PREF,INTERNET:${contact.email || ""}`,
      `URL:${contact.website || ""}`,
      `ADR;TYPE=WORK,POSTAL,PARCEL:;;${contact.address || ""};;;;`,
    ];

    // Embed base64 avatar if present. 
    // Strip "data:image/xxx;base64," prefix for raw photo binary encoder
    if (contact.avatar) {
      const commaIdx = contact.avatar.indexOf("base64,");
      if (commaIdx !== -1) {
        const rawBase64 = contact.avatar.substring(commaIdx + 7);
        let imgType = "JPEG";
        if (contact.avatar.includes("image/png")) {
          imgType = "PNG";
        } else if (contact.avatar.includes("image/gif")) {
          imgType = "GIF";
        }
        vCardLines.push(`PHOTO;TYPE=${imgType};ENCODING=b:${rawBase64}`);
      }
    }

    // Embed social anchors
    if (contact.linkedin) {
      vCardLines.push(`X-SOCIALPROFILE;TYPE=linkedin:${contact.linkedin}`);
    }
    if (contact.twitter) {
      vCardLines.push(`X-SOCIALPROFILE;TYPE=twitter:${contact.twitter}`);
    }
    if (contact.github) {
      vCardLines.push(`X-SOCIALPROFILE;TYPE=github:${contact.github}`);
    }
    if (contact.instagram) {
      vCardLines.push(`X-SOCIALPROFILE;TYPE=instagram:${contact.instagram}`);
    }

    vCardLines.push("END:VCARD");

    const vCardBlob = new Blob([vCardLines.join("\n")], { type: "text/vcard;charset=utf-8" });
    const blobURL = URL.createObjectURL(vCardBlob);
    
    // Trigger download
    const link = document.createElement("a");
    link.href = blobURL;
    link.setAttribute("download", `${contact.firstName || "card"}_${contact.lastName || "net"}.vcf`);
    document.body.appendChild(link);
    link.click();
    
    // Clean-up
    document.body.removeChild(link);
    URL.revokeObjectURL(blobURL);
  };

  const handleShare = async () => {
    const currentUrl = window.location.href;
    const shareDetails = {
      title: contact ? `Contact Card of ${contact.firstName} ${contact.lastName}` : "CARDNET Contact Card",
      text: contact ? `${contact.firstName} ${contact.lastName} - ${contact.title} at ${contact.organization}` : "Digital Business Card Details",
      url: currentUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareDetails);
      } catch (err) {
        console.log("Device share dismissed or cancelled", err);
      }
    } else {
      // Fallback: Copy URL
      try {
        await navigator.clipboard.writeText(currentUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      } catch (err) {
        console.error("Clipboard write error:", err);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        <p className="text-zinc-500 font-mono text-xs mt-3 tracking-widest uppercase">
          Routing to cryptographic credentials...
        </p>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-950/40 border border-red-800 text-red-500 flex items-center justify-center mb-4">
          <ArrowLeft className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold tracking-tight">CARDNET Connection Offline</h3>
        <p className="text-zinc-500 text-sm max-w-sm mt-2">
          {error || "The requested digital business card identifier does not map to any live enterprise credentials."}
        </p>
        <Link 
          to="/"
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 text-xs font-semibold hover:bg-zinc-800 transition active:scale-95 cursor-pointer"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const shareableUrl = window.location.href;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-between py-8 px-4 relative overflow-hidden">
      {/* Decorative Blur Backdrops */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-zinc-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Controls */}
      <div className="w-full max-w-md flex justify-between items-center z-10">
        <Link 
          to="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/40 hover:bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800/40 rounded-full text-xs transition active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </Link>
        <button
          onClick={() => setShowQR(!showQR)}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition active:scale-95 border cursor-pointer ${
            showQR 
              ? "bg-indigo-600 text-white border-indigo-500" 
              : "bg-zinc-900/40 hover:bg-zinc-950 text-zinc-400 hover:text-white border-zinc-800/40"
          }`}
          type="button"
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>{showQR ? "Interactive Card" : "Show QR Scan"}</span>
        </button>
      </div>

      {/* Main Container Core */}
      <main className="w-full max-w-md my-auto pt-6 pb-12 flex flex-col items-center z-10 transition-all duration-300">
        
        {/* QR Code Presentation Toggle */}
        {showQR ? (
          <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-3xl p-8 flex flex-col items-center justify-center shadow-2xl relative">
            <h4 className="text-zinc-200 text-base font-semibold tracking-tight text-center">
              Scan Card Net QR
            </h4>
            <p className="text-zinc-500 text-xs text-center mt-1 mb-6">
              Hold a smartphone camera up to this matrix to pull vCard credentials.
            </p>
            <div className="bg-white p-4 rounded-2xl shadow-xl flex items-center justify-center">
              <QRCodeSVG 
                value={shareableUrl} 
                size={180} 
                level="Q" 
                fgColor="#09090b" 
                bgColor="#ffffff" 
              />
            </div>
            <div className="text-zinc-400 text-xs font-mono tracking-wider truncate mt-6 max-w-[280px]">
              {shareableUrl}
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center text-center">
            {/* Upper Profile Details Section */}
            <div className="relative w-28 h-28 rounded-full border-2 border-indigo-500/40 bg-zinc-900/80 shadow-2xl flex items-center justify-center text-3xl font-bold text-white tracking-widest overflow-hidden shrink-0">
              {contact.avatar ? (
                <img
                  src={contact.avatar}
                  alt={`${contact.firstName} ${contact.lastName}`}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                getInitials()
              )}
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white mt-4">
              {`${contact.firstName} ${contact.lastName}`}
            </h1>
            <p className="text-indigo-400 text-xs font-semibold tracking-tight mt-1">
              {contact.title}
            </p>
            {contact.organization && (
              <span className="mt-1 px-3 py-1 bg-zinc-900/80 border border-zinc-800/40 rounded-full text-zinc-400 text-[10px] font-mono uppercase tracking-wider">
                {contact.organization}
              </span>
            )}

            {/* Middle Quick Actions Ring (Call, Email, SMS, Maps Navigation) */}
            <div className="grid grid-cols-4 gap-6 my-8 w-full max-w-[280px]">
              {/* Call */}
              <a 
                href={contact.phone ? `tel:${contact.phone}` : "#"} 
                className={`flex flex-col items-center gap-1.5 group select-none ${!contact.phone && "opacity-25 pointer-events-none"}`}
                title="Dial corporate mobile number"
              >
                <div className="w-12 h-12 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-full flex items-center justify-center transition active:scale-95 text-zinc-300 hover:text-white shadow-lg">
                  <Phone className="w-5 h-5 group-hover:scale-105 transition" />
                </div>
                <span className="text-[10px] text-zinc-400 font-medium">Call</span>
              </a>

              {/* Email */}
              <a 
                href={contact.email ? `mailto:${contact.email}` : "#"} 
                className={`flex flex-col items-center gap-1.5 group select-none ${!contact.email && "opacity-25 pointer-events-none"}`}
                title="Send business correspondence email"
              >
                <div className="w-12 h-12 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-full flex items-center justify-center transition active:scale-95 text-zinc-300 hover:text-white shadow-lg">
                  <Mail className="w-5 h-5 group-hover:scale-105 transition" />
                </div>
                <span className="text-[10px] text-zinc-400 font-medium">Email</span>
              </a>

              {/* SMS */}
              <a 
                href={contact.phone ? `sms:${contact.phone}` : "#"} 
                className={`flex flex-col items-center gap-1.5 group select-none ${!contact.phone && "opacity-25 pointer-events-none"}`}
                title="Initiate cellular SMS"
              >
                <div className="w-12 h-12 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-full flex items-center justify-center transition active:scale-95 text-zinc-300 hover:text-white shadow-lg">
                  <MessageSquare className="w-5 h-5 group-hover:scale-105 transition" />
                </div>
                <span className="text-[10px] text-zinc-400 font-medium">SMS</span>
              </a>

              {/* Maps navigation */}
              <a 
                href={contact.address ? `https://maps.google.com/?q=${encodeURIComponent(contact.address)}` : "#"} 
                target="_blank" 
                rel="noopener noreferrer"
                className={`flex flex-col items-center gap-1.5 group select-none ${!contact.address && "opacity-25 pointer-events-none"}`}
                title="Navigate to corporate logistics center on Google Maps"
              >
                <div className="w-12 h-12 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-full flex items-center justify-center transition active:scale-95 text-zinc-300 hover:text-white shadow-lg">
                  <Compass className="w-5 h-5 group-hover:scale-105 transition" />
                </div>
                <span className="text-[10px] text-zinc-400 font-medium font-sans">Navigate</span>
              </a>
            </div>

            {/* Lower Segment: Frosted Glass Link Tiles for social profile navigation */}
            <div className="w-full space-y-3 mt-2 pr-1">
              {contact.website && (
                <a
                  href={contact.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-zinc-900/60 hover:bg-zinc-900/80 border border-zinc-800/50 rounded-2xl text-left transition select-none group backdrop-blur-md shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500">Corporate Website</p>
                      <p className="text-zinc-200 text-sm font-semibold mt-0.5 truncate max-w-[200px]">{contact.website}</p>
                    </div>
                  </div>
                  <UserPlus className="w-4 h-4 text-zinc-500 group-hover:translate-x-0.5 transition" />
                </a>
              )}

              {contact.linkedin && (
                <a
                  href={contact.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-zinc-900/60 hover:bg-zinc-900/80 border border-zinc-800/50 rounded-2xl text-left transition select-none group backdrop-blur-md shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-950/40 border border-indigo-900/30 flex items-center justify-center text-indigo-400">
                      <Linkedin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500">LinkedIn Profile</p>
                      <p className="text-zinc-200 text-sm font-semibold mt-0.5 truncate max-w-[200px]">Connect on LinkedIn</p>
                    </div>
                  </div>
                  <UserPlus className="w-4 h-4 text-zinc-500 group-hover:translate-x-0.5 transition" />
                </a>
              )}

              {contact.twitter && (
                <a
                  href={contact.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-zinc-900/60 hover:bg-zinc-900/80 border border-zinc-800/50 rounded-2xl text-left transition select-none group backdrop-blur-md shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300">
                      <Twitter className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500">Twitter (X)</p>
                      <p className="text-zinc-200 text-sm font-semibold mt-0.5 truncate max-w-[200px]">Follow Updates</p>
                    </div>
                  </div>
                  <UserPlus className="w-4 h-4 text-zinc-500 group-hover:translate-x-0.5 transition" />
                </a>
              )}

              {contact.github && (
                <a
                  href={contact.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-zinc-900/60 hover:bg-zinc-900/80 border border-zinc-800/50 rounded-2xl text-left transition select-none group backdrop-blur-md shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300">
                      <Github className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500">GitHub Directory</p>
                      <p className="text-zinc-200 text-sm font-semibold mt-0.5 truncate max-w-[200px]">Browse Repositories</p>
                    </div>
                  </div>
                  <UserPlus className="w-4 h-4 text-zinc-500 group-hover:translate-x-0.5 transition" />
                </a>
              )}

              {contact.instagram && (
                <a
                  href={contact.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-zinc-900/60 hover:bg-zinc-900/80 border border-zinc-800/50 rounded-2xl text-left transition select-none group backdrop-blur-md shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300">
                      <Instagram className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500">Instagram Handle</p>
                      <p className="text-zinc-200 text-sm font-semibold mt-0.5 truncate max-w-[200px]">View Highlights</p>
                    </div>
                  </div>
                  <UserPlus className="w-4 h-4 text-zinc-500 group-hover:translate-x-0.5 transition" />
                </a>
              )}

              {/* Physical location tile fallback */}
              {contact.address && (
                <div className="p-4 bg-zinc-900/40 border border-zinc-800/40 rounded-2xl text-left">
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500 mb-1">Corporate HQ Mailing</p>
                  <p className="text-zinc-300 text-xs font-medium leading-relaxed">{contact.address}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Two primary action buttons at bottom floating bar */}
      <div className="w-full max-w-md grid grid-cols-2 gap-3 mt-4 z-10">
        <button
          onClick={handleDownloadVCF}
          className="py-3 bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs rounded-xl transition active:scale-95 flex items-center justify-center gap-1.5 shadow-lg select-none cursor-pointer"
          type="button"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add to Contacts</span>
        </button>

        <button
          onClick={handleShare}
          className="py-3 bg-zinc-900 hover:bg-zinc-850 text-white border border-zinc-800 hover:border-zinc-700 font-bold text-xs rounded-xl transition active:scale-95 flex items-center justify-center gap-1.5 shadow-lg select-none cursor-pointer"
          type="button"
        >
          {copiedLink ? (
            <>
              <ClipboardCheck className="w-4 h-4 text-green-400" />
              <span className="text-green-400">Card Link Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              <span>Share My vCard</span>
            </>
          )}
        </button>
      </div>

      <footer className="mt-8 text-center text-zinc-600 text-[9px] font-mono tracking-wider uppercase z-10">
        Powered by CardNet Enterprise System
      </footer>
    </div>
  );
}
