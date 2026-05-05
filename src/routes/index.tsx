import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { loginAndGetToken } from "@/lib/server-auth";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Loader2 } from "lucide-react";
import schoolLogo from "@/assets/school-logo.jpeg";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Home - Wisdom World School" },
      { name: "description", content: "Welcome to the Wisdom World School student portal." },
    ],
  }),
});

function Index() {
  const navigate = useNavigate();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleGoToDashboard = async () => {
    setIsAuthenticating(true);
    try {
      // Hit the hidden login API via local proxy
      const result = await loginAndGetToken();
      
      if (result.success) {
        // Store the token in session storage if needed by the dashboard
        const token = result.data?.token || result.data?.data?.token;
        const entityId = result.data?.entity || result.data?.data?.entity;
        const userId = result.data?._id || result.data?.data?._id;
        
        console.log("Login Metadata:", { token, entityId, userId });
        
        if (token) {
          sessionStorage.setItem("authToken", token);
          if (entityId) sessionStorage.setItem("entityId", entityId);
          if (userId) sessionStorage.setItem("userId", userId);
          
          toast.success(`Authenticated successfully!`);
        } else {
          toast.success("Authenticated (no token in response)");
        }
        
        // Navigate to the dashboard
        navigate({ to: "/dashboard" });
      } else {
        console.error("Login failed:", result.error);
        toast.error(result.error || "Authentication failed. Please try again.");
      }
    } catch (error) {
      console.error("Error during authentication:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
      {/* Premium Glassmorphism Card */}
      <div className="w-full max-w-lg bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white/20 p-12 flex flex-col items-center text-center space-y-8 animate-in fade-in zoom-in duration-500">
        
        {/* Logo Section */}
        <div className="relative">
          <div className="absolute -inset-4 bg-emerald-500/10 rounded-full blur-xl" />
          <img
            src={schoolLogo}
            alt="School Logo"
            className="h-24 w-24 rounded-full object-cover relative ring-4 ring-white shadow-lg"
          />
        </div>

        {/* Title Section */}
        <div className="space-y-3">
          <h1 className="text-4xl font-extrabold text-[#1b3a2d] tracking-tight">
            Wisdom World School
          </h1>
          <p className="text-slate-500 font-medium">
            Student Management & Club Registration Portal
          </p>
        </div>

        {/* Action Section */}
        <div className="w-full pt-4">
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
                Go to Dashboard
              </>
            )}
          </Button>
          <p className="mt-6 text-sm text-slate-400 flex items-center justify-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Secure connection established
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-slate-400 text-sm font-medium">
        Developed by <span className="text-emerald-700/60">Okie Dokie</span>
      </footer>

      <Toaster />
    </div>
  );
}
