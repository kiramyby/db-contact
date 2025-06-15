<template>
  <div class="login-container">
    <h2>Hospital Database Login</h2>
    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    <div class="info-message">
      <p><strong>数据库连接信息:</strong></p>
      <p>主机: 47.116.113.18:3306</p>
      <p>数据库: hospital_management</p>
      <p><small>后端服务器将直接连接到数据库</small></p>
    </div>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="username">用户名:</label>
        <input 
          type="text" 
          id="username" 
          v-model="username" 
          required 
          :disabled="isLoading"
          placeholder="输入用户名"
        />
      </div>
      <div class="form-group">
        <label for="password">密码:</label>
        <input 
          type="password" 
          id="password" 
          v-model="password" 
          required 
          :disabled="isLoading"
          placeholder="输入密码"
        />
      </div>
      <button type="submit" :disabled="isLoading">
        {{ isLoading ? '登录中...' : '登录' }}
      </button>
    </form>
    <div class="login-help">
      <p><small>输入任意用户名和密码即可登录并测试数据库连接</small></p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { apiService } from '@/services/api'

const username = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const router = useRouter()
const userStore = useUserStore()

const handleLogin = async () => {
  if (!username.value || !password.value) {
    errorMessage.value = '请输入用户名和密码'
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
      errorMessage.value = '登录失败'
    }
  } catch (error) {
    console.error('Login error:', error)
    errorMessage.value = error instanceof Error ? error.message : '登录失败，请重试'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 50px auto;
  padding: 40px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #555;
}

input[type="text"],
input[type="password"] {
  width: 100%;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

input[type="text"]:focus,
input[type="password"]:focus {
  outline: none;
  border-color: #007bff;
}

input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

button[type="submit"] {
  width: 100%;
  padding: 12px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-top: 10px;
}

button[type="submit"]:hover:not(:disabled) {
  background-color: #0056b3;
}

button[type="submit"]:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
  border: 1px solid #f5c6cb;
}

.info-message {
  background-color: #d1ecf1;
  color: #0c5460;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
  border: 1px solid #bee5eb;
}

.info-message p {
  margin: 5px 0;
  font-size: 14px;
}

.info-message strong {
  color: #0c5460;
}

.info-message small {
  color: #6c757d;
  font-style: italic;
}

.login-help {
  text-align: center;
  margin-top: 20px;
}

.login-help p {
  color: #6c757d;
  font-size: 13px;
}

@media (max-width: 480px) {
  .login-container {
    margin: 40px 20px;
    padding: 30px 20px;
  }
}
</style>
