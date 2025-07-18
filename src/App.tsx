import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Sidebar } from './components/layout/Sidebar'
import { Dashboard } from './pages/Dashboard'
import { CustomerProfiles } from './pages/CustomerProfiles'
import { Segmentation } from './pages/Segmentation'
import { Analytics } from './pages/Analytics'
import { AIInsights } from './pages/AIInsights'
import { RiskAssessment } from './pages/RiskAssessment'
import { blink } from './blink/client'
import { Toaster } from './components/ui/toaster'
import { Button } from './components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Brain, Building2, Shield, Users } from 'lucide-react'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-lg font-medium text-gray-700">Loading AI Banking Platform...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                AI Banking Intelligence
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                Advanced customer intelligence and segmentation platform
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <Brain className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">AI-Powered Insights</p>
                  <p className="text-sm text-blue-700">Machine learning customer analysis</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">360° Customer Profiles</p>
                  <p className="text-sm text-green-700">Comprehensive customer intelligence</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                <Shield className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-900">Risk Assessment</p>
                  <p className="text-sm text-red-700">Real-time fraud detection</p>
                </div>
              </div>
            </div>
            <Button 
              onClick={() => blink.auth.login()} 
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              Sign In to Continue
            </Button>
            <p className="text-xs text-center text-gray-500">
              Secure authentication powered by Blink
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/customers" element={<CustomerProfiles />} />
            <Route path="/segmentation" element={<Segmentation />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/insights" element={<AIInsights />} />
            <Route path="/risk" element={<RiskAssessment />} />
          </Routes>
        </main>
        <Toaster />
      </div>
    </Router>
  )
}

export default App