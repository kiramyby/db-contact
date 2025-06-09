import { defineStore } from 'pinia'
import { ref } from 'vue'

interface User {
  username: string
  userId: number
}

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const isLoggedIn = ref(false)
  const token = ref<string | null>(localStorage.getItem('token'))

  function setAuthData(userData: User, authToken: string) {
    user.value = userData
    token.value = authToken
    isLoggedIn.value = true
    localStorage.setItem('token', authToken)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  function login(username: string, userId: number = 1) {
    const userData: User = { username, userId }
    user.value = userData
    isLoggedIn.value = true
    localStorage.setItem('user', JSON.stringify(userData))
  }

  function logout() {
    user.value = null
    token.value = null
    isLoggedIn.value = false
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  // Initialize from localStorage on store creation
  function initializeFromStorage() {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    
    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        user.value = userData
        token.value = storedToken
        isLoggedIn.value = true
      } catch (error) {
        console.error('Failed to parse stored user data:', error)
        logout()
      }
    }
  }

  // API helper function
  function getAuthHeaders() {
    return token.value ? { 'Authorization': `Bearer ${token.value}` } : {}
  }

  // Initialize on store creation
  initializeFromStorage()

  return { 
    user, 
    isLoggedIn, 
    token, 
    login, 
    logout, 
    setAuthData, 
    getAuthHeaders,
    initializeFromStorage
  }
})
