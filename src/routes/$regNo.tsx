import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { loginWithCredentials } from "@/lib/server-auth";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Loader2, UserCircle } from "lucide-react";
import schoolLogo from "@/assets/school-logo.jpeg";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/$regNo")({
  component: RegistrationLogin,
  head: () => ({
    meta: [
      { title: "Student Login - Wisdom World School" },
    ],
  }),
});

function RegistrationLogin() {
  const { regNo } = useParams({ from: "/$regNo" });
  const navigate = useNavigate();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Background credentials (hidden from frontend)
  const MOBILE = "7004743156";
  const PASSWORD = "123456789";

  const handleGoToDashboard = async () => {
    setIsAuthenticating(true);
    try {
      // Login with background credentials
      const result = await loginWithCredentials(MOBILE, PASSWORD);
      
      if (result.success) {
        toast.success("Authenticated successfully!");
        // Navigate to the dashboard with the regNo from URL
        navigate({ 
          to: "/dashboard",
          search: { regNo: regNo } 
        });
      } else {
        console.error("Login failed:", result.error);
        toast.error(result.error || "Authentication failed.");
      }
    } catch (error) {
      console.error("Error during authentication:", error);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white/20 p-12 flex flex-col items-center text-center space-y-8 animate-in fade-in zoom-in duration-500">
        
        <div className="relative">
          <div className="absolute -inset-4 bg-emerald-500/10 rounded-full blur-xl" />
          <img
            src={schoolLogo}
            alt="School Logo"
            className="h-24 w-24 rounded-full object-cover relative ring-4 ring-white shadow-lg"
          />
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl font-extrabold text-[#1b3a2d] tracking-tight">
            Wisdom World School
          </h1>
          <p className="text-slate-500 font-medium">
            Student Management Portal
          </p>
        </div>

        {/* Dynamic Registration Box */}
        <div className="w-full p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center gap-3">
          <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-sm">
            <UserCircle className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Ready for Login</p>
            <p className="text-2xl font-black text-[#1b3a2d]">ID: {regNo}</p>
          </div>
        </div>

        <div className="w-full">
          <Button
            onClick={handleGoToDashboard}
            disabled={isAuthenticating}
            className="w-full h-16 text-lg font-bold rounded-2xl bg-[#1b3a2d] hover:bg-[#153024] text-white shadow-lg shadow-emerald-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-80 group"
          >
            {isAuthenticating ? (
              <>
                <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                <LayoutDashboard className="mr-3 h-6 w-6 group-hover:rotate-12 transition-transform" />
                Login to Dashboard
              </>
            )}
          </Button>
          <p className="mt-8 text-sm text-slate-400 flex items-center justify-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Secure connection established
          </p>
        </div>
      </div>

      <footer className="mt-12 text-slate-400 text-sm font-medium">
        Developed by <span className="text-emerald-700/60">Okie Dokie</span>
      </footer>

      <Toaster />
    </div>
  );
}
