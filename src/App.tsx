import { useState, useEffect } from "react";

// Auth & Components
import AdminLogin from "./components/AdminLogin";
import UserLogin from "./components/UserLogin";
import LoginSelectionPage from "./components/auth/LoginSelectionPage";
import PersonDetailView from "./components/PersonDetailView";
import SetupPasswordPage from "./components/SetupPasswordPage";
import { useAuth } from "./contexts/AuthContext";

// Admin Panel Components
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./components/admin/AdminDashboard";
import AdminUsers from "./components/admin/AdminUsers";
import AdminUserDetails from "./components/admin/AdminUserDetails";
import AdminPlans from "./components/admin/AdminPlans";
import AdminCreateCard from "./components/admin/AdminCreateCard";
import AdminCardsList from "./components/admin/AdminCardsList";
import AdminActivity from "./components/admin/AdminActivity";
import AdminSettings from "./components/admin/AdminSettings";

// User Panel Components
import UserNavigation from "./components/user/UserNavigation";
import UserMyCardPage from "./components/user/UserMyCardPage";
import UserProfilePage from "./components/user/UserProfilePage";

interface VerificationData {
  databaseVerified: boolean;
  idNumber: string;
  name: string;
  phone: string;
  photoUrl?: string;
  dateOfBirth?: string;
  address?: string;
  planName?: string;
  status: "active" | "expired" | "blocked" | "legacy";
}

function decodeData(encoded: string): any {
  try {
    let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) base64 += "=";
    const decoded = decodeURIComponent(atob(base64));
    const [name, phone, idNumber] = decoded.split("|");
    return { name, phone, idNumber };
  } catch (e) {
    return null;
  }
}

export default function App() {
  const { session: userSession, user: currentUser, signOut } = useAuth();

  // Routing State
  const [currentHash, setCurrentHash] = useState(window.location.hash || "#/");
  const [viewData, setViewData] = useState<VerificationData | null>(null);
  const [verificationState, setVerificationState] = useState<"idle" | "loading" | "not-found" | "error">("idle");

  // Admin Auth State
  const [adminSession, setAdminSession] = useState<"checking" | "authenticated" | "unauthenticated">("checking");
  const [selectedAdminUserId, setSelectedAdminUserId] = useState<string | null>(null);

  // User Dashboard / Plan Data State
  const [userData, setUserData] = useState<{
    profile: { id: string; email: string; display_name?: string; status?: string } | null;
    plan: { name: string; price: number; duration_days: number; card_limit: number } | null;
    cards: Array<any>;
  }>({ profile: null, plan: null, cards: [] });

  const [userTab, setUserTab] = useState<"home" | "my-card" | "preview" | "profile">("home");
  const [userBlockedMessage, setUserBlockedMessage] = useState("");

  // Sync Hash & Route Guards
  useEffect(() => {
    let requestNumber = 0;

    const handleRoute = async () => {
      const currentRequest = ++requestNumber;
      const hash = window.location.hash || "#/";
      setCurrentHash(hash);

      // Check Verification routes - support both UUID and card_number
      if (hash.startsWith("#/verify/")) {
        const cardId = hash.split("#/verify/")[1];
        setViewData(null);
        setVerificationState("loading");
        try {
          const response = await fetch(`/api/verify-card?id=${encodeURIComponent(cardId)}`);
          const result = await response.json();
          if (currentRequest !== requestNumber) return;
          if (response.status === 404) {
            setVerificationState("not-found");
            return;
          }
          if (!response.ok) {
            setVerificationState("error");
            return;
          }
          setViewData({
            databaseVerified: true,
            idNumber: result.cardNumber,
            name: result.name,
            phone: result.phone,
            photoUrl: result.photoUrl,
            dateOfBirth: result.dateOfBirth,
            address: result.address,
            planName: result.planName,
            status: result.status
          });
          setVerificationState("idle");
        } catch {
          if (currentRequest === requestNumber) setVerificationState("error");
        }
        return;
      }

      if (hash.startsWith("#/v/")) {
        const encoded = hash.split("#/v/")[1];
        if (encoded) {
          const decoded = decodeData(encoded);
          if (decoded) {
            setViewData({ ...decoded, databaseVerified: false, status: "legacy" });
            setVerificationState("idle");
          }
        }
        return;
      }

      // Check Admin route session
      if (hash.startsWith("#/admin")) {
        setAdminSession("checking");
        try {
          const response = await fetch("/api/admin-session");
          const result = await response.json();
          if (currentRequest === requestNumber) {
            setAdminSession(response.ok && result.authenticated ? "authenticated" : "unauthenticated");
          }
        } catch {
          if (currentRequest === requestNumber) setAdminSession("unauthenticated");
        }
      }
    };

    handleRoute();
    window.addEventListener("hashchange", handleRoute);
    return () => {
      requestNumber += 1;
      window.removeEventListener("hashchange", handleRoute);
    };
  }, []);

  // Fetch User Dashboard Data (Profile, Assigned Plan, Cards)
  useEffect(() => {
    if (!currentUser) return;
    async function loadUserDashboard() {
      try {
        const headers: Record<string, string> = {};
        if (userSession?.access_token) {
          headers["Authorization"] = `Bearer ${userSession.access_token}`;
        }
        const res = await fetch("/api/user-dashboard", { headers });
        const data = await res.json();
        if (res.status === 403) {
          setUserBlockedMessage(data.error || "Your account has been blocked.");
        } else if (res.ok) {
          setUserData(data);
          setUserBlockedMessage("");
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadUserDashboard();
  }, [currentUser, userSession]);

  // Route Handlers
  const isSelectionPage = currentHash === "#/" || currentHash === "" || currentHash === "#";
  const isAdminRoute = currentHash.startsWith("#/admin");
  const isUserLoginRoute = currentHash === "#/login" || currentHash === "#/user/login";
  const isSetupPasswordRoute = currentHash.startsWith("#/setup-password/");

  // Public Verification View
  if (viewData) {
    return <PersonDetailView data={viewData} />;
  }

  if (verificationState !== "idle") {
    const messages = {
      error: ["Verification unavailable", "The verification service could not be reached. Please try again."],
      loading: ["Checking record", "Fetching the latest card status..."],
      "not-found": ["ID Card Not Found", "This QR code is invalid or the ID card does not exist."]
    };
    const [title, message] = messages[verificationState];
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-6">
        <div className="max-w-md text-center border border-white/10 bg-white/5 rounded-3xl p-10">
          <h1 className="text-2xl font-black uppercase">{title}</h1>
          <p className="mt-3 text-sm text-white/50">{message}</p>
          {verificationState !== "loading" && (
            <button
              onClick={() => { window.location.hash = "#/"; window.location.reload(); }}
              className="mt-8 bg-amber-500 text-black font-black uppercase text-xs tracking-widest px-6 py-3 rounded-xl"
            >
              Return Home
            </button>
          )}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // SETUP PASSWORD PAGE (/setup-password/:userId/:email)
  // ----------------------------------------------------
  if (isSetupPasswordRoute) {
    const parts = currentHash.split("/setup-password/");
    const rest = parts[1] || "";
    const lastSlash = rest.lastIndexOf("/");
    const userId = lastSlash > -1 ? rest.substring(0, lastSlash) : rest;
    const email = lastSlash > -1 ? decodeURIComponent(rest.substring(lastSlash + 1)) : "";
    return <SetupPasswordPage userId={userId} email={email} />;
  }

  // ----------------------------------------------------
  // 1. FIRST PAGE: LOGIN SELECTION PAGE (/)
  // ----------------------------------------------------
  if (isSelectionPage) {
    return (
      <LoginSelectionPage
        onSelectAdmin={() => { window.location.hash = "#/admin/login"; }}
        onSelectUser={() => { window.location.hash = "#/login"; }}
      />
    );
  }

  // ----------------------------------------------------
  // 2. ADMIN PANEL ROUTING (/admin/*)
  // ----------------------------------------------------
  if (isAdminRoute) {
    if (currentHash === "#/admin/login") {
      return <AdminLogin onAuthenticated={() => { setAdminSession("authenticated"); window.location.hash = "#/admin"; }} />;
    }

    if (adminSession === "checking") {
      return (
        <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-6">
          <p className="text-xs font-black uppercase tracking-[3px] text-white/40">Checking Admin Authorization...</p>
        </div>
      );
    }

    if (adminSession === "unauthenticated") {
      return <AdminLogin onAuthenticated={() => { setAdminSession("authenticated"); window.location.hash = "#/admin"; }} />;
    }

    // Determine Active Admin Tab
    let activeAdminTab = "dashboard";
    if (currentHash === "#/admin/users") activeAdminTab = "users";
    else if (currentHash.startsWith("#/admin/users/")) activeAdminTab = "user-details";
    else if (currentHash === "#/admin/plans") activeAdminTab = "plans";
    else if (currentHash === "#/admin/create-card") activeAdminTab = "create-card";
    else if (currentHash === "#/admin/cards") activeAdminTab = "cards";
    else if (currentHash === "#/admin/activity") activeAdminTab = "activity";
    else if (currentHash === "#/admin/settings") activeAdminTab = "settings";

    const handleAdminNavigate = (tab: string) => {
      if (tab === "dashboard") window.location.hash = "#/admin";
      else window.location.hash = `#/admin/${tab}`;
    };

    const handleAdminLogout = async () => {
      await fetch("/api/admin-session", { method: "DELETE" });
      setAdminSession("unauthenticated");
      window.location.hash = "#/admin/login";
    };

    return (
      <AdminLayout
        currentTab={activeAdminTab}
        title={activeAdminTab.toUpperCase().replace("-", " ")}
        subtitle="Maurya System Administrator Control Center"
        onNavigate={handleAdminNavigate}
        onLogout={handleAdminLogout}
      >
        {activeAdminTab === "dashboard" && <AdminDashboard onNavigate={handleAdminNavigate} />}
        {activeAdminTab === "users" && (
          <AdminUsers
            onSelectUser={id => {
              setSelectedAdminUserId(id);
              window.location.hash = `#/admin/users/${id}`;
            }}
          />
        )}
        {activeAdminTab === "user-details" && (
          <AdminUserDetails
            userId={selectedAdminUserId || currentHash.split("#/admin/users/")[1] || ""}
            onBack={() => { window.location.hash = "#/admin/users"; }}
          />
        )}
        {activeAdminTab === "plans" && <AdminPlans />}
        {activeAdminTab === "create-card" && <AdminCreateCard />}
        {activeAdminTab === "cards" && <AdminCardsList />}
        {activeAdminTab === "activity" && <AdminActivity />}
        {activeAdminTab === "settings" && <AdminSettings />}
      </AdminLayout>
    );
  }

  // ----------------------------------------------------
  // 3. USER LOGIN PAGE (/login)
  // ----------------------------------------------------
  if (isUserLoginRoute) {
    return <UserLogin />;
  }

  // Check if User is Blocked
  if (userBlockedMessage) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-6">
        <div className="max-w-md text-center border border-red-500/20 bg-red-500/10 rounded-3xl p-10 space-y-4">
          <span className="text-4xl">🚫</span>
          <h1 className="text-2xl font-black uppercase text-red-400">Account Blocked</h1>
          <p className="text-sm text-white/70">{userBlockedMessage}</p>
          <button
            onClick={async () => { await signOut(); window.location.hash = "#/login"; }}
            className="mt-6 bg-white text-black font-black uppercase text-xs tracking-widest px-6 py-3 rounded-xl"
          >
            Log Out
          </button>
        </div>
      </div>
    );
  }

  // User Guard: if trying to access user pages unauthenticated, show UserLogin
  if (!currentUser && (currentHash === "#/home" || currentHash === "#/my-card" || currentHash === "#/preview" || currentHash === "#/profile")) {
    return <UserLogin />;
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-amber-500/30">
      <UserNavigation
        activeTab={userTab}
        onTabChange={tab => setUserTab(tab)}
        onLogout={async () => {
          await signOut();
          window.location.hash = "#/";
        }}
      />

      <main className="max-w-4xl mx-auto p-6 sm:p-10">
        {userTab === "home" && (
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 text-center space-y-6">
            <span className="text-xs font-black uppercase tracking-[4px] text-amber-500">Welcome, {userData.profile?.display_name || "User"}</span>
            <h1 className="text-4xl font-black uppercase tracking-tight">Your Digital ID Card</h1>

            <div className="pt-4 space-y-4">
              {userData.cards.length > 0 ? (
                <div className="space-y-4">
                  <div className="bg-black/30 border border-white/10 px-6 py-4 rounded-2xl inline-block">
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Card Status</p>
                    <span className="inline-block mt-1 px-3 py-1 bg-emerald-500/10 text-emerald-400 font-black rounded-lg uppercase text-sm">
                      Active
                    </span>
                  </div>

                  <div className="bg-black/30 border border-white/10 px-6 py-4 rounded-2xl inline-block">
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Current Plan</p>
                    <p className="font-black text-white text-lg mt-1">{userData.plan?.name || "Basic"}</p>
                    <p className="text-xs text-white/40 font-semibold">
                      {userData.plan?.card_limit === -1 ? "Unlimited" : `${userData.plan?.card_limit || 100} Cards Limit`}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-black/30 border border-white/10 px-8 py-6 rounded-2xl max-w-md mx-auto">
                  <p className="text-sm text-white/50">
                    Your ID card has not been created yet. Please contact the administrator.
                  </p>
                </div>
              )}

              <button
                onClick={() => setUserTab("my-card")}
                className="bg-amber-500 text-black px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/20"
              >
                {userData.cards.length > 0 ? "View My Card" : "Check Card Status"}
              </button>
            </div>
          </div>
        )}

        {userTab === "my-card" && <UserMyCardPage />}

        {userTab === "preview" && (
          <div className="text-center py-24 opacity-20 font-black text-4xl uppercase">
            Select My Card to view your ID card
          </div>
        )}

        {userTab === "profile" && (
          <UserProfilePage
            user={userData.profile}
            assignedPlan={userData.plan}
            cardsCount={userData.cards.length}
          />
        )}
      </main>
    </div>
  );
}
