import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Project {
  id: string
  name: string
  createdAt: number
  lastAccessed: number
  pinnedItems: any[]
  // Add other project-specific data as needed
}

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<Project[]>([])
  const currentProjectId = ref<string | null>(null)
  
  // Load projects from localStorage on initialization
  const loadProjects = () => {
    if (process.client) {
      const stored = localStorage.getItem('farclimate-projects')
      if (stored) {
        try {
          const data = JSON.parse(stored)
          // Handle legacy format: a single project object instead of wrapper
          if (data && data.id && data.name && !data.projects) {
            projects.value = [data]
            currentProjectId.value = data.id
          } else {
            projects.value = data.projects || []
            currentProjectId.value = data.currentProjectId || null
          }
        } catch (error) {
          console.error('Error loading projects from localStorage:', error)
        }
      }
    }
  }

  // Save projects to localStorage
  const saveProjects = () => {
    console.log('Saving projects to localStorage', projects.value, currentProjectId.value)
    if (process.client) {
      try {
        localStorage.setItem('farclimate-projects', JSON.stringify({
          projects: projects.value,
          currentProjectId: currentProjectId.value
        }))
      } catch (error) {
        console.error('Error saving projects to localStorage:', error)
      }
    }
  }

  // Generate random ID
  const generateId = () => {
    return Math.random().toString(36).substr(2, 9)
  }

  // Get current project
  const currentProject = computed(() => {
    return projects.value.find(p => p.id === currentProjectId.value) || null
  })

  // Create a new project
  const createProject = (name: string = 'Unnamed Project') => {
    const newProject: Project = {
      id: generateId(),
      name,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      pinnedItems: []
    }
    
    projects.value.push(newProject)
    currentProjectId.value = newProject.id
    saveProjects()
    
    return newProject
  }

  // Switch to a project
  const switchToProject = (projectId: string, options?: { readOnly?: boolean }) => {
    const project = projects.value.find(p => p.id === projectId)
    if (project) {
      // Save current project's pinned items before switching (skip in read-only context)
      if (!options?.readOnly && currentProjectId.value) {
        const currentProject = projects.value.find(p => p.id === currentProjectId.value)
        if (currentProject && process.client) {
          const pinsStore = usePinsStore()
          currentProject.pinnedItems = pinsStore.pinnedItems
        }
      }
      
      currentProjectId.value = projectId
      project.lastAccessed = Date.now()
      
      // Restore pinned items for the new project
      if (process.client) {
        const pinsStore = usePinsStore()
        pinsStore.setPinnedItems(project.pinnedItems || [])
      }
      
      if (!options?.readOnly) {
        saveProjects()
      }
      return project
    }
    return null
  }

  // Update project name
  const updateProjectName = (projectId: string, newName: string) => {
    const project = projects.value.find(p => p.id === projectId)
    if (project) {
      project.name = newName
      saveProjects()
    }
  }

  // Delete a project
  const deleteProject = (projectId: string) => {
    const index = projects.value.findIndex(p => p.id === projectId)
    if (index !== -1) {
      projects.value.splice(index, 1)
      
      // If we deleted the current project, switch to another one or create a new one
      if (currentProjectId.value === projectId) {
        if (projects.value.length > 0) {
          currentProjectId.value = projects.value[0].id
        } else {
          currentProjectId.value = null
        }
      }
      
      saveProjects()
    }
  }

  // Initialize with a default project if none exists
  const initialize = () => {
    loadProjects()
    
    if (projects.value.length === 0 || !currentProjectId.value) {
      createProject('Unnamed Project')
    } else {
      // Update last accessed time for current project
      const current = projects.value.find(p => p.id === currentProjectId.value)
      if (current) {
        current.lastAccessed = Date.now()
        saveProjects()
        // Restore pinned items for the current project into the pins store
        if (process.client) {
          try {
            const pinsStore = usePinsStore()
            pinsStore.setPinnedItems(current.pinnedItems || [])
          } catch (e) {
            // no-op
          }
        }
      }
    }
  }

  // Get recent projects (sorted by last accessed)
  const recentProjects = computed(() => {
    return [...projects.value]
      .sort((a, b) => b.lastAccessed - a.lastAccessed)
      .slice(0, 10)
  })

  // Save current project's pinned items
  const saveCurrentProjectPins = () => {
    if (currentProjectId.value && process.client) {
      const project = projects.value.find(p => p.id === currentProjectId.value)
      if (project) {
        const pinsStore = usePinsStore()
        project.pinnedItems = pinsStore.pinnedItems
        saveProjects()
      }
    }
  }

  // Get all projects
  const getAllProjects = () => projects.value

  return {
    projects,
    currentProjectId,
    currentProject,
    recentProjects,
    createProject,
    switchToProject,
    updateProjectName,
    deleteProject,
    initialize,
    getAllProjects,
    loadProjects,
    saveProjects,
    saveCurrentProjectPins
  }
})
