<template>
  <div class="login-container">
    <div v-if="configMissing" class="config-warning">
      <h3>⚠️ 数据库配置缺失</h3>
      <p>请先配置数据库连接信息才能登录。</p>
      <button @click="goToConfig" class="config-btn">前往配置</button>
    </div>
    
    <div v-else>
      <h2>Hospital Database Login</h2>
      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="username">Username:</label>
          <input 
            type="text" 
            id="username" 
            v-model="username" 
            required 
            :disabled="isLoading"
            placeholder="Enter your username"
          />
        </div>
        <div class="form-group">
          <label for="password">Password:</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            required 
            :disabled="isLoading"
            placeholder="Enter your password"
          />
        </div>
        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Logging in...' : 'Login' }}
        </button>
      </form>
      <div class="login-info">
        <p><strong>Demo Credentials:</strong></p>
        <p>Username: admin</p>
        <p>Password: admin123</p>
        <p><small>Database: 192.168.0.31:3307</small></p>
        <button @click="goToConfig" class="config-link">修改数据库配置</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { apiService } from '@/services/api'

const username = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const configMissing = ref(false)
const router = useRouter()
const userStore = useUserStore()

const handleLogin = async () => {
  if (!username.value || !password.value) {
    errorMessage.value = 'Please enter both username and password'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await apiService.login(username.value, password.value)
    
    if (response.success) {
      userStore.setAuthData(response.user, response.token)
      router.push('/data')
    } else {
      errorMessage.value = 'Login failed'
    }
  } catch (error) {
    console.error('Login error:', error)
    errorMessage.value = error instanceof Error ? error.message : 'Login failed. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const checkDatabaseConfig = () => {
  const savedConfig = localStorage.getItem('dbConfig')
  if (!savedConfig) {
    configMissing.value = true
    return
  }
  
  try {
    const config = JSON.parse(savedConfig)
    if (!config.host || !config.user || !config.password) {
      configMissing.value = true
      return
    }
    
    // 恢复API服务配置
    apiService.setDatabaseConfig(config)
    configMissing.value = false
  } catch (error) {
    console.error('Failed to load database config:', error)
    configMissing.value = true
  }
}

const goToConfig = () => {
  router.push('/config')
}

onMounted(() => {
  checkDatabaseConfig()
})
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 80px auto;
  padding: 40px;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  background-color: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.login-container h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-size: 1.8rem;
  font-weight: 600;
}

.login-container form {
  width: 100%;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: #495057;
  font-weight: 500;
  font-size: 14px;
}

input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-sizing: border-box;
  font-size: 14px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

button {
  width: 100%;
  padding: 14px 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  margin-top: 20px;
  transition: background-color 0.2s ease, transform 0.1s ease;
}

button:hover {
  background-color: #0056b3;
}

button:active {
  transform: translateY(1px);
}

button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
}

.error-message {
  margin-bottom: 20px;
  padding: 12px 16px;
  background-color: #ffebee;
  color: #c62828;
  border: 1px solid #ffcdd2;
  border-radius: 6px;
  font-size: 14px;
}

.login-info {
  margin-top: 30px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  text-align: center;
}

.login-info p {
  margin: 5px 0;
  font-size: 14px;
}

.login-info strong {
  color: #333;
}

.login-info small {
  color: #6c757d;
  font-style: italic;
}

.config-warning {
  text-align: center;
  padding: 30px;
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  color: #856404;
}

.config-warning h3 {
  margin-bottom: 15px;
  color: #b45309;
}

.config-btn {
  background-color: #ffc107;
  color: #212529;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 15px;
  transition: background-color 0.2s ease;
}

.config-btn:hover {
  background-color: #ffb300;
}

.config-link {
  background: none;
  border: 1px solid #007bff;
  color: #007bff;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 12px;
  margin-top: 10px;
  transition: all 0.2s ease;
}

.config-link:hover {
  background-color: #007bff;
  color: white;
}

@media (max-width: 480px) {
  .login-container {
    margin: 40px 20px;
    padding: 30px 20px;
  }
}
</style>
