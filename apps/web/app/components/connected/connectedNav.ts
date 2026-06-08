export interface ConnectedNavItem {
  label: string
  to: string
  icon?: string
  glyph?: string
  n?: string
  description: string
}

export const connectedNav: ConnectedNavItem[] = [
  {
    label: 'Overview',
    to: '/connected',
    icon: 'i-lucide-home',
    glyph: '◇',
    n: '00',
    description: 'Explore the European climate-adaptation network',
  },
  {
    label: 'Dashboard',
    to: '/connected/dashboard',
    icon: 'i-lucide-layout-dashboard',
    glyph: '▦',
    n: '01',
    description: 'Overview of the European climate adaptation network',
  },
  {
    label: 'Entities Map',
    to: '/connected/EntitiesMap',
    icon: 'i-lucide-map',
    glyph: '◉',
    n: '02',
    description: 'Geographic distribution of entities across Europe',
  },
  {
    label: 'Project–Entity Connections',
    to: '/connected/PrjEntConnected',
    icon: 'i-lucide-network',
    glyph: '⌗',
    n: '03',
    description: 'Network graph of project–entity relationships',
  },
  {
    label: 'Projects UMAP',
    to: '/connected/ProjectsUmapNew',
    icon: 'i-lucide-scatter-chart',
    glyph: '✸',
    n: '04',
    description: 'Semantic clustering of projects in 2-D space',
  },
]
