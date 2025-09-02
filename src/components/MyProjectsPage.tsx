import { GameProject } from '@/lib/types'
import { Dashboard } from '@/components/Dashboard'

interface MyProjectsPageProps {
  projects: GameProject[]
  onProjectSelect: (project: GameProject) => void
  onProjectsChange: (projects: GameProject[]) => void
  onQAWorkspace?: (project: GameProject) => void
}

export function MyProjectsPage({ projects, onProjectSelect, onProjectsChange, onQAWorkspace }: MyProjectsPageProps) {
  return (
    <Dashboard 
      projects={projects}
      onProjectSelect={onProjectSelect}
      onProjectsChange={onProjectsChange}
      onQAWorkspace={onQAWorkspace}
    />
  )
}