import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Package, ShoppingCart, Warehouse,
  Users, BarChart2, Truck, LogOut, Store,
} from 'lucide-react'
import { useAuthStore } from '../../store/auth.store'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/products', icon: Package, label: 'Mahsulotlar' },
  { to: '/sales', icon: ShoppingCart, label: 'Sotuvlar' },
  { to: '/stock', icon: Warehouse, label: 'Ombor' },
  { to: '/customers', icon: Users, label: 'Mijozlar' },
  { to: '/reports', icon: BarChart2, label: 'Hisobotlar' },
  { to: '/suppliers', icon: Truck, label: 'Yetkazib beruvchilar' },
]

export function Sidebar() {
  const { user, logout } = useAuthStore()

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col min-h-screen">
      <div className="p-4 flex items-center gap-2 border-b border-gray-700">
        <Store className="text-blue-400" size={24} />
        <span className="font-bold text-lg">Dauran</span>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <div className="text-xs text-gray-400 mb-1">{user?.fullName}</div>
        <div className="text-xs text-gray-500 mb-3 capitalize">{user?.role}</div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <LogOut size={16} />
          Chiqish
        </button>
      </div>
    </aside>
  )
}
