import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GameProject } from './lib/types'
import { GameStudioSidebar } from './components/GameStudioSidebar'
import { GameForgeDashboard } from './components/GameForgeDashboard'
import { Dashboard } from './components/Dashboard'
import { ProjectDetailView } from './components/ProjectDetailView'
import { QAWorkspace } from './components/QAWorkspace'
import { StoryLoreWorkspace } from './components/StoryLoreWorkspace'
import { StoryDisplay } from './components/StoryDisplay'
import { AssetStudioWorkspace } from './components/AssetStudioWorkspace'
import { AssetEditingStudio } from './components/AssetEditingStudio'
import { PreviewWorkspace } from './components/PreviewWorkspace'
import { GameplayStudio } from './components/GameplayStudio'
import { Toaster } from './components/ui/sonner'
import { useProjects } from './hooks/use-projects'
import { useIsMobile } from './hooks/use-mobile'
import { toast } from 'sonner'

function App() {
  const [currentSection, setCurrentSection] = useState('dashboard')
  const [selectedProject, setSelectedProject] = useState<GameProject | null>(null)
  const [editingAsset, setEditingAsset] = useState<any | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { projects, loading, error, addProject, updateProject, removeProject } = useProjects()
  const [qaProject, setQaProject] = useState<GameProject | null>(null)
  const isMobile = useIsMobile()

  // Handle project creation
  const handleProjectCreated = (project: GameProject) => {
    console.log('🎮 New project created:', project.title)
    addProject(project)
    setCurrentSection('project-detail')
    setSelectedProject(project)
  }

  // Handle project updates
  const handleProjectUpdate = (updatedProject: GameProject) => {
    console.log('🔄 Project updated:', updatedProject.title)
    updateProject(updatedProject)
    setSelectedProject(updatedProject)
  }

  // Handle project deletion
  const handleProjectDelete = (projectId: string) => {
    console.log('🗑️ Deleting project:', projectId)
    removeProject(projectId)
    if (selectedProject?.id === projectId) {
      setSelectedProject(null)
      setCurrentSection('dashboard')
    }
  }

  // Handle section navigation
  const handleSectionChange = (section: string) => {
    setCurrentSection(section)
  }

  // Handle project selection
  const handleProjectSelect = (project: GameProject) => {
    setSelectedProject(project)
    setCurrentSection('project-detail')
  }

  // Handle QA Workspace
  const handleQAWorkspace = (project: GameProject) => {
    setQaProject(project)
    setCurrentSection('qa-workspace')
  }

  // Handle asset editing
  const handleAssetEdit = (asset: any) => {
    setEditingAsset(asset)
    setCurrentSection('asset-editing')
  }

  // Handle asset updates
  const handleAssetUpdate = (updatedAsset: any) => {
    if (selectedProject) {
      const updatedProject = { ...selectedProject }
      
      // Update the asset in the project
      if (updatedProject.assets) {
        const assetCategory = updatedAsset.category
        if (updatedProject.assets[assetCategory]) {
          const assetIndex = updatedProject.assets[assetCategory].findIndex(
            (asset: any) => asset.id === updatedAsset.id
          )
          if (assetIndex !== -1) {
            updatedProject.assets[assetCategory][assetIndex] = updatedAsset
            handleProjectUpdate(updatedProject)
          }
        }
      }
    }
    setEditingAsset(null)
    setCurrentSection('asset-studio')
  }

  // Handle story updates
  const handleStoryUpdate = (updatedStory: any) => {
    if (selectedProject) {
      const updatedProject = { 
        ...selectedProject, 
        story: updatedStory,
        updatedAt: new Date().toISOString()
      }
      handleProjectUpdate(updatedProject)
    }
  }

  // Handle gameplay updates
  const handleGameplayUpdate = (updatedGameplay: any) => {
    if (selectedProject) {
      const updatedProject = { 
        ...selectedProject, 
        gameplay: updatedGameplay,
        updatedAt: new Date().toISOString()
      }
      handleProjectUpdate(updatedProject)
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your projects...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="text-red-500 text-xl">⚠️</div>
          <p className="text-muted-foreground">Failed to load projects: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const renderMainContent = () => {
    switch (currentSection) {
      case 'home':
        return (
          <GameForgeDashboard 
            projects={projects}
            onProjectSelect={handleProjectSelect}
            onProjectCreate={handleProjectCreated}
            onProjectsChange={() => {}} // No longer needed - handled by hooks
            onSectionChange={handleSectionChange}
          />
        )
      
      case 'dashboard':
        return (
          <Dashboard 
            onProjectSelect={handleProjectSelect} 
            onQAWorkspace={handleQAWorkspace} 
            projects={projects} 
            onProjectsChange={() => {}} // No longer needed - handled by hooks
          />
        )
      
      case 'project-detail':
        if (!selectedProject) return <Dashboard onProjectSelect={handleProjectSelect} onQAWorkspace={handleQAWorkspace} projects={projects} onProjectsChange={() => {}} />
        return (
          <ProjectDetailView 
            project={selectedProject} 
            onNavigate={handleSectionChange}
            onProjectUpdate={handleProjectUpdate}
            onAssetEdit={handleAssetEdit}
          />
        )
      
      case 'qa-workspace':
        if (!qaProject) return <Dashboard onProjectSelect={handleProjectSelect} onQAWorkspace={handleQAWorkspace} projects={projects} onProjectsChange={() => {}} />
        return <QAWorkspace project={qaProject} />
      
      case 'story-lore':
        if (!selectedProject) return <Dashboard onProjectSelect={handleProjectSelect} onQAWorkspace={handleQAWorkspace} projects={projects} onProjectsChange={() => {}} />
        return (
          <StoryLoreWorkspace 
            project={selectedProject}
            onStoryUpdate={handleStoryUpdate}
            onBack={() => setCurrentSection('project-detail')}
          />
        )
      
      case 'story-display':
        if (!selectedProject?.story) return <Dashboard onProjectSelect={handleProjectSelect} onQAWorkspace={handleQAWorkspace} projects={projects} onProjectsChange={() => {}} />
        return (
          <StoryDisplay 
            project={selectedProject}
            story={selectedProject.story}
            onBack={() => setCurrentSection('story-lore')}
          />
        )
      
      case 'asset-studio':
        if (!selectedProject) return <Dashboard onProjectSelect={handleProjectSelect} onQAWorkspace={handleQAWorkspace} projects={projects} onProjectsChange={() => {}} />
        return (
          <AssetStudioWorkspace 
            project={selectedProject}
            onAssetEdit={handleAssetEdit}
            onBack={() => setCurrentSection('project-detail')}
            onProjectUpdate={handleProjectUpdate}
          />
        )
      
      case 'asset-editing':
        if (!editingAsset || !selectedProject) return <Dashboard onProjectSelect={handleProjectSelect} onQAWorkspace={handleQAWorkspace} projects={projects} onProjectsChange={() => {}} />
        return (
          <AssetEditingStudio 
            asset={editingAsset}
            project={selectedProject}
            onAssetUpdate={handleAssetUpdate}
            onBack={() => setCurrentSection('asset-studio')}
          />
        )
      
      case 'preview':
        if (!selectedProject) return <Dashboard onProjectSelect={handleProjectSelect} onQAWorkspace={handleQAWorkspace} projects={projects} onProjectsChange={() => {}} />
        return (
          <PreviewWorkspace 
            project={selectedProject}
            onBack={() => setCurrentSection('project-detail')}
          />
        )
      
      case 'gameplay':
        if (!selectedProject) return <Dashboard onProjectSelect={handleProjectSelect} onQAWorkspace={handleQAWorkspace} projects={projects} onProjectsChange={() => {}} />
        return (
          <GameplayStudio 
            project={selectedProject}
            onGameplayUpdate={handleGameplayUpdate}
            onBack={() => setCurrentSection('project-detail')}
          />
        )
      
      default:
        return (
          <Dashboard 
            onProjectSelect={handleProjectSelect} 
            onQAWorkspace={handleQAWorkspace} 
            projects={projects} 
            onProjectsChange={() => {}}
          />
        )
    }
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <GameStudioSidebar 
        currentSection={currentSection}
        onSectionChange={handleSectionChange}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed(!sidebarCollapsed)}
        selectedProject={selectedProject}
        isMobile={isMobile}
      />
      
      <main className={`flex-1 transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      } ${isMobile ? 'ml-0' : ''} overflow-hidden`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSection + (selectedProject?.id || 'none')}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {renderMainContent()}
          </motion.div>
        </AnimatePresence>
      </main>
      
      <Toaster />
    </div>
  )
}

export default App
