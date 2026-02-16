import { motion } from "framer-motion";
import { useRole, useSettings, getPersonalizedGreeting } from "@/lib/store";
import { Heart, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function RoleSelect() {
  const [, setRole] = useRole();
  const [settings] = useSettings();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-8 max-w-md"
      >
        <div className="space-y-3">
          <h1 className="font-display text-4xl text-primary font-light tracking-wide">
            {getPersonalizedGreeting(settings.identity.name)}
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            This is your gentle space. Who's visiting today?
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setRole("self"); navigate("/"); }}
            className="bg-lavender hover:bg-lavender/80 rounded-3xl p-8 text-center transition-colors space-y-3"
          >
            <Heart className="h-10 w-10 mx-auto text-lavender-foreground" />
            <h2 className="font-display text-xl text-lavender-foreground font-light">For Myself</h2>
            <p className="text-xs text-lavender-foreground/70 leading-relaxed">
              Your full personal space — write, dream, and take care of yourself
            </p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setRole("partner"); navigate("/"); }}
            className="bg-peach hover:bg-peach/80 rounded-3xl p-8 text-center transition-colors space-y-3"
          >
            <Users className="h-10 w-10 mx-auto text-peach-foreground" />
            <h2 className="font-display text-xl text-peach-foreground font-light">
              For {settings.identity.partnerName || "Partner"}
            </h2>
            <p className="text-xs text-peach-foreground/70 leading-relaxed">
              See what's been shared with you — read-only, with love
            </p>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
