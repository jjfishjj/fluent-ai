import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { BrainwaveProvider } from "@/contexts/BrainwaveContext";
import { BottomNav } from "@/components/layout/BottomNav";
import BrainLab from "./pages/BrainLab";
import MemoryLab from "./pages/MemoryLab";
import SubjectLab from "./pages/SubjectLab";
import Index from "./pages/Index";
import Practice from "./pages/Practice";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import Quiz from "./pages/Quiz";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Friends from "./pages/Friends";
import Energy from "./pages/Energy";
import Shop from "./pages/Shop";
import Interests from "./pages/Interests";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <BrainwaveProvider>
            <div className="pb-16 md:pb-0">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/practice" element={<Practice />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/quiz" element={<Quiz />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/friends" element={<Friends />} />
                <Route path="/energy" element={<Energy />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/interests" element={<Interests />} />
                <Route path="/brain-lab" element={<BrainLab />} />
                <Route path="/memory" element={<MemoryLab />} />
                <Route path="/subjects" element={<SubjectLab />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <BottomNav />
          </BrainwaveProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
