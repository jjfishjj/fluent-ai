import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Header } from '@/components/layout/Header'
import { FusionRadar } from '@/components/vark/FusionRadar'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Brain, BookOpen, Calendar } from 'lucide-react'

const VARKProfile = () => {
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
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> 返回首頁
        </Button>
        <h1 className="text-2xl font-display font-bold mb-1">🧠 融合學習風格報告</h1>
        <p className="text-sm text-muted-foreground mb-4">三源雷達圖：測驗 + 行為 + 腦波</p>

        <FusionRadar userId={user.id} />

        <div className="mt-6 grid grid-cols-1 gap-3">
          <Button variant="outline" className="w-full justify-start gap-3" onClick={() => navigate('/vark-quiz')}>
            <BookOpen className="w-4 h-4" />
            重新進行 VARK 測驗
          </Button>
          <Button variant="outline" className="w-full justify-start gap-3" onClick={() => navigate('/review')}>
            <Calendar className="w-4 h-4" />
            前往記憶複習中心
          </Button>
          <Button variant="outline" className="w-full justify-start gap-3" onClick={() => navigate('/brain-lab')}>
            <Brain className="w-4 h-4" />
            Brain Lab 腦波分析
          </Button>
        </div>
      </div>
    </div>
  )
}

export default VARKProfile
