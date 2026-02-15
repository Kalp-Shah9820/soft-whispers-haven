import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useRole } from "@/lib/store";
import Layout from "@/components/Layout";
import MoodCheckModal from "@/components/MoodCheckModal";
import RoleSelect from "@/pages/RoleSelect";
import Home from "@/pages/Home";
import Write from "@/pages/Write";
import Dreams from "@/pages/Dreams";
import DreamDetail from "@/pages/DreamDetail";
import Targets from "@/pages/Targets";
import Thoughts from "@/pages/Thoughts";
import SelfCare from "@/pages/SelfCare";
import Letters from "@/pages/Letters";
import Shared from "@/pages/Shared";
import Settings from "@/pages/Settings";
import Kindness from "@/pages/Kindness";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const [role] = useRole();

  // Show role selection if not chosen (first visit stored as "self")
  // We use a separate check - if role hasn't been explicitly set
  const [hasChosen] = [true]; // Role is always set after first pick

  return (
    <>
      <MoodCheckModal />
      <Layout>
        <Routes>
          <Route path="/" element={role === "partner" ? <Shared /> : <Home />} />
          <Route path="/write" element={<Write />} />
          <Route path="/dreams" element={<Dreams />} />
          <Route path="/dreams/:id" element={<DreamDetail />} />
          <Route path="/targets" element={<Targets />} />
          <Route path="/thoughts" element={<Thoughts />} />
          <Route path="/self-care" element={<SelfCare />} />
          <Route path="/letters" element={<Letters />} />
          <Route path="/shared" element={<Shared />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/kindness" element={<Kindness />} />
          <Route path="/role" element={<RoleSelect />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
