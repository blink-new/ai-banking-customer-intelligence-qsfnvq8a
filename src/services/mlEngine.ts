import { blink } from '../blink/client'

export interface CustomerData {
  id: string
  accountBalance: number
  creditScore: number
  annualIncome: number
  transactionCount: number
  avgMonthlyBalance: number
  riskScore: number
  customerLifetimeValue: number
  accountAge: number // in months
  lastTransactionDays: number // days since last transaction
}

export interface SegmentationResult {
  segmentId: string
  segmentName: string
  customers: string[]
  characteristics: {
    avgBalance: number
    avgIncome: number
    avgRiskScore: number
    avgCLV: number
    size: number
  }
  insights: string[]
}

export class MLEngine {
  /**
   * Advanced customer segmentation using AI-powered clustering
   */
  static async performCustomerSegmentation(customers: CustomerData[]): Promise<SegmentationResult[]> {
    if (customers.length === 0) return []

    try {
      // Prepare customer data for AI analysis
      const customerSummary = customers.map(c => ({
        id: c.id,
        balance: c.accountBalance,
        income: c.annualIncome,
        creditScore: c.creditScore,
        transactionCount: c.transactionCount,
        riskScore: c.riskScore,
        clv: c.customerLifetimeValue,
        accountAge: c.accountAge,
        lastActivity: c.lastTransactionDays
      }))

      // Use AI to analyze and segment customers
      const { object } = await blink.ai.generateObject({
        prompt: `Analyze this banking customer data and create 4-6 meaningful customer segments based on behavior, value, and risk patterns:

Customer Data (${customers.length} customers):
${JSON.stringify(customerSummary.slice(0, 50), null, 2)}

Create segments that are:
1. Actionable for banking strategies
2. Distinct and meaningful
3. Based on multiple factors (not just balance)
4. Include both high-value and growth opportunities

For each segment, provide:
- segmentName: Clear, business-friendly name
- customerIds: Array of customer IDs that belong to this segment
- characteristics: Average metrics for the segment
- insights: 2-3 actionable business insights for this segment

Consider patterns like:
- High-value customers (premium services)
- Young professionals (growth potential)
- Digital natives (mobile-first)
- Risk-averse savers (conservative products)
- Active traders (investment products)
- Dormant accounts (retention needed)`,
        schema: {
          type: 'object',
          properties: {
            segments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  segmentName: { type: 'string' },
                  customerIds: { 
                    type: 'array',
                    items: { type: 'string' }
                  },
                  characteristics: {
                    type: 'object',
                    properties: {
                      avgBalance: { type: 'number' },
                      avgIncome: { type: 'number' },
                      avgRiskScore: { type: 'number' },
                      avgCLV: { type: 'number' },
                      size: { type: 'number' }
                    }
                  },
                  insights: {
                    type: 'array',
                    items: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      })

      // Process AI results into our format
      const results: SegmentationResult[] = []
      
      if (object.segments) {
        for (const segment of object.segments) {
          results.push({
            segmentId: `seg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            segmentName: segment.segmentName,
            customers: segment.customerIds,
            characteristics: segment.characteristics,
            insights: segment.insights
          })
        }
      }

      return results
    } catch (error) {
      console.error('Error in AI segmentation:', error)
      // Fallback to rule-based segmentation
      return this.fallbackSegmentation(customers)
    }
  }

  /**
   * Fallback rule-based segmentation if AI fails
   */
  private static fallbackSegmentation(customers: CustomerData[]): SegmentationResult[] {
    const segments: SegmentationResult[] = []

    // High Value Customers (top 20% by balance)
    const sortedByBalance = [...customers].sort((a, b) => b.accountBalance - a.accountBalance)
    const highValueCount = Math.ceil(customers.length * 0.2)
    const highValueCustomers = sortedByBalance.slice(0, highValueCount)
    
    segments.push({
      segmentId: `seg_high_value_${Date.now()}`,
      segmentName: 'High Value Customers',
      customers: highValueCustomers.map(c => c.id),
      characteristics: {
        avgBalance: highValueCustomers.reduce((sum, c) => sum + c.accountBalance, 0) / highValueCustomers.length,
        avgIncome: highValueCustomers.reduce((sum, c) => sum + c.annualIncome, 0) / highValueCustomers.length,
        avgRiskScore: highValueCustomers.reduce((sum, c) => sum + c.riskScore, 0) / highValueCustomers.length,
        avgCLV: highValueCustomers.reduce((sum, c) => sum + c.customerLifetimeValue, 0) / highValueCustomers.length,
        size: highValueCustomers.length
      },
      insights: [
        'Premium banking services and investment products',
        'Dedicated relationship managers',
        'Exclusive rewards and benefits programs'
      ]
    })

    // Young Professionals (age-based proxy using account age and income)
    const youngProfessionals = customers.filter(c => 
      c.accountAge < 36 && c.annualIncome > 40000 && c.annualIncome < 100000
    )
    
    if (youngProfessionals.length > 0) {
      segments.push({
        segmentId: `seg_young_prof_${Date.now()}`,
        segmentName: 'Young Professionals',
        customers: youngProfessionals.map(c => c.id),
        characteristics: {
          avgBalance: youngProfessionals.reduce((sum, c) => sum + c.accountBalance, 0) / youngProfessionals.length,
          avgIncome: youngProfessionals.reduce((sum, c) => sum + c.annualIncome, 0) / youngProfessionals.length,
          avgRiskScore: youngProfessionals.reduce((sum, c) => sum + c.riskScore, 0) / youngProfessionals.length,
          avgCLV: youngProfessionals.reduce((sum, c) => sum + c.customerLifetimeValue, 0) / youngProfessionals.length,
          size: youngProfessionals.length
        },
        insights: [
          'Mobile-first banking solutions',
          'Student loan and mortgage products',
          'Financial planning and investment education'
        ]
      })
    }

    // High Risk Customers
    const highRiskCustomers = customers.filter(c => c.riskScore > 0.7)
    
    if (highRiskCustomers.length > 0) {
      segments.push({
        segmentId: `seg_high_risk_${Date.now()}`,
        segmentName: 'High Risk Customers',
        customers: highRiskCustomers.map(c => c.id),
        characteristics: {
          avgBalance: highRiskCustomers.reduce((sum, c) => sum + c.accountBalance, 0) / highRiskCustomers.length,
          avgIncome: highRiskCustomers.reduce((sum, c) => sum + c.annualIncome, 0) / highRiskCustomers.length,
          avgRiskScore: highRiskCustomers.reduce((sum, c) => sum + c.riskScore, 0) / highRiskCustomers.length,
          avgCLV: highRiskCustomers.reduce((sum, c) => sum + c.customerLifetimeValue, 0) / highRiskCustomers.length,
          size: highRiskCustomers.length
        },
        insights: [
          'Enhanced monitoring and fraud detection',
          'Risk mitigation strategies',
          'Potential account restrictions or closures'
        ]
      })
    }

    return segments
  }

  /**
   * Generate AI-powered customer insights
   */
  static async generateCustomerInsights(customerId: string, customerData: any): Promise<any[]> {
    try {
      const { object } = await blink.ai.generateObject({
        prompt: `Analyze this individual banking customer profile and generate 3-5 actionable insights:

Customer Profile:
- Balance: $${customerData.accountBalance?.toLocaleString() || 0}
- Credit Score: ${customerData.creditScore || 'N/A'}
- Annual Income: $${customerData.annualIncome?.toLocaleString() || 'N/A'}
- Risk Score: ${customerData.riskScore || 0}
- Transaction Count: ${customerData.transactionCount || 0}
- Account Age: ${customerData.accountAge || 0} months
- Last Transaction: ${customerData.lastTransactionDays || 0} days ago

Generate insights for:
1. Product recommendations
2. Risk assessment
3. Engagement opportunities
4. Revenue optimization
5. Retention strategies

Each insight should include type, priority, confidence, and actionable recommendation.`,
        schema: {
          type: 'object',
          properties: {
            insights: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  priority: { type: 'string' },
                  confidence: { type: 'number' },
                  recommendation: { type: 'string' },
                  potentialRevenue: { type: 'number' }
                }
              }
            }
          }
        }
      })

      return object.insights || []
    } catch (error) {
      console.error('Error generating customer insights:', error)
      return []
    }
  }

  /**
   * Predict customer lifetime value using AI
   */
  static async predictCustomerLifetimeValue(customerData: CustomerData): Promise<number> {
    try {
      const { text } = await blink.ai.generateText({
        prompt: `Calculate the predicted Customer Lifetime Value (CLV) for this banking customer:

Customer Data:
- Current Balance: $${customerData.accountBalance}
- Annual Income: $${customerData.annualIncome}
- Credit Score: ${customerData.creditScore}
- Transaction Count: ${customerData.transactionCount}
- Account Age: ${customerData.accountAge} months
- Risk Score: ${customerData.riskScore}

Consider factors:
1. Revenue potential from fees and interest
2. Cross-selling opportunities
3. Retention probability
4. Risk-adjusted returns
5. Account growth trajectory

Return only the predicted CLV as a number (no currency symbols or text).`,
        maxTokens: 50
      })

      const clv = parseFloat(text.replace(/[^0-9.-]/g, ''))
      return isNaN(clv) ? customerData.customerLifetimeValue : clv
    } catch (error) {
      console.error('Error predicting CLV:', error)
      return customerData.customerLifetimeValue
    }
  }

  /**
   * Assess customer risk using multiple factors
   */
  static async assessCustomerRisk(customerData: CustomerData, transactionHistory: any[]): Promise<{
    riskScore: number
    riskLevel: string
    factors: string[]
    recommendations: string[]
  }> {
    try {
      const { object } = await blink.ai.generateObject({
        prompt: `Assess the risk level for this banking customer:

Customer Profile:
- Balance: $${customerData.accountBalance}
- Credit Score: ${customerData.creditScore}
- Income: $${customerData.annualIncome}
- Transaction Count: ${customerData.transactionCount}
- Account Age: ${customerData.accountAge} months
- Current Risk Score: ${customerData.riskScore}

Recent Transaction Patterns:
${transactionHistory.slice(0, 10).map(t => 
  `- ${t.transactionType}: $${t.amount} (${t.merchantCategory || 'N/A'})`
).join('\n')}

Assess risk based on:
1. Credit worthiness
2. Transaction patterns
3. Account behavior
4. Income stability
5. Fraud indicators

Provide risk score (0.0-1.0), level (low/medium/high/critical), risk factors, and recommendations.`,
        schema: {
          type: 'object',
          properties: {
            riskScore: { type: 'number' },
            riskLevel: { type: 'string' },
            factors: {
              type: 'array',
              items: { type: 'string' }
            },
            recommendations: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        }
      })

      return {
        riskScore: Math.max(0, Math.min(1, object.riskScore || customerData.riskScore)),
        riskLevel: object.riskLevel || 'medium',
        factors: object.factors || [],
        recommendations: object.recommendations || []
      }
    } catch (error) {
      console.error('Error assessing customer risk:', error)
      return {
        riskScore: customerData.riskScore,
        riskLevel: customerData.riskScore > 0.7 ? 'high' : customerData.riskScore > 0.4 ? 'medium' : 'low',
        factors: ['Unable to assess risk factors'],
        recommendations: ['Manual review recommended']
      }
    }
  }

  /**
   * Generate product recommendations for a customer
   */
  static async generateProductRecommendations(customerData: CustomerData): Promise<any[]> {
    try {
      const { object } = await blink.ai.generateObject({
        prompt: `Generate personalized banking product recommendations for this customer:

Customer Profile:
- Balance: $${customerData.accountBalance}
- Credit Score: ${customerData.creditScore}
- Annual Income: $${customerData.annualIncome}
- Risk Score: ${customerData.riskScore}
- Transaction Activity: ${customerData.transactionCount} transactions
- Account Age: ${customerData.accountAge} months

Available Products:
- Savings Accounts (high-yield, money market)
- Credit Cards (rewards, cashback, travel)
- Loans (personal, auto, mortgage)
- Investment Products (CDs, mutual funds, retirement)
- Insurance (life, auto, home)
- Business Banking (if applicable)

Recommend 3-5 products with reasoning, expected revenue, and recommendation score.`,
        schema: {
          type: 'object',
          properties: {
            recommendations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  productType: { type: 'string' },
                  productName: { type: 'string' },
                  reasoning: { type: 'string' },
                  recommendationScore: { type: 'number' },
                  potentialRevenue: { type: 'number' },
                  priority: { type: 'string' }
                }
              }
            }
          }
        }
      })

      return object.recommendations || []
    } catch (error) {
      console.error('Error generating product recommendations:', error)
      return []
    }
  }
}

export default MLEngine