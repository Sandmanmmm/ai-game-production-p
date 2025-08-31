import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GameProject } from './lib/types'
import { getMockProjects } from './lib/mockData'
import { GameStudioSidebar } from './components/GameStudioSidebar'
import { GameForgeDashboard } from './components/GameForgeDashboard'
import { Dashboard } from './components/Dashboard'
import { ProjectDetailView } from './components/ProjectDetailView'
import { QAWorkspace } from './components/QAWorkspace'
import { StoryLoreWorkspace } from './components/StoryLoreWorkspace'
import { AssetStudioWorkspace } from './components/AssetStudioWorkspace'
import { PreviewWorkspace } from './components/PreviewWorkspace'
import { GameplayStudio } from './components/GameplayStudio'
import { Toaster } from './components/ui/sonner'
import { useLocalStorage } from './hooks/use-local-storage'
import { useIsMobile } from './hooks/use-mobile'
import { toast } from 'sonner'

function App() {
  const [currentSection, setCurrentSection] = useState('dashboard')
  const [selectedProject, setSelectedProject] = useState<GameProject | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [projects, setProjects] = useLocalStorage<GameProject[]>('game_projects', [])
  const [qaProject, setQaProject] = useState<GameProject | null>(null)
  const isMobile = useIsMobile()

  // One-time cleanup of duplicate projects and initialization
  useEffect(() => {
    // DEBUGGING: Check what's in localStorage
    console.log('🔍 LOCALSTORAGE DEBUG:')
    const rawStorageData = localStorage.getItem('game_projects')
    console.log('📦 Raw localStorage data:', rawStorageData)
    
    if (rawStorageData) {
      try {
        const parsedData = JSON.parse(rawStorageData)
        console.log('📊 Parsed projects from localStorage:', parsedData)
        console.log('📈 Number of projects in storage:', parsedData.length)
        
        if (parsedData.length > 0) {
          console.log('🎯 First project in storage:', parsedData[0])
          console.log('🎨 First project assets:', parsedData[0]?.assets)
          if (parsedData[0]?.assets?.art) {
            console.log('🖼️ First art asset:', parsedData[0].assets.art[0])
          }
          if (parsedData[0]?.assets?.audio) {
            console.log('🎵 First audio asset:', parsedData[0].assets.audio[0])
          }
          if (parsedData[0]?.assets?.models) {
            console.log('🎲 First model asset:', parsedData[0].assets.models[0])
          }
        }
      } catch (error) {
        console.error('❌ Error parsing localStorage data:', error)
      }
    } else {
      console.log('📭 No localStorage data found')
    }
    
    console.log('🔄 Current projects state:', projects)
    console.log('📊 Projects state length:', projects.length)
    
    // First, clean up any existing duplicates
    const uniqueProjects = projects.filter((project, index, arr) => 
      arr.findIndex(p => p.id === project.id) === index
    )
    
    if (uniqueProjects.length !== projects.length) {
      console.log('🧹 Cleaned up duplicate projects:', projects.length - uniqueProjects.length)
      setProjects(uniqueProjects)
      return // Exit early to let the cleanup update trigger the next effect
    }
    
    // Add sample assets to existing projects that have empty assets
    const projectsNeedingAssets = uniqueProjects.filter(project => {
      console.log('🔍 Checking project:', project.title, 'Assets:', project.assets)
      return !project.assets || 
        !project.assets.art || 
        !project.assets.audio || 
        !project.assets.models ||
        (project.assets.art.length === 0 && project.assets.audio.length === 0 && project.assets.models.length === 0)
    })
    
    console.log('📊 Projects needing assets:', projectsNeedingAssets.length, 'out of', uniqueProjects.length)
    
    // TEMPORARY: Force add assets to ALL projects for debugging
    if (uniqueProjects.length > 0) {
      console.log('� FORCE ADDING assets to all projects for debugging')
      const updatedProjects = uniqueProjects.map(project => ({
            ...project,
            assets: {
              art: [
                {
                  id: `${project.id}_art_hero`,
                  name: 'Hero Character Concept',
                  type: 'character' as const,
                  category: 'character' as const,
                  status: 'approved' as const,
                  tags: ['hero', 'character', 'concept'],
                  thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop'
                },
                {
                  id: `${project.id}_art_env`,
                  name: 'Game Environment',
                  type: 'environment' as const,
                  category: 'environment' as const,
                  status: 'in-progress' as const,
                  tags: ['environment', 'background'],
                  thumbnail: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop'
                }
              ],
              audio: [
                {
                  id: `${project.id}_audio_theme`,
                  name: 'Main Theme Music',
                  type: 'music' as const,
                  category: 'music' as const,
                  status: 'approved' as const,
                  tags: ['theme', 'orchestral'],
                  duration: 180
                }
              ],
              models: [
                {
                  id: `${project.id}_model_hero`,
                  name: 'Hero 3D Model',
                  type: '3d' as const,
                  category: 'character' as const,
                  status: 'review' as const,
                  tags: ['hero', 'low-poly'],
                  polyCount: 5420
                }
              ],
              ui: []
            }
          }))
      setProjects(updatedProjects)
      return
    }
    
    // If no projects exist, initialize with mock data
    if (uniqueProjects.length === 0) {
      const mockProjects = getMockProjects()
      setProjects(mockProjects)
    }
  }, []) // Run only once on mount - prevents infinite loops

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true)
    }
  }, [isMobile])

  const handleProjectSelect = (project: GameProject) => {
    console.log('🎯 APP: Project Selected:', {
      projectId: project.id,
      projectTitle: project.title,
      currentSection: currentSection,
      willSetSection: 'project-detail'
    })
    setSelectedProject(project)
    setCurrentSection('project-detail')
  }

  const handleBackToDashboard = () => {
    console.log('🔙 APP: Back to Dashboard clicked')
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

  const handleProjectCreate = (project: GameProject) => {
    setProjects(currentProjects => [...currentProjects, project])
    setSelectedProject(project)
    setCurrentSection('project-detail')
    toast.success(`🎮 Project "${project.title}" created successfully!`)
  }

  const handleSectionChange = (section: string) => {
    setCurrentSection(section)
  }

  const renderMainContent = () => {
    console.log('🎯 APP: Rendering Main Content:', {
      currentSection: currentSection,
      hasSelectedProject: !!selectedProject,
      selectedProjectId: selectedProject?.id,
      shouldRenderProjectDetail: currentSection === 'project-detail' && !!selectedProject
    })
    
    if (currentSection === 'project-detail' && selectedProject) {
      console.log('✅ APP: Rendering ProjectDetailView for:', selectedProject.title)
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
        return (
          <GameForgeDashboard 
            onProjectSelect={handleProjectSelect} 
            onProjectCreate={handleProjectCreate}
            onSectionChange={handleSectionChange}
            projects={projects} 
            onProjectsChange={setProjects} 
          />
        )
      case 'projects':
        return <Dashboard onProjectSelect={handleProjectSelect} onQAWorkspace={handleQAWorkspace} projects={projects} onProjectsChange={setProjects} />
      case 'story':
        return (
          <StoryLoreWorkspace 
            projectId={selectedProject?.id}
            onContentChange={(content) => {
              // Handle story content updates if needed
              console.log('Story content updated:', content)
            }}
          />
        )
      case 'assets':
        return selectedProject ? (
          <AssetStudioWorkspace 
            projectId={selectedProject.id}
          />
        ) : (
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
                  🎨
                </motion.div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Asset Studio
                </h2>
                <p className="text-muted-foreground mb-6">
                  Select a project to enter the Asset Studio and generate game assets with AI.
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
      case 'gameplay':
        return selectedProject ? (
          <GameplayStudio projectId={selectedProject.id} />
        ) : (
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
                  🎮
                </motion.div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Gameplay Studio
                </h2>
                <p className="text-muted-foreground mb-6">
                  Select a project from the sidebar to start designing levels and gameplay mechanics with AI assistance.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentSection('dashboard')}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Create New Project
                </motion.button>
              </div>
            </div>
          </motion.div>
        )
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
                        {project.story?.plotOutline || 'Enter QA mode to test gameplay mechanics and balance.'}
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
      case 'preview':
        return selectedProject ? (
          <PreviewWorkspace 
            projectId={selectedProject.id}
          />
        ) : (
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
                  📺
                </motion.div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Game Preview
                </h2>
                <p className="text-muted-foreground mb-6">
                  Select a project to preview your game in full-screen production mode.
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
        return <Dashboard onProjectSelect={handleProjectSelect} onQAWorkspace={handleQAWorkspace} projects={projects} onProjectsChange={setProjects} />
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
              projects={projects}
              selectedProject={selectedProject}
              onProjectSelect={setSelectedProject}
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