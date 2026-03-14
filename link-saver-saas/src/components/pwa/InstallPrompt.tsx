"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed this session
    if (sessionStorage.getItem("pwa-install-dismissed")) {
      setDismissed(true);
      return;
    }

    function handlePrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handlePrompt);
    return () => window.removeEventListener("beforeinstallprompt", handlePrompt);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  }

  function handleDismiss() {
    setDismissed(true);
    sessionStorage.setItem("pwa-install-dismissed", "true");
  }

  if (!deferredPrompt || dismissed) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 p-3 rounded-[--radius-lg] bg-surface border border-border shadow-xl shadow-black/30">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-[--radius-sm] bg-accent/15 flex items-center justify-center flex-shrink-0">
          <Download size={16} className="text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium font-heading mb-0.5">Install Keepmark</p>
          <p className="text-xs text-muted">Add to your home screen for quick access</p>
        </div>
        <button onClick={handleDismiss} className="p-1 text-muted hover:text-text-secondary">
          <X size={14} />
        </button>
      </div>
      <button
        onClick={handleInstall}
        className="btn btn-primary btn-sm w-full mt-2.5"
      >
        Install App
      </button>
    </div>
  );
}
