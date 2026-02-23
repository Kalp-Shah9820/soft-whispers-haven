import { useCallback, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { useRoleAPI } from "@/lib/store-api";
import { authAPI, clearAuthToken } from "@/lib/api";
import { HideModeProvider } from "@/lib/hideMode";
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

function AuthBootstrapper({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  const run = useCallback(async () => {
    setError(false);
    setReady(false);

    // Retry up to 3 times — handles Render free-tier cold starts (~30s)
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        try {
          await authAPI.getMe();
          setReady(true);
          return;
        } catch {
          clearAuthToken();
        }
        await authAPI.bootstrap();
        setReady(true);
        return;
      } catch (e) {
        console.error(`Auth bootstrap attempt ${attempt} failed:`, e);
        if (attempt < 3) await new Promise((r) => setTimeout(r, 2000));
      }
    }

    // All retries exhausted — surface error but still render the app
    setError(true);
    setReady(true);
  }, []);

  useEffect(() => { run(); }, [run]);

  if (!ready) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-2">
        <p className="text-muted-foreground text-sm animate-pulse">Soft Whispers is getting ready for you…</p>
        <p className="text-xs text-muted-foreground/50">Connecting to server…</p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="fixed top-0 inset-x-0 z-50 bg-destructive/90 text-white text-sm text-center py-2 px-4 flex items-center justify-center gap-3">
          <span>⚠️ Could not connect to the server. Some features won't work.</span>
          <button onClick={run} className="underline underline-offset-2 font-medium hover:no-underline">
            Retry
          </button>
        </div>
      )}
      {children}
    </>
  );
}

function HomeWrapper() {
  const [role] = useRoleAPI();
  return (
    <>
      <MoodCheckModal />
      <Layout>
        {role === "partner" ? <Shared /> : <Home />}
      </Layout>
    </>
  );
}

function WriteWrapper() {
  return (
    <>
      <MoodCheckModal />
      <Layout>
        <Write />
      </Layout>
    </>
  );
}

function DreamsWrapper() {
  return (
    <>
      <MoodCheckModal />
      <Layout>
        <Dreams />
      </Layout>
    </>
  );
}

function DreamDetailWrapper() {
  return (
    <>
      <MoodCheckModal />
      <Layout>
        <DreamDetail />
      </Layout>
    </>
  );
}

function TargetsWrapper() {
  return (
    <>
      <MoodCheckModal />
      <Layout>
        <Targets />
      </Layout>
    </>
  );
}

function ThoughtsWrapper() {
  return (
    <>
      <MoodCheckModal />
      <Layout>
        <Thoughts />
      </Layout>
    </>
  );
}

function SelfCareWrapper() {
  return (
    <>
      <MoodCheckModal />
      <Layout>
        <SelfCare />
      </Layout>
    </>
  );
}

function LettersWrapper() {
  return (
    <>
      <MoodCheckModal />
      <Layout>
        <Letters />
      </Layout>
    </>
  );
}

function SharedWrapper() {
  return (
    <>
      <MoodCheckModal />
      <Layout>
        <Shared />
      </Layout>
    </>
  );
}

function SettingsWrapper() {
  return (
    <>
      <MoodCheckModal />
      <Layout>
        <Settings />
      </Layout>
    </>
  );
}

function KindnessWrapper() {
  return (
    <>
      <MoodCheckModal />
      <Layout>
        <Kindness />
      </Layout>
    </>
  );
}

function RoleSelectWrapper() {
  return (
    <>
      <MoodCheckModal />
      <Layout>
        <RoleSelect />
      </Layout>
    </>
  );
}

const router = createBrowserRouter(
  [
    { path: "/", element: <HomeWrapper /> },
    { path: "/write", element: <WriteWrapper /> },
    { path: "/dreams", element: <DreamsWrapper /> },
    { path: "/dreams/:id", element: <DreamDetailWrapper /> },
    { path: "/targets", element: <TargetsWrapper /> },
    { path: "/thoughts", element: <ThoughtsWrapper /> },
    { path: "/self-care", element: <SelfCareWrapper /> },
    { path: "/letters", element: <LettersWrapper /> },
    { path: "/shared", element: <SharedWrapper /> },
    { path: "/settings", element: <SettingsWrapper /> },
    { path: "/kindness", element: <KindnessWrapper /> },
    { path: "/role", element: <RoleSelectWrapper /> },
    { path: "*", element: <NotFound /> },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
    },
  }
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthBootstrapper>
        <HideModeProvider>
          <RouterProvider router={router} />
        </HideModeProvider>
      </AuthBootstrapper>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
