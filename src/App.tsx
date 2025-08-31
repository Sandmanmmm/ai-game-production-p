import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GameProject } from '@/lib/types'
import { getMockProjects } from '@/lib/mockData'
import { GameStudioSidebar } from '@/components/GameStudioSidebar'
import { Dashboard } from '@/components/Dashboard'
import { ProjectDetailView } from '@/components/ProjectDetailView'
import { QAWorkspace } from '@/components/QAWorkspace'
import { Toaster } from '@/components/ui/sonner'
import { useKV } from '@github/spark/hooks'
import { useIsMobile } from '@/hooks/use-mobile'
import { toast } from 'sonner'

function App() {
  const [currentSection, setCurrentSection] = useState('dashboard')
  const [selectedProject, setSelectedProject] = useState<GameProject | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [projects, setProjects] = useKV<GameProject[]>('game_projects', [])
  const [qaProject, setQaProject] = useState<GameProject | null>(null)
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

  const handleQAWorkspace = (project: GameProject) => {
    setQaProject(project)
    toast.success('🔬 Entering QA Testing Studio!')
  }

  const handleCloseQA = () => {
    setQaProject(null)
  }

  const renderMainContent = () => {
    if (currentSection === 'project-detail' && selectedProject) {
      return (
        <ProjectDetailView 
          project={selectedProject} 
          onBack={handleBackToDashboard}
          onQAWorkspace={handleQAWorkspace}
        />
      )
    }

    switch (currentSection) {
      case 'dashboard':
        return <Dashboard onProjectSelect={handleProjectSelect} onQAWorkspace={handleQAWorkspace} />
      case 'projects':
        return <Dashboard onProjectSelect={handleProjectSelect} onQAWorkspace={handleQAWorkspace} />
      case 'story':
      case 'assets':
      case 'gameplay':
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
      case 'qa':
        // Show QA selection screen if no project selected
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 p-6"
          >
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-accent/20 flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                    className="text-accent"
                  >
                    🔬
                  </motion.div>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">
                    QA Testing Studio
                  </h2>
                  <p className="text-muted-foreground text-lg">
                    Select a project to enter the immersive QA testing environment
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <motion.div
                    key={project.id}
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleQAWorkspace(project)}
                    className="glass-card rounded-xl p-6 cursor-pointer group"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg text-foreground group-hover:text-accent transition-colors">
                          {project.title}
                        </h3>
                        <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                          🎮
                        </div>
                      </div>
                      <p className="text-muted-foreground text-sm line-clamp-2">
                        {project.story?.plot || 'Enter QA mode to test gameplay mechanics and balance.'}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Progress: {project.progress}%
                        </span>
                        <span className="text-accent font-medium">Test Now →</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
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
          {(currentSection !== 'project-detail' || !isMobile) && !qaProject && (
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

      {/* QA Workspace Overlay */}
      <AnimatePresence>
        {qaProject && (
          <QAWorkspace 
            project={qaProject} 
            onClose={handleCloseQA}
          />
        )}
      </AnimatePresence>

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