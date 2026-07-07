import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Check, AlertCircle, FileText, Search, ShieldCheck, 
  Send, DollarSign, List, Plus, Landmark, History, FileCheck, ExternalLink, Mail
} from "lucide-react";
import DocumentDashboard from "./DocumentDashboard";

interface TransmissionsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  type: string; // The specific menu action/slug
  title: string;
  subtitle: string;
  userEmail?: string;
  isLoggedIn?: boolean;
  currentUserEmail?: string;
  onLoginSuccess?: (email: string, token: string) => void;
  userLicenses?: any[];
  userRequests?: any[];
  userEmailLogs?: any[];
  onRefreshData?: () => void;
}

export default function TransmissionsOverlay({
  isOpen,
  onClose,
  type,
  title,
  subtitle,
  userEmail = "evianaconcepts1@gmail.com",
  isLoggedIn = false,
  currentUserEmail,
  onLoginSuccess,
  userLicenses = [],
  userRequests = [],
  userEmailLogs = [],
  onRefreshData
}: TransmissionsOverlayProps) {
  // License verification state
  const [verificationInput, setVerificationInput] = useState("");
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Custom Login State inside TransmissionsOverlay
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginIsRegister, setLoginIsRegister] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const handleOverlayLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setLoginError("Credentials cannot be null.");
      return;
    }
    setLoginError("");
    setLoginLoading(true);
    try {
      const endpoint = loginIsRegister ? "/api/auth/signup" : "/api/auth/login";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail.toLowerCase().trim(), password: loginPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLoginSuccess(true);
        if (onLoginSuccess) {
          onLoginSuccess(data.email, data.token);
        }
        setTimeout(() => {
          onClose();
          setLoginEmail("");
          setLoginPassword("");
          setLoginSuccess(false);
        }, 1500);
      } else {
        setLoginError(data.error || "Authentication handshake rejected.");
      }
    } catch (err: any) {
      setLoginError("Connection refused: " + err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  // Clearance state
  const [clearanceStep, setClearanceStep] = useState<"choose" | "review" | "approval" | "final">("choose");
  const [selectedContractType, setSelectedContractType] = useState<string | null>(null);
  const [contractSignature, setContractSignature] = useState("");

  // Publishing form state
  const [isPublishingSubmitting, setIsPublishingSubmitting] = useState(false);
  const [publishingSuccess, setPublishingSuccess] = useState(false);
  const [iswcRequestSong, setIswcRequestSong] = useState("");

  // Metadata form state
  const [isMetadataSubmitting, setIsMetadataSubmitting] = useState(false);
  const [metadataSuccess, setMetadataSuccess] = useState(false);
  const [isrcRequestSong, setIsrcRequestSong] = useState("");

  // Ownership state
  const [isOwnershipSubmitting, setIsOwnershipSubmitting] = useState(false);
  const [ownershipSuccess, setOwnershipSuccess] = useState(false);
  const [sampleDeclarationText, setSampleDeclarationText] = useState("");

  // Royalty payment state
  const [isRoyaltySaving, setIsRoyaltySaving] = useState(false);
  const [royaltySuccess, setRoyaltySuccess] = useState(false);
  const [paymentInstructions, setPaymentInstructions] = useState("");

  // Enterprise form state
  const [isEnterpriseSubmitting, setIsEnterpriseSubmitting] = useState(false);
  const [enterpriseSuccess, setEnterpriseSuccess] = useState(false);

  // General contact/support form states
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSuccess, setSupportSuccess] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const [contactSuccess, setContactSuccess] = useState(false);

  // Document Vault modal state inside dashboards
  const [showDocumentVault, setShowDocumentVault] = useState(false);

  // License transfer state
  const [transferringId, setTransferringId] = useState<string | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [transferError, setTransferError] = useState("");
  const [transferSuccessMsg, setTransferSuccessMsg] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  // Administrative Console CRUD state
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminPayments, setAdminPayments] = useState<any[]>([]);
  const [adminActiveTab, setAdminActiveTab] = useState<"users" | "payments">("payments");
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [adminSuccessMsg, setAdminSuccessMsg] = useState("");
  const [activeAdminLocalView, setActiveAdminLocalView] = useState(false);
  
  // User Form
  const [showUserForm, setShowUserForm] = useState(false);
  const [userFormEmail, setUserFormEmail] = useState("");
  const [userFormPassword, setUserFormPassword] = useState("");
  const [userFormIsEdit, setUserFormIsEdit] = useState(false);
  
  // Payment Form
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentFormId, setPaymentFormId] = useState("");
  const [paymentFormEmail, setPaymentFormEmail] = useState("");
  const [paymentFormAmount, setPaymentFormAmount] = useState("");
  const [paymentFormStatus, setPaymentFormStatus] = useState("success");
  const [paymentFormIsEdit, setPaymentFormIsEdit] = useState(false);

  React.useEffect(() => {
    const slug = type.toLowerCase().replace(/[^a-z0-9]/g, "-");
    if (isOpen && (slug === "admin" || slug === "admin-console" || slug === "system" || activeAdminLocalView)) {
      fetchAdminData();
    }
  }, [isOpen, type, activeAdminLocalView]);

  if (!isOpen) return null;

  // Handle license verification lookup
  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationInput.trim()) return;

    setIsVerifying(true);
    setVerificationResult(null);

    setTimeout(() => {
      setIsVerifying(false);
      const isOwlCode = verificationInput.toUpperCase().includes("OWL") || verificationInput.includes("823") || verificationInput.includes("01");
      
      setVerificationResult({
        id: verificationInput.toUpperCase(),
        status: isOwlCode ? "SECURED / ACTIVE" : "VALIDATED / REGISTERED",
        composition: "The Owl Clock - Midnight Drift (Theme II)",
        type: "Commercial Sync & Broadcast License",
        isrc: "US-LMN-26-00301",
        iswc: "T-302.459.882-1",
        issuedTo: userEmail,
        issuedDate: "2026-06-30 UTC",
        signature: "DIGITALLY REGISTERED VIA SECURE CRYPTOGRAPHIC PROTOCOL",
        hash: "0x8F9C2B7A1E4D039F"
      });
    }, 1200);
  };

  const handleTransferLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferringId || !recipientEmail) return;
    setIsTransferring(true);
    setTransferError("");
    setTransferSuccessMsg("");
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/licenses/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          licenseId: transferringId,
          recipientEmail: recipientEmail.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTransferSuccessMsg(`License ${transferringId} successfully transferred to ${recipientEmail}!`);
        setRecipientEmail("");
        // Refresh data and clean up states
        setTimeout(() => {
          setTransferringId(null);
          setTransferSuccessMsg("");
          if (onRefreshData) onRefreshData();
        }, 2500);
      } else {
        setTransferError(data.error || "Failed to execute transfer.");
      }
    } catch (err: any) {
      setTransferError("Network connection error: " + err.message);
    } finally {
      setIsTransferring(false);
    }
  };

  // Administrative Operations CRUD handlers
  const fetchAdminData = async () => {
    setAdminLoading(true);
    setAdminError("");
    try {
      const token = localStorage.getItem("token");
      const [usersRes, paymentsRes] = await Promise.all([
        fetch("/api/admin/users", {
          headers: token ? { "Authorization": `Bearer ${token}` } : {}
        }),
        fetch("/api/admin/payments", {
          headers: token ? { "Authorization": `Bearer ${token}` } : {}
        })
      ]);
      const usersData = await usersRes.json();
      const paymentsData = await paymentsRes.json();
      if (usersData.success) setAdminUsers(usersData.users);
      if (paymentsData.success) setAdminPayments(paymentsData.payments);
    } catch (err: any) {
      setAdminError("Failed to fetch administrative ledger: " + err.message);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoading(true);
    setAdminError("");
    setAdminSuccessMsg("");
    try {
      const token = localStorage.getItem("token");
      const endpoint = "/api/admin/users";
      const method = userFormIsEdit ? "PUT" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          email: userFormEmail.toLowerCase().trim(),
          password: userFormPassword
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminSuccessMsg(userFormIsEdit ? "Access cipher updated successfully." : "Terminal account registered successfully.");
        setShowUserForm(false);
        setUserFormEmail("");
        setUserFormPassword("");
        fetchAdminData();
      } else {
        setAdminError(data.error || "Failed to save user terminal.");
      }
    } catch (err: any) {
      setAdminError("Connection lost: " + err.message);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleDeleteUser = async (email: string) => {
    if (!window.confirm(`Wipe user terminal ${email} permanently?`)) return;
    setAdminLoading(true);
    setAdminError("");
    setAdminSuccessMsg("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminSuccessMsg("Terminal successfully deleted from secure indices.");
        fetchAdminData();
      } else {
        setAdminError(data.error || "Failed to purge user terminal.");
      }
    } catch (err: any) {
      setAdminError("Connection lost: " + err.message);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoading(true);
    setAdminError("");
    setAdminSuccessMsg("");
    try {
      const token = localStorage.getItem("token");
      const endpoint = "/api/admin/payments";
      const method = paymentFormIsEdit ? "PUT" : "POST";
      const bodyPayload = paymentFormIsEdit 
        ? { id: paymentFormId, email: paymentFormEmail, amount: paymentFormAmount, status: paymentFormStatus }
        : { email: paymentFormEmail, amount: paymentFormAmount, status: paymentFormStatus };

      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(bodyPayload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminSuccessMsg(paymentFormIsEdit ? "Payment metadata updated successfully." : "Manual payment record injected successfully.");
        setShowPaymentForm(false);
        setPaymentFormId("");
        setPaymentFormEmail("");
        setPaymentFormAmount("");
        fetchAdminData();
      } else {
        setAdminError(data.error || "Failed to save payment record.");
      }
    } catch (err: any) {
      setAdminError("Connection lost: " + err.message);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (!window.confirm(`Purge payment record ${id} from database?`)) return;
    setAdminLoading(true);
    setAdminError("");
    setAdminSuccessMsg("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/payments", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminSuccessMsg("Payment record purged from archive databases.");
        fetchAdminData();
      } else {
        setAdminError(data.error || "Failed to delete payment record.");
      }
    } catch (err: any) {
      setAdminError("Connection lost: " + err.message);
    } finally {
      setAdminLoading(false);
    }
  };

  const renderAdminPanel = () => {
    return (
      <div className="space-y-4 text-left font-sans select-text">
        <div className="flex justify-between items-start border-b border-zinc-900 pb-2">
          <div className="space-y-0.5">
            <span className="text-[8px] tracking-[0.25em] text-[#D9D6CA] font-bold uppercase block">
              [ SYSTEM ADMINISTRATIVE CONSOLE ]
            </span>
            <p className="text-zinc-500 text-[10px] leading-tight uppercase">
              Manage secure terminal access and inspect transactional indices.
            </p>
          </div>
          <button 
            onClick={fetchAdminData} 
            disabled={adminLoading}
            className="text-[#00E676] bg-[#00E676]/5 border border-[#00E676]/20 px-2 py-1 text-[8px] font-mono font-bold hover:bg-[#00E676]/10 transition-colors uppercase whitespace-nowrap cursor-pointer"
          >
            {adminLoading ? "Syncing..." : "Reload Ledger ⇄"}
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-zinc-900">
          <button
            onClick={() => {
              setAdminActiveTab("payments");
              setAdminError("");
              setAdminSuccessMsg("");
            }}
            className={`flex-1 py-2 text-center text-[10px] font-mono tracking-wider uppercase font-bold transition-all cursor-pointer ${adminActiveTab === "payments" ? "text-[#00E676] border-b-2 border-[#00E676] bg-[#00E676]/5" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            Payments Ledger ({adminPayments.length})
          </button>
          <button
            onClick={() => {
              setAdminActiveTab("users");
              setAdminError("");
              setAdminSuccessMsg("");
            }}
            className={`flex-1 py-2 text-center text-[10px] font-mono tracking-wider uppercase font-bold transition-all cursor-pointer ${adminActiveTab === "users" ? "text-yellow-500 border-b-2 border-yellow-500 bg-yellow-500/5" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            Terminal Registry ({adminUsers.length})
          </button>
        </div>

        {adminError && (
          <div className="text-[9px] font-mono text-red-500 uppercase bg-red-950/10 border border-red-900/40 p-2 rounded-sm leading-tight">
            ERROR: {adminError}
          </div>
        )}

        {adminSuccessMsg && (
          <div className="text-[9px] font-mono text-[#00E676] uppercase bg-[#00E676]/10 border border-[#00E676]/40 p-2 rounded-sm leading-tight">
            SUCCESS: {adminSuccessMsg}
          </div>
        )}

        {/* ----------------- TAB: PAYMENTS ----------------- */}
        {adminActiveTab === "payments" && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-zinc-500 font-mono uppercase">TRANSACTIONS ARCHIVE</span>
              <button
                onClick={() => {
                  setPaymentFormIsEdit(false);
                  setPaymentFormEmail("");
                  setPaymentFormAmount("");
                  setPaymentFormStatus("success");
                  setShowPaymentForm(!showPaymentForm);
                  setShowUserForm(false);
                }}
                className="bg-[#00E676] text-black font-mono font-bold text-[8.5px] px-2 py-1 hover:bg-white transition-colors cursor-pointer"
              >
                {showPaymentForm ? "Close Form ✕" : "+ Ingest Payment"}
              </button>
            </div>

            {/* Payment Input Form */}
            {showPaymentForm && (
              <motion.form 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                onSubmit={handleSavePayment}
                className="bg-neutral-950 border border-zinc-900 p-3 rounded-sm space-y-2.5"
              >
                <span className="text-[8.5px] text-zinc-400 font-mono font-bold block uppercase">
                  {paymentFormIsEdit ? `Edit Payment Reference: ${paymentFormId}` : "Manual Payment Ledger Ingestion"}
                </span>
                
                <div className="space-y-1.5">
                  <input 
                    type="email"
                    required
                    placeholder="User Terminal Email"
                    value={paymentFormEmail}
                    onChange={(e) => setPaymentFormEmail(e.target.value)}
                    className="w-full bg-black border border-zinc-850 px-2.5 py-1.5 text-[10px] font-mono text-[#D9D6CA] outline-none focus:border-zinc-700 uppercase"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="number"
                      required
                      placeholder="Amount (NGN)"
                      value={paymentFormAmount}
                      onChange={(e) => setPaymentFormAmount(e.target.value)}
                      className="w-full bg-black border border-zinc-850 px-2.5 py-1.5 text-[10px] font-mono text-[#D9D6CA] outline-none focus:border-zinc-700"
                    />
                    <select
                      value={paymentFormStatus}
                      onChange={(e) => setPaymentFormStatus(e.target.value)}
                      className="w-full bg-black border border-zinc-850 px-2 py-1.5 text-[10px] font-mono text-[#D9D6CA] outline-none focus:border-zinc-700 uppercase"
                    >
                      <option value="success">Success</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#00E676] text-black font-mono font-bold text-[9px] py-2 hover:bg-white transition-colors cursor-pointer uppercase"
                >
                  {paymentFormIsEdit ? "Save Payment Changes" : "Commit Payment Record"}
                </button>
              </motion.form>
            )}

            {/* Payments List */}
            <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 border border-zinc-900 bg-neutral-950 p-2 rounded-sm">
              {adminPayments.length === 0 ? (
                <div className="text-zinc-650 font-mono text-[9px] uppercase text-center py-6">
                  No payment indexes present.
                </div>
              ) : (
                adminPayments.map((pay: any) => (
                  <div key={pay.id} className="border border-zinc-900 bg-black p-2 rounded-[2px] text-[10px] space-y-1.5">
                    <div className="flex justify-between items-start">
                      <div className="font-mono">
                        <span className="text-zinc-500 uppercase">REF:</span> <span className="text-[#00E676] font-bold">{pay.id}</span>
                      </div>
                      <span className={`text-[8px] px-1.5 py-0.2 font-bold uppercase ${pay.status === "success" ? "text-[#00E676] bg-[#00E676]/10" : pay.status === "failed" ? "text-red-500 bg-red-500/10" : "text-yellow-500 bg-yellow-500/10"}`}>
                        {pay.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 text-[9px] font-mono text-zinc-400">
                      <div className="truncate">EMAIL: {pay.email}</div>
                      <div className="text-right">AMT: {pay.amount?.toLocaleString()} {pay.currency || "NGN"}</div>
                      <div>GATEWAY: {pay.gateway || "manual"}</div>
                      <div className="text-right text-[8px] text-zinc-600 truncate">{pay.date}</div>
                    </div>

                    <div className="flex justify-end gap-2.5 pt-1 border-t border-zinc-950">
                      <button
                        onClick={() => {
                          setPaymentFormIsEdit(true);
                          setPaymentFormId(pay.id);
                          setPaymentFormEmail(pay.email);
                          setPaymentFormAmount(pay.amount?.toString() || "");
                          setPaymentFormStatus(pay.status || "success");
                          setShowPaymentForm(true);
                          setShowUserForm(false);
                        }}
                        className="text-zinc-400 hover:text-white font-mono text-[8.5px] uppercase cursor-pointer"
                      >
                        Edit status
                      </button>
                      <button
                        onClick={() => handleDeletePayment(pay.id)}
                        className="text-red-500 hover:text-red-400 font-mono text-[8.5px] uppercase cursor-pointer"
                      >
                        Purge
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ----------------- TAB: USERS ----------------- */}
        {adminActiveTab === "users" && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-zinc-500 font-mono uppercase">AUTHENTICATED TERMINALS</span>
              <button
                onClick={() => {
                  setUserFormIsEdit(false);
                  setUserFormEmail("");
                  setUserFormPassword("");
                  setShowUserForm(!showUserForm);
                  setShowPaymentForm(false);
                }}
                className="bg-yellow-500 text-black font-mono font-bold text-[8.5px] px-2 py-1 hover:bg-white transition-colors cursor-pointer"
              >
                {showUserForm ? "Close Form ✕" : "+ Ingest User"}
              </button>
            </div>

            {/* User Input Form */}
            {showUserForm && (
              <motion.form 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                onSubmit={handleSaveUser}
                className="bg-neutral-950 border border-zinc-900 p-3 rounded-sm space-y-2.5"
              >
                <span className="text-[8.5px] text-zinc-400 font-mono font-bold block uppercase">
                  {userFormIsEdit ? `Reset Access Cipher for ${userFormEmail}` : "Register New Terminal Terminal"}
                </span>
                
                <div className="space-y-2">
                  <input 
                    type="email"
                    required
                    disabled={userFormIsEdit}
                    placeholder="Terminal Email address"
                    value={userFormEmail}
                    onChange={(e) => setUserFormEmail(e.target.value)}
                    className="w-full bg-black border border-zinc-850 px-2.5 py-1.5 text-[10px] font-mono text-[#D9D6CA] disabled:text-zinc-650 outline-none focus:border-zinc-700 uppercase"
                  />
                  <input 
                    type="password"
                    required
                    placeholder={userFormIsEdit ? "New Access Code (Cipher)" : "Access Code (Cipher)"}
                    value={userFormPassword}
                    onChange={(e) => setUserFormPassword(e.target.value)}
                    className="w-full bg-black border border-zinc-850 px-2.5 py-1.5 text-[10px] font-mono text-[#D9D6CA] outline-none focus:border-zinc-700"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-yellow-500 text-black font-mono font-bold text-[9px] py-2 hover:bg-white transition-colors cursor-pointer uppercase"
                >
                  {userFormIsEdit ? "Save Cipher Code" : "Provision Terminal Network"}
                </button>
              </motion.form>
            )}

            {/* Users List */}
            <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 border border-zinc-900 bg-neutral-950 p-2 rounded-sm">
              {adminUsers.length === 0 ? (
                <div className="text-zinc-650 font-mono text-[9px] uppercase text-center py-6">
                  No terminal index directories found.
                </div>
              ) : (
                adminUsers.map((usr: any) => (
                  <div key={usr.email} className="border border-zinc-900 bg-black p-2.5 rounded-[2px] text-[10px] space-y-1.5 flex flex-col">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-zinc-200 uppercase font-semibold">{usr.email}</span>
                      <span className="text-[8px] px-1.5 py-0.2 text-yellow-500 bg-yellow-500/10 font-mono font-bold uppercase truncate">
                        {usr.status || "VERIFIED"}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-[8.5px] font-mono text-zinc-500 pt-1 border-t border-zinc-950">
                      <span>ESTD: {usr.createdAt?.toString().substring(0, 10)}</span>
                      <div className="flex gap-2.5">
                        <button
                          onClick={() => {
                            setUserFormIsEdit(true);
                            setUserFormEmail(usr.email);
                            setUserFormPassword("");
                            setShowUserForm(true);
                            setShowPaymentForm(false);
                          }}
                          className="text-zinc-400 hover:text-white uppercase cursor-pointer text-[8px]"
                        >
                          Set Cipher
                        </button>
                        {usr.email !== "evianaconcepts1@gmail.com" && (
                          <button
                            onClick={() => handleDeleteUser(usr.email)}
                            className="text-red-500 hover:text-red-400 uppercase cursor-pointer text-[8px]"
                          >
                            Purge
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  };


  // Render content based on mapped slug or title
  const renderContent = () => {
    const slug = type.toLowerCase().replace(/[^a-z0-9]/g, "-");

    // ----------------------------------------------------
    // 1. LICENSE VERIFICATION & CERTIFICATE RECORD
    // ----------------------------------------------------
    if (slug === "license-verification" || slug === "license-certificate" || slug === "verification") {
      return (
        <div className="space-y-5 text-left">
          <div className="space-y-1">
            <span className="text-[8px] tracking-[0.25em] text-[#D9D6CA] font-bold uppercase block">
              [ SECURED VERIFICATION PORTAL ]
            </span>
            <p className="text-zinc-400 text-[10.5px] leading-relaxed uppercase">
              Enter a License ID, Certificate ID, or Composition ID to query the secure cryptographic registry.
            </p>
          </div>

          <form onSubmit={handleVerify} className="flex gap-2">
            <input 
              type="text"
              placeholder="e.g. OWL-823"
              value={verificationInput}
              onChange={(e) => setVerificationInput(e.target.value)}
              className="flex-grow bg-black border border-zinc-850 px-3.5 py-2.5 text-[11px] font-mono text-[#D9D6CA] focus:outline-none focus:border-[#D9D6CA]/40 uppercase placeholder-zinc-700"
            />
            <button 
              type="submit"
              className="bg-[#D9D6CA] text-black font-mono font-bold text-[10px] tracking-widest px-4 py-2.5 hover:bg-white transition-colors cursor-pointer whitespace-nowrap"
            >
              {isVerifying ? "QUERYING..." : "VERIFY"}
            </button>
          </form>

          {isVerifying && (
            <div className="py-8 flex flex-col items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-[9px] text-zinc-500 tracking-widest uppercase">LOOKING UP REGISTRY...</span>
            </div>
          )}

          {verificationResult && !isVerifying && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-zinc-850 bg-neutral-950 p-4 space-y-4 rounded-sm relative overflow-hidden"
            >
              <div className="absolute top-2 right-2 text-[7px] text-zinc-700 uppercase font-mono tracking-wider">
                CERTIFICATE RECORD
              </div>

              <div className="flex items-start gap-2.5 border-b border-zinc-900 pb-3">
                <div className="w-6 h-6 bg-[#00E676]/10 border border-[#00E676]/40 text-[#00E676] rounded-full flex items-center justify-center shrink-0">
                  <ShieldCheck size={13} />
                </div>
                <div className="space-y-0.5">
                  <div className="text-[9.5px] font-bold text-[#00E676] tracking-wider uppercase">
                    LICENSE AUTHENTICATED — {verificationResult.status}
                  </div>
                  <div className="text-[8.5px] text-zinc-500 font-mono">
                    ID: {verificationResult.id}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-3.5 gap-x-2 text-[10px] font-mono">
                <div>
                  <span className="text-zinc-650 text-[8px] uppercase block tracking-wider">COMPOSITION:</span>
                  <span className="text-zinc-300 font-medium uppercase">{verificationResult.composition}</span>
                </div>
                <div>
                  <span className="text-zinc-650 text-[8px] uppercase block tracking-wider">TYPE:</span>
                  <span className="text-[#D9D6CA] uppercase">{verificationResult.type}</span>
                </div>
                <div>
                  <span className="text-zinc-650 text-[8px] uppercase block tracking-wider">ISRC / ISWC:</span>
                  <span className="text-zinc-400 font-mono uppercase">{verificationResult.isrc} / {verificationResult.iswc}</span>
                </div>
                <div>
                  <span className="text-zinc-650 text-[8px] uppercase block tracking-wider">ISSUED TO:</span>
                  <span className="text-zinc-400 truncate block">{verificationResult.issuedTo}</span>
                </div>
                <div className="col-span-2 border-t border-zinc-900 pt-3">
                  <span className="text-zinc-650 text-[8px] uppercase block tracking-wider">SIGNATURE RECORD:</span>
                  <span className="text-[8.5px] text-zinc-500 font-mono leading-relaxed block tracking-tight">
                    {verificationResult.signature}
                  </span>
                  <span className="text-[8px] text-[#D9D6CA]/40 font-mono mt-1 block">
                    HASH: {verificationResult.hash}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Quick links as requested */}
          <div className="border-t border-zinc-900 pt-4 flex justify-between items-center text-[9px] font-mono text-zinc-500">
            <span>REGISTRY VERSION 4.02</span>
            <button 
              onClick={() => setShowDocumentVault(true)}
              className="text-[#D9D6CA] hover:underline cursor-pointer uppercase flex items-center gap-1"
            >
              Access Document Vault ↗
            </button>
          </div>
        </div>
      );
    }

    // ----------------------------------------------------
    // 2. REQUEST CLEARANCE (CONTRACTS SEQUENCE)
    // ----------------------------------------------------
    if (slug === "request-clearance") {
      const contractTypes = [
        { id: "Access", name: "Access License Agreement", desc: "Non-commercial evaluation, private streaming, and architectural study." },
        { id: "Release", name: "Release License Agreement", desc: "Indie release rights, streaming distribution up to 50,000 plays." },
        { id: "Commercial", name: "Commercial License Agreement", desc: "Global DSP distribution, broadcast rights, unlimited streaming." },
        { id: "Exclusive", name: "Exclusive Acquisition Agreement", desc: "Full buyout, complete ownership transfer, catalog removal." },
        { id: "Sync", name: "Sync License Agreement", desc: "Master synchronization rights for films, games, series, and advertising." }
      ];

      return (
        <div className="space-y-5 text-left">
          {clearanceStep === "choose" && (
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[8px] tracking-[0.25em] text-[#D9D6CA] font-bold uppercase block">
                  [ STEP 1: CHOOSE CONTRACT TYPE ]
                </span>
                <p className="text-zinc-400 text-[10.5px] leading-relaxed uppercase">
                  Select the required license archetype to initiate the clearance procedure.
                </p>
              </div>

              <div className="space-y-2.5">
                {contractTypes.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedContractType(c.name);
                      setClearanceStep("review");
                    }}
                    className="w-full text-left border border-zinc-850 hover:border-[#D9D6CA]/40 bg-black hover:bg-zinc-950 p-3.5 transition-all flex justify-between items-center group cursor-pointer"
                  >
                    <div className="space-y-1 min-w-0 pr-4">
                      <div className="text-[11px] font-bold text-white group-hover:text-[#D9D6CA] uppercase tracking-wider">
                        {c.name}
                      </div>
                      <div className="text-[9px] text-zinc-500 uppercase leading-snug">
                        {c.desc}
                      </div>
                    </div>
                    <span className="text-[#D9D6CA] text-[10px] tracking-widest shrink-0 uppercase group-hover:translate-x-1 transition-transform">
                      SELECT &gt;
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {clearanceStep === "review" && selectedContractType && (
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[8px] tracking-[0.25em] text-[#D9D6CA] font-bold uppercase block">
                  [ STEP 2: REVIEW LICENSE ]
                </span>
                <h4 className="text-white font-bold text-xs uppercase tracking-widest">
                  {selectedContractType}
                </h4>
              </div>

              <div className="border border-zinc-850 bg-neutral-950 p-4 h-[200px] overflow-y-auto text-[9.5px] font-mono text-zinc-400 space-y-4 scrollbar-thin select-text">
                <p className="font-bold text-white">SECURE MASTER &amp; INTELLECTUAL LICENSE</p>
                <p>This document constitutes a binding agreement between the Sonic Archive catalog and the licensee ({userEmail}).</p>
                <p>1. LICENSED MATERIAL: The corresponding sonic master recordings, stems, and metadata generated under THE OWL CLOCK umbrella.</p>
                <p>2. SCOPE OF RIGHTS: Licensee is granted non-exclusive rights to exploit the works strictly in accordance with the parameters defined under the {selectedContractType} archetype.</p>
                <p>3. RESTRICTIONS: Re-selling, sub-licensing, or deploying the assets to external generative machine learning models is strictly prohibited without the express physical co-signature of administration.</p>
                <p>4. JURISDICTION: This license is governed by federal copyright law and administered under the statutory guidelines of the state of Atlanta, Georgia and Lagos, Nigeria.</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setClearanceStep("choose")}
                  className="flex-grow border border-zinc-850 hover:border-white text-zinc-400 hover:text-white font-mono text-[9px] tracking-widest uppercase py-3 transition-all cursor-pointer text-center"
                >
                  &lt; BACK
                </button>
                <button
                  onClick={() => setClearanceStep("approval")}
                  className="flex-grow bg-[#D9D6CA] text-black font-mono font-bold text-[9px] tracking-widest uppercase py-3 hover:bg-white transition-all cursor-pointer text-center"
                >
                  CLEARANCE REVIEW &gt;
                </button>
              </div>
            </div>
          )}

          {clearanceStep === "approval" && (
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[8px] tracking-[0.25em] text-red-500 font-bold uppercase block">
                  [ STEP 3: CLEARANCE REVIEW &amp; SIGNATURE ]
                </span>
                <p className="text-zinc-400 text-[10.5px] leading-relaxed uppercase">
                  Sign below with your full name to submit this Master Clearance Agreement for Final Approval.
                </p>
              </div>

              <div className="space-y-3">
                <input 
                  type="text"
                  placeholder="TYPE FULL NAME TO SIGN"
                  value={contractSignature}
                  onChange={(e) => setContractSignature(e.target.value)}
                  className="w-full bg-black border border-zinc-850 px-3.5 py-3 text-[11px] font-mono text-[#D9D6CA] focus:outline-none focus:border-red-500/40 uppercase placeholder-zinc-700"
                />

                <button
                  onClick={() => {
                    if (!contractSignature.trim()) return;
                    setClearanceStep("final");
                  }}
                  disabled={!contractSignature.trim()}
                  className={`w-full font-mono font-bold text-[10px] tracking-widest py-3.5 transition-all text-center uppercase ${
                    contractSignature.trim() 
                      ? "bg-red-500 text-white cursor-pointer hover:bg-red-600" 
                      : "bg-zinc-900 text-zinc-650 cursor-not-allowed"
                  }`}
                >
                  APPROVE MASTER CLEARANCE AGREEMENT
                </button>
              </div>
            </div>
          )}

          {clearanceStep === "final" && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="border border-zinc-850 bg-neutral-950 p-5 space-y-4 rounded-sm text-center"
            >
              <div className="w-10 h-10 bg-[#00E676]/10 border border-[#00E676]/40 text-[#00E676] rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse">
                <Check size={20} />
              </div>

              <h4 className="text-white font-bold text-xs uppercase tracking-widest">
                CLEARANCE APPROVED
              </h4>

              <p className="text-zinc-450 text-[10px] leading-relaxed uppercase">
                The Master Clearance Agreement has been digitally executed, archived, and transmitted to your verified terminal ({userEmail}).
              </p>

              <div className="border border-zinc-900 bg-black p-3 text-[9px] text-zinc-500 font-mono uppercase text-left space-y-1">
                <div>CONTRACT HASH: 0xBB823D3F1E8</div>
                <div>SIGNATURE: {contractSignature.toUpperCase()}</div>
                <div>STATUS: REGISTERED IN SECURE VAULT</div>
              </div>

              <button
                onClick={() => {
                  setClearanceStep("choose");
                  setSelectedContractType(null);
                  setContractSignature("");
                }}
                className="w-full bg-zinc-900 text-zinc-300 font-mono text-[9px] tracking-widest py-3 hover:text-white transition-all cursor-pointer uppercase"
              >
                REQUEST ANOTHER CLEARANCE
              </button>
            </motion.div>
          )}
        </div>
      );
    }

    // ----------------------------------------------------
    // 3. PUBLISHING REQUEST DASHBOARD (SPLIT SHEET / PRO / ISWC)
    // ----------------------------------------------------
    if (slug === "publishing" || slug === "publishing-request-dashboard") {
      return (
        <div className="space-y-5 text-left">
          <div className="space-y-1">
            <span className="text-[8px] tracking-[0.25em] text-[#D9D6CA] font-bold uppercase block">
              [ PUBLISHING REQUEST DASHBOARD ]
            </span>
            <p className="text-zinc-400 text-[10.5px] leading-relaxed uppercase">
              Manage composition PRO declarations, request ISWC registration, and review split sheet allocations.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="border border-zinc-900 bg-neutral-950 p-3 space-y-2">
              <span className="text-[8.5px] text-zinc-500 block uppercase tracking-wider font-extrabold">Split Sheet Record</span>
              <div className="text-[11px] font-bold text-white uppercase">OWL-01 Splits</div>
              <div className="text-[9.5px] text-zinc-400 font-mono space-y-1">
                <div>• PUBLISHER — 50% (Pub)</div>
                <div>• COMPOSER — 50% (Writer)</div>
              </div>
            </div>

            <div className="border border-zinc-900 bg-neutral-950 p-3 space-y-2">
              <span className="text-[8.5px] text-zinc-500 block uppercase tracking-wider font-extrabold">PRO Affiliations</span>
              <div className="text-[11px] font-bold text-[#D9D6CA] uppercase">ASCAP / BMI / PRS</div>
              <div className="text-[9px] text-zinc-500 leading-normal uppercase">
                Global performance rights administered securely via performance rights organizations.
              </div>
            </div>
          </div>

          {publishingSuccess ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-[#00E676]/5 border border-[#00E676]/20 rounded-sm text-center space-y-2"
            >
              <div className="text-[10px] font-bold text-[#00E676] uppercase tracking-widest">
                ISWC REQUEST SUBMITTED
              </div>
              <p className="text-[9.5px] text-zinc-400 uppercase leading-normal">
                Composition "{iswcRequestSong}" has been queued for ASCAP/BMI registration index. An agent will confirm within 48 hours.
              </p>
            </motion.div>
          ) : (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!iswcRequestSong.trim()) return;
                setIsPublishingSubmitting(true);
                setTimeout(() => {
                  setIsPublishingSubmitting(false);
                  setPublishingSuccess(true);
                }, 1200);
              }}
              className="space-y-3 border-t border-zinc-900 pt-4"
            >
              <span className="text-[8.5px] text-zinc-400 block uppercase tracking-wider font-bold">
                INITIATE NEW ISWC REQUEST
              </span>
              <input 
                type="text"
                placeholder="ENTER COMPOSITION TITLE"
                value={iswcRequestSong}
                onChange={(e) => setIswcRequestSong(e.target.value)}
                className="w-full bg-black border border-zinc-850 px-3 py-2.5 text-[10.5px] font-mono text-[#D9D6CA] focus:outline-none focus:border-[#D9D6CA]/40 uppercase placeholder-zinc-700"
              />
              <button 
                type="submit"
                className="w-full bg-[#D9D6CA] text-black font-mono font-bold text-[9.5px] tracking-widest py-3 hover:bg-white transition-colors cursor-pointer uppercase"
              >
                {isPublishingSubmitting ? "PROCESSING REQUEST..." : "SUBMIT PUBLISHING REQUEST"}
              </button>
            </form>
          )}

          <div className="border-t border-zinc-900 pt-4 flex justify-between items-center text-[9px] font-mono text-zinc-500">
            <span>ADMINISTRATOR: SYSTEM GLOBAL</span>
            <button 
              onClick={() => setShowDocumentVault(true)}
              className="text-[#D9D6CA] hover:underline cursor-pointer uppercase"
            >
              Open Split Sheets Vault ↗
            </button>
          </div>
        </div>
      );
    }

    // ----------------------------------------------------
    // 4. METADATA REQUEST DASHBOARD (METADATA SHEET / ISRC / UPC)
    // ----------------------------------------------------
    if (slug === "metadata" || slug === "metadata-request-dashboard") {
      return (
        <div className="space-y-5 text-left">
          <div className="space-y-1">
            <span className="text-[8px] tracking-[0.25em] text-[#D9D6CA] font-bold uppercase block">
              [ METADATA REQUEST DASHBOARD ]
            </span>
            <p className="text-zinc-400 text-[10.5px] leading-relaxed uppercase">
              Configure track-level metadata sheets, register ISRC audio codes, and manage master credits.
            </p>
          </div>

          <div className="border border-zinc-900 bg-neutral-950 p-3.5 space-y-3">
            <span className="text-[8.5px] text-zinc-500 block uppercase tracking-wider font-extrabold">Active Metadata Sheets</span>
            <div className="grid grid-cols-2 gap-y-2 text-[10px] font-mono text-zinc-400 uppercase">
              <div>• Format: WAV 24-bit</div>
              <div>• Tunings: 432 Hz</div>
              <div>• Genres: Ambient Drone</div>
              <div>• Authors: THE SENTINELS</div>
            </div>
          </div>

          {metadataSuccess ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-[#00E676]/5 border border-[#00E676]/20 rounded-sm text-center space-y-2"
            >
              <div className="text-[10px] font-bold text-[#00E676] uppercase tracking-widest">
                ISRC ASSIGNED SUCCESSFULLY
              </div>
              <p className="text-[9.5px] text-zinc-400 uppercase leading-normal">
                Audio ID "{isrcRequestSong}" has been assigned ISRC code: <span className="text-white font-mono font-bold">US-LMN-26-00824</span>.
              </p>
            </motion.div>
          ) : (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!isrcRequestSong.trim()) return;
                setIsMetadataSubmitting(true);
                setTimeout(() => {
                  setIsMetadataSubmitting(false);
                  setMetadataSuccess(true);
                }, 1200);
              }}
              className="space-y-3 border-t border-zinc-900 pt-4"
            >
              <span className="text-[8.5px] text-zinc-400 block uppercase tracking-wider font-bold">
                GENERATE NEW ISRC / UPC FOR RELEASE
              </span>
              <input 
                type="text"
                placeholder="ENTER UNREGISTERED SONG NAME"
                value={isrcRequestSong}
                onChange={(e) => setIsrcRequestSong(e.target.value)}
                className="w-full bg-black border border-zinc-850 px-3 py-2.5 text-[10.5px] font-mono text-[#D9D6CA] focus:outline-none focus:border-[#D9D6CA]/40 uppercase placeholder-zinc-700"
              />
              <button 
                type="submit"
                className="w-full bg-[#D9D6CA] text-black font-mono font-bold text-[9.5px] tracking-widest py-3 hover:bg-white transition-colors cursor-pointer uppercase"
              >
                {isMetadataSubmitting ? "ALLOCATING CODES..." : "GENERATE SECURED ISRC CODE"}
              </button>
            </form>
          )}

          <div className="border-t border-zinc-900 pt-4 flex justify-between items-center text-[9px] font-mono text-zinc-500">
            <span>CATALOG ARCHIVE V3</span>
            <button 
              onClick={() => setShowDocumentVault(true)}
              className="text-[#D9D6CA] hover:underline cursor-pointer uppercase"
            >
              Inspect Metadata Sheets ↗
            </button>
          </div>
        </div>
      );
    }

    // ----------------------------------------------------
    // 5. OWNERSHIP VERIFICATION (SAMPLE DECLARATION / WARRANTY)
    // ----------------------------------------------------
    if (slug === "ownership-verification" || slug === "ownership") {
      return (
        <div className="space-y-5 text-left">
          <div className="space-y-1">
            <span className="text-[8px] tracking-[0.25em] text-[#D9D6CA] font-bold uppercase block">
              [ OWNERSHIP VERIFICATION DASHBOARD ]
            </span>
            <p className="text-zinc-400 text-[10.5px] leading-relaxed uppercase">
              Submit clearance requests, assert sample-free warranties, and review intellectual property statements.
            </p>
          </div>

          <div className="border border-zinc-900 bg-neutral-950 p-3.5 space-y-2">
            <span className="text-[8.5px] text-zinc-500 block uppercase tracking-wider font-extrabold">No-Sample Warranty Status</span>
            <div className="flex items-center gap-2 text-[#00E676] text-[10.5px] font-bold uppercase">
              <ShieldCheck size={14} />
              <span>ACTIVE GUARANTEE — 100% ORIGINAL COMPOSITIONS</span>
            </div>
            <p className="text-[8.5px] text-zinc-500 uppercase leading-relaxed">
              Our administration guarantees all masters in the Owl Clock are cleared, containing zero unauthorized samples.
            </p>
          </div>

          {ownershipSuccess ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-[#00E676]/5 border border-[#00E676]/20 rounded-sm text-center space-y-2"
            >
              <div className="text-[10px] font-bold text-[#00E676] uppercase tracking-widest">
                SAMPLE DECLARATION LOGGED
              </div>
              <p className="text-[9.5px] text-zinc-400 uppercase leading-normal">
                Your legal assertion has been securely registered to the System Ledger under the warranty block.
              </p>
            </motion.div>
          ) : (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!sampleDeclarationText.trim()) return;
                setIsOwnershipSubmitting(true);
                setTimeout(() => {
                  setIsOwnershipSubmitting(false);
                  setOwnershipSuccess(true);
                }, 1200);
              }}
              className="space-y-3 border-t border-zinc-900 pt-4"
            >
              <span className="text-[8.5px] text-zinc-400 block uppercase tracking-wider font-bold">
                SUBMIT NEW WARRANTY &amp; SAMPLE DECLARATION
              </span>
              <textarea 
                placeholder="ENTER ORIGINAL WORK DETAILS & WARRANTY ASSERTION"
                value={sampleDeclarationText}
                onChange={(e) => setSampleDeclarationText(e.target.value)}
                rows={3}
                className="w-full bg-black border border-zinc-850 px-3 py-2.5 text-[10.5px] font-mono text-[#D9D6CA] focus:outline-none focus:border-[#D9D6CA]/40 uppercase placeholder-zinc-700 resize-none"
              />
              <button 
                type="submit"
                className="w-full bg-[#D9D6CA] text-black font-mono font-bold text-[9.5px] tracking-widest py-3 hover:bg-white transition-colors cursor-pointer uppercase"
              >
                {isOwnershipSubmitting ? "NOTARIZING DECREE..." : "RECORD COMPOSITION WARRANTY"}
              </button>
            </form>
          )}

          <div className="border-t border-zinc-900 pt-4 flex justify-between items-center text-[9px] font-mono text-zinc-500">
            <span>LEGAL JURISDICTION: DEED LOCK</span>
            <button 
              onClick={() => setShowDocumentVault(true)}
              className="text-[#D9D6CA] hover:underline cursor-pointer uppercase"
            >
              Inspect Ownership Deeds ↗
            </button>
          </div>
        </div>
      );
    }

    // ----------------------------------------------------
    // 6. ROYALTY ADMINISTRATION (SPLITS / STATEMENTS)
    // ----------------------------------------------------
    if (slug === "royalty-administration" || slug === "royalty" || slug === "royalty-dashboard") {
      return (
        <div className="space-y-5 text-left">
          <div className="space-y-1">
            <span className="text-[8px] tracking-[0.25em] text-[#D9D6CA] font-bold uppercase block">
              [ ROYALTY LEDGER DASHBOARD ]
            </span>
            <p className="text-zinc-400 text-[10.5px] leading-relaxed uppercase">
              Track synchronization licensing payouts, examine ledger balances, and configure payment instructions.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 font-mono">
            <div className="border border-zinc-900 bg-neutral-950 p-3 space-y-1">
              <span className="text-[7.5px] text-zinc-500 uppercase block tracking-wider">Unpaid Balance</span>
              <div className="text-lg font-extrabold text-[#D9D6CA]">$1,842.50</div>
              <span className="text-[8px] text-[#00E676] uppercase block">AVAILABLE FOR PAYOUT</span>
            </div>
            <div className="border border-zinc-900 bg-neutral-950 p-3 space-y-1">
              <span className="text-[7.5px] text-zinc-500 uppercase block tracking-wider">Total Distributed</span>
              <div className="text-lg font-extrabold text-zinc-500">$14,500.00</div>
              <span className="text-[8px] text-zinc-600 uppercase block">SINCE ARCHIVE BIRTH</span>
            </div>
          </div>

          {royaltySuccess ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 bg-[#00E676]/5 border border-[#00E676]/20 rounded-sm text-center"
            >
              <div className="text-[9.5px] font-bold text-[#00E676] uppercase tracking-widest">
                PAYMENT INSTRUCTIONS UPDATED
              </div>
            </motion.div>
          ) : (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!paymentInstructions.trim()) return;
                setIsRoyaltySaving(true);
                setTimeout(() => {
                  setIsRoyaltySaving(false);
                  setRoyaltySuccess(true);
                }, 1000);
              }}
              className="space-y-2 border-t border-zinc-900 pt-3"
            >
              <span className="text-[8.5px] text-zinc-400 block uppercase tracking-wider font-bold">
                CONFIGURE PAYOUT INSTRUCTIONS
              </span>
              <input 
                type="text"
                placeholder="e.g. WIRE TRANS, PAYONEER EMAIL, BANK DETAILS"
                value={paymentInstructions}
                onChange={(e) => setPaymentInstructions(e.target.value)}
                className="w-full bg-black border border-zinc-850 px-3 py-2 text-[10.5px] font-mono text-[#D9D6CA] focus:outline-none focus:border-[#D9D6CA]/40 uppercase placeholder-zinc-700"
              />
              <button 
                type="submit"
                className="w-full bg-[#D9D6CA] text-black font-mono font-bold text-[9px] tracking-widest py-2.5 hover:bg-white transition-colors cursor-pointer uppercase"
              >
                {isRoyaltySaving ? "STORING PAYOUT METHOD..." : "SAVE DISBURSEMENT PATHWAY"}
              </button>
            </form>
          )}

          <div className="border-t border-zinc-900 pt-3.5 flex justify-between items-center text-[9px] font-mono text-zinc-500">
            <span>LEDGER: STANDALONE CRYPTO</span>
            <button 
              onClick={() => setShowDocumentVault(true)}
              className="text-[#D9D6CA] hover:underline cursor-pointer uppercase"
            >
              Inspect Royalty Statements ↗
            </button>
          </div>
        </div>
      );
    }

    // ----------------------------------------------------
    // 7. RIGHTS ADMINISTRATION CENTER
    // ----------------------------------------------------
    if (slug === "rights-administration" || slug === "rights" || slug === "rights-dashboard") {
      return (
        <div className="space-y-5 text-left">
          <div className="space-y-1">
            <span className="text-[8px] tracking-[0.25em] text-[#D9D6CA] font-bold uppercase block">
              [ RIGHTS ADMINISTRATION CENTER ]
            </span>
            <p className="text-zinc-400 text-[10.5px] leading-relaxed uppercase">
              Secure copyright records, monitor third-party licensing usage, and view active global declarations.
            </p>
          </div>

          <div className="border border-zinc-850 bg-neutral-950 p-4 space-y-3.5">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5 text-[9.5px] font-mono font-bold">
              <span className="text-white">ENFORCEMENT VECTOR</span>
              <span className="text-zinc-500">STATUS</span>
            </div>
            <div className="space-y-2.5 text-[10px] font-mono text-zinc-400">
              <div className="flex justify-between">
                <span>• YouTube ContentID Sync</span>
                <span className="text-[#00E676] font-bold">[ ARMORED ]</span>
              </div>
              <div className="flex justify-between">
                <span>• Broadcast Airplay Monitored</span>
                <span className="text-[#00E676] font-bold">[ ONLINE ]</span>
              </div>
              <div className="flex justify-between">
                <span>• Metadata Fingerprint Registry</span>
                <span className="text-zinc-500">[ INDEXED ]</span>
              </div>
            </div>
          </div>

          <p className="text-[9px] text-zinc-500 leading-normal uppercase">
            All rights asserted globally on behalf of the registered owners under standard legal proxy structures.
          </p>

          <div className="border-t border-zinc-900 pt-4 flex justify-between items-center text-[9px] font-mono text-zinc-500">
            <span>COMPLIANCE INDEX 88</span>
            <button 
              onClick={() => setShowDocumentVault(true)}
              className="text-[#D9D6CA] hover:underline cursor-pointer uppercase"
            >
              Open Rights Dashboard ↗
            </button>
          </div>
        </div>
      );
    }

    // ----------------------------------------------------
    // 7A. MY LICENSES (ACCOUNT SECTION)
    // ----------------------------------------------------
    if (slug === "my-licenses") {
      if (activeAdminLocalView && currentUserEmail === "evianaconcepts1@gmail.com") {
        return (
          <div className="space-y-4">
            <button
              onClick={() => setActiveAdminLocalView(false)}
              className="text-zinc-400 hover:text-white text-[9px] font-mono uppercase cursor-pointer flex items-center gap-1.5 border border-zinc-900 bg-neutral-950 px-2.5 py-1.5 rounded-sm"
            >
              ← BACK TO LICENSE REGISTRY
            </button>
            {renderAdminPanel()}
          </div>
        );
      }

      return (
        <div className="space-y-4 text-left">
          <div className="space-y-1">
            <span className="text-[8px] tracking-[0.25em] text-[#D9D6CA] font-bold uppercase block">
              [ ACCOUNT / ACTIVE LICENSES ]
            </span>
            <p className="text-zinc-400 text-[10.5px] leading-relaxed uppercase">
              The currently active licenses assigned to your secure email terminal.
            </p>
          </div>

          {currentUserEmail === "evianaconcepts1@gmail.com" && (
            <div className="border border-yellow-500 bg-yellow-500/5 p-3 rounded-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-yellow-500 text-[9.5px] font-bold uppercase">ADMINISTRATOR DIRECTORY TERMINAL DETECTED</span>
                <span className="text-[7.5px] text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 font-bold font-mono">ROOT</span>
              </div>
              <p className="text-[9.5px] text-zinc-400 uppercase leading-normal">
                You are authorized with root permissions. Access the complete Payments, Users, and License Registry CRUD terminal below.
              </p>
              <button
                onClick={() => setActiveAdminLocalView(true)}
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-mono font-bold text-[9px] tracking-widest py-2 transition-all cursor-pointer uppercase"
              >
                Open Root Admin Control Center ⚙
              </button>
            </div>
          )}

          <div className="space-y-2.5 border-t border-zinc-900 pt-3">
            {!isLoggedIn ? (
              <div className="text-zinc-500 font-mono text-[9px] uppercase text-center py-8 border border-dashed border-zinc-900 rounded-[2px] px-4 leading-relaxed">
                Terminal authorization required. Please establish a secure connection via checkout or support node to access active licenses.
              </div>
            ) : (userLicenses && userLicenses.length > 0) ? (
              userLicenses.map((license) => (
                <div key={license.id} className="border border-zinc-900 bg-neutral-950 p-3 rounded-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-white text-[11px] font-bold uppercase">{license.song}</span>
                    <span className="text-[8.5px] text-[#00E676] bg-[#00E676]/10 px-1.5 py-0.5 font-bold uppercase">ACTIVE</span>
                  </div>
                  <div className="grid grid-cols-2 text-[9px] font-mono text-zinc-400 font-bold">
                    <div>TYPE: {license.type}</div>
                    <div>ISSUED: {license.date}</div>
                  </div>
                  <div className="text-[8.5px] text-zinc-500 font-mono border-t border-zinc-900 pt-1.5 flex justify-between items-center">
                    <span>ID: {license.id}</span>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => {
                          if (transferringId === license.id) {
                            setTransferringId(null);
                            setTransferError("");
                            setTransferSuccessMsg("");
                          } else {
                            setTransferringId(license.id);
                            setRecipientEmail("");
                            setTransferError("");
                            setTransferSuccessMsg("");
                          }
                        }}
                        className="text-yellow-500 hover:underline cursor-pointer uppercase text-[8px] font-bold"
                      >
                        {transferringId === license.id ? "Cancel Transfer ✕" : "Transfer License ⇄"}
                      </button>
                      <button 
                        onClick={() => {
                          setVerificationInput(license.id);
                          setVerificationResult({
                            id: license.id,
                            status: "SECURED / ACTIVE",
                            composition: license.song,
                            type: license.type,
                            isrc: license.isrc || "US-LMN-26-00301",
                            iswc: license.iswc || "T-302.459.882-1",
                            issuedTo: currentUserEmail || userEmail,
                            issuedDate: license.date,
                            signature: license.signature || "DIGITALLY REGISTERED VIA SECURE CRYPTOGRAPHIC PROTOCOL",
                            hash: license.hash || "0x8F9C2B7A1E4D039F"
                          });
                        }}
                        className="text-[#D9D6CA] hover:underline cursor-pointer uppercase text-[8px] font-bold"
                      >
                        View Certificate →
                      </button>
                    </div>
                  </div>

                  {/* Inline Transfer Form */}
                  {transferringId === license.id && (
                    <motion.form 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={handleTransferLicense}
                      className="border-t border-dashed border-zinc-900 pt-2.5 mt-2 space-y-2"
                    >
                      <p className="text-[8.5px] text-zinc-400 font-mono uppercase leading-tight">
                        Transfer Ownership of this composition license. The recipient must be a registered terminal user. This operation is cryptographically irreversible.
                      </p>
                      
                      {transferError && (
                        <div className="text-[8.5px] text-red-500 font-mono uppercase bg-red-950/10 border border-red-900/40 p-1.5 rounded-sm">
                          ERROR: {transferError}
                        </div>
                      )}

                      {transferSuccessMsg && (
                        <div className="text-[8.5px] text-[#00E676] font-mono uppercase bg-[#00E676]/10 border border-[#00E676]/30 p-1.5 rounded-sm">
                          SUCCESS: {transferSuccessMsg}
                        </div>
                      )}

                      {!transferSuccessMsg && (
                        <div className="flex gap-2">
                          <input 
                            type="email"
                            required
                            placeholder="RECIPIENT@EMAIL.COM"
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                            className="flex-grow bg-black border border-zinc-850 px-2 py-1.5 text-[9px] font-mono text-[#D9D6CA] focus:outline-none focus:border-[#D9D6CA]/40 uppercase placeholder-zinc-800"
                          />
                          <button 
                            type="submit"
                            disabled={isTransferring}
                            className="bg-yellow-500 text-black font-mono font-bold text-[8px] tracking-wider px-3 py-1.5 hover:bg-yellow-400 transition-colors cursor-pointer"
                          >
                            {isTransferring ? "XFER..." : "CONFIRM XFER"}
                          </button>
                        </div>
                      )}
                    </motion.form>
                  )}
                </div>

              ))
            ) : (
              <div className="text-zinc-500 font-mono text-[9px] uppercase text-center py-8 border border-dashed border-zinc-900 rounded-[2px] px-4 leading-relaxed">
                No active license records found for terminal {currentUserEmail}.
              </div>
            )}
          </div>
        </div>
      );
    }

    // ----------------------------------------------------
    // 7B. MY CERTIFICATES (ACCOUNT SECTION)
    // ----------------------------------------------------
    // ----------------------------------------------------
    // 7B. MY CERTIFICATES (ACCOUNT SECTION)
    // ----------------------------------------------------
    if (slug === "my-certificates") {
      return (
        <div className="space-y-4 text-left">
          <div className="space-y-1">
            <span className="text-[8px] tracking-[0.25em] text-[#D9D6CA] font-bold uppercase block">
              [ ACCOUNT / DIGITAL SIGNATURE CERTIFICATES ]
            </span>
            <p className="text-zinc-400 text-[10.5px] leading-relaxed uppercase">
              Your cryptographic signature records and identity certificates stored on the secure registry.
            </p>
          </div>

          <div className="space-y-2.5 border-t border-zinc-900 pt-3">
            {!isLoggedIn ? (
              <div className="text-zinc-500 font-mono text-[9px] uppercase text-center py-8 border border-dashed border-zinc-900 rounded-[2px] px-4 leading-relaxed">
                Terminal authorization required. Please establish a secure connection via checkout or support node to access active certificates.
              </div>
            ) : (userLicenses && userLicenses.length > 0) ? (
              userLicenses.map((license, idx) => (
                <div key={`cert-${license.id}`} className="border border-zinc-900 bg-neutral-950 p-3 rounded-sm font-mono space-y-2">
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-1.5">
                    <span className="text-[#D9D6CA] text-[9.5px] font-bold uppercase">Digital Signature Certificate (DSC)</span>
                    <span className="text-[8px] text-zinc-500 font-bold">DSC-{license.id.split("-").pop()}-{10 + idx}</span>
                  </div>
                  <div className="text-[9px] text-zinc-400 space-y-1">
                    <div>COMPOSITION: {license.song}</div>
                    <div>TERMINAL HOLDER: {currentUserEmail || userEmail}</div>
                    <div className="truncate">SECURE HASH: {license.hash}</div>
                  </div>
                  <div className="text-[8px] text-zinc-500 text-right pt-1 uppercase">
                    REGISTERED & VERIFIED BY SECURITY PROTOCOLS
                  </div>
                </div>
              ))
            ) : (
              <div className="text-zinc-500 font-mono text-[9px] uppercase text-center py-8 border border-dashed border-zinc-900 rounded-[2px] px-4 leading-relaxed">
                No active certificate records found for terminal {currentUserEmail}.
              </div>
            )}
          </div>
        </div>
      );
    }

    // ----------------------------------------------------
    // 7C. MY DOWNLOADS (ACCOUNT SECTION)
    // ----------------------------------------------------
    if (slug === "my-downloads") {
      return (
        <div className="space-y-4 text-left">
          <div className="space-y-1">
            <span className="text-[8px] tracking-[0.25em] text-[#D9D6CA] font-bold uppercase block">
              [ ACCOUNT / MASTER SECURE DOWNLOADS ]
            </span>
            <p className="text-zinc-400 text-[10.5px] leading-relaxed uppercase">
              Download your purchased master audio loops, high-quality stems, and metadata sheets.
            </p>
          </div>

          <div className="space-y-2 border-t border-zinc-900 pt-3">
            {!isLoggedIn ? (
              <div className="text-zinc-500 font-mono text-[9px] uppercase text-center py-8 border border-dashed border-zinc-900 rounded-[2px] px-4 leading-relaxed">
                Terminal authorization required. Connect your terminal to access authorized high-quality master file downloads.
              </div>
            ) : (userLicenses && userLicenses.length > 0) ? (
              userLicenses.flatMap((license) => {
                const cleanSongName = license.song.replace(/[\s\-\(\)]+/g, "_").toUpperCase();
                return [
                  { filename: `${cleanSongName}_MASTER.WAV`, size: "48.2 MB", desc: `Master Stereo Wave File (24-bit / 48kHz) - ${license.song}` },
                  { filename: `${cleanSongName}_STEMS.ZIP`, size: "185.0 MB", desc: `Separate Audio Stems (Drums, Bass, Synths, FX) - ${license.song}` }
                ];
              }).map((file) => (
                <div key={file.filename} className="border border-zinc-900 bg-neutral-950 p-3 rounded-sm flex justify-between items-center">
                  <div className="space-y-1 pr-2 max-w-[70%]">
                    <span className="text-white text-[9.5px] font-mono font-bold block truncate">{file.filename}</span>
                    <span className="text-[8.5px] text-zinc-500 font-mono block uppercase">{file.desc}</span>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[8.5px] text-zinc-500 font-mono uppercase">{file.size}</span>
                    <button 
                      onClick={() => alert(`Initiating secure high-speed dispatch of "${file.filename}"...`)}
                      className="text-black bg-[#D9D6CA] font-mono text-[8px] font-bold px-2 py-1 tracking-wider uppercase hover:bg-white transition-colors cursor-pointer rounded-none"
                    >
                      DOWNLOAD
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-zinc-500 font-mono text-[9px] uppercase text-center py-8 border border-dashed border-zinc-900 rounded-[2px] px-4 leading-relaxed">
                No active license records found. Acquire digital licenses at checkout to populate high-speed stems dispatch queue.
              </div>
            )}
          </div>
        </div>
      );
    }

    // ----------------------------------------------------
    // 7D. MY REQUESTS (ACCOUNT SECTION)
    // ----------------------------------------------------
    if (slug === "my-requests") {
      return (
        <div className="space-y-4 text-left">
          <div className="space-y-1">
            <span className="text-[8px] tracking-[0.25em] text-[#D9D6CA] font-bold uppercase block">
              [ ACCOUNT / CLEARANCE & RIGHTS REQUESTS ]
            </span>
            <p className="text-zinc-400 text-[10.5px] leading-relaxed uppercase">
              Track active clearance requests, publishing registration status, and ownership verification briefs.
            </p>
          </div>

          <div className="space-y-2.5 border-t border-zinc-900 pt-3">
            {!isLoggedIn ? (
              <div className="text-zinc-500 font-mono text-[9px] uppercase text-center py-8 border border-dashed border-zinc-900 rounded-[2px] px-4 leading-relaxed">
                Terminal authorization required. Please establish a secure connection to track active clearance requests.
              </div>
            ) : (userRequests && userRequests.length > 0) ? (
              userRequests.map((req) => (
                <div key={req.ref} className="border border-zinc-900 bg-neutral-950 p-3 rounded-sm font-mono space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-white text-[10px] font-bold uppercase">{req.type}</span>
                    <span className="text-[8px] text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 font-bold uppercase">{req.status}</span>
                  </div>
                  <div className="grid grid-cols-2 text-[8.5px] text-zinc-500 font-bold">
                    <div>TARGET: {req.target}</div>
                    <div>DATE: {req.date}</div>
                  </div>
                  <div className="text-[8px] text-zinc-650 border-t border-zinc-900 pt-1">
                    REFERENCE NUMBER: {req.ref}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-zinc-500 font-mono text-[9px] uppercase text-center py-8 border border-dashed border-zinc-900 rounded-[2px] px-4 leading-relaxed">
                No active clearance or publishing requests found for terminal {currentUserEmail}.
              </div>
            )}
          </div>
        </div>
      );
    }

    // ----------------------------------------------------
    // 8. BRAND STORY / MISSION / ABOUT
    // ----------------------------------------------------
    if (slug === "about-the-archive" || slug === "about") {
      return (
        <div className="space-y-4 text-left select-text">
          <div className="space-y-1">
            <span className="text-[8px] tracking-[0.25em] text-[#D9D6CA] font-bold uppercase block">
              [ STORY &amp; MISSION ]
            </span>
            <h4 className="text-white font-bold text-xs uppercase tracking-widest">
              The Owl Clock: A Temporal Sonic Vault
            </h4>
          </div>

          <div className="text-[10px] font-mono text-zinc-400 space-y-3.5 leading-relaxed uppercase">
            <p>
              Born from a pursuit to capture fleeting frequencies, THE OWL CLOCK serves as a public-facing sonic archive.
            </p>
            <p>
              Every audio fragment recorded inside this threshold represents a specific temporal marker—measured, verified, and sealed with a custom frequency and signature.
            </p>
            <p>
              We provide modern creators, media directors, and labels with a verified catalog of cleared compositions, stems, and atmospheric loops designed for deep cinematic immersion.
            </p>
          </div>

          <div className="border-t border-zinc-900 pt-4 text-[9px] text-zinc-500 font-mono flex justify-between">
            <span>OPERATOR: THE SONIC ARCHIVE CATALOG</span>
            <span>ESTABLISHED 2026</span>
          </div>
        </div>
      );
    }

    // ----------------------------------------------------
    // 9. ENTERPRISE INTAKE PORTAL
    // ----------------------------------------------------
    if (slug === "enterprise") {
      return (
        <div className="space-y-4 text-left">
          <div className="space-y-1">
            <span className="text-[8px] tracking-[0.25em] text-[#D9D6CA] font-bold uppercase block">
              [ ENTERPRISE INTAKE PORTAL ]
            </span>
            <p className="text-zinc-400 text-[10.5px] leading-relaxed uppercase">
              Bespoke sync licensing clearance, publishing administration, and catalog integration services for high-volume buyers, streaming platforms, and media agencies.
            </p>
          </div>

          {enterpriseSuccess ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-[#00E676]/5 border border-[#00E676]/20 rounded-sm text-center"
            >
              <div className="text-[10px] font-bold text-[#00E676] uppercase tracking-widest mb-1">
                SECURE BRIEF RECEIVED
              </div>
              <p className="text-[9.5px] text-zinc-400 uppercase leading-relaxed">
                An Enterprise Curator will establish encrypted contact at your terminal email within 12 business hours.
              </p>
            </motion.div>
          ) : (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                setIsEnterpriseSubmitting(true);
                setTimeout(() => {
                  setIsEnterpriseSubmitting(false);
                  setEnterpriseSuccess(true);
                }, 1500);
              }}
              className="space-y-3 border-t border-zinc-900 pt-3"
            >
              <input 
                type="text"
                placeholder="AGENCY, LABEL, OR COMPANY NAME"
                required
                className="w-full bg-black border border-zinc-850 px-3 py-2.5 text-[10.5px] font-mono text-[#D9D6CA] focus:outline-none focus:border-[#D9D6CA]/40 uppercase placeholder-zinc-700"
              />
              <textarea 
                placeholder="BRIEF DESCRIPTION OF SYNC / BRAND NEEDS"
                rows={3}
                required
                className="w-full bg-black border border-zinc-850 px-3 py-2.5 text-[10.5px] font-mono text-[#D9D6CA] focus:outline-none focus:border-[#D9D6CA]/40 uppercase placeholder-zinc-700 resize-none"
              />
              <button 
                type="submit"
                className="w-full bg-[#D9D6CA] text-black font-mono font-bold text-[9.5px] tracking-widest py-3 hover:bg-white transition-colors cursor-pointer uppercase"
              >
                {isEnterpriseSubmitting ? "TRANSMITTING SPECIFICATION..." : "SUBMIT ENTERPRISE BRIEF"}
              </button>
            </form>
          )}

          <div className="border-t border-zinc-900 pt-4 flex justify-between items-center text-[9px] font-mono text-zinc-500">
            <span>GLOBAL PORTAL</span>
            <button 
              onClick={() => setShowDocumentVault(true)}
              className="text-[#D9D6CA] hover:underline cursor-pointer uppercase"
            >
              Open Enterprise Dashboard ↗
            </button>
          </div>
        </div>
      );
    }

    // ----------------------------------------------------
    // 10. HELP CENTER & SUPPORT
    // ----------------------------------------------------
    if (slug === "support") {
      return (
        <div className="space-y-4 text-left">
          <div className="space-y-1">
            <span className="text-[8px] tracking-[0.25em] text-[#D9D6CA] font-bold uppercase block">
              [ SUPPORT / VAULT HELP DESK ]
            </span>
            <p className="text-zinc-400 text-[10.5px] leading-relaxed uppercase">
              Having issues downloading WAV stems or verifying digital license records? Submit a priority ticket directly to our terminal admin.
            </p>
          </div>

          {supportSuccess ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-[#00E676]/5 border border-[#00E676]/20 rounded-sm text-center"
            >
              <div className="text-[10px] font-bold text-[#00E676] uppercase tracking-widest mb-1">
                TICKET DISPATCHED SECURELY
              </div>
              <p className="text-[9.5px] text-zinc-400 uppercase leading-relaxed">
                Registered to code: <span className="text-white font-bold">LMN-SUPPORT-2921</span>. Support agents will contact you shortly.
              </p>
            </motion.div>
          ) : (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!supportMessage.trim()) return;
                setIsEnterpriseSubmitting(true);
                setTimeout(() => {
                  setIsEnterpriseSubmitting(false);
                  setSupportSuccess(true);
                }, 1200);
              }}
              className="space-y-3"
            >
              <textarea 
                placeholder="HOW CAN WE ASSIST YOU?"
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                rows={3}
                required
                className="w-full bg-black border border-zinc-850 px-3 py-2.5 text-[10.5px] font-mono text-[#D9D6CA] focus:outline-none focus:border-[#D9D6CA]/40 uppercase placeholder-zinc-700 resize-none"
              />
              <button 
                type="submit"
                className="w-full bg-[#D9D6CA] text-black font-mono font-bold text-[9.5px] tracking-widest py-3 hover:bg-white transition-colors cursor-pointer uppercase"
              >
                {isEnterpriseSubmitting ? "TRANSMITTING INQUIRY..." : "SEND SUPPORT REQUEST"}
              </button>
            </form>
          )}

          <div className="border-t border-zinc-900 pt-4 text-[9px] text-zinc-650 font-mono uppercase text-center">
            24/7 ENCRYPTED VAULT ESCALATION ACTIVE
          </div>
        </div>
      );
    }

    // ----------------------------------------------------
    // 11. GENERAL CONTACT PAGE
    // ----------------------------------------------------
    if (slug === "contact") {
      return (
        <div className="space-y-4 text-left">
          <div className="space-y-1">
            <span className="text-[8px] tracking-[0.25em] text-[#D9D6CA] font-bold uppercase block">
              [ TRANSMISSIONS OFFICE ]
            </span>
            <p className="text-zinc-400 text-[10.5px] leading-relaxed uppercase">
              General inquiries, sync representations, or feedback for the curators. Reach us at our operations hubs.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 border border-zinc-900 bg-neutral-950 p-3.5 text-[9.5px] font-mono text-zinc-400">
            <div>
              <span className="text-white font-bold block uppercase tracking-wider mb-1">ATLANTA HUB</span>
              <div>HQ. Atlanta</div>
              <div>Georgia, USA</div>
              <div className="text-zinc-650 mt-1">atl@credentials.local</div>
            </div>
            <div>
              <span className="text-white font-bold block uppercase tracking-wider mb-1">LAGOS HUB</span>
              <div>HQ. Lagos</div>
              <div>Lagos, Nigeria</div>
              <div className="text-zinc-650 mt-1">los@credentials.local</div>
            </div>
          </div>

          {contactSuccess ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3.5 bg-[#00E676]/5 border border-[#00E676]/20 rounded-sm text-center"
            >
              <div className="text-[10px] font-bold text-[#00E676] uppercase tracking-widest">
                MESSAGE DELIVERED
              </div>
            </motion.div>
          ) : (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!contactMessage.trim()) return;
                setIsEnterpriseSubmitting(true);
                setTimeout(() => {
                  setIsEnterpriseSubmitting(false);
                  setContactSuccess(true);
                }, 1000);
              }}
              className="space-y-3"
            >
              <input 
                type="text"
                placeholder="YOUR NAME"
                required
                className="w-full bg-black border border-zinc-850 px-3 py-2 text-[10.5px] font-mono text-[#D9D6CA] focus:outline-none focus:border-[#D9D6CA]/40 uppercase placeholder-zinc-700"
              />
              <textarea 
                placeholder="WRITE MESSAGE"
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                rows={2}
                required
                className="w-full bg-black border border-zinc-850 px-3 py-2 text-[10.5px] font-mono text-[#D9D6CA] focus:outline-none focus:border-[#D9D6CA]/40 uppercase placeholder-zinc-700 resize-none"
              />
              <button 
                type="submit"
                className="w-full bg-[#D9D6CA] text-black font-mono font-bold text-[9.5px] tracking-widest py-2.5 hover:bg-white transition-colors cursor-pointer uppercase"
              >
                {isEnterpriseSubmitting ? "SENDING BRIEF..." : "DISPATCH SIGNAL"}
              </button>
            </form>
          )}
        </div>
      );
    }

    // ----------------------------------------------------
    // 12. LEGAL POLICIES (TERMS, PRIVACY, COOKIES, ETC.)
    // ----------------------------------------------------
    if (["terms", "privacy", "cookies", "refunds", "acceptable-use", "protocols-dep"].includes(slug)) {
      const legalTitles: Record<string, string> = {
        "terms": "TERMS OF USE (PROTOCOLS)",
        "privacy": "PRIVACY CONVENTIONS",
        "cookies": "COOKIE DISCLOSURE",
        "refunds": "REFUND POLICY",
        "acceptable-use": "ACCEPTABLE USE DIRECTIVE"
      };

      const legalText: Record<string, string[]> = {
        "terms": [
          "1. ACCEPTANCE: By accessing this portal, the user agrees to be bound by the digital governance protocols.",
          "2. INTELLECTUAL STATUS: All audio, waveform metadata, clock algorithms, and cryptographic files are sole property of the administration.",
          "3. USAGE: Redistribution or algorithmic mining of archive materials without validated licenses is heavily prosecuted under international copyright agreements."
        ],
        "privacy": [
          "1. REGISTRATION DATA: We collect terminal identifiers, purchase histories, and secure emails strictly for clearance tracking.",
          "2. ENCRYPTION: Communication signals are routed through secure, server-side proxies. We never retain payment codes.",
          "3. COMPLIANCE: Data operations satisfy all federal privacy requirements in Lagos, Nigeria and Atlanta, USA."
        ],
        "cookies": [
          "1. SESSIONS: The portal utilizes secure local tokens to cache media bag items and maintain active audio loops.",
          "2. OPT-OUT: By maintaining connection, you assent to temporary cookie states required for clock calibration."
        ],
        "refunds": [
          "1. DIGITAL WAIVER: Due to the instant delivery of master WAV stems and clearance certificates, all completed acquisitions are final.",
          "2. DISCREPANCIES: If file corruption occurs, we will re-generate and sign a fresh stem package."
        ],
        "acceptable-use": [
          "1. FORBIDDEN VECTORS: You may not use Owl Clock fragments to feed deep artificial networks or audio mimicry frameworks.",
          "2. DEFIANT ACTION: Any unauthorized server probing will automatically lock access terminals via Security Protocol SYS-44."
        ]
      };

      const targetTitle = legalTitles[slug] || "PROTOCOLS MANUAL";
      const targetParas = legalText[slug] || ["1. STANDARD PROTOCOL IS ACTIVE. REFER ALL INQUIRIES TO OUR CORE STAFF."];

      return (
        <div className="space-y-4 text-left select-text">
          <div className="space-y-1">
            <span className="text-[8px] tracking-[0.25em] text-[#D9D6CA] font-bold uppercase block">
              [ LEGAL AGREEMENT ]
            </span>
            <h4 className="text-white font-bold text-xs uppercase tracking-widest">
              {targetTitle}
            </h4>
          </div>

          <div className="text-[10px] font-mono text-zinc-400 space-y-4 leading-relaxed uppercase">
            {targetParas.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          <div className="border-t border-zinc-900 pt-4 text-[9px] text-zinc-500 font-mono text-center">
            LAST MODIFIED: JUNE 2026 • LEGAL DEPT
          </div>
        </div>
      );
    }

    // ----------------------------------------------------
    // 13. ADMINISTRATIVE CRUD CORE (USERS & PAYMENTS)
    // ----------------------------------------------------
    if (slug === "admin" || slug === "admin-console" || slug === "system") {
      return renderAdminPanel();
    }

    // Default Fallback
    return (
      <div className="space-y-3.5 py-2">
        <p className="text-zinc-400 text-[10.5px] leading-relaxed uppercase tracking-wider">
          {body || `ACCESS TO "${title}" IS CURRENTLY UNREACHABLE OR DEMANDS HIGHER CRYPTOGRAPHIC CLEARANCE. CONTACT TRANSMISSIONS ADMIN.`}
        </p>
        
        <div className="border border-zinc-900 bg-neutral-950 p-2.5 flex items-center gap-2.5">
          <span className="text-red-500 animate-pulse text-sm shrink-0">⚠️</span>
          <span className="text-[8.5px] text-zinc-500 uppercase tracking-widest leading-normal">
            SECURITY PROTOCOL SYS-44 IS ACTIVE. ATTEMPTS HAVE BEEN LOGGED.
          </span>
        </div>
      </div>
    );
  };

  const body = `ACCESS TO "${title}" IS CURRENTLY UNREACHABLE OR DEMANDS HIGHER CRYPTOGRAPHIC CLEARANCE. CONTACT TRANSMISSIONS ADMIN.`;

  const isDashboardView = type !== "login";

  if (isDashboardView) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/98 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-6 select-text font-mono"
          >
            <motion.div 
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="border border-zinc-900 bg-[#050505] w-full max-w-7xl h-[95vh] sm:h-[90vh] max-h-[95vh] sm:max-h-[90vh] shadow-[0_25px_60px_rgba(0,0,0,0.95)] relative rounded-sm flex flex-col overflow-hidden"
            >
              {/* Dashboard Header Bar */}
              <div className="flex justify-between items-center border-b border-zinc-900 bg-zinc-950 px-5 py-3 shrink-0 select-none">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-650 font-bold tracking-widest uppercase">
                    SECURE STORAGE PROTOCOL // 
                  </span>
                  <span className="text-[10px] text-[#00E676] font-extrabold tracking-widest uppercase animate-pulse">
                    ACTIVE CLIENT SESSION
                  </span>
                </div>
                <button 
                  onClick={onClose} 
                  className="text-zinc-500 hover:text-white transition-colors cursor-pointer text-[10px] p-1 flex items-center gap-1.5 font-bold tracking-wider"
                  title="Disconnect Gateway"
                >
                  <span>CLOSE WORKSPACE</span>
                  <span>✕</span>
                </button>
              </div>

              {/* Scrollable Workspace */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <DocumentDashboard
                  currentUserEmail={currentUserEmail || userEmail}
                  isLoggedIn={isLoggedIn}
                  onClose={onClose}
                  onRefreshData={onRefreshData}
                  mode="CLIENT"
                />
              </div>

              <div className="border-t border-zinc-900 bg-zinc-950 px-5 py-2 shrink-0 flex items-center justify-between select-none">
                <span className="text-[8px] text-zinc-600 tracking-wider uppercase font-bold">
                  SECURE DEP NODE: ATL-GA-NGR-2026
                </span>
                <span className="text-[8px] text-[#00E676]/60 tracking-widest font-bold">
                  ALL SESSIONS ARE ENCRYPTED AND LOGGED. SECURITY PROTOCOL SYS-44 ACTIVE.
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-4 select-none font-mono"
          >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="border border-zinc-850 bg-[#050505] p-6 max-w-md w-full text-left space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative rounded-sm"
          >
            {/* Header */}
            <div className="flex justify-between items-start border-b border-zinc-900 pb-3">
              <div className="space-y-1">
                <span className="text-[8px] tracking-[0.3em] uppercase text-[#D9D6CA]/50 font-bold block">
                  [ {subtitle || "TRANSMISSION"} ]
                </span>
                <h4 className="text-[#D9D6CA] font-bold text-xs uppercase tracking-widest leading-tight">
                  {title}
                </h4>
              </div>
              <button 
                onClick={onClose} 
                className="text-zinc-500 hover:text-white transition-colors cursor-pointer text-xs p-1"
                title="Dismiss"
              >
                ✕
              </button>
            </div>

            {/* Content: Auth form */}
            <div className="py-1">
              {loginSuccess ? (
                <div className="space-y-4 text-center py-6">
                  <div className="w-10 h-10 border border-[#00E676]/40 bg-[#00E676]/10 text-[#00E676] rounded-full flex items-center justify-center mx-auto">
                    ✓
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-[#00E676] text-xs font-bold tracking-widest uppercase">
                      SECURE LINK ESTABLISHED
                    </h5>
                    <p className="text-zinc-500 text-[9px] uppercase">
                      Initializing terminal access keys for {loginEmail.toUpperCase()}...
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleOverlayLoginSubmit} className="space-y-4">
                  <p className="text-zinc-400 text-[10.5px] leading-relaxed uppercase">
                    Authenticate to establish a secure, encrypted connection to your private document dashboard.
                  </p>

                  {loginError && (
                    <div className="text-[9px] text-red-500 bg-red-950/10 border border-red-900/40 p-2 uppercase">
                      HANDSHAKE ERROR: {loginError}
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-zinc-500 text-[7.5px] uppercase block tracking-wider">
                        EMAIL ADDR:
                      </label>
                      <input
                        type="email"
                        required
                        disabled={loginLoading}
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="RECIPIENT@SYSTEM.LOCAL"
                        className="w-full bg-black border border-zinc-900 focus:border-[#D9D6CA]/40 text-white font-mono placeholder-zinc-800 text-[10px] px-3 py-2.5 rounded-none uppercase transition-colors focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-zinc-500 text-[7.5px] uppercase block tracking-wider">
                        ACCESS CIPHER (PASSWORD):
                      </label>
                      <input
                        type="password"
                        required
                        disabled={loginLoading}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-black border border-zinc-900 focus:border-[#D9D6CA]/40 text-white font-mono placeholder-zinc-800 text-[10px] px-3 py-2.5 rounded-none transition-colors focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Mode switcher (Sign in vs Register) */}
                  <div className="text-left">
                    <button
                      type="button"
                      disabled={loginLoading}
                      onClick={() => {
                        setLoginIsRegister(!loginIsRegister);
                        setLoginError("");
                      }}
                      className="text-[#D9D6CA] hover:text-white text-[9px] uppercase tracking-wider underline cursor-pointer"
                    >
                      {loginIsRegister 
                        ? "Already registered? Connect Existing Terminal" 
                        : "Need an account? Register New Terminal"
                      }
                    </button>
                  </div>

                  <button 
                    type="submit"
                    disabled={loginLoading}
                    className="w-full bg-[#D9D6CA] text-black font-mono font-bold text-[10px] tracking-[0.2em] uppercase py-3 transition-all cursor-pointer rounded-none hover:bg-white"
                  >
                    {loginLoading 
                      ? "INITIATING HANDSHAKE..." 
                      : loginIsRegister 
                        ? "REGISTER & CONNECT TERMINAL" 
                        : "CONNECT TERMINAL"
                    }
                  </button>
                </form>
              )}
            </div>

            <button 
              onClick={onClose}
              disabled={loginLoading}
              className="w-full bg-zinc-900 border border-zinc-800 hover:border-[#D9D6CA]/40 hover:text-white text-zinc-300 font-mono text-[9px] tracking-[0.25em] uppercase py-3 transition-all cursor-pointer rounded-none"
            >
              CANCEL CONNECTION
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

      {/* 8. HIDDEN DOCUMENT VAULT SUB-MODAL */}
      <AnimatePresence>
        {showDocumentVault && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/98 backdrop-blur-lg z-[200] flex items-center justify-center p-4 select-none font-mono"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="border border-zinc-850 bg-[#020202] p-6 max-w-lg w-full text-left space-y-4 shadow-[0_25px_60px_rgba(0,0,0,0.95)]"
            >
              <div className="flex justify-between items-start border-b border-zinc-900 pb-3">
                <div className="space-y-1">
                  <span className="text-[8px] tracking-[0.3em] uppercase text-red-500 font-bold block">
                    [ CRYPTOGRAPHIC SECURE LEVEL ]
                  </span>
                  <h4 className="text-white font-bold text-xs uppercase tracking-widest leading-tight">
                    DOCUMENT VAULT
                  </h4>
                </div>
                <button 
                  onClick={() => setShowDocumentVault(false)} 
                  className="text-zinc-500 hover:text-white transition-colors cursor-pointer text-xs p-1"
                >
                  ✕
                </button>
              </div>

              <p className="text-zinc-500 text-[10px] leading-relaxed uppercase">
                Displays legally executed digital signature certificates, download logs, expired agreements, and revoked credentials.
              </p>

              <div className="space-y-2 border border-zinc-900 p-3 bg-zinc-950/40 rounded-sm">
                <span className="text-[8px] text-zinc-650 tracking-wider font-bold uppercase block">ARCHIVED VAULT FILES</span>
                
                <div className="space-y-2 text-[10px] font-mono text-zinc-400">
                  <div className="flex justify-between items-center py-1 border-b border-zinc-950">
                    <span className="flex items-center gap-1.5"><FileText size={11} className="text-zinc-600" /> OWL_LICENSE_CERT_0333.PDF</span>
                    <span className="text-[#00E676] bg-[#00E676]/10 px-1.5 py-0.5 text-[8.5px] font-bold">[ SIGNED ]</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-zinc-950">
                    <span className="flex items-center gap-1.5"><FileText size={11} className="text-zinc-600" /> SPLIT_SHEET_M01.XLS</span>
                    <span className="text-[#00E676] bg-[#00E676]/10 px-1.5 py-0.5 text-[8.5px] font-bold">[ EXECUTED ]</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-zinc-950">
                    <span className="flex items-center gap-1.5"><FileText size={11} className="text-zinc-600" /> MASTER_CLEARANCE_AGREEMENT.WAV</span>
                    <span className="text-zinc-500 bg-zinc-900 px-1.5 py-0.5 text-[8.5px]">[ DOWNLOAD RECORD ]</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-zinc-950">
                    <span className="flex items-center gap-1.5"><FileText size={11} className="text-zinc-600" /> TEMP_EVALUATION_ACCESS_38.PDF</span>
                    <span className="text-yellow-600 bg-yellow-600/10 px-1.5 py-0.5 text-[8.5px]">[ EXPIRED ]</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="flex items-center gap-1.5"><FileText size={11} className="text-zinc-600" /> REVOKED_LICENSE_SAMPLE_92.PDF</span>
                    <span className="text-red-500 bg-red-500/10 px-1.5 py-0.5 text-[8.5px] font-bold">[ REVOKED ]</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowDocumentVault(false)}
                  className="w-full bg-zinc-900 border border-zinc-800 hover:border-white text-zinc-300 font-mono text-[9px] tracking-widest uppercase py-3 transition-all cursor-pointer text-center"
                >
                  CLOSE VAULT ACCESS
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
