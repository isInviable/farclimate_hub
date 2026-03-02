export interface SkillItem {
  id: string
  title: string
  description: string
  image: string
  date: string
  readTime: string
  url: string
  categories: string[]
}

export function useSkillsData() {
  const skills: SkillItem[] = [
    {
      id: '1',
      title: 'Good practices for climate adaptation',
      description: 'Online courses: Building coastal resilience — good practices for climate adaptation. Discover the tools and methods used by practitioners on the ground.',
      image: '/img/skills/518d09f9832927f50d10de460e04c78322dfab80.png',
      date: '24 Nov. 2025',
      readTime: '3 min. read',
      url: '#',
      categories: ['Forestry', 'Nature-Based solutions'],
    },
    {
      id: '2',
      title: 'Sustainable fisheries in a warming ocean',
      description: 'Online courses: Building coastal resilience, good practices for climate adaptation. Online courses: Building coastal resilience, good practices for climate adaptation.',
      image: '/img/skills/617a567031eeb3b22618484cc1b29b97e9a289ff.png',
      date: '24 Nov. 2025',
      readTime: '3 min. read',
      url: '#',
      categories: ['Fisheries', 'EU Taxonomy'],
    },
    {
      id: '3',
      title: 'Forest carbon and biodiversity co-benefits',
      description: 'Online courses: Building coastal resilience, good practices for climate adaptation. Online courses: Building coastal resilience, good practices for climate adaptation.',
      image: '/img/skills/21cc55fef85c1a7cd5ba2732872702e37bee9c7a.png',
      date: '24 Nov. 2025',
      readTime: '3 min. read',
      url: '#',
      categories: ['Forestry', 'Biodiversity'],
    },
    {
      id: '4',
      title: 'Nature-based solutions for urban resilience',
      description: 'Online courses: Building coastal resilience, good practices for climate adaptation. Online courses: Building coastal resilience, good practices for climate adaptation.',
      image: '/img/skills/0dbe392cba673e9a10906afad05672e2921668ad.png',
      date: '24 Nov. 2025',
      readTime: '3 min. read',
      url: '#',
      categories: ['Nature-Based solutions', 'Agriculture'],
    },
  ]

  const trainingCategories = [
    { label: 'Forestry', count: 4 },
    { label: 'Fisheries', count: 5 },
    { label: 'Agriculture', count: 8 },
    { label: 'Life Cycle Assessment', count: 1 },
    { label: 'EU Taxonomy', count: 2 },
    { label: 'Biodiversity', count: 3 },
    { label: 'Nature-Based solutions', count: 5 },
  ]

  const filterOptions = [
    { label: 'More views' },
    { label: 'Relevance' },
    { label: 'Agriculture' },
  ]

  return { skills, trainingCategories, filterOptions }
}
