export default defineNuxtPlugin(() => {
  const open = useState('site-nav-open', () => false)

  useRouter().beforeEach(() => {
    open.value = false
  })
})
