import { siteNavHomeItem, siteNavItems } from '~/constants/siteNav'

function normalizePath(path: string) {
  return path.replace(/\/+$/, '') || '/'
}

export function useSiteNav() {
  const route = useRoute()
  const localePath = useLocalePath()
  const open = useState('site-nav-open', () => false)

  function isActive(to: string) {
    const target = normalizePath(localePath(to))
    const current = normalizePath(route.path)
    if (target === '/' || /^\/(es|it)$/.test(target)) {
      return current === target
    }
    return current === target || current.startsWith(`${target}/`)
  }

  function close() {
    open.value = false
  }

  function toggle() {
    open.value = !open.value
  }

  return {
    items: siteNavItems,
    homeItem: siteNavHomeItem,
    isActive,
    open,
    close,
    toggle,
  }
}
