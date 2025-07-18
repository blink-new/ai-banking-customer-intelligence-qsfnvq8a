import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { 
  LayoutDashboard, 
  Users, 
  Target, 
  BarChart3, 
  Brain, 
  Shield,
  Building2,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { blink } from '../../blink/client'

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Overview and key metrics'
  },
  {
    name: 'Customer Profiles',
    href: '/customers',
    icon: Users,
    description: '360° customer intelligence'
  },
  {
    name: 'Segmentation',
    href: '/segmentation',
    icon: Target,
    description: 'AI-powered customer segments'
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    description: 'Advanced analytics & insights'
  },
  {
    name: 'AI Insights',
    href: '/insights',
    icon: Brain,
    description: 'Machine learning insights',
    badge: 'AI'
  },
  {
    name: 'Risk Assessment',
    href: '/risk',
    icon: Shield,
    description: 'Fraud detection & risk analysis'
  }
]

export function Sidebar() {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    blink.auth.logout()
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="bg-white shadow-md"
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-200 transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!collapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">AI Banking</h1>
                <p className="text-xs text-gray-500">Intelligence Platform</p>
              </div>
            </div>
          )}
          
          {/* Collapse button - desktop only */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 h-auto"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            const Icon = item.icon
            
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5 flex-shrink-0",
                  isActive ? "text-blue-600" : "text-gray-500"
                )} />
                
                {!collapsed && (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="truncate">{item.name}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          {!collapsed && (
            <div className="px-3 py-2">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">Banking Admin</p>
                  <p className="text-xs text-gray-500 truncate">admin@bank.com</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex space-x-2">
            {!collapsed && (
              <Button variant="ghost" size="sm" className="flex-1 justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className={cn(
                collapsed ? "w-full justify-center" : "flex-shrink-0",
                "text-red-600 hover:text-red-700 hover:bg-red-50"
              )}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span className="ml-2">Logout</span>}
            </Button>
          </div>
        </div>
      </div>

      {/* Main content spacer */}
      <div className={cn(
        "hidden lg:block transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )} />
    </>
  )
}