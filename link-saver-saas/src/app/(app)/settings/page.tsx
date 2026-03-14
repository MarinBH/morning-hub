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
      <h1 className="text-[22px] font-bold tracking-tight mb-6">Settings</h1>

      <div className="space-y-6">
        {/* Profile */}
        <div className="p-4 rounded-[--radius-lg] bg-surface border border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              <User size={20} className="text-accent" />
            </div>
            <div>
              <div className="font-medium text-sm">{displayName || "User"}</div>
              <div className="text-xs text-muted">{email}</div>
            </div>
            {profile?.tier && (
              <span className="ml-auto px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-accent/10 text-accent">
                {profile.tier}
              </span>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 rounded-[--radius-md] bg-bg border border-border text-text-primary text-sm outline-none focus:border-accent"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-[--radius-md] bg-accent text-white text-sm font-medium hover:bg-accent-hover disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Account */}
        <div className="p-4 rounded-[--radius-lg] bg-surface border border-border">
          <h2 className="text-sm font-semibold mb-3">Account</h2>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 rounded-[--radius-md] bg-error-subtle text-error text-sm font-medium hover:bg-error/20 transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
