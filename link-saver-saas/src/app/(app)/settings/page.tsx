"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const [profile, setProfile] = useState<{ display_name: string; tier: string } | null>(null);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email || "");

      const { data } = await supabase
        .from("profiles")
        .select("display_name, tier")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data);
        setDisplayName(data.display_name || "");
      }
    }
    load();
  }, [supabase]);

  async function handleSave() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", user.id);

    setSaving(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="font-heading text-xl font-bold tracking-tight mb-6">Settings</h1>

      <div className="space-y-4">
        {/* Profile */}
        <div className="p-4 rounded-[--radius-lg] bg-surface border border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center">
              <User size={18} className="text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm font-heading truncate">{displayName || "User"}</div>
              <div className="text-[11px] text-muted font-mono truncate">{email}</div>
            </div>
            {profile?.tier && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-accent/10 text-accent font-heading">
                {profile.tier}
              </span>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5 font-heading">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="input !bg-bg"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary btn-sm disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Account */}
        <div className="p-4 rounded-[--radius-lg] bg-surface border border-border">
          <h2 className="text-sm font-semibold font-heading mb-3">Account</h2>
          <button
            onClick={handleSignOut}
            className="btn btn-sm bg-error-subtle text-error hover:bg-error/20"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
