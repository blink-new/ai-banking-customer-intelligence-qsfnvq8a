import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Progress } from '../components/ui/progress'
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts'
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Brain,
  Target,
  Activity,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { blink } from '../blink/client'

interface DashboardMetrics {
  totalCustomers: number
  totalBalance: number
  avgBalance: number
  highRiskCustomers: number
  activeSegments: number
  pendingInsights: number
  monthlyGrowth: number
  customerSatisfaction: number
}

const mockRecentActivity = [
  { id: 1, type: 'new_customer', message: 'New high-value customer registered', time: '2 minutes ago', priority: 'high' },
  { id: 2, type: 'risk_alert', message: 'Risk score increased for customer #1234', time: '15 minutes ago', priority: 'high' },
  { id: 3, type: 'insight', message: 'AI identified cross-selling opportunity', time: '1 hour ago', priority: 'medium' },
  { id: 4, type: 'segment', message: 'New segment "Digital Natives" created', time: '2 hours ago', priority: 'low' },
]

const mockSegmentPerformance = [
  { name: 'High Value', customers: 145, revenue: 2400000, growth: 12.5 },
  { name: 'Young Professionals', customers: 320, revenue: 1800000, growth: 8.2 },
  { name: 'Digital Natives', customers: 280, revenue: 1200000, growth: 15.1 },
  { name: 'Premium Savers', customers: 95, revenue: 1600000, growth: 5.8 },
]

const mockRiskDistribution = [
  { name: 'Low Risk', value: 75, color: '#10B981' },
  { name: 'Medium Risk', value: 20, color: '#F59E0B' },
  { name: 'High Risk', value: 5, color: '#EF4444' },
]

export function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalCustomers: 0,
    totalBalance: 0,
    avgBalance: 0,
    highRiskCustomers: 0,
    activeSegments: 0,
    pendingInsights: 0,
    monthlyGrowth: 0,
    customerSatisfaction: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [customers, segments, insights] = await Promise.all([
        blink.db.customers.list({ limit: 1000 }),
        blink.db.customerSegments.list(),
        blink.db.aiInsights.list({ where: { status: 'active' } })
      ])

      const totalBalance = customers.reduce((sum, c) => sum + (c.accountBalance || 0), 0)
      const avgBalance = customers.length > 0 ? totalBalance / customers.length : 0
      const highRiskCustomers = customers.filter(c => (c.riskScore || 0) > 0.7).length

      setMetrics({
        totalCustomers: customers.length,
        totalBalance,
        avgBalance,
        highRiskCustomers,
        activeSegments: segments.length,
        pendingInsights: insights.length,
        monthlyGrowth: 8.5, // Mock data
        customerSatisfaction: 4.2 // Mock data
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'new_customer':
        return <Users className="h-4 w-4 text-green-500" />
      case 'risk_alert':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'insight':
        return <Brain className="h-4 w-4 text-purple-500" />
      case 'segment':
        return <Target className="h-4 w-4 text-blue-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive'
      case 'medium':
        return 'default'
      case 'low':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadDashboardData}>
            <Activity className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalCustomers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +{metrics.monthlyGrowth}%
              </span>
              from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(metrics.totalBalance / 1000000).toFixed(1)}M</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +12.3%
              </span>
              from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Balance</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.avgBalance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-600 flex items-center">
                <ArrowDownRight className="h-3 w-3 mr-1" />
                -2.1%
              </span>
              from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.highRiskCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalCustomers > 0 ? ((metrics.highRiskCustomers / metrics.totalCustomers) * 100).toFixed(1) : 0}% of total customers
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Segment Performance */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Segment Performance</CardTitle>
            <CardDescription>Revenue and growth by customer segment</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockSegmentPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'revenue' ? `$${(value as number / 1000000).toFixed(1)}M` : value,
                    name === 'revenue' ? 'Revenue' : 'Customers'
                  ]} 
                />
                <Bar dataKey="customers" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk Distribution */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
            <CardDescription>Customer risk level breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={mockRiskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {mockRiskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {mockRiskDistribution.map((risk, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: risk.color }}
                    />
                    <span className="text-sm">{risk.name}</span>
                  </div>
                  <span className="text-sm font-medium">{risk.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* AI Insights Summary */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>AI Insights & Opportunities</CardTitle>
            <CardDescription>Active insights requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{metrics.pendingInsights}</div>
                  <div className="text-sm text-muted-foreground">Active Insights</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">12</div>
                  <div className="text-sm text-muted-foreground">Opportunities</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">3</div>
                  <div className="text-sm text-muted-foreground">Risk Alerts</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900">Revenue Opportunity</span>
                    <Badge variant="outline" className="text-green-700 border-green-300">High Priority</Badge>
                  </div>
                  <p className="text-sm text-green-800">
                    145 high-value customers eligible for premium investment products. Potential revenue: $2.4M annually.
                  </p>
                </div>
                
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2 mb-1">
                    <Brain className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Cross-sell Opportunity</span>
                    <Badge variant="outline" className="text-blue-700 border-blue-300">Medium Priority</Badge>
                  </div>
                  <p className="text-sm text-blue-800">
                    280 digital natives showing increased mobile usage. Perfect candidates for digital banking plus.
                  </p>
                </div>
                
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center space-x-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-900">Risk Alert</span>
                    <Badge variant="outline" className="text-red-700 border-red-300">High Priority</Badge>
                  </div>
                  <p className="text-sm text-red-800">
                    15 customers showing unusual transaction patterns. Requires immediate review for fraud prevention.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events and alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRecentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  {getActivityIcon(activity.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                      <Badge variant={getPriorityColor(activity.priority)} className="text-xs">
                        {activity.priority}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button className="h-20 flex-col space-y-2">
              <Brain className="h-6 w-6" />
              <span>Generate AI Insights</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Target className="h-6 w-6" />
              <span>Create Segment</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Users className="h-6 w-6" />
              <span>Add Customer</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <TrendingUp className="h-6 w-6" />
              <span>View Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}