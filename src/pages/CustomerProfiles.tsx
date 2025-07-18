import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Progress } from '../components/ui/progress'
import { 
  Search, 
  Filter, 
  User, 
  DollarSign, 
  CreditCard, 
  AlertTriangle,
  TrendingUp,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Activity,
  Brain,
  Target,
  Sparkles,
  RefreshCw,
  Download,
  Plus
} from 'lucide-react'
import { blink } from '../blink/client'
import { DataSeeder } from '../services/dataSeeder'
import { MLEngine } from '../services/mlEngine'

interface Customer {
  id: string
  customerNumber: string
  firstName: string
  lastName: string
  email: string
  phone: string
  accountBalance: number
  creditScore: number
  annualIncome: number
  riskScore: number
  customerLifetimeValue: number
  accountType: string
  preferredChannel: string
  kycStatus: string
  isActive: number
  createdAt: string
  lastTransactionDate: string
  transactionCount: number
}

interface CustomerInsight {
  type: string
  title: string
  description: string
  priority: string
  confidence: number
  recommendation: string
  potentialRevenue?: number
}

export function CustomerProfiles() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRisk, setFilterRisk] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerInsights, setCustomerInsights] = useState<CustomerInsight[]>([])
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [seeding, setSeeding] = useState(false)

  useEffect(() => {
    loadCustomers()
  }, [])

  useEffect(() => {
    filterCustomers()
  }, [customers, searchTerm, filterRisk, filterStatus])

  const loadCustomers = async () => {
    try {
      const customerData = await blink.db.customers.list({
        orderBy: { createdAt: 'desc' },
        limit: 500
      })
      setCustomers(customerData)
    } catch (error) {
      console.error('Error loading customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterCustomers = () => {
    let filtered = customers

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.customerNumber.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Risk filter
    if (filterRisk !== 'all') {
      filtered = filtered.filter(customer => {
        const risk = customer.riskScore
        switch (filterRisk) {
          case 'low': return risk < 0.3
          case 'medium': return risk >= 0.3 && risk < 0.7
          case 'high': return risk >= 0.7
          default: return true
        }
      })
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(customer => {
        switch (filterStatus) {
          case 'active': return customer.isActive === 1
          case 'inactive': return customer.isActive === 0
          case 'kyc_pending': return customer.kycStatus === 'pending'
          case 'high_value': return customer.accountBalance > 100000
          default: return true
        }
      })
    }

    setFilteredCustomers(filtered)
  }

  const seedSampleData = async () => {
    try {
      setSeeding(true)
      const user = await blink.auth.me()
      await DataSeeder.seedCustomerData(user.id, 50)
      await DataSeeder.seedCustomerSegments(user.id)
      await loadCustomers()
    } catch (error) {
      console.error('Error seeding data:', error)
    } finally {
      setSeeding(false)
    }
  }

  const generateCustomerInsights = async (customer: Customer) => {
    try {
      setInsightsLoading(true)
      
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
        avgMonthlyBalance: customer.accountBalance * 0.9, // Approximation
        riskScore: customer.riskScore,
        customerLifetimeValue: customer.customerLifetimeValue,
        accountAge: Math.floor((Date.now() - new Date(customer.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)),
        lastTransactionDays: customer.lastTransactionDate ? 
          Math.floor((Date.now() - new Date(customer.lastTransactionDate).getTime()) / (1000 * 60 * 60 * 24)) : 30
      }

      const insights = await MLEngine.generateCustomerInsights(customer.id, customerData)
      setCustomerInsights(insights)
    } catch (error) {
      console.error('Error generating insights:', error)
    } finally {
      setInsightsLoading(false)
    }
  }

  const getRiskLevel = (score: number) => {
    if (score < 0.3) return { level: 'Low', color: 'bg-green-500', textColor: 'text-green-700' }
    if (score < 0.7) return { level: 'Medium', color: 'bg-yellow-500', textColor: 'text-yellow-700' }
    return { level: 'High', color: 'bg-red-500', textColor: 'text-red-700' }
  }

  const getStatusBadge = (customer: Customer) => {
    if (!customer.isActive) return <Badge variant="secondary">Inactive</Badge>
    if (customer.kycStatus === 'pending') return <Badge variant="outline">KYC Pending</Badge>
    if (customer.accountBalance > 100000) return <Badge className="bg-purple-100 text-purple-800">High Value</Badge>
    return <Badge variant="default">Active</Badge>
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Customer Profiles</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                  </div>
                </div>
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
        <h2 className="text-3xl font-bold tracking-tight">Customer Profiles</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadCustomers}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          {customers.length === 0 && (
            <Button onClick={seedSampleData} disabled={seeding}>
              {seeding ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {seeding ? 'Seeding...' : 'Add Sample Data'}
            </Button>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers by name, email, or customer number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterRisk} onValueChange={setFilterRisk}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Risk Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risk Levels</SelectItem>
            <SelectItem value="low">Low Risk</SelectItem>
            <SelectItem value="medium">Medium Risk</SelectItem>
            <SelectItem value="high">High Risk</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Customers</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="kyc_pending">KYC Pending</SelectItem>
            <SelectItem value="high_value">High Value</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Customer Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {filteredCustomers.length !== customers.length && `${filteredCustomers.length} filtered`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(customers.reduce((sum, c) => sum + c.accountBalance, 0) / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground">Under management</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter(c => c.accountBalance > 100000).length}
            </div>
            <p className="text-xs text-muted-foreground">Customers &gt;$100k</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {customers.filter(c => c.riskScore > 0.7).length}
            </div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {customers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
            <p className="text-gray-500 mb-6">Get started by adding sample customer data</p>
            <Button onClick={seedSampleData} disabled={seeding}>
              {seeding ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {seeding ? 'Adding Sample Data...' : 'Add Sample Data'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCustomers.map((customer) => {
            const risk = getRiskLevel(customer.riskScore)
            return (
              <Dialog key={customer.id}>
                <DialogTrigger asChild>
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-lg font-semibold truncate">
                              {customer.firstName} {customer.lastName}
                            </h3>
                            {getStatusBadge(customer)}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{customer.email}</p>
                          <p className="text-xs text-muted-foreground">{customer.customerNumber}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Balance</span>
                          <span className="font-semibold">${customer.accountBalance.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Risk Level</span>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${risk.color}`}></div>
                            <span className={`text-sm font-medium ${risk.textColor}`}>{risk.level}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">CLV</span>
                          <span className="font-semibold">${customer.customerLifetimeValue.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Credit Score</span>
                          <span className="font-semibold">{customer.creditScore}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{customer.firstName} {customer.lastName}</h2>
                        <p className="text-muted-foreground">{customer.customerNumber}</p>
                      </div>
                    </DialogTitle>
                    <DialogDescription>
                      360° customer profile with AI-powered insights and recommendations
                    </DialogDescription>
                  </DialogHeader>

                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="financial">Financial</TabsTrigger>
                      <TabsTrigger value="insights">AI Insights</TabsTrigger>
                      <TabsTrigger value="activity">Activity</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Personal Information</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center space-x-3">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span>{customer.email}</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{customer.phone || 'Not provided'}</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>Customer since {new Date(customer.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Activity className="h-4 w-4 text-muted-foreground" />
                              <span>Preferred: {customer.preferredChannel}</span>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Account Summary</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Account Type</span>
                              <Badge variant="outline">{customer.accountType}</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">KYC Status</span>
                              <Badge variant={customer.kycStatus === 'approved' ? 'default' : 'secondary'}>
                                {customer.kycStatus}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Status</span>
                              <Badge variant={customer.isActive ? 'default' : 'secondary'}>
                                {customer.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Transactions</span>
                              <span className="font-medium">{customer.transactionCount}</span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="financial" className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                              <DollarSign className="mr-2 h-5 w-5" />
                              Account Balance
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold">${customer.accountBalance.toLocaleString()}</div>
                            <p className="text-sm text-muted-foreground mt-1">Current balance</p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                              <CreditCard className="mr-2 h-5 w-5" />
                              Credit Score
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold">{customer.creditScore}</div>
                            <Progress value={(customer.creditScore / 850) * 100} className="mt-2" />
                            <p className="text-sm text-muted-foreground mt-1">
                              {customer.creditScore > 750 ? 'Excellent' : 
                               customer.creditScore > 650 ? 'Good' : 
                               customer.creditScore > 550 ? 'Fair' : 'Poor'}
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                              <TrendingUp className="mr-2 h-5 w-5" />
                              Lifetime Value
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold">${customer.customerLifetimeValue.toLocaleString()}</div>
                            <p className="text-sm text-muted-foreground mt-1">Predicted CLV</p>
                          </CardContent>
                        </Card>
                      </div>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center">
                            <AlertTriangle className="mr-2 h-5 w-5" />
                            Risk Assessment
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span>Risk Score</span>
                              <div className="flex items-center space-x-2">
                                <Progress value={customer.riskScore * 100} className="w-32" />
                                <span className="font-medium">{Math.round(customer.riskScore * 100)}%</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Risk Level</span>
                              <Badge variant={customer.riskScore > 0.7 ? 'destructive' : customer.riskScore > 0.4 ? 'default' : 'secondary'}>
                                {getRiskLevel(customer.riskScore).level}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Annual Income: ${customer.annualIncome?.toLocaleString() || 'Not provided'}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="insights" className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">AI-Powered Insights</h3>
                        <Button 
                          onClick={() => {
                            setSelectedCustomer(customer)
                            generateCustomerInsights(customer)
                          }}
                          disabled={insightsLoading}
                        >
                          {insightsLoading ? (
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Brain className="mr-2 h-4 w-4" />
                          )}
                          {insightsLoading ? 'Generating...' : 'Generate Insights'}
                        </Button>
                      </div>

                      {customerInsights.length > 0 ? (
                        <div className="space-y-4">
                          {customerInsights.map((insight, index) => (
                            <Card key={index}>
                              <CardHeader>
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start space-x-3">
                                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                      <Sparkles className="h-4 w-4 text-purple-600" />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold">{insight.title}</h4>
                                      <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Badge variant={insight.priority === 'high' ? 'destructive' : insight.priority === 'medium' ? 'default' : 'secondary'}>
                                      {insight.priority}
                                    </Badge>
                                    <div className="text-sm text-muted-foreground">
                                      {Math.round(insight.confidence * 100)}% confidence
                                    </div>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  <div className="text-sm">
                                    <strong>Recommendation:</strong> {insight.recommendation}
                                  </div>
                                  {insight.potentialRevenue && (
                                    <div className="text-sm text-green-600">
                                      <strong>Potential Revenue:</strong> ${insight.potentialRevenue.toLocaleString()}
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <Card>
                          <CardContent className="text-center py-8">
                            <Brain className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                            <p className="text-muted-foreground">Click "Generate Insights" to analyze this customer with AI</p>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>

                    <TabsContent value="activity" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Recent Activity</CardTitle>
                          <CardDescription>Transaction history and account activity</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <Activity className="h-4 w-4 text-blue-500" />
                                <div>
                                  <p className="font-medium">Last Transaction</p>
                                  <p className="text-sm text-muted-foreground">
                                    {customer.lastTransactionDate ? 
                                      new Date(customer.lastTransactionDate).toLocaleDateString() : 
                                      'No recent transactions'
                                    }
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <Target className="h-4 w-4 text-green-500" />
                                <div>
                                  <p className="font-medium">Total Transactions</p>
                                  <p className="text-sm text-muted-foreground">{customer.transactionCount} transactions</p>
                                </div>
                              </div>
                            </div>
                            <div className="text-center py-4 text-muted-foreground">
                              <p>Detailed transaction history would appear here</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            )
          })}
        </div>
      )}

      {filteredCustomers.length === 0 && customers.length > 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Search className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-muted-foreground">No customers match your current filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}