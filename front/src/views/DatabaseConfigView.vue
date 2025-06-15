<template>
  <div class="config-container">
    <div class="config-card">
      <h2>数据库连接配置</h2>
      <p class="config-description">
        请配置您的MySQL数据库连接信息。配置完成后，您可以登录并开始使用数据库管理功能。
      </p>

      <form @submit.prevent="saveConfig" class="config-form">
        <div class="form-group">
          <label for="host">主机地址</label>
          <input
            id="host"
            v-model="config.host"
            type="text"
            placeholder="192.168.0.31"
            required
          />
        </div>

        <div class="form-group">
          <label for="port">端口</label>
          <input
            id="port"
            v-model.number="config.port"
            type="number"
            placeholder="3306"
            required
          />
        </div>

        <div class="form-group">
          <label for="user">用户名</label>
          <input
            id="user"
            v-model="config.user"
            type="text"
            placeholder="数据库用户名"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">密码</label>
          <input
            id="password"
            v-model="config.password"
            type="password"
            placeholder="数据库密码"
            required
          />
        </div>

        <div class="form-group">
          <label for="database">数据库名</label>
          <input
            id="database"
            v-model="config.database"
            type="text"
            placeholder="数据库名（可选）"
          />
        </div>

        <div class="form-actions">
          <button 
            type="button" 
            @click="testConnection" 
            :disabled="loading || !isFormValid"
            class="btn btn-secondary"
          >
            {{ loading ? '测试中...' : '测试连接' }}
          </button>
          
          <button 
            type="submit" 
            :disabled="loading || !isFormValid"
            class="btn btn-primary"
          >
            保存配置
          </button>
        </div>
      </form>

      <div v-if="message" class="message" :class="messageType">
        {{ message }}
      </div>

      <div class="config-info">
        <h3>当前配置状态</h3>
        <div class="status-grid">
          <div class="status-item">
            <span class="status-label">连接状态:</span>
            <span class="status-value" :class="connectionStatus.class">
              {{ connectionStatus.text }}
            </span>
          </div>
          <div class="status-item">
            <span class="status-label">主机:</span>
            <span class="status-value">{{ config.host || '未设置' }}</span>
          </div>
          <div class="status-item">
            <span class="status-label">端口:</span>
            <span class="status-value">{{ config.port || '未设置' }}</span>
          </div>
          <div class="status-item">
            <span class="status-label">用户:</span>
            <span class="status-value">{{ config.user || '未设置' }}</span>
          </div>
        </div>
      </div>

      <div class="config-actions">
        <router-link to="/login" class="btn btn-primary" v-if="configSaved">
          前往登录
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { apiService } from '@/services/api'

interface DatabaseConfig {
  host: string
  port: number
  user: string
  password: string
  database: string
}

const config = ref<DatabaseConfig>({
  host: '192.168.0.31',
  port: 3306,
  user: '',
  password: '',
  database: ''
})

const loading = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')
const configSaved = ref(false)
const connectionTested = ref(false)

const isFormValid = computed(() => {
  return config.value.host && 
         config.value.port && 
         config.value.user && 
         config.value.password
})

const connectionStatus = computed(() => {
  if (!configSaved.value) {
    return { text: '未配置', class: 'status-warning' }
  }
  if (!connectionTested.value) {
    return { text: '未测试', class: 'status-warning' }
  }
  return { text: '已连接', class: 'status-success' }
})

const showMessage = (msg: string, type: 'success' | 'error') => {
  message.value = msg
  messageType.value = type
  setTimeout(() => {
    message.value = ''
  }, 5000)
}

const testConnection = async () => {
  if (!isFormValid.value) {
    showMessage('请先填写完整的连接信息', 'error')
    return
  }

  loading.value = true
  try {
    // 设置配置
    apiService.setDatabaseConfig(config.value)
    
    // 使用临时token测试连接（在实际应用中，这需要先登录）
    // 这里我们直接测试数据库连接
    const result = await apiService.testConnection('temp')
    
    if (result.success) {
      connectionTested.value = true
      showMessage('数据库连接测试成功！', 'success')
    } else {
      showMessage(`连接失败: ${result.error}`, 'error')
    }
  } catch (error) {
    showMessage(`连接测试失败: ${error}`, 'error')
  } finally {
    loading.value = false
  }
}

const saveConfig = async () => {
  if (!isFormValid.value) {
    showMessage('请填写完整的连接信息', 'error')
    return
  }

  loading.value = true
  try {
    // 设置API服务的数据库配置
    apiService.setDatabaseConfig(config.value)
    
    // 保存到localStorage
    localStorage.setItem('dbConfig', JSON.stringify(config.value))
    
    configSaved.value = true
    showMessage('数据库配置已保存！', 'success')
  } catch (error) {
    showMessage(`保存配置失败: ${error}`, 'error')
  } finally {
    loading.value = false
  }
}

const loadSavedConfig = () => {
  const saved = localStorage.getItem('dbConfig')
  if (saved) {
    try {
      const savedConfig = JSON.parse(saved)
      config.value = { ...config.value, ...savedConfig }
      configSaved.value = true
      
      // 恢复API服务配置
      apiService.setDatabaseConfig(config.value)
    } catch (error) {
      console.error('Failed to load saved config:', error)
    }
  }
}

onMounted(() => {
  loadSavedConfig()
})
</script>

<style scoped>
.config-container {
  max-width: 600px;
  margin: 80px auto;
  padding: 20px;
  min-height: calc(100vh - 160px);
}

.config-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  border: 1px solid #e9ecef;
}

.config-card h2 {
  color: #333;
  margin-bottom: 10px;
  text-align: center;
}

.config-description {
  color: #666;
  text-align: center;
  margin-bottom: 30px;
  line-height: 1.5;
}

.config-form {
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #495057;
  font-weight: 500;
  font-size: 14px;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.form-actions {
  display: flex;
  gap: 15px;
  margin-top: 30px;
}

.btn {
  padding: 14px 16px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}

.btn-secondary {
  background: #f8f9fa;
  color: #495057;
  border: 1px solid #dee2e6;
}

.btn-secondary:hover:not(:disabled) {
  background: #e9ecef;
  border-color: #adb5bd;
}

.message {
  padding: 12px 16px;
  border-radius: 6px;
  margin: 20px 0;
  text-align: center;
  font-weight: 500;
  font-size: 14px;
}

.message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.config-info {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

.config-info h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 18px;
}

.status-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
}

.status-label {
  color: #666;
  font-weight: 500;
}

.status-value {
  font-weight: 600;
}

.status-success {
  color: #28a745;
}

.status-warning {
  color: #ffc107;
}

.config-actions {
  text-align: center;
  margin-top: 20px;
}

.config-actions .btn {
  max-width: 200px;
}

@media (max-width: 768px) {
  .config-container {
    margin: 40px auto;
    padding: 15px;
  }
  
  .config-card {
    padding: 30px 20px;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn {
    margin-bottom: 10px;
  }
}

@media (max-width: 480px) {
  .config-container {
    margin: 20px auto;
    padding: 10px;
  }
  
  .config-card {
    padding: 25px 15px;
  }
  
  .config-card h2 {
    font-size: 1.5rem;
  }
}
</style>
