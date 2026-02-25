import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Component } from 'vue'

export const useDialogStore = defineStore('dialog', () => {
  const isVisible = ref(false)
  const component = ref<Component | null>(null)
  const props = ref<Record<string, any>>({})

  const showDialog = (comp: Component, compProps: Record<string, any> = {}) => {
    component.value = comp
    props.value = compProps
    isVisible.value = true
  }

  const hideDialog = () => {
    isVisible.value = false
    component.value = null
    props.value = {}
  }

  return {
    isVisible,
    component,
    props,
    showDialog,
    hideDialog,
  }
}) 