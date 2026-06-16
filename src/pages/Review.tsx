import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Header } from '@/components/layout/Header'
import { PullToRefresh } from '@/components/layout/PullToRefresh'
import { ReviewDeck } from '@/components/memory/ReviewDeck'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

const Review = () => {
  const navigate = useNavigate()
  const { user, profile, isAdmin, signOut } = useAuth()

  if (!user) {
    navigate('/auth')
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        isLoggedIn={!!user}
        isAdmin={isAdmin}
        userName={profile?.display_name || user?.email?.split('@')[0] || 'User'}
        onLogin={() => navigate('/auth')}
        onLogout={signOut}
      />
      <PullToRefresh onRefresh={() => Promise.resolve()}>
        <div className="container mx-auto px-4 py-6 max-w-lg">
          <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> 返回首頁
          </Button>
          <h1 className="text-2xl font-display font-bold mb-1">📅 記憶複習中心</h1>
          <p className="text-sm text-muted-foreground mb-6">FSRS 智慧排程，記得更牢</p>
          <ReviewDeck userId={user.id} />
        </div>
      </PullToRefresh>
    </div>
  )
}

export default Review
