import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Progress } from '../components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { 
  AlertTriangle, 
  Shield, 
  TrendingUp, 
  Users,
  Brain,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  DollarSign,
  CreditCard,
  Zap
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter
} from 'recharts'
import { blink } from '../blink/client'
import { MLEngine } from '../services/mlEngine'

interface RiskAssessment {
  id: string
  customerId: string
  assessmentType: string
  riskScore: number
  riskLevel: string
  factors: string
  recommendations: string
  status: string
  assessedDate: string
  expiresDate: string
  customer?: {
    firstName: string
    lastName: string
    email: string
    accountBalance: number
    creditScore: number
  }
}

interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string
  accountBalance: number
  creditScore: number
  annualIncome: number
  riskScore: number
  transactionCount: number
  lastTransactionDate: string
}

export function RiskAssessment() {
  const [assessments, setAssessments] = useState<RiskAssessment[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [selectedAssessment, setSelectedAssessment] = useState<RiskAssessment | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [assessmentData, customerData] = await Promise.all([
        blink.db.riskAssessments.list({ 
          orderBy: { assessedDate: 'desc' },
          limit: 100 
        }),
        blink.db.customers.list({ limit: 1000 })
      ])

      // Enrich assessments with customer data
      const enrichedAssessments = assessmentData.map(assessment => {
        const customer = customerData.find(c => c.id === assessment.customerId)
        return {
          ...assessment,
          customer: customer ? {
            firstName: customer.firstName,
            lastName: customer.lastName,
            email: customer.email,
            accountBalance: customer.accountBalance,
            creditScore: customer.creditScore
          } : undefined
        }
      })

      setAssessments(enrichedAssessments)
      setCustomers(customerData)
    } catch (error) {
      console.error('Error loading risk data:', error)
    } finally {
      setLoading(false)
    }
  }

  const runRiskAnalysis = async () => {
    try {
      setAnalyzing(true)
      const user = await blink.auth.me()

      // Analyze high-risk customers
      const highRiskCustomers = customers.filter(c => c.riskScore > 0.6 || c.accountBalance < 1000)
      
      for (const customer of highRiskCustomers.slice(0, 20)) { // Limit to prevent API overload
        try {
          // Load customer transactions for context
          const transactions = await blink.db.transactions.list({
            where: { customerId: customer.id },
            orderBy: { transactionDate: 'desc' },
            limit: 20
          })

          const customerData = {
            id: customer.id,
            accountBalance: customer.accountBalance,
            creditScore: customer.creditScore,
            annualIncome: customer.annualIncome,
            transactionCount: customer.transactionCount,
            avgMonthlyBalance: customer.accountBalance * 0.9,
            riskScore: customer.riskScore,
            customerLifetimeValue: 0,
            accountAge: Math.floor((Date.now() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)),
            lastTransactionDays: customer.lastTransactionDate ? 
              Math.floor((Date.now() - new Date(customer.lastTransactionDate).getTime()) / (1000 * 60 * 60 * 24)) : 30
          }

          // Use ML engine for risk assessment
          const riskAnalysis = await MLEngine.assessCustomerRisk(customerData, transactions)

          // Create risk assessment record
          const assessmentId = `risk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          await blink.db.riskAssessments.create({
            id: assessmentId,
            userId: user.id,
            customerId: customer.id,
            assessmentType: 'comprehensive',
            riskScore: riskAnalysis.riskScore,
            riskLevel: riskAnalysis.riskLevel,
            factors: JSON.stringify(riskAnalysis.factors),
            recommendations: JSON.stringify(riskAnalysis.recommendations),
            status: 'active',
            assessedDate: new Date().toISOString(),
            expiresDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
          })

          // Update customer risk score
          await blink.db.customers.update(customer.id, {
            riskScore: riskAnalysis.riskScore
          })

        } catch (customerError) {
          console.error(`Error analyzing customer ${customer.id}:`, customerError)
        }
      }

      await loadData()
    } catch (error) {
      console.error('Error running risk analysis:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  const updateAssessmentStatus = async (assessmentId: string, status: string) => {
    try {
      await blink.db.riskAssessments.update(assessmentId, { status })
      await loadData()
    } catch (error) {
      console.error('Error updating assessment status:', error)
    }
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'low': return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' }
      case 'medium': return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' }
      case 'high': return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' }
      case 'critical': return { bg: 'bg-red-200', text: 'text-red-900', border: 'border-red-300' }
      default: return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' }
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Clock className="h-4 w-4 text-blue-500" />
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'dismissed': return <XCircle className="h-4 w-4 text-gray-500" />
      default: return <Clock className="h-4 w-4 text-blue-500" />
    }
  }

  // Prepare chart data
  const riskDistribution = [
    { name: 'Low Risk', value: assessments.filter(a => a.riskLevel === 'low').length, color: '#10B981' },
    { name: 'Medium Risk', value: assessments.filter(a => a.riskLevel === 'medium').length, color: '#F59E0B' },
    { name: 'High Risk', value: assessments.filter(a => a.riskLevel === 'high').length, color: '#EF4444' },
    { name: 'Critical', value: assessments.filter(a => a.riskLevel === 'critical').length, color: '#DC2626' }
  ]

  const riskTrends = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    const dayAssessments = assessments.filter(a => 
      new Date(a.assessedDate).toDateString() === date.toDateString()
    )
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short' }),
      assessments: dayAssessments.length,
      highRisk: dayAssessments.filter(a => a.riskLevel === 'high' || a.riskLevel === 'critical').length
    }
  })

  const customerRiskScatter = customers.slice(0, 100).map(c => ({
    balance: c.accountBalance,
    riskScore: c.riskScore * 100,
    name: `${c.firstName} ${c.lastName}`
  }))

  const activeAssessments = assessments.filter(a => a.status === 'active')
  const highRiskAssessments = assessments.filter(a => a.riskLevel === 'high' || a.riskLevel === 'critical')

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Risk Assessment</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse mb-2"></div>
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
        <h2 className="text-3xl font-bold tracking-tight">Risk Assessment</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={runRiskAnalysis} disabled={analyzing || customers.length === 0}>
            {analyzing ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Brain className="mr-2 h-4 w-4" />
            )}
            {analyzing ? 'Analyzing...' : 'Run AI Analysis'}
          </Button>
        </div>
      </div>

      {/* Risk Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assessments.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeAssessments.length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{highRiskAssessments.length}</div>
            <p className="text-xs text-muted-foreground">
              {assessments.length > 0 ? Math.round((highRiskAssessments.length / assessments.length) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Risk Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assessments.length > 0 ? 
                Math.round((assessments.reduce((sum, a) => sum + a.riskScore, 0) / assessments.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Risk level</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At-Risk Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter(c => c.riskScore > 0.6).length}
            </div>
            <p className="text-xs text-muted-foreground">Require monitoring</p>
          </CardContent>
        </Card>
      </div>

      {customers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No customer data available</h3>
            <p className="text-gray-500 mb-6">Add customer data first to enable risk assessment</p>
          </CardContent>
        </Card>
      ) : assessments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Brain className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No risk assessments yet</h3>
            <p className="text-gray-500 mb-6">Run AI analysis to assess customer risk profiles</p>
            <Button onClick={runRiskAnalysis} disabled={analyzing}>
              <Zap className="mr-2 h-4 w-4" />
              Start Risk Analysis
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Charts Section */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Risk Distribution</CardTitle>
                <CardDescription>Assessment breakdown by risk level</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={riskDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {riskDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Assessments']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {riskDistribution.map((risk, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: risk.color }}
                        />
                        <span className="text-sm">{risk.name}</span>
                      </div>
                      <span className="text-sm font-medium">{risk.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Trends</CardTitle>
                <CardDescription>Daily assessment activity</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={riskTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="assessments" stroke="#3B82F6" strokeWidth={2} />
                    <Line type="monotone" dataKey="highRisk" stroke="#EF4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk vs Balance</CardTitle>
                <CardDescription>Customer risk correlation</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <ScatterChart data={customerRiskScatter.slice(0, 50)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="balance" 
                      type="number" 
                      domain={['dataMin', 'dataMax']}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <YAxis 
                      dataKey="riskScore" 
                      type="number" 
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'balance' ? `$${value.toLocaleString()}` : `${value}%`,
                        name === 'balance' ? 'Balance' : 'Risk Score'
                      ]}
                    />
                    <Scatter dataKey="riskScore" fill="#EF4444" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent High-Risk Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
                High-Risk Alerts
              </CardTitle>
              <CardDescription>Customers requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              {highRiskAssessments.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
                  <p className="text-muted-foreground">No high-risk customers detected</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {highRiskAssessments.slice(0, 5).map((assessment) => {
                    const riskColors = getRiskColor(assessment.riskLevel)
                    return (
                      <div key={assessment.id} className={`p-4 rounded-lg border ${riskColors.border} ${riskColors.bg}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="font-semibold">
                                  {assessment.customer ? 
                                    `${assessment.customer.firstName} ${assessment.customer.lastName}` : 
                                    'Unknown Customer'
                                  }
                                </h4>
                                <Badge className={`${riskColors.bg} ${riskColors.text}`}>
                                  {assessment.riskLevel}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {assessment.customer?.email}
                              </p>
                              <div className="flex items-center space-x-4 text-sm">
                                <span>Risk Score: {Math.round(assessment.riskScore * 100)}%</span>
                                <span>Balance: ${assessment.customer?.accountBalance.toLocaleString()}</span>
                                <span>Credit: {assessment.customer?.creditScore}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateAssessmentStatus(assessment.id, 'resolved')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Resolve
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4 mr-1" />
                                  Details
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Risk Assessment Details</DialogTitle>
                                  <DialogDescription>
                                    Comprehensive risk analysis for {assessment.customer?.firstName} {assessment.customer?.lastName}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                      <h4 className="font-semibold mb-2">Customer Information</h4>
                                      <div className="space-y-1 text-sm">
                                        <p>Email: {assessment.customer?.email}</p>
                                        <p>Balance: ${assessment.customer?.accountBalance.toLocaleString()}</p>
                                        <p>Credit Score: {assessment.customer?.creditScore}</p>
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold mb-2">Risk Metrics</h4>
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm">Risk Score</span>
                                          <div className="flex items-center space-x-2">
                                            <Progress value={assessment.riskScore * 100} className="w-16 h-2" />
                                            <span className="text-sm font-medium">{Math.round(assessment.riskScore * 100)}%</span>
                                          </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm">Risk Level</span>
                                          <Badge className={`${riskColors.bg} ${riskColors.text}`}>
                                            {assessment.riskLevel}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h4 className="font-semibold mb-2">Risk Factors</h4>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                      <pre className="text-sm whitespace-pre-wrap">
                                        {JSON.stringify(JSON.parse(assessment.factors || '[]'), null, 2)}
                                      </pre>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h4 className="font-semibold mb-2">Recommendations</h4>
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                      <pre className="text-sm whitespace-pre-wrap">
                                        {JSON.stringify(JSON.parse(assessment.recommendations || '[]'), null, 2)}
                                      </pre>
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {highRiskAssessments.length > 5 && (
                    <p className="text-center text-muted-foreground">
                      And {highRiskAssessments.length - 5} more high-risk assessments...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* All Assessments */}
          <Card>
            <CardHeader>
              <CardTitle>All Risk Assessments</CardTitle>
              <CardDescription>Complete assessment history</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="active" className="w-full">
                <TabsList>
                  <TabsTrigger value="active">Active ({activeAssessments.length})</TabsTrigger>
                  <TabsTrigger value="resolved">Resolved ({assessments.filter(a => a.status === 'resolved').length})</TabsTrigger>
                  <TabsTrigger value="all">All ({assessments.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="space-y-4">
                  {activeAssessments.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
                      <p className="text-muted-foreground">No active risk assessments</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeAssessments.map((assessment) => {
                        const riskColors = getRiskColor(assessment.riskLevel)
                        return (
                          <div key={assessment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              {getStatusIcon(assessment.status)}
                              <div>
                                <p className="font-medium">
                                  {assessment.customer ? 
                                    `${assessment.customer.firstName} ${assessment.customer.lastName}` : 
                                    'Unknown Customer'
                                  }
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {assessment.assessmentType} • {new Date(assessment.assessedDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="text-right">
                                <p className="text-sm font-medium">{Math.round(assessment.riskScore * 100)}% Risk</p>
                                <Badge className={`${riskColors.bg} ${riskColors.text}`} size="sm">
                                  {assessment.riskLevel}
                                </Badge>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedAssessment(assessment)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="resolved" className="space-y-4">
                  {assessments.filter(a => a.status === 'resolved').map((assessment) => {
                    const riskColors = getRiskColor(assessment.riskLevel)
                    return (
                      <div key={assessment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg opacity-75">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(assessment.status)}
                          <div>
                            <p className="font-medium">
                              {assessment.customer ? 
                                `${assessment.customer.firstName} ${assessment.customer.lastName}` : 
                                'Unknown Customer'
                              }
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Resolved • {new Date(assessment.assessedDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge className={`${riskColors.bg} ${riskColors.text}`} size="sm">
                          {assessment.riskLevel}
                        </Badge>
                      </div>
                    )
                  })}
                </TabsContent>

                <TabsContent value="all" className="space-y-4">
                  <div className="space-y-2">
                    {assessments.slice(0, 20).map((assessment) => {
                      const riskColors = getRiskColor(assessment.riskLevel)
                      return (
                        <div key={assessment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(assessment.status)}
                            <div>
                              <p className="font-medium">
                                {assessment.customer ? 
                                  `${assessment.customer.firstName} ${assessment.customer.lastName}` : 
                                  'Unknown Customer'
                                }
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {assessment.status} • {new Date(assessment.assessedDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <p className="text-sm font-medium">{Math.round(assessment.riskScore * 100)}%</p>
                              <Badge className={`${riskColors.bg} ${riskColors.text}`} size="sm">
                                {assessment.riskLevel}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {assessments.length > 20 && (
                      <p className="text-center text-muted-foreground py-2">
                        And {assessments.length - 20} more assessments...
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}