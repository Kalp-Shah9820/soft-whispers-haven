import { motion } from "framer-motion";
import { useSharedAPI } from "@/lib/store-api";
import { Eye } from "lucide-react";

export default function Shared() {
  const { sharedDreams, sharedThoughts, sharedLetters, sharedMoods, loading } = useSharedAPI();

  const today = new Date().toISOString().slice(0, 10);

  // Filter shared targets from shared dreams
  const sharedTargets = sharedDreams.flatMap((d) =>
    d.targets.filter((t) => t.shared).map((t) => ({ ...t, dreamTitle: d.title }))
  );

  // Filter letters that are unlocked
  const unlockedSharedLetters = sharedLetters.filter(
    (l) => !l.sealed || (l.unlockDate && today >= l.unlockDate)
  );

  const isEmpty =
    sharedDreams.length === 0 &&
    sharedTargets.length === 0 &&
    unlockedSharedLetters.length === 0 &&
    sharedThoughts.length === 0 &&
    sharedMoods.length === 0;

  if (loading) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground text-sm">Loading shared content… 💕</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <Eye className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-display font-light text-primary">Shared With You</h1>
        </div>
        <p className="text-sm text-muted-foreground">A read-only space, built on trust and love 💕</p>
      </motion.div>

      {isEmpty ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg">Nothing shared yet — and that's okay 🌿</p>
          <p className="text-sm text-muted-foreground mt-2">When she's ready, her world will gently appear here.</p>
        </div>
      ) : (
        <>
          {sharedMoods.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-display text-lg font-light text-foreground">Moods 🌈</h2>
              <div className="flex flex-wrap gap-2">
                {sharedMoods.slice(-10).reverse().map((m, i) => (
                  <div key={i} className="bg-card rounded-2xl px-4 py-2 text-center">
                    <span className="text-xl">{m.mood}</span>
                    <p className="text-xs text-muted-foreground">{new Date(m.date).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sharedDreams.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-display text-lg font-light text-foreground">Dreams 🌙</h2>
              {sharedDreams.map((dream) => (
                <div key={dream.id} className="bg-card rounded-3xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{dream.mood}</span>
                    <h3 className="font-display text-lg font-light text-foreground">{dream.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{dream.content}</p>
                </div>
              ))}
            </div>
          )}

          {sharedThoughts.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-display text-lg font-light text-foreground">Thoughts 💭</h2>
              {sharedThoughts.map((t) => (
                <div key={t.id} className="bg-card rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{t.mood}</span>
                    <span className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{t.content}</p>
                </div>
              ))}
            </div>
          )}

          {sharedTargets.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-display text-lg font-light text-foreground">Gentle Steps 🌱</h2>
              {sharedTargets.map((t) => (
                <div key={t.id} className="bg-card rounded-2xl p-4">
                  <p className="text-sm font-medium text-foreground">{t.text}</p>
                  <p className="text-xs text-muted-foreground mt-1">from "{t.dreamTitle}"</p>
                </div>
              ))}
            </div>
          )}

          {unlockedSharedLetters.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-display text-lg font-light text-foreground">Letters 💌</h2>
              {unlockedSharedLetters.map((l) => (
                <div key={l.id} className="bg-card rounded-3xl p-5">
                  <p className="text-xs text-muted-foreground mb-2">Written on {new Date(l.createdAt).toLocaleDateString()}</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{l.content}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
