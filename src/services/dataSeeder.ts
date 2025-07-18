import { blink } from '../blink/client'

export class DataSeeder {
  /**
   * Seed the database with realistic banking customer data
   */
  static async seedCustomerData(userId: string, count: number = 100): Promise<void> {
    try {
      console.log(`Seeding ${count} customers...`)
      
      const customers = []
      const transactions = []
      const interactions = []
      
      // Generate realistic customer data
      for (let i = 0; i < count; i++) {
        const customerId = `cust_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`
        const customerNumber = `BNK${String(100000 + i).padStart(6, '0')}`
        
        // Generate realistic demographics
        const firstName = this.getRandomFirstName()
        const lastName = this.getRandomLastName()
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${this.getRandomEmailDomain()}`
        const phone = this.generatePhoneNumber()
        
        // Generate financial profile
        const annualIncome = this.generateAnnualIncome()
        const creditScore = this.generateCreditScore(annualIncome)
        const accountBalance = this.generateAccountBalance(annualIncome, creditScore)
        const accountAge = Math.floor(Math.random() * 120) + 1 // 1-120 months
        const transactionCount = Math.floor(Math.random() * 200) + 10
        const avgMonthlyBalance = accountBalance * (0.8 + Math.random() * 0.4)
        const riskScore = this.calculateRiskScore(creditScore, accountBalance, transactionCount)
        const customerLifetimeValue = this.calculateCLV(accountBalance, annualIncome, accountAge)
        
        const customer = {
          id: customerId,
          userId,
          customerNumber,
          firstName,
          lastName,
          email,
          phone,
          dateOfBirth: this.generateDateOfBirth(),
          address: this.generateAddress(),
          city: this.getRandomCity(),
          state: this.getRandomState(),
          zipCode: this.generateZipCode(),
          country: 'US',
          accountBalance,
          creditScore,
          annualIncome,
          employmentStatus: this.getRandomEmploymentStatus(),
          accountType: this.getRandomAccountType(),
          accountOpenedDate: this.generateAccountOpenedDate(accountAge),
          lastTransactionDate: this.generateLastTransactionDate(),
          transactionCount,
          avgMonthlyBalance,
          riskScore,
          customerLifetimeValue,
          preferredChannel: this.getRandomChannel(),
          kycStatus: Math.random() > 0.1 ? 'approved' : 'pending',
          isActive: Math.random() > 0.05 ? 1 : 0
        }
        
        customers.push(customer)
        
        // Generate transactions for this customer
        const customerTransactions = this.generateTransactions(customerId, userId, transactionCount)
        transactions.push(...customerTransactions)
        
        // Generate customer interactions
        const customerInteractions = this.generateInteractions(customerId, userId)
        interactions.push(...customerInteractions)
      }
      
      // Batch insert customers
      console.log('Inserting customers...')
      await blink.db.customers.createMany(customers)
      
      // Batch insert transactions
      console.log('Inserting transactions...')
      const transactionBatches = this.chunkArray(transactions, 50)
      for (const batch of transactionBatches) {
        await blink.db.transactions.createMany(batch)
      }
      
      // Batch insert interactions
      console.log('Inserting interactions...')
      await blink.db.customerInteractions.createMany(interactions)
      
      console.log(`Successfully seeded ${count} customers with ${transactions.length} transactions and ${interactions.length} interactions`)
    } catch (error) {
      console.error('Error seeding customer data:', error)
      throw error
    }
  }
  
  /**
   * Generate sample customer segments
   */
  static async seedCustomerSegments(userId: string): Promise<void> {
    try {
      const segments = [
        {
          id: `seg_high_value_${Date.now()}`,
          userId,
          segmentName: 'High Value Customers',
          description: 'Customers with account balances over $100,000 and high transaction volumes',
          criteria: JSON.stringify({
            accountBalance: { min: 100000 },
            transactionCount: { min: 50 }
          }),
          customerCount: 0,
          avgBalance: 250000,
          totalRevenue: 5000000,
          growthRate: 12.5,
          riskLevel: 'low',
          isActive: 1
        },
        {
          id: `seg_young_prof_${Date.now()}`,
          userId,
          segmentName: 'Young Professionals',
          description: 'Customers aged 25-35 with growing incomes and digital-first preferences',
          criteria: JSON.stringify({
            annualIncome: { min: 40000, max: 100000 },
            preferredChannel: 'mobile'
          }),
          customerCount: 0,
          avgBalance: 25000,
          totalRevenue: 1800000,
          growthRate: 18.2,
          riskLevel: 'medium',
          isActive: 1
        },
        {
          id: `seg_digital_natives_${Date.now()}`,
          userId,
          segmentName: 'Digital Natives',
          description: 'Tech-savvy customers who prefer mobile and online banking',
          criteria: JSON.stringify({
            preferredChannel: ['mobile', 'online'],
            transactionCount: { min: 30 }
          }),
          customerCount: 0,
          avgBalance: 35000,
          totalRevenue: 2200000,
          growthRate: 22.1,
          riskLevel: 'low',
          isActive: 1
        },
        {
          id: `seg_premium_savers_${Date.now()}`,
          userId,
          segmentName: 'Premium Savers',
          description: 'Conservative customers with high balances and low transaction frequency',
          criteria: JSON.stringify({
            accountBalance: { min: 75000 },
            transactionCount: { max: 20 }
          }),
          customerCount: 0,
          avgBalance: 150000,
          totalRevenue: 3200000,
          growthRate: 8.5,
          riskLevel: 'low',
          isActive: 1
        },
        {
          id: `seg_at_risk_${Date.now()}`,
          userId,
          segmentName: 'At-Risk Customers',
          description: 'Customers showing signs of potential churn or financial stress',
          criteria: JSON.stringify({
            riskScore: { min: 0.6 },
            lastTransactionDays: { min: 30 }
          }),
          customerCount: 0,
          avgBalance: 15000,
          totalRevenue: 500000,
          growthRate: -5.2,
          riskLevel: 'high',
          isActive: 1
        }
      ]
      
      await blink.db.customerSegments.createMany(segments)
      console.log(`Successfully seeded ${segments.length} customer segments`)
    } catch (error) {
      console.error('Error seeding customer segments:', error)
      throw error
    }
  }
  
  // Helper methods for generating realistic data
  private static getRandomFirstName(): string {
    const names = [
      'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
      'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
      'Thomas', 'Sarah', 'Christopher', 'Karen', 'Charles', 'Nancy', 'Daniel', 'Lisa',
      'Matthew', 'Betty', 'Anthony', 'Helen', 'Mark', 'Sandra', 'Donald', 'Donna',
      'Steven', 'Carol', 'Paul', 'Ruth', 'Andrew', 'Sharon', 'Joshua', 'Michelle'
    ]
    return names[Math.floor(Math.random() * names.length)]
  }
  
  private static getRandomLastName(): string {
    const names = [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
      'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
      'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
      'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
      'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores'
    ]
    return names[Math.floor(Math.random() * names.length)]
  }
  
  private static getRandomEmailDomain(): string {
    const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com']
    return domains[Math.floor(Math.random() * domains.length)]
  }
  
  private static generatePhoneNumber(): string {
    const areaCode = Math.floor(Math.random() * 800) + 200
    const exchange = Math.floor(Math.random() * 800) + 200
    const number = Math.floor(Math.random() * 10000)
    return `${areaCode}-${exchange}-${String(number).padStart(4, '0')}`
  }
  
  private static generateAnnualIncome(): number {
    // Generate realistic income distribution
    const rand = Math.random()
    if (rand < 0.2) return Math.floor(Math.random() * 30000) + 20000 // 20k-50k
    if (rand < 0.5) return Math.floor(Math.random() * 40000) + 50000 // 50k-90k
    if (rand < 0.8) return Math.floor(Math.random() * 60000) + 90000 // 90k-150k
    if (rand < 0.95) return Math.floor(Math.random() * 100000) + 150000 // 150k-250k
    return Math.floor(Math.random() * 250000) + 250000 // 250k-500k
  }
  
  private static generateCreditScore(income: number): number {
    // Credit score correlated with income but with variation
    const baseScore = Math.min(850, 580 + (income / 1000))
    const variation = (Math.random() - 0.5) * 100
    return Math.max(300, Math.min(850, Math.floor(baseScore + variation)))
  }
  
  private static generateAccountBalance(income: number, creditScore: number): number {
    // Balance correlated with income and credit score
    const incomeMultiplier = income / 100000
    const creditMultiplier = creditScore / 850
    const baseBalance = income * 0.1 * incomeMultiplier * creditMultiplier
    const variation = (Math.random() - 0.5) * baseBalance * 0.5
    return Math.max(100, Math.floor(baseBalance + variation))
  }
  
  private static calculateRiskScore(creditScore: number, balance: number, transactionCount: number): number {
    // Risk score based on multiple factors
    const creditRisk = (850 - creditScore) / 550 // 0-1 scale
    const balanceRisk = balance < 1000 ? 0.3 : balance < 5000 ? 0.1 : 0
    const activityRisk = transactionCount < 5 ? 0.2 : transactionCount > 100 ? 0.1 : 0
    
    const totalRisk = (creditRisk * 0.6) + (balanceRisk * 0.3) + (activityRisk * 0.1)
    return Math.max(0, Math.min(1, totalRisk + (Math.random() - 0.5) * 0.2))
  }
  
  private static calculateCLV(balance: number, income: number, accountAge: number): number {
    // Simplified CLV calculation
    const monthlyRevenue = (balance * 0.001) + (income * 0.0001) // Fees and interest
    const retentionMultiplier = Math.min(5, accountAge / 12) // Longer customers more valuable
    return Math.floor(monthlyRevenue * 12 * retentionMultiplier * (2 + Math.random() * 3))
  }
  
  private static generateDateOfBirth(): string {
    const year = 1950 + Math.floor(Math.random() * 50)
    const month = Math.floor(Math.random() * 12) + 1
    const day = Math.floor(Math.random() * 28) + 1
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }
  
  private static generateAddress(): string {
    const streetNumbers = Math.floor(Math.random() * 9999) + 1
    const streetNames = ['Main St', 'Oak Ave', 'Pine Rd', 'Elm Dr', 'Maple Ln', 'Cedar Ct', 'Park Blvd']
    return `${streetNumbers} ${streetNames[Math.floor(Math.random() * streetNames.length)]}`
  }
  
  private static getRandomCity(): string {
    const cities = [
      'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia',
      'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville',
      'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco', 'Indianapolis', 'Seattle'
    ]
    return cities[Math.floor(Math.random() * cities.length)]
  }
  
  private static getRandomState(): string {
    const states = [
      'CA', 'TX', 'FL', 'NY', 'PA', 'IL', 'OH', 'GA', 'NC', 'MI',
      'NJ', 'VA', 'WA', 'AZ', 'MA', 'TN', 'IN', 'MO', 'MD', 'WI'
    ]
    return states[Math.floor(Math.random() * states.length)]
  }
  
  private static generateZipCode(): string {
    return String(Math.floor(Math.random() * 90000) + 10000)
  }
  
  private static getRandomEmploymentStatus(): string {
    const statuses = ['employed', 'self-employed', 'unemployed', 'retired', 'student']
    const weights = [0.7, 0.15, 0.05, 0.08, 0.02]
    const rand = Math.random()
    let cumulative = 0
    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i]
      if (rand < cumulative) return statuses[i]
    }
    return 'employed'
  }
  
  private static getRandomAccountType(): string {
    const types = ['checking', 'savings', 'premium', 'business']
    const weights = [0.6, 0.25, 0.1, 0.05]
    const rand = Math.random()
    let cumulative = 0
    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i]
      if (rand < cumulative) return types[i]
    }
    return 'checking'
  }
  
  private static generateAccountOpenedDate(accountAgeMonths: number): string {
    const now = new Date()
    const openedDate = new Date(now.getTime() - (accountAgeMonths * 30 * 24 * 60 * 60 * 1000))
    return openedDate.toISOString().split('T')[0]
  }
  
  private static generateLastTransactionDate(): string {
    const daysAgo = Math.floor(Math.random() * 30)
    const date = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000))
    return date.toISOString().split('T')[0]
  }
  
  private static getRandomChannel(): string {
    const channels = ['online', 'mobile', 'branch', 'atm', 'phone']
    const weights = [0.35, 0.4, 0.15, 0.08, 0.02]
    const rand = Math.random()
    let cumulative = 0
    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i]
      if (rand < cumulative) return channels[i]
    }
    return 'online'
  }
  
  private static generateTransactions(customerId: string, userId: string, count: number): any[] {
    const transactions = []
    const transactionTypes = ['debit', 'credit', 'transfer', 'payment']
    const merchantCategories = [
      'grocery', 'gas', 'restaurant', 'retail', 'utilities', 'healthcare',
      'entertainment', 'travel', 'insurance', 'education', 'other'
    ]
    
    for (let i = 0; i < Math.min(count, 50); i++) {
      const daysAgo = Math.floor(Math.random() * 90)
      const transactionDate = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000))
      
      transactions.push({
        id: `txn_${customerId}_${i}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        customerId,
        transactionType: transactionTypes[Math.floor(Math.random() * transactionTypes.length)],
        amount: Math.floor(Math.random() * 1000) + 10,
        description: `Transaction ${i + 1}`,
        merchantCategory: merchantCategories[Math.floor(Math.random() * merchantCategories.length)],
        channel: this.getRandomChannel(),
        location: `${this.getRandomCity()}, ${this.getRandomState()}`,
        isRecurring: Math.random() > 0.8 ? 1 : 0,
        riskFlag: Math.random() > 0.95 ? 1 : 0,
        transactionDate: transactionDate.toISOString()
      })
    }
    
    return transactions
  }
  
  private static generateInteractions(customerId: string, userId: string): any[] {
    const interactions = []
    const interactionTypes = ['call', 'email', 'chat', 'visit', 'complaint']
    const channels = ['phone', 'email', 'web_chat', 'branch', 'mobile_app']
    const subjects = [
      'Account Balance Inquiry', 'Transaction Dispute', 'Product Information',
      'Technical Support', 'Account Opening', 'Loan Application', 'General Inquiry'
    ]
    
    const numInteractions = Math.floor(Math.random() * 5) + 1
    
    for (let i = 0; i < numInteractions; i++) {
      const daysAgo = Math.floor(Math.random() * 180)
      const interactionDate = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000))
      
      interactions.push({
        id: `int_${customerId}_${i}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        customerId,
        interactionType: interactionTypes[Math.floor(Math.random() * interactionTypes.length)],
        channel: channels[Math.floor(Math.random() * channels.length)],
        subject: subjects[Math.floor(Math.random() * subjects.length)],
        description: `Customer interaction regarding ${subjects[Math.floor(Math.random() * subjects.length)].toLowerCase()}`,
        outcome: Math.random() > 0.2 ? 'resolved' : 'pending',
        satisfactionScore: Math.floor(Math.random() * 5) + 1,
        agentId: `agent_${Math.floor(Math.random() * 20) + 1}`,
        durationMinutes: Math.floor(Math.random() * 30) + 5,
        interactionDate: interactionDate.toISOString()
      })
    }
    
    return interactions
  }
  
  private static chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }
}

export default DataSeeder