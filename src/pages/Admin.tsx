import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/admin/StatCard';
import { LanguageChart } from '@/components/admin/LanguageChart';
import { ConversationTable } from '@/components/admin/ConversationTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Globe,
  Search,
  Filter,
  Plus,
  FileText,
  AlertTriangle,
  Star,
  Settings
} from 'lucide-react';
import { Conversation, AnalyticsData, AdminPreset } from '@/lib/types';

// Mock data for demonstration
const mockAnalytics: AnalyticsData = {
  totalUsers: 12450,
  activeUsers: { daily: 1234, monthly: 8765 },
  guestVsLoggedIn: { guests: 4500, loggedIn: 7950 },
  languageUsage: {
    english: 4500,
    german: 1200,
    french: 1800,
    spanish: 2100,
    japanese: 1650,
    korean: 1200,
  },
  scenarioUsage: {
    daily: 3200,
    workplace: 4100,
    travel: 2400,
    academic: 1800,
    freeChat: 950,
  },
  examModeUsage: { ielts: 890, toefl: 720 },
  commonErrors: [
    { error: 'Subject-verb agreement', count: 2340 },
    { error: 'Article usage', count: 1890 },
    { error: 'Verb tense', count: 1560 },
    { error: 'Preposition errors', count: 1230 },
  ],
  popularKeywords: [
    { keyword: 'interview', count: 890 },
    { keyword: 'travel', count: 780 },
    { keyword: 'restaurant', count: 650 },
    { keyword: 'business', count: 540 },
  ],
};

const mockConversations: Conversation[] = [
  {
    id: 'conv-001-abc-xyz',
    settings: {
      language: 'english',
      scenario: 'workplace',
      difficulty: 'intermediate',
      speed: 'normal',
      tone: 'formal',
      mode: 'practice',
      instantCorrection: true,
    },
    messages: [
      { id: '1', role: 'assistant', content: 'Hello!', timestamp: new Date() },
      { id: '2', role: 'user', content: 'Hi there!', timestamp: new Date() },
    ],
    startedAt: new Date('2024-01-15'),
    isAnonymized: true,
  },
  {
    id: 'conv-002-def-uvw',
    settings: {
      language: 'german',
      scenario: 'daily',
      difficulty: 'beginner',
      speed: 'slow',
      tone: 'casual',
      mode: 'practice',
      instantCorrection: true,
    },
    messages: [
      { id: '1', role: 'assistant', content: 'Hallo!', timestamp: new Date() },
      { id: '2', role: 'user', content: 'Guten Tag!', timestamp: new Date() },
      { id: '3', role: 'assistant', content: 'Wie geht es dir?', timestamp: new Date() },
    ],
    startedAt: new Date('2024-01-14'),
    isAnonymized: true,
  },
  {
    id: 'conv-003-ghi-rst',
    settings: {
      language: 'japanese',
      scenario: 'travel',
      difficulty: 'advanced',
      speed: 'fast',
      tone: 'semi-formal',
      mode: 'test',
      instantCorrection: false,
    },
    messages: Array(8).fill(null).map((_, i) => ({
      id: String(i),
      role: i % 2 === 0 ? 'assistant' : 'user' as const,
      content: 'Sample message',
      timestamp: new Date(),
    })),
    startedAt: new Date('2024-01-13'),
    isAnonymized: true,
    score: { fluency: 8, grammar: 7, vocabulary: 8, logic: 9, overall: 8, feedback: 'Great job!' },
  },
];

const mockPresets: AdminPreset[] = [
  {
    id: 'preset-001',
    type: 'example',
    language: 'english',
    scenario: 'workplace',
    difficulty: 'intermediate',
    title: 'Job Interview - Marketing Role',
    content: 'Sample interview dialogue for marketing positions...',
    createdBy: 'admin',
    createdAt: new Date('2024-01-10'),
    isActive: true,
  },
  {
    id: 'preset-002',
    type: 'error',
    language: 'german',
    scenario: 'daily',
    difficulty: 'beginner',
    title: 'Common Article Mistakes',
    content: 'Examples of der/die/das errors...',
    createdBy: 'admin',
    createdAt: new Date('2024-01-08'),
    isActive: true,
  },
];

const Admin = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [languageFilter, setLanguageFilter] = useState('all');

  const handleViewConversation = (id: string) => {
    console.log('View conversation:', id);
  };

  const handleMarkAsQuality = (id: string) => {
    console.log('Mark as quality:', id);
  };

  const handleMarkAsError = (id: string) => {
    console.log('Mark as error:', id);
  };

  const handleCreatePreset = (id: string) => {
    console.log('Create preset from:', id);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isAdmin={true} isLoggedIn={true} userName="Admin" />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage conversations, presets, and learning recommendations
            </p>
          </div>
          <Button variant="gradient">
            <Plus className="w-4 h-4 mr-2" />
            New Preset
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="conversations">Conversations</TabsTrigger>
            <TabsTrigger value="presets">Presets</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Users"
                value={mockAnalytics.totalUsers.toLocaleString()}
                change="+12% from last month"
                changeType="positive"
                icon={Users}
              />
              <StatCard
                title="Daily Active Users"
                value={mockAnalytics.activeUsers.daily.toLocaleString()}
                change="+5% from yesterday"
                changeType="positive"
                icon={TrendingUp}
              />
              <StatCard
                title="Total Conversations"
                value="45.2K"
                change="+18% from last month"
                changeType="positive"
                icon={MessageSquare}
              />
              <StatCard
                title="Languages Active"
                value="6"
                icon={Globe}
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LanguageChart data={mockAnalytics.languageUsage} />

              {/* User Type Distribution */}
              <div className="bg-card rounded-xl p-6 border border-border shadow-soft">
                <h3 className="font-semibold mb-4">User Distribution</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Logged In Users</span>
                      <span className="text-sm font-medium">
                        {mockAnalytics.guestVsLoggedIn.loggedIn.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full gradient-primary rounded-full"
                        style={{ 
                          width: `${(mockAnalytics.guestVsLoggedIn.loggedIn / mockAnalytics.totalUsers) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Guest Users</span>
                      <span className="text-sm font-medium">
                        {mockAnalytics.guestVsLoggedIn.guests.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-muted-foreground/30 rounded-full"
                        style={{ 
                          width: `${(mockAnalytics.guestVsLoggedIn.guests / mockAnalytics.totalUsers) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <h4 className="font-medium mb-3">Exam Mode Usage</h4>
                  <div className="flex gap-4">
                    <div className="flex-1 p-4 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold">{mockAnalytics.examModeUsage.ielts}</p>
                      <p className="text-sm text-muted-foreground">IELTS Sessions</p>
                    </div>
                    <div className="flex-1 p-4 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold">{mockAnalytics.examModeUsage.toefl}</p>
                      <p className="text-sm text-muted-foreground">TOEFL Sessions</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Common Errors & Keywords */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card rounded-xl p-6 border border-border shadow-soft">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  Common Errors
                </h3>
                <div className="space-y-3">
                  {mockAnalytics.commonErrors.map((error, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm">{error.error}</span>
                      <Badge variant="secondary">{error.count}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card rounded-xl p-6 border border-border shadow-soft">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary" />
                  Popular Keywords
                </h3>
                <div className="flex flex-wrap gap-2">
                  {mockAnalytics.popularKeywords.map((kw, i) => (
                    <Badge key={i} variant="outline" className="text-sm">
                      {kw.keyword} ({kw.count})
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Conversations Tab */}
          <TabsContent value="conversations" className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={languageFilter} onValueChange={setLanguageFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="german">German</SelectItem>
                  <SelectItem value="french">French</SelectItem>
                  <SelectItem value="spanish">Spanish</SelectItem>
                  <SelectItem value="japanese">Japanese</SelectItem>
                  <SelectItem value="korean">Korean</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
            </div>

            <ConversationTable
              conversations={mockConversations}
              onViewConversation={handleViewConversation}
              onMarkAsQuality={handleMarkAsQuality}
              onMarkAsError={handleMarkAsError}
              onCreatePreset={handleCreatePreset}
            />
          </TabsContent>

          {/* Presets Tab */}
          <TabsContent value="presets" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockPresets.map((preset) => (
                <div key={preset.id} className="bg-card rounded-xl p-5 border border-border shadow-soft">
                  <div className="flex items-start justify-between mb-3">
                    <Badge 
                      variant={
                        preset.type === 'example' ? 'default' :
                        preset.type === 'error' ? 'destructive' : 'secondary'
                      }
                    >
                      {preset.type}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {preset.language}
                    </Badge>
                  </div>
                  <h4 className="font-semibold mb-2">{preset.title}</h4>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {preset.content}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {preset.difficulty}
                    </span>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>
              ))}

              {/* Add New Card */}
              <button className="bg-muted/50 rounded-xl p-5 border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center min-h-[200px]">
                <Plus className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Create New Preset</span>
              </button>
            </div>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-6">
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="font-semibold mb-4">Recommendation Rules</h3>
              <p className="text-muted-foreground mb-6">
                Configure automatic learning recommendations based on user performance patterns.
              </p>
              
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50 flex items-center justify-between">
                  <div>
                    <p className="font-medium">Grammar Error Threshold</p>
                    <p className="text-sm text-muted-foreground">
                      Suggest grammar exercises after 5+ similar errors
                    </p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
                
                <div className="p-4 rounded-lg bg-muted/50 flex items-center justify-between">
                  <div>
                    <p className="font-medium">Level Progression</p>
                    <p className="text-sm text-muted-foreground">
                      Suggest next level after 80% accuracy rate
                    </p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
                
                <div className="p-4 rounded-lg bg-muted/50 flex items-center justify-between">
                  <div>
                    <p className="font-medium">Exam Mode Suggestion</p>
                    <p className="text-sm text-muted-foreground">
                      Suggest exam practice after 10 successful sessions
                    </p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Data & Privacy Settings
              </h3>
              
              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">Data Collection</p>
                    <Badge variant="secondary">Enabled for Logged-in Users</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Anonymous conversation data is collected from logged-in users for platform improvement.
                  </p>
                </div>
                
                <div className="p-4 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">Guest Privacy</p>
                    <Badge variant="outline">No Data Collection</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Guest users' conversations are not stored or analyzed.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
