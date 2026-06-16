import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Header } from '@/components/layout/Header'
import { VARKQuiz } from '@/components/vark/Quiz'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

const VARKQuizPage = () => {
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
      <div className="container mx-auto px-4 py-6 max-w-lg">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate('/vark-profile')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> 返回風格報告
        </Button>
        <h1 className="text-2xl font-display font-bold mb-1">📝 VARK 學習風格測驗</h1>
        <p className="text-sm text-muted-foreground mb-6">找出你的學習超能力</p>
        <VARKQuiz userId={user.id} onDone={() => navigate('/vark-profile')} />
      </div>
    </div>
  )
}

export default VARKQuizPage
