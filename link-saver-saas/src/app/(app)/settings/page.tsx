"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User, Download, Trash2, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";

export default function SettingsPage() {
  const [profile, setProfile] = useState<{ display_name: string; tier: string; preferences: Record<string, string> } | null>(null);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [defaultSort, setDefaultSort] = useState("newest");
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email || "");

      const { data } = await supabase
        .from("profiles")
        .select("display_name, tier, preferences")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data);
        setDisplayName(data.display_name || "");
        setDefaultSort(data.preferences?.default_sort || "newest");
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
      .update({
        display_name: displayName,
        preferences: { ...profile?.preferences, default_sort: defaultSort },
      })
      .eq("id", user.id);

    setSaving(false);
    toast("Settings saved");
  }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/export");
      if (!res.ok) throw new Error("Export failed");
      const data = await res.json();

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `keepmark-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast("Data exported successfully");
    } catch {
      toast("Failed to export data", "error");
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    const confirmed = confirm(
      "Are you sure you want to delete your account? This will permanently delete all your saved links and data. This action cannot be undone."
    );
    if (!confirmed) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Delete all user data (cascades via FK)
    await supabase.from("links").delete().eq("user_id", user.id);
    await supabase.from("tags").delete().eq("user_id", user.id);
    await supabase.from("profiles").delete().eq("id", user.id);
    await supabase.auth.signOut();
    toast("Account deleted");
    router.push("/");
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
          </div>
        </div>

        {/* Preferences */}
        <div className="p-4 rounded-[--radius-lg] bg-surface border border-border">
          <h2 className="text-sm font-semibold font-heading mb-3">Preferences</h2>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5 font-heading">Default Sort Order</label>
            <div className="relative">
              <select
                value={defaultSort}
                onChange={(e) => setDefaultSort(e.target.value)}
                className="input !bg-bg appearance-none pr-8 cursor-pointer"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="title">Alphabetical</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary btn-sm disabled:opacity-50 mt-3"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* Data */}
        <div className="p-4 rounded-[--radius-lg] bg-surface border border-border">
          <h2 className="text-sm font-semibold font-heading mb-3">Your Data</h2>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="btn btn-secondary btn-sm disabled:opacity-50"
          >
            <Download size={14} />
            {exporting ? "Exporting..." : "Export All Data"}
          </button>
          <p className="text-[11px] text-muted mt-2">Download all your saved links and summaries as JSON.</p>
        </div>

        {/* Account */}
        <div className="p-4 rounded-[--radius-lg] bg-surface border border-border">
          <h2 className="text-sm font-semibold font-heading mb-3">Account</h2>
          <div className="flex gap-2">
            <button
              onClick={handleSignOut}
              className="btn btn-sm bg-surface-hover text-text-secondary hover:text-text-primary border border-border"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="p-4 rounded-[--radius-lg] bg-error-subtle border border-error/15">
          <h2 className="text-sm font-semibold font-heading text-error mb-1.5">Danger Zone</h2>
          <p className="text-[12px] text-text-secondary mb-3">Permanently delete your account and all saved data. This cannot be undone.</p>
          <button
            onClick={handleDeleteAccount}
            className="btn btn-sm bg-error/15 text-error hover:bg-error/25 border border-error/20"
          >
            <Trash2 size={13} />
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
