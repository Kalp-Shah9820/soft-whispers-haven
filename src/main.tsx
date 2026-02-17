import { createRoot } from "react-dom/client";
import { authAPI } from "./lib/api";
import App from "./App.tsx";
import "./index.css";

async function autoLogin() {
  try {
    await authAPI.getMe();
    console.log("User already logged in");
  } catch (err) {
    console.log("No session found. Creating demo user...");
    await authAPI.register({
      name: "Demo User",
      phone: "+919999999999",
      role: "self",
    });
    console.log("Demo user created and logged in");
  }
}

await autoLogin();

createRoot(document.getElementById("root")!).render(<App />);
