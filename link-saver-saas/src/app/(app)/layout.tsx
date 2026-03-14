import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { ToastProvider } from "@/components/ui/Toast";
import { SaveModal } from "@/components/save/SaveModal";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="flex min-h-dvh">
        <Sidebar />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        <BottomNav />
        <ServiceWorkerRegistration />
        <InstallPrompt />
        <SaveModal />
      </div>
    </ToastProvider>
  );
}
