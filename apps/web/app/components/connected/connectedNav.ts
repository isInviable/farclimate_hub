export interface ConnectedNavItem {
  label: string
  to: string
  icon?: string
  description: string
}

export const connectedNav: ConnectedNavItem[] = [
  {
    label: 'Dashboard',
    to: '/connected/dashboard',
    icon: 'i-lucide-layout-dashboard',
    description: 'Overview of the European climate adaptation network',
  },
  {
    label: 'Entities Map',
    to: '/connected/EntitiesMap',
    icon: 'i-lucide-map',
    description: 'Geographic distribution of entities across Europe',
  },
  {
    label: 'Project–Entity Connections',
    to: '/connected/PrjEntConnected',
    icon: 'i-lucide-network',
    description: 'Network graph of project–entity relationships',
  },
  {
    label: 'Projects UMAP',
    to: '/connected/ProjectsUmapNew',
    icon: 'i-lucide-scatter-chart',
    description: 'Semantic clustering of projects in 2-D space',
  },
]
