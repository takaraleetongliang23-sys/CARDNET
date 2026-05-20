import React, { useState, useEffect } from "react";
import { Contact } from "../types";
import { X, Upload, Mail, Phone, Globe, MapPin, Briefcase, Building, Linkedin, Twitter, Github, Instagram, ArrowRight } from "lucide-react";

interface ContactCardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contact: Partial<Contact>) => Promise<void>;
  contact?: Contact | null; // Null/undefined means creating a new contact
}

export default function ContactCardFormModal({
  isOpen,
  onClose,
  onSave,
  contact,
}: ContactCardFormModalProps) {
  const [formData, setFormData] = useState<Partial<Contact>>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    title: "",
    organization: "",
    website: "",
    address: "",
    avatar: "",
    linkedin: "",
    twitter: "",
    github: "",
    instagram: "",
  });

  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Sync data when editing an existing contact
  useEffect(() => {
    if (contact) {
      setFormData({ ...contact });
    } else {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        title: "",
        organization: "",
        website: "",
        address: "",
        avatar: "",
        linkedin: "",
        twitter: "",
        github: "",
        instagram: "",
      });
    }
    setAvatarError(null);
    setSaveError(null);
  }, [contact, isOpen]);

  if (!isOpen) return null;

  // Handler for Base64 converting
  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setAvatarError(null);
    if (!file) return;

    // Reject formats that are not pictures
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please upload a valid image file");
      return;
    }

    // Check size <1.5MB
    const limit = 1.5 * 1024 * 1024;
    if (file.size > limit) {
      setAvatarError("Avatar image must be smaller than 1.5 megabytes (1.5MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, avatar: reader.result as string }));
    };
    reader.onerror = () => {
      setAvatarError("Could not parse image file");
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (field: keyof Contact, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName && !formData.lastName) {
      setSaveError("Provide at least a First Name or Last Name to identify the digital card");
      return;
    }

    try {
      setIsSaving(true);
      setSaveError(null);
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setSaveError(err?.message || "Something went wrong saving the contact.");
    } finally {
      setIsSaving(false);
    }
  };

  // Compute initials for display fallback
  const getInitials = () => {
    const f = formData.firstName?.trim()?.charAt(0) || "";
    const l = formData.lastName?.trim()?.charAt(0) || "";
    return (f + l).toUpperCase() || "CN";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/65 backdrop-blur-xs">
      {/* Modal Card wrapper with rounded edges, borders, shadows */}
      <div 
        id="cardnet-editor-modal"
        className="relative w-full max-w-5xl bg-white border border-zinc-200 text-zinc-900 rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[92vh] md:max-h-[90vh]"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-700 transition-all bg-zinc-50 hover:bg-zinc-100 p-2 rounded-full cursor-pointer z-10 border border-zinc-200"
          type="button"
          aria-label="Close modal dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left pane: Editable form fields (scrollable) */}
        <form
          onSubmit={handleSubmit}
          className="w-full md:w-[55%] p-6 md:p-8 flex flex-col overflow-y-auto border-b md:border-b-0 md:border-r border-zinc-205"
        >
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
              {contact ? "Edit Digital Card" : "New Digital Business Card"}
            </h2>
            <p className="text-zinc-550 text-xs mt-1">
              Construct high-fidelity credentials ready for mobile vCard installation and instant QR scan.
            </p>
          </div>

          {saveError && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs text-center font-semibold">
              {saveError}
            </div>
          )}

          {/* Avatar Upload */}
          <div className="mt-6 flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-full border border-zinc-150 bg-indigo-50 font-bold text-indigo-780 text-sm flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
              {formData.avatar ? (
                <img
                  src={formData.avatar}
                  alt="Avatar Preview"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                getInitials()
              )}
            </div>
            <div className="flex-1">
              <label 
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-zinc-650 text-xs font-semibold cursor-pointer transition border border-zinc-200 shadow-2xs"
                htmlFor="avatar-file-upload"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Photograph</span>
                <input
                  id="avatar-file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFile}
                  className="hidden"
                />
              </label>
              <div className="text-[10px] text-zinc-450 mt-1 font-mono">
                Aspect ratio 1:1, Max size 1.5MB (JPEG/PNG)
              </div>
              {avatarError && (
                <div className="text-[11px] text-red-500 font-medium mt-1">
                  {avatarError}
                </div>
              )}
            </div>
          </div>

          <div className="my-5 border-t border-zinc-100" />

          {/* Form input fields */}
          <div className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-650 text-xs font-semibold mb-1" htmlFor="firstName">First Name</label>
                <input
                  id="firstName"
                  type="text"
                  value={formData.firstName || ""}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  placeholder="Jane"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-2 px-3 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-zinc-650 text-xs font-semibold mb-1" htmlFor="lastName">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  value={formData.lastName || ""}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  placeholder="Doe"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-2 px-3 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Corporate Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-650 text-xs font-semibold mb-1" htmlFor="title">Job Title</label>
                <input
                  id="title"
                  type="text"
                  value={formData.title || ""}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="VP of Engineering"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-2 px-3 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-zinc-650 text-xs font-semibold mb-1" htmlFor="organization">Organization</label>
                <input
                  id="organization"
                  type="text"
                  value={formData.organization || ""}
                  onChange={(e) => handleInputChange("organization", e.target.value)}
                  placeholder="Acme Corp"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-2 px-3 text-sm text-zinc-808 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-650 text-xs font-semibold mb-1" htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="jane.doe@acme.com"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-2 px-3 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-zinc-650 text-xs font-semibold mb-1" htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  type="text"
                  value={formData.phone || ""}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+1 (555) 019-2834"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-2 px-3 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Website & Address */}
            <div>
              <label className="block text-zinc-600 text-xs font-semibold mb-1" htmlFor="website">Website Link</label>
              <input
                id="website"
                type="text"
                value={formData.website || ""}
                onChange={(e) => handleInputChange("website", e.target.value)}
                placeholder="https://acme.com"
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-2 px-3 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-zinc-600 text-xs font-semibold mb-1" htmlFor="address">Physical Address</label>
              <input
                id="address"
                type="text"
                value={formData.address || ""}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="1600 Amphitheatre Pkwy, Mountain View, CA 94043"
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-2 px-3 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Social media linkages */}
            <div className="border-t border-zinc-100 pt-3">
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-3 font-mono">
                Social Profiles
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-semibold mb-1">
                    <Linkedin className="w-3.5 h-3.5 text-zinc-400" />
                    <label htmlFor="linkedin-input">LinkedIn URL</label>
                  </div>
                  <input
                    id="linkedin-input"
                    type="text"
                    value={formData.linkedin || ""}
                    onChange={(e) => handleInputChange("linkedin", e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-2 px-3 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-semibold mb-1">
                    <Twitter className="w-3.5 h-3.5 text-zinc-400" />
                    <label htmlFor="twitter-input">Twitter (X) URL</label>
                  </div>
                  <input
                    id="twitter-input"
                    type="text"
                    value={formData.twitter || ""}
                    onChange={(e) => handleInputChange("twitter", e.target.value)}
                    placeholder="https://twitter.com/..."
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-2 px-3 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-zinc-550 text-xs font-semibold mb-1">
                    <Github className="w-3.5 h-3.5 text-zinc-400" />
                    <label htmlFor="github-input">GitHub URL</label>
                  </div>
                  <input
                    id="github-input"
                    type="text"
                    value={formData.github || ""}
                    onChange={(e) => handleInputChange("github", e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-2 px-3 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-zinc-550 text-xs font-semibold mb-1">
                    <Instagram className="w-3.5 h-3.5 text-zinc-400" />
                    <label htmlFor="instagram-input">Instagram URL</label>
                  </div>
                  <input
                    id="instagram-input"
                    type="text"
                    value={formData.instagram || ""}
                    onChange={(e) => handleInputChange("instagram", e.target.value)}
                    placeholder="https://instagram.com/..."
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-2 px-3 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-zinc-200 rounded-lg text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 text-sm font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-zinc-150 disabled:text-zinc-400 rounded-lg text-sm font-semibold transition flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
            >
              {isSaving ? "Saving..." : contact ? "Update Card" : "Generate Card"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Right pane: Dedicated Live Preview reflecting live typed data */}
        <div className="w-full md:w-[45%] bg-zinc-950 p-6 md:p-8 flex flex-col items-center justify-center min-h-[300px] md:min-h-0 relative select-none">
          <div className="absolute top-4 left-6 text-zinc-600 text-[10px] font-mono tracking-widest uppercase">
            Interactive Live Preview
          </div>

          <div className="w-full max-w-sm aspect-[1.62/1] relative rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 p-6 shadow-xl flex flex-col justify-between overflow-hidden">
            {/* Ambient Background Gradient for modern aesthetic */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex justify-between items-start">
              {/* Name & Title */}
              <div>
                <h3 className="text-xl font-bold tracking-tight text-white leading-tight">
                  {formData.firstName || formData.lastName
                    ? `${formData.firstName || ""} ${formData.lastName || ""}`.trim()
                    : "Your Full Name"}
                </h3>
                <p className="text-zinc-400 text-xs font-semibold mt-1">
                  {formData.title || "Principal Solutions Architect"}
                </p>
                <p className="text-indigo-400 text-[10px] uppercase tracking-wider font-semibold mt-0.5">
                  {formData.organization || "Enterprise Corp Ltd."}
                </p>
              </div>

              {/* Real-time Avatar Circle Fallback */}
              <div className="w-14 h-14 rounded-full border border-zinc-600 bg-zinc-800/80 shadow-inner flex items-center justify-center font-bold text-white tracking-widest text-sm overflow-hidden shrink-0">
                {formData.avatar ? (
                  <img
                    src={formData.avatar}
                    alt="Card Preview Avatar"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  getInitials()
                )}
              </div>
            </div>

            {/* Simulated interactive contact rows */}
            <div className="space-y-1.5 border-t border-zinc-800/80 pt-4">
              <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                <Mail className="w-3 h-3 text-zinc-500" />
                <span className="truncate">{formData.email || "hello@domain.com"}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                <Phone className="w-3 h-3 text-zinc-500" />
                <span>{formData.phone || "+1 (555) 000-0000"}</span>
              </div>
              {formData.website && (
                <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                  <Globe className="w-3 h-3 text-zinc-500" />
                  <span className="truncate">{formData.website}</span>
                </div>
              )}
              {formData.address && (
                <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                  <MapPin className="w-3 h-3 text-zinc-500" />
                  <span className="truncate">{formData.address}</span>
                </div>
              )}
            </div>

            {/* Social Indicators */}
            <div className="flex items-center justify-between mt-4 self-stretch text-[9px] font-mono text-zinc-500">
              <div className="flex gap-2">
                {formData.linkedin && <Linkedin className="w-3 h-3 text-zinc-400" />}
                {formData.twitter && <Twitter className="w-3 h-3 text-zinc-400" />}
                {formData.github && <Github className="w-3 h-3 text-zinc-400" />}
                {formData.instagram && <Instagram className="w-3 h-3 text-zinc-400" />}
              </div>
              <span>CARDNET CARD DIGITAL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
