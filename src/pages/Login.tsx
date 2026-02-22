import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI, clearAuthToken } from "@/lib/api";
import { toast } from "@/components/ui/sonner";

export default function LoginPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [meName, setMeName] = useState<string | null>(null);

  const trimmed = useMemo(
    () => ({ name: name.trim(), phone: phone.trim() }),
    [name, phone]
  );

  useEffect(() => {
    let mounted = true;
    authAPI
      .getMe()
      .then(({ user }) => {
        if (!mounted) return;
        setMeName(user?.name || "Connected");
      })
      .catch(() => {
        if (!mounted) return;
        setMeName(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await authAPI.login({
        name: trimmed.name || undefined,
        phone: trimmed.phone || undefined,
      });
      toast.success("Logged in");
      navigate("/");
    } catch (e: any) {
      toast.error(e?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!trimmed.name) {
      toast.error("Please enter your name");
      return;
    }
    setLoading(true);
    try {
      await authAPI.register({
        name: trimmed.name,
        phone: trimmed.phone || undefined,
        role: "self",
      });
      toast.success("Registered & connected");
      navigate("/");
    } catch (e: any) {
      toast.error(e?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    clearAuthToken();
    setMeName(null);
    toast.success("Disconnected");
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="bg-card rounded-3xl p-5 space-y-2">
        <h1 className="text-2xl font-display font-light text-primary">Connect</h1>
        <p className="text-sm text-muted-foreground">
          Log in or register to connect the app to the backend. This is never automatic.
        </p>
        {meName ? (
          <p className="text-sm">
            Status: <span className="font-medium">Connected</span> ({meName})
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Status: Not connected</p>
        )}
      </div>

      <div className="bg-card rounded-3xl p-5 space-y-3">
        <div>
          <label className="text-sm text-muted-foreground block mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full bg-secondary/30 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground block mb-1">Phone (optional)</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            className="w-full bg-secondary/30 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-primary/20 text-primary hover:bg-primary/30 disabled:opacity-50 transition-colors"
          >
            Log in
          </button>
          <button
            type="button"
            onClick={handleRegister}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-secondary/40 text-foreground hover:bg-secondary/60 disabled:opacity-50 transition-colors"
          >
            Register
          </button>
        </div>

        <button
          type="button"
          onClick={handleDisconnect}
          className="w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-destructive/15 text-destructive hover:bg-destructive/25 transition-colors"
        >
          Disconnect (log out)
        </button>
      </div>
    </div>
  );
}

