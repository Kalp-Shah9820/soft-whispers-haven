import { useEffect, useState } from "react";
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

  useEffect(() => {
    let cancelled = false;

    async function ensureAuth() {
      try {
        // If we already have a token, verify it; otherwise bootstrap a new one.
        try {
          await authAPI.getMe();
          if (!cancelled) {
            setReady(true);
          }
          return;
        } catch {
          // Token missing or invalid – clear and bootstrap a fresh one.
          clearAuthToken();
        }

        await authAPI.bootstrap();
      } catch (e) {
        // In a private app, we quietly fall back to local-only behavior if backend is unreachable.
        console.error("Auth bootstrap failed:", e);
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    }

    ensureAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-sm text-muted-foreground">
        Soft Whispers is getting ready for you…
      </div>
    );
  }

  return <>{children}</>;
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
