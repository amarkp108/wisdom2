import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LayoutDashboard, UserCircle } from "lucide-react";
import schoolLogo from "@/assets/school-logo.jpeg";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

type IndexSearch = {
  regNo?: string;
};

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): IndexSearch => {
    return {
      regNo: (search.regNo as string) || (search.regno as string) || undefined,
    };
  },
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
  const { regNo: searchRegNo } = Route.useSearch();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [regNo, setRegNo] = useState("");

  // Automatic redirection if regNo is provided via URL query parameter or localStorage
  useEffect(() => {
    const storedRegNo = localStorage.getItem("regno");
    if (storedRegNo) {
      navigate({ to: "/$regNo", params: { regNo: storedRegNo } });
    } else if (searchRegNo) {
      navigate({ to: "/$regNo", params: { regNo: searchRegNo } });
    }
  }, [searchRegNo, navigate]);

  const handleGoToDashboard = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!regNo) {
      toast.error("Please enter your Registration Number");
      return;
    }

    // Save to localStorage as requested
    localStorage.setItem("regno", regNo);
    
    // Trigger page reload as requested
    window.location.reload();
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
            Student Management Portal
          </p>
        </div>

        {/* Action Section */}
        <div className="w-full pt-4">
          <form onSubmit={handleGoToDashboard} className="space-y-5 text-left">
            <div className="space-y-2">
              <Label htmlFor="regNo" className="text-slate-600 font-semibold ml-1">Registration Number</Label>
              <div className="relative group">
                <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                <Input
                  id="regNo"
                  type="text"
                  placeholder="e.g. 23"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  className="pl-12 h-14 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-lg"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isAuthenticating}
              className="w-full h-16 text-lg font-bold rounded-2xl bg-[#1b3a2d] hover:bg-[#153024] text-white shadow-lg shadow-emerald-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-80 group mt-4"
            >
              <LayoutDashboard className="mr-3 h-6 w-6 group-hover:rotate-12 transition-transform" />
              Continue to Login
            </Button>
          </form>
          <p className="mt-8 text-sm text-slate-400 flex items-center justify-center gap-2">
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
