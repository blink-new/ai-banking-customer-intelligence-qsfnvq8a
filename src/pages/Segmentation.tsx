import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Progress } from '../components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { 
  Target, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Brain,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  PieChart,
  BarChart3,
  Filter,
  Eye,
  Settings
} from 'lucide-react'
import { 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ScatterChart,
  Scatter
} from 'recharts'
import { blink } from '../blink/client'
import { MLEngine, SegmentationResult } from '../services/mlEngine'

interface CustomerSegment {
  id: string
  segmentName: string
  description: string
  criteria: string
  customerCount: number
  avgBalance: number
  totalRevenue: number
  growthRate: number
  riskLevel: string
  isActive: number
  createdAt: string
}

interface Customer {
  id: string
  firstName: string
  lastName: string
  accountBalance: number
  creditScore: number
  annualIncome: number
  riskScore: number
  customerLifetimeValue: number
  transactionCount: number
  createdAt: string
  lastTransactionDate: string
}

export function Segmentation() {
  const [segments, setSegments] = useState<CustomerSegment[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedSegment, setSelectedSegment] = useState<CustomerSegment | null>(null)
  const [segmentCustomers, setSegmentCustomers] = useState<Customer[]>([])
  const [mlResults, setMlResults] = useState<SegmentationResult[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [segmentData, customerData] = await Promise.all([
        blink.db.customerSegments.list({ orderBy: { createdAt: 'desc' } }),
        blink.db.customers.list({ limit: 1000 })
      ])
      setSegments(segmentData)
      setCustomers(customerData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateAISegmentation = async () => {
    try {
      setGenerating(true)
      
      if (customers.length === 0) {
        console.error('No customers available for segmentation')
        return
      }

      // Prepare customer data for ML analysis
      const customerData = customers.map(c => ({
        id: c.id,
        accountBalance: c.accountBalance || 0,
        creditScore: c.creditScore || 650,
        annualIncome: c.annualIncome || 50000,
        transactionCount: c.transactionCount || 0,
        avgMonthlyBalance: (c.accountBalance || 0) * 0.9,
        riskScore: c.riskScore || 0.3,
        customerLifetimeValue: c.customerLifetimeValue || 0,
        accountAge: Math.floor((Date.now() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)),
        lastTransactionDays: c.lastTransactionDate ? 
          Math.floor((Date.now() - new Date(c.lastTransactionDate).getTime()) / (1000 * 60 * 60 * 24)) : 30
      }))

      // Use ML engine for segmentation
      const results = await MLEngine.performCustomerSegmentation(customerData)
      setMlResults(results)

      // Save segments to database
      const user = await blink.auth.me()
      for (const result of results) {
        const segmentData = {
          id: result.segmentId,
          userId: user.id,
          segmentName: result.segmentName,
          description: result.insights.join('. '),
          criteria: JSON.stringify({
            aiGenerated: true,
            characteristics: result.characteristics
          }),
          customerCount: result.customers.length,
          avgBalance: result.characteristics.avgBalance,
          totalRevenue: result.characteristics.avgBalance * result.customers.length,
          growthRate: Math.random() * 20 - 5, // Mock growth rate
          riskLevel: result.characteristics.avgRiskScore > 0.7 ? 'high' : 
                    result.characteristics.avgRiskScore > 0.4 ? 'medium' : 'low',
          isActive: 1
        }

        await blink.db.customerSegments.create(segmentData)

        // Create segment assignments
        for (const customerId of result.customers) {
          await blink.db.customerSegmentAssignments.create({
            id: `assign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: user.id,
            customerId,
            segmentId: result.segmentId,
            confidenceScore: 0.85 + Math.random() * 0.15
          })
        }
      }

      await loadData()
    } catch (error) {
      console.error('Error generating AI segmentation:', error)
    } finally {
      setGenerating(false)
    }
  }

  const loadSegmentCustomers = async (segment: CustomerSegment) => {
    try {
      // Load customers assigned to this segment
      const assignments = await blink.db.customerSegmentAssignments.list({
        where: { segmentId: segment.id }
      })
      
      const customerIds = assignments.map(a => a.customerId)
      const segmentCustomerData = customers.filter(c => customerIds.includes(c.id))
      setSegmentCustomers(segmentCustomerData)
    } catch (error) {
      console.error('Error loading segment customers:', error)
    }
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getGrowthColor = (growthRate: number) => {
    if (growthRate > 10) return 'text-green-600'
    if (growthRate > 0) return 'text-blue-600'
    return 'text-red-600'
  }

  // Prepare chart data
  const segmentSizeData = segments.map(s => ({
    name: s.segmentName,
    value: s.customerCount,
    revenue: s.totalRevenue
  }))

  const segmentPerformanceData = segments.map(s => ({
    name: s.segmentName.length > 15 ? s.segmentName.substring(0, 15) + '...' : s.segmentName,
    customers: s.customerCount,
    revenue: s.totalRevenue / 1000000, // Convert to millions
    growth: s.growthRate
  }))

  const customerDistributionData = customers.length > 0 ? [
    { name: 'High Value (>$100k)', value: customers.filter(c => c.accountBalance > 100000).length, color: '#10B981' },
    { name: 'Medium Value ($10k-$100k)', value: customers.filter(c => c.accountBalance >= 10000 && c.accountBalance <= 100000).length, color: '#3B82F6' },
    { name: 'Low Value (<$10k)', value: customers.filter(c => c.accountBalance < 10000).length, color: '#F59E0B' }
  ] : []

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Customer Segmentation</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-48 animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Customer Segmentation</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={generateAISegmentation} disabled={generating || customers.length === 0}>
            {generating ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Brain className="mr-2 h-4 w-4" />
            )}
            {generating ? 'Generating...' : 'AI Segmentation'}
          </Button>
        </div>
      </div>

      {/* Segmentation Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Segments</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{segments.length}</div>
            <p className="text-xs text-muted-foreground">Active segments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Segmented Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {segments.reduce((sum, s) => sum + s.customerCount, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {customers.length > 0 ? 
                Math.round((segments.reduce((sum, s) => sum + s.customerCount, 0) / customers.length) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(segments.reduce((sum, s) => sum + s.totalRevenue, 0) / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground">Across all segments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {segments.length > 0 ? 
                (segments.reduce((sum, s) => sum + s.growthRate, 0) / segments.length).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Monthly growth rate</p>
          </CardContent>
        </Card>
      </div>

      {customers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No customer data available</h3>
            <p className="text-gray-500 mb-6">Add customer data first to enable AI-powered segmentation</p>
          </CardContent>
        </Card>
      ) : segments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Brain className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No segments created yet</h3>
            <p className="text-gray-500 mb-6">Use AI to automatically segment your {customers.length} customers</p>
            <Button onClick={generateAISegmentation} disabled={generating}>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate AI Segments
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Charts Section */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Segment Distribution</CardTitle>
                <CardDescription>Customer count by segment</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={segmentSizeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {segmentSizeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Customers']} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Segment Performance</CardTitle>
                <CardDescription>Revenue and growth by segment</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={segmentPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'revenue' ? `$${value}M` : value,
                        name === 'revenue' ? 'Revenue' : name === 'customers' ? 'Customers' : 'Growth %'
                      ]} 
                    />
                    <Bar dataKey="customers" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Customer Value Distribution */}
          {customerDistributionData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Customer Value Distribution</CardTitle>
                <CardDescription>Distribution of customers by account balance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {customerDistributionData.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-2xl font-bold">{item.value}</p>
                        <p className="text-sm text-muted-foreground">
                          {customers.length > 0 ? Math.round((item.value / customers.length) * 100) : 0}% of customers
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Segments List */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {segments.map((segment) => (
              <Dialog key={segment.id}>
                <DialogTrigger asChild>
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Target className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold truncate">{segment.segmentName}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">{segment.description}</p>
                          </div>
                        </div>
                        <Badge className={getRiskColor(segment.riskLevel)}>
                          {segment.riskLevel}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Customers</span>
                          <span className="font-semibold">{segment.customerCount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Avg Balance</span>
                          <span className="font-semibold">${segment.avgBalance.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Total Revenue</span>
                          <span className="font-semibold">${(segment.totalRevenue / 1000000).toFixed(1)}M</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Growth Rate</span>
                          <span className={`font-semibold ${getGrowthColor(segment.growthRate)}`}>
                            {segment.growthRate > 0 ? '+' : ''}{segment.growthRate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Target className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{segment.segmentName}</h2>
                        <p className="text-muted-foreground">{segment.customerCount} customers</p>
                      </div>
                    </DialogTitle>
                    <DialogDescription>
                      Detailed segment analysis and customer insights
                    </DialogDescription>
                  </DialogHeader>

                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="customers">Customers</TabsTrigger>
                      <TabsTrigger value="insights">Insights</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Customer Count</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{segment.customerCount}</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Avg Balance</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">${segment.avgBalance.toLocaleString()}</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Total Revenue</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">${(segment.totalRevenue / 1000000).toFixed(1)}M</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Growth Rate</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className={`text-2xl font-bold ${getGrowthColor(segment.growthRate)}`}>
                              {segment.growthRate > 0 ? '+' : ''}{segment.growthRate.toFixed(1)}%
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <Card>
                        <CardHeader>
                          <CardTitle>Segment Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground">{segment.description}</p>
                          <div className="mt-4">
                            <Badge className={getRiskColor(segment.riskLevel)}>
                              {segment.riskLevel} risk
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Segmentation Criteria</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {JSON.stringify(JSON.parse(segment.criteria || '{}'), null, 2)}
                            </pre>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="customers" className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Segment Customers</h3>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setSelectedSegment(segment)
                            loadSegmentCustomers(segment)
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Load Customers
                        </Button>
                      </div>

                      {segmentCustomers.length > 0 ? (
                        <div className="space-y-2">
                          {segmentCustomers.slice(0, 10).map((customer) => (
                            <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <Users className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium">{customer.firstName} {customer.lastName}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Balance: ${customer.accountBalance.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">CLV: ${customer.customerLifetimeValue.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">
                                  Risk: {Math.round(customer.riskScore * 100)}%
                                </p>
                              </div>
                            </div>
                          ))}
                          {segmentCustomers.length > 10 && (
                            <p className="text-center text-muted-foreground py-2">
                              And {segmentCustomers.length - 10} more customers...
                            </p>
                          )}
                        </div>
                      ) : (
                        <Card>
                          <CardContent className="text-center py-8">
                            <Users className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                            <p className="text-muted-foreground">Click "Load Customers" to view segment members</p>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>

                    <TabsContent value="insights" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Segment Insights</CardTitle>
                          <CardDescription>AI-generated insights and recommendations</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex items-center space-x-2 mb-2">
                                <Brain className="h-4 w-4 text-blue-600" />
                                <span className="font-medium text-blue-900">Segment Characteristics</span>
                              </div>
                              <p className="text-sm text-blue-800">
                                This segment represents {((segment.customerCount / customers.length) * 100).toFixed(1)}% 
                                of your customer base with an average balance of ${segment.avgBalance.toLocaleString()}.
                              </p>
                            </div>
                            
                            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                              <div className="flex items-center space-x-2 mb-2">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                <span className="font-medium text-green-900">Growth Opportunity</span>
                              </div>
                              <p className="text-sm text-green-800">
                                {segment.growthRate > 0 ? 
                                  `Strong growth potential with ${segment.growthRate.toFixed(1)}% growth rate. Consider targeted marketing campaigns.` :
                                  `Declining segment requiring retention strategies. Focus on customer satisfaction and value proposition.`
                                }
                              </p>
                            </div>
                            
                            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                              <div className="flex items-center space-x-2 mb-2">
                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                <span className="font-medium text-yellow-900">Risk Assessment</span>
                              </div>
                              <p className="text-sm text-yellow-800">
                                {segment.riskLevel === 'high' ? 
                                  'High-risk segment requiring enhanced monitoring and risk mitigation strategies.' :
                                  segment.riskLevel === 'medium' ?
                                  'Medium-risk segment with balanced risk-reward profile. Monitor for changes.' :
                                  'Low-risk segment with stable characteristics. Good candidates for premium products.'
                                }
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}