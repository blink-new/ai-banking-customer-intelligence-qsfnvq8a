import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Progress } from '../components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  Lightbulb,
  Sparkles,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { blink } from '../blink/client'

interface AIInsight {
  id: string
  title: string
  description: string
  insightType: string
  priority: string
  confidenceScore: number
  status: string
  createdAt: string
  customerId?: string
  segmentId?: string
}

export function AIInsights() {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadInsights()
  }, [])

  const loadInsights = async () => {
    try {
      const insightData = await blink.db.aiInsights.list({
        orderBy: { createdAt: 'desc' },
        limit: 50
      })
      setInsights(insightData)
    } catch (error) {
      console.error('Error loading insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateNewInsights = async () => {
    try {
      setGenerating(true)
      
      // Load customer data for analysis
      const customers = await blink.db.customers.list({ limit: 1000 })
      const segments = await blink.db.customerSegments.list()
      
      // Generate insights using AI
      const { text } = await blink.ai.generateText({
        prompt: `Analyze this banking customer data and generate 5-8 actionable business insights:

Customer Data Summary:
- Total customers: ${customers.length}
- Average balance: $${customers.reduce((sum, c) => sum + (c.accountBalance || 0), 0) / customers.length}
- High-value customers (>$50k): ${customers.filter(c => (c.accountBalance || 0) > 50000).length}
- High-risk customers: ${customers.filter(c => (c.riskScore || 0) > 0.7).length}
- Active segments: ${segments.length}

Generate insights for:
1. Revenue opportunities
2. Risk management alerts
3. Customer retention strategies
4. Cross-selling opportunities
5. Operational improvements
6. Market trends
7. Customer behavior patterns

For each insight, provide:
- title (concise, actionable)
- description (2-3 sentences with specific recommendations)
- type (opportunity, risk_alert, retention, cross_sell, operational, trend, behavior)
- priority (high, medium, low)
- confidence (0.0-1.0)

Return as JSON array with fields: title, description, type, priority, confidence`,
        maxTokens: 1500
      })

      try {
        const generatedInsights = JSON.parse(text)
        const user = await blink.auth.me()

        for (const insight of generatedInsights) {
          await blink.db.aiInsights.create({
            id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: user.id,
            title: insight.title,
            description: insight.description,
            insightType: insight.type,
            priority: insight.priority,
            confidenceScore: insight.confidence,
            status: 'active'
          })
        }

        await loadInsights()
      } catch (parseError) {
        console.error('Error parsing AI insights:', parseError)
      }
    } catch (error) {
      console.error('Error generating insights:', error)
    } finally {
      setGenerating(false)
    }
  }

  const updateInsightStatus = async (insightId: string, status: string) => {
    try {
      await blink.db.aiInsights.update(insightId, { status })
      await loadInsights()
    } catch (error) {
      console.error('Error updating insight status:', error)
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <TrendingUp className="h-5 w-5 text-green-500" />
      case 'risk_alert':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'retention':
        return <Target className="h-5 w-5 text-blue-500" />
      case 'cross_sell':
        return <Lightbulb className="h-5 w-5 text-yellow-500" />
      default:
        return <Brain className="h-5 w-5 text-purple-500" />
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'dismissed':
        return <XCircle className="h-4 w-4 text-gray-500" />
      default:
        return <Clock className="h-4 w-4 text-blue-500" />
    }
  }

  const activeInsights = insights.filter(i => i.status === 'active')
  const resolvedInsights = insights.filter(i => i.status === 'resolved')
  const dismissedInsights = insights.filter(i => i.status === 'dismissed')

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">AI Insights</h2>
        </div>
        <div className="grid gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-64 animate-pulse"></div>
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
        <h2 className="text-3xl font-bold tracking-tight">AI Insights</h2>
        <Button onClick={generateNewInsights} disabled={generating}>
          {generating ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {generating ? 'Generating...' : 'Generate Insights'}
        </Button>
      </div>

      {/* Insights Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Insights</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeInsights.length}</div>
            <p className="text-xs text-muted-foreground">Requiring attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {activeInsights.filter(i => i.priority === 'high').length}
            </div>
            <p className="text-xs text-muted-foreground">Critical insights</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opportunities</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeInsights.filter(i => i.insightType === 'opportunity').length}
            </div>
            <p className="text-xs text-muted-foreground">Revenue opportunities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeInsights.length > 0 
                ? Math.round((activeInsights.reduce((sum, i) => sum + (i.confidenceScore || 0), 0) / activeInsights.length) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">AI confidence level</p>
          </CardContent>
        </Card>
      </div>

      {insights.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Brain className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No insights generated yet</h3>
            <p className="text-gray-500 mb-6">Generate AI-powered insights to discover opportunities and risks</p>
            <Button onClick={generateNewInsights} disabled={generating}>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate First Insights
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">Active ({activeInsights.length})</TabsTrigger>
            <TabsTrigger value="resolved">Resolved ({resolvedInsights.length})</TabsTrigger>
            <TabsTrigger value="dismissed">Dismissed ({dismissedInsights.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeInsights.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
                  <p className="text-muted-foreground">No active insights. All insights have been addressed!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {activeInsights.map((insight) => (
                  <Card key={insight.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          {getInsightIcon(insight.insightType)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-lg font-semibold">{insight.title}</h3>
                              <Badge variant={getPriorityColor(insight.priority)}>
                                {insight.priority}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground mb-3">{insight.description}</p>
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-muted-foreground">Confidence:</span>
                                <div className="flex items-center space-x-2">
                                  <Progress 
                                    value={(insight.confidenceScore || 0) * 100} 
                                    className="w-16 h-2" 
                                  />
                                  <span className="text-sm font-medium">
                                    {Math.round((insight.confidenceScore || 0) * 100)}%
                                  </span>
                                </div>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(insight.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateInsightStatus(insight.id, 'resolved')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Resolve
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateInsightStatus(insight.id, 'dismissed')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="resolved" className="space-y-4">
            {resolvedInsights.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No resolved insights yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {resolvedInsights.map((insight) => (
                  <Card key={insight.id} className="opacity-75">
                    <CardHeader>
                      <div className="flex items-start space-x-4">
                        {getInsightIcon(insight.insightType)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold">{insight.title}</h3>
                            <Badge variant="outline">Resolved</Badge>
                            <Badge variant={getPriorityColor(insight.priority)}>
                              {insight.priority}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mb-2">{insight.description}</p>
                          <div className="text-sm text-muted-foreground">
                            Resolved on {new Date(insight.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="dismissed" className="space-y-4">
            {dismissedInsights.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No dismissed insights</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {dismissedInsights.map((insight) => (
                  <Card key={insight.id} className="opacity-50">
                    <CardHeader>
                      <div className="flex items-start space-x-4">
                        {getInsightIcon(insight.insightType)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold">{insight.title}</h3>
                            <Badge variant="outline">Dismissed</Badge>
                            <Badge variant={getPriorityColor(insight.priority)}>
                              {insight.priority}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mb-2">{insight.description}</p>
                          <div className="text-sm text-muted-foreground">
                            Dismissed on {new Date(insight.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}