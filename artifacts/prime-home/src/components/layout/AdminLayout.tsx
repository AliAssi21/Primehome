import { Link, useLocation } from "wouter";
import { LayoutDashboard, Package, ShoppingCart, Users, Tag, Settings, LogOut, Menu, X, Store } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function NavLink({ href, label, icon: Icon, exact, onClick }: { href: string; label: string; icon: React.ElementType; exact?: boolean; onClick?: () => void }) {
  const [location] = useLocation();
  const isActive = exact ? location === href : location.startsWith(href);
  return (
    <Link href={href} onClick={onClick}>
      <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive ? "bg-amber-500/15 text-amber-600" : "text-stone-400 hover:text-stone-200 hover:bg-stone-800"}`}>
        <Icon className="h-4 w-4" />
        {label}
      </div>
    </Link>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { admin, logout } = useAdminAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const Sidebar = ({ onNavClick }: { onNavClick?: () => void }) => (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-stone-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <Store className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm leading-tight">Prime Home</p>
            <p className="text-xs text-stone-500">Admin Portal</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} onClick={onNavClick} />
        ))}
      </nav>
      <div className="p-3 border-t border-stone-800">
        <div className="flex items-center gap-3 p-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-amber-400">{admin?.name?.[0]?.toUpperCase()}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-stone-200 truncate">{admin?.name}</p>
            <p className="text-xs text-stone-500 truncate">{admin?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-stone-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
        <Link href="/" className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors mt-0.5">
          ← Back to Store
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-stone-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-stone-900 border-r border-stone-800 shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-stone-900 border-r border-stone-800 flex flex-col">
            <div className="flex justify-end p-3">
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} className="text-stone-400 hover:text-stone-200">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <Sidebar onNavClick={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center gap-3 p-4 bg-stone-900 border-b border-stone-800">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)} className="text-stone-400 h-8 w-8">
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-semibold text-white text-sm">Prime Home Admin</span>
        </header>

        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
