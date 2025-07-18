import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ScatterChart,
  Scatter
} from 'recharts'
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity,
  Calendar,
  Filter
} from 'lucide-react'
import { blink } from '../blink/client'

const mockTransactionData = [
  { month: 'Jan', transactions: 2400, volume: 1200000, customers: 180 },
  { month: 'Feb', transactions: 1398, volume: 980000, customers: 165 },
  { month: 'Mar', transactions: 9800, volume: 2100000, customers: 220 },
  { month: 'Apr', transactions: 3908, volume: 1800000, customers: 195 },
  { month: 'May', transactions: 4800, volume: 2400000, customers: 240 },
  { month: 'Jun', transactions: 3800, volume: 2200000, customers: 210 },
]

const mockChannelData = [
  { name: 'Online Banking', value: 45, color: '#3B82F6' },
  { name: 'Mobile App', value: 35, color: '#10B981' },
  { name: 'ATM', value: 15, color: '#F59E0B' },
  { name: 'Branch', value: 5, color: '#EF4444' },
]

const mockCustomerBehavior = [
  { segment: 'High Value', avgTransactions: 25, avgBalance: 75000, satisfaction: 4.8 },
  { segment: 'Young Professionals', avgTransactions: 18, avgBalance: 35000, satisfaction: 4.2 },
  { segment: 'Digital Natives', avgTransactions: 22, avgBalance: 28000, satisfaction: 4.5 },
  { segment: 'Premium Savers', avgTransactions: 12, avgBalance: 85000, satisfaction: 4.6 },
  { segment: 'Standard', avgTransactions: 8, avgBalance: 15000, satisfaction: 3.9 },
]

const mockRiskAnalysis = [
  { riskLevel: 'Low', count: 450, percentage: 75 },
  { riskLevel: 'Medium', count: 120, percentage: 20 },
  { riskLevel: 'High', count: 30, percentage: 5 },
]

export function Analytics() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('6m')

  useEffect(() => {
    loadAnalyticsData()
  }, [])

  const loadAnalyticsData = async () => {
    try {
      const customerData = await blink.db.customers.list({ limit: 1000 })
      setCustomers(customerData)
    } catch (error) {
      console.error('Error loading analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
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
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Last Month</SelectItem>
              <SelectItem value="3m">Last 3 Months</SelectItem>
              <SelectItem value="6m">Last 6 Months</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24,106</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12.5%</span> from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transaction Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12.3M</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+8.2%</span> from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+5.1%</span> from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Transaction Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$510</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-600">-2.1%</span> from last period
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="customer-behavior">Customer Behavior</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Trends</CardTitle>
                <CardDescription>Monthly transaction volume and count</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={mockTransactionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [
                      name === 'transactions' ? value.toLocaleString() : `$${(value as number).toLocaleString()}`,
                      name === 'transactions' ? 'Transactions' : 'Volume'
                    ]} />
                    <Area type="monotone" dataKey="transactions" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transaction Volume</CardTitle>
                <CardDescription>Monthly transaction value trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockTransactionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${(value as number).toLocaleString()}`, 'Volume']} />
                    <Line type="monotone" dataKey="volume" stroke="#10B981" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Customer Activity</CardTitle>
              <CardDescription>Active customers by month</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockTransactionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [value, 'Active Customers']} />
                  <Bar dataKey="customers" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customer-behavior" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Segment Performance</CardTitle>
                <CardDescription>Average transactions by customer segment</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockCustomerBehavior} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="segment" type="category" width={100} />
                    <Tooltip formatter={(value) => [value, 'Avg Transactions']} />
                    <Bar dataKey="avgTransactions" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Balance vs Transactions</CardTitle>
                <CardDescription>Relationship between balance and transaction frequency</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={mockCustomerBehavior}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="avgBalance" name="Balance" />
                    <YAxis dataKey="avgTransactions" name="Transactions" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter dataKey="avgTransactions" fill="#10B981" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Customer Satisfaction by Segment</CardTitle>
              <CardDescription>Average satisfaction scores across segments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockCustomerBehavior.map((segment, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-24 text-sm font-medium">{segment.segment}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2 w-32">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(segment.satisfaction / 5) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-sm font-medium">{segment.satisfaction}/5.0</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Channel Distribution</CardTitle>
                <CardDescription>Transaction volume by channel</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={mockChannelData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {mockChannelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Share']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {mockChannelData.map((channel, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: channel.color }}
                        />
                        <span className="text-sm">{channel.name}</span>
                      </div>
                      <span className="text-sm font-medium">{channel.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Channel Performance</CardTitle>
                <CardDescription>Average transaction value by channel</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { channel: 'Online', avgValue: 650, transactions: 1200 },
                    { channel: 'Mobile', avgValue: 420, transactions: 980 },
                    { channel: 'ATM', avgValue: 180, transactions: 450 },
                    { channel: 'Branch', avgValue: 1200, transactions: 120 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="channel" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Avg Value']} />
                    <Bar dataKey="avgValue" fill="#F59E0B" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Risk Distribution</CardTitle>
                <CardDescription>Customer risk level breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={mockRiskAnalysis}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      <Cell fill="#10B981" />
                      <Cell fill="#F59E0B" />
                      <Cell fill="#EF4444" />
                    </Pie>
                    <Tooltip formatter={(value, name, props) => [
                      `${value} customers (${props.payload.percentage}%)`,
                      props.payload.riskLevel
                    ]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {mockRiskAnalysis.map((risk, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div 
                          className={`w-3 h-3 rounded-full mr-2 ${
                            risk.riskLevel === 'Low' ? 'bg-green-500' :
                            risk.riskLevel === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                        />
                        <span className="text-sm">{risk.riskLevel} Risk</span>
                      </div>
                      <span className="text-sm font-medium">{risk.count} ({risk.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Trends</CardTitle>
                <CardDescription>Risk level changes over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[
                    { month: 'Jan', low: 420, medium: 110, high: 35 },
                    { month: 'Feb', low: 435, medium: 105, high: 32 },
                    { month: 'Mar', low: 445, medium: 115, high: 28 },
                    { month: 'Apr', low: 450, medium: 120, high: 30 },
                    { month: 'May', low: 448, medium: 118, high: 32 },
                    { month: 'Jun', low: 450, medium: 120, high: 30 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="low" stroke="#10B981" name="Low Risk" />
                    <Line type="monotone" dataKey="medium" stroke="#F59E0B" name="Medium Risk" />
                    <Line type="monotone" dataKey="high" stroke="#EF4444" name="High Risk" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}