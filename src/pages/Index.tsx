import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { LanguageCard } from '@/components/home/LanguageCard';
import { FeatureCard } from '@/components/home/FeatureCard';
import { Button } from '@/components/ui/button';
import { LANGUAGES } from '@/lib/constants';
import { LanguageConfig } from '@/lib/types';
import { 
  MessageSquare, Mic, Brain, BarChart3, Target, Globe,
  ChevronRight, Sparkles, Users
} from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut } = useAuth();

  const handleLanguageSelect = (language: LanguageConfig) => {
    navigate(`/practice?lang=${language.id}`);
  };

  return (
    <div className="min-h-screen gradient-hero">
      <Header 
        isLoggedIn={!!user}
        isAdmin={isAdmin}
        userName={profile?.display_name || user?.email?.split('@')[0] || 'User'}
        onLogin={() => navigate('/auth')}
        onLogout={signOut}
      />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
            <Sparkles className="w-4 h-4" />
            AI-Powered Language Learning
          </div>
          
          <h1 className="text-4xl md:text-6xl font-display font-extrabold mb-6 animate-slide-up">
            Master Any Language Through
            <span className="block gradient-primary bg-clip-text text-transparent">
              Real Conversations
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
            Practice speaking with AI tutors in real-world scenarios. 
            Get instant feedback, personalized lessons, and track your progress.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <Button variant="gradient" size="xl" onClick={() => navigate('/practice')}>
              Start Learning Free
              <ChevronRight className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="xl">
              <Users className="w-5 h-5 mr-2" />
              View Demo
            </Button>
          </div>

          <div className="flex items-center justify-center gap-8 mt-12 text-muted-foreground animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              <span className="text-sm">6 Languages</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <span className="text-sm">20+ Scenarios</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <span className="text-sm">IELTS & TOEFL</span>
            </div>
          </div>
        </div>
      </section>

      {/* Language Selection */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Choose Your Language</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Select a language to start practicing. Each language includes specialized scenarios and exam preparation modes.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {LANGUAGES.map((language, index) => (
            <div key={language.id} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
              <LanguageCard language={language} onClick={handleLanguageSelect} />
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Why LinguaAI?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Our platform combines cutting-edge AI with proven language learning methodologies for maximum effectiveness.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <FeatureCard icon={MessageSquare} title="Scenario-Based Learning" description="Practice real-world situations like job interviews, ordering food, or medical appointments." gradient />
          <FeatureCard icon={Mic} title="Voice Interaction" description="Speak naturally and get instant feedback on pronunciation and fluency." />
          <FeatureCard icon={Brain} title="AI Corrections" description="Receive real-time grammar corrections and natural phrasing suggestions." />
          <FeatureCard icon={Target} title="Exam Preparation" description="Dedicated modes for IELTS and TOEFL speaking test preparation with scoring." />
          <FeatureCard icon={BarChart3} title="Progress Tracking" description="Monitor your improvement across vocabulary, grammar, and fluency metrics." />
          <FeatureCard icon={Sparkles} title="Personalized Learning" description="AI-generated recommendations based on your strengths and areas for improvement." />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto bg-card rounded-3xl p-8 md:p-12 shadow-elevated border border-border">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">Ready to Start Your Language Journey?</h2>
              <p className="text-muted-foreground mb-6">
                Join thousands of learners improving their language skills every day. Start with a free conversation – no credit card required.
              </p>
              <Button variant="gradient" size="lg" onClick={() => navigate('/practice')}>
                Begin Free Practice
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
            <div className="w-48 h-48 rounded-2xl gradient-primary opacity-20 animate-float" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-border">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Globe className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold">LinguaAI</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2024 LinguaAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
