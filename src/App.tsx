import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GameProject } from '@/lib/types'
import { getMockProjects } from '@/lib/mockData'
import { GameStudioSidebar } from '@/components/GameStudioSidebar'
import { Dashboard } from '@/components/Dashboard'
import { ProjectDetailView } from '@/components/ProjectDetailView'
import { Toaster } from '@/components/ui/sonner'
import { useKV } from '@github/spark/hooks'
import { useIsMobile } from '@/hooks/use-mobile'

function App() {
  const [currentSection, setCurrentSection] = useState('dashboard')
  const [selectedProject, setSelectedProject] = useState<GameProject | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [projects, setProjects] = useKV<GameProject[]>('game_projects', [])
  const isMobile = useIsMobile()

  // Initialize with mock data if no projects exist
  useEffect(() => {
    if (projects.length === 0) {
      const mockProjects = getMockProjects()
      setProjects(mockProjects)
    }
  }, [projects.length, setProjects])

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true)
    }
  }, [isMobile])

  const handleProjectSelect = (project: GameProject) => {
    setSelectedProject(project)
    setCurrentSection('project-detail')
  }

  const handleBackToDashboard = () => {
    setSelectedProject(null)
    setCurrentSection('dashboard')
  }

  const renderMainContent = () => {
    if (currentSection === 'project-detail' && selectedProject) {
      return (
        <ProjectDetailView 
          project={selectedProject} 
          onBack={handleBackToDashboard} 
        />
      )
    }

    switch (currentSection) {
      case 'dashboard':
        return <Dashboard onProjectSelect={handleProjectSelect} />
      case 'projects':
        return <Dashboard onProjectSelect={handleProjectSelect} />
      case 'story':
      case 'assets':
      case 'gameplay':
      case 'qa':
      case 'publishing':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 p-6 flex items-center justify-center"
          >
            <div className="text-center space-y-4 max-w-md">
              <div className="w-20 h-20 mx-auto rounded-full bg-accent/20 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  className="text-accent"
                >
                  ⚡
                </motion.div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2 capitalize">
                  {currentSection.replace('-', ' & ')} Studio
                </h2>
                <p className="text-muted-foreground mb-6">
                  This section will be available soon. Create a project to start exploring AI-powered game development tools.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentSection('dashboard')}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Go to Dashboard
                </motion.button>
              </div>
            </div>
          </motion.div>
        )
      default:
        return <Dashboard onProjectSelect={handleProjectSelect} />
    }
  }

  return (
    <div className="h-screen w-screen bg-background text-foreground overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 opacity-40">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '-6s' }} />
      </div>

      {/* Main Layout */}
      <div className="relative z-10 h-full flex">
        {/* Sidebar */}
        <AnimatePresence>
          {(currentSection !== 'project-detail' || !isMobile) && (
            <GameStudioSidebar
              currentSection={currentSection}
              onSectionChange={setCurrentSection}
              isCollapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSection + (selectedProject?.id || '')}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="flex-1 overflow-hidden"
            >
              {renderMainContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Global Toast Notifications */}
      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--card)',
            border: '1px solid var(--border)',
            color: 'var(--foreground)',
          },
        }}
      />
    </div>
  )
}

export default App