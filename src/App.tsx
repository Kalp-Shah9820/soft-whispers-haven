import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Write from "@/pages/Write";
import Dreams from "@/pages/Dreams";
import DreamDetail from "@/pages/DreamDetail";
import Targets from "@/pages/Targets";
import SelfCare from "@/pages/SelfCare";
import Letters from "@/pages/Letters";
import Shared from "@/pages/Shared";
import Settings from "@/pages/Settings";
import Kindness from "@/pages/Kindness";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/write" element={<Write />} />
            <Route path="/dreams" element={<Dreams />} />
            <Route path="/dreams/:id" element={<DreamDetail />} />
            <Route path="/targets" element={<Targets />} />
            <Route path="/self-care" element={<SelfCare />} />
            <Route path="/letters" element={<Letters />} />
            <Route path="/shared" element={<Shared />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/kindness" element={<Kindness />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
