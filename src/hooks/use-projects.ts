import { useState, useEffect, useContext } from 'react'
import { GameProject } from '@/lib/types'
import { projectAPI } from '@/lib/projectAPI'
import { AuthContext } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export function useProjects() {
  const { user, token } = useContext(AuthContext)
  const [projects, setProjects] = useState<GameProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProjects = async () => {
    if (!user || !token) {
      console.log('🔒 User not authenticated, skipping project load')
      setProjects([])
      setLoading(false)
      return
    }

    try {
      console.log('📋 Loading projects from database...')
      setLoading(true)
      setError(null)
      
      const userProjects = await projectAPI.getUserProjects()
      console.log(`✅ Loaded ${userProjects.length} projects from database`)
      
      setProjects(userProjects)
    } catch (err) {
      console.error('❌ Error loading projects:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load projects'
      setError(errorMessage)
      
      if (errorMessage.includes('Authentication required')) {
        toast.error('Please log in to view your projects')
      } else {
        toast.error('Failed to load projects. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Load projects when user authentication changes
  useEffect(() => {
    loadProjects()
  }, [user, token])

  const addProject = (project: GameProject) => {
    console.log('➕ Adding project to local state:', project.title)
    setProjects(prev => [project, ...prev])
  }

  const updateProject = (updatedProject: GameProject) => {
    console.log('📝 Updating project in local state:', updatedProject.title)
    setProjects(prev => 
      prev.map(p => p.id === updatedProject.id ? updatedProject : p)
    )
  }

  const removeProject = (projectId: string) => {
    console.log('🗑️ Removing project from local state:', projectId)
    setProjects(prev => prev.filter(p => p.id !== projectId))
  }

  const refreshProjects = () => {
    console.log('🔄 Refreshing projects from database...')
    loadProjects()
  }

  return {
    projects,
    loading,
    error,
    addProject,
    updateProject,
    removeProject,
    refreshProjects
  }
}
