import Footer from "@/components/footer";
import Header from "@/components/header";

export function PublicPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white overflow-x-hidden">
      <Header />
      <div className="flex-1 overflow-x-hidden">{children}</div>
      <Footer />
    </div>
  );
}
