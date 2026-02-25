import { ref, onMounted, onUnmounted } from 'vue'
import { usePinsStore } from '@/stores/pins'
import type { PinnedItem } from '@/stores/pins'

export function usePin() {
  const pinsStore = usePinsStore()
  const isAnimating = ref(false)

  const pinContent = (
    element: HTMLElement,
    overrides?: Partial<PinnedItem>
  ) => {
    // Determine content type
    const type = element.tagName === 'IMG' ? 'image' : 'text'
    
    // Get content based on type
    const content = type === 'image' 
      ? (element as HTMLImageElement).src
      : element.innerText || element.textContent || ''

    // Create pinned item
    const pinnedItem: Omit<PinnedItem, 'timestamp'> = {
      id: overrides?.id ?? crypto.randomUUID(),
      title: overrides?.title ?? (content.substring(0, 50) + (content.length > 50 ? '...' : '')),
      type: overrides?.type ?? (type === 'image' ? 'image' : 'other'),
      data: overrides?.data ?? { content, sourceElement: element },
      notes: overrides?.notes
    }

    // Store the pin
    const pinId = pinsStore.pinItem(pinnedItem)

    // Trigger animation
    animatePin(element)

    return pinId
  }

  const unpinContent = (id: string) => {
    pinsStore.unpinItem(id)
  }

  const isPinned = (id: string) => {
    return pinsStore.isPinned(id)
  }

  const animatePin = async (element: HTMLElement) => {
    if (isAnimating.value) return

    isAnimating.value = true
    
    // Create a clone for animation
    const clone = element.cloneNode(true) as HTMLElement
    const rect = element.getBoundingClientRect()
    
    // Style the clone
    Object.assign(clone.style, {
      position: 'fixed',
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      transform: 'scale(1)',
      opacity: '1',
      transition: 'all 0.5s ease-in-out',
      zIndex: '9999',
      pointerEvents: 'none'
    })

    // Add to body
    document.body.appendChild(clone)

    // Force reflow
    clone.offsetHeight

    // Animate
    Object.assign(clone.style, {
      transform: 'scale(0.2)',
      opacity: '0',
      top: '20px',
      right: '20px'
    })

    // Cleanup after animation
    setTimeout(() => {
      clone.remove()
      isAnimating.value = false
    }, 500)
  }

  return {
    pinContent,
    unpinContent,
    isPinned,
    isAnimating
  }
} 