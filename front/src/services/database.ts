// 数据库配置管理服务
// 注意：由于浏览器环境限制，实际的MySQL连接需要通过后端代理

interface DatabaseConfig {
  host: string
  port: number
  user: string
  password: string
  database: string
}

interface LoginResponse {
  success: boolean
  token: string
  user: {
    username: string
    userId: number
  }
}

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

interface SqlExecutionResponse {
  success: boolean
  data?: any[]
  fields?: Array<{
    name: string
    type: string
    table: string
  }>
  rowCount?: number
  error?: string
}

interface DatabaseUser {
  id: number
  username: string
  host: string
  locked: boolean
  passwordExpired: boolean
}

class DatabaseService {
  private config: DatabaseConfig | null = null
  private isAuthenticated = false

  // 设置数据库连接配置
  setConfig(config: Partial<DatabaseConfig>) {
    this.config = { 
      host: '192.168.0.31',
      port: 3307,
      user: '',
      password: '',
      database: '',
      ...config 
    }
    // 保存配置到localStorage
    localStorage.setItem('dbConfig', JSON.stringify(this.config))
  }

  // 获取当前配置
  getConfig(): DatabaseConfig | null {
    if (!this.config) {
      const saved = localStorage.getItem('dbConfig')
      if (saved) {
        try {
          this.config = JSON.parse(saved)
        } catch (error) {
          console.error('Failed to parse saved config:', error)
        }
      }
    }
    return this.config
  }

  // 简化的登录验证 - 仅用于演示，无需token
  private generateDemoToken(username: string): string {
    return `demo_${username}`
  }

  // 简化的令牌验证 - 演示版本，永远返回true
  private isValidDemoToken(token: string): boolean {
    return true // 演示版本，不做任何验证
  }

  // 登录验证 - 简化版本，仅用于演示
  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      if (!username || !password) {
        throw new Error('Username and password are required')
      }

      // 检查数据库配置
      const config = this.getConfig()
      if (!config || !config.host || !config.user || !config.password) {
        throw new Error('Database configuration is missing. Please configure database connection first.')
      }

      // 演示模式：简化的登录验证（接受任何用户名/密码组合）
      if (username && password) {
        const token = this.generateDemoToken(username)
        this.isAuthenticated = true

        return {
          success: true,
          token,
          user: { username, userId: 1 }
        }
      } else {
        throw new Error('Username and password are required')
      }
    } catch (error) {
      throw new Error(`Login failed: ${error}`)
    }
  }

  // 测试数据库连接（模拟）
  async testConnection(token: string): Promise<ApiResponse> {
    try {
      if (!this.isValidDemoToken(token)) {
        throw new Error('Invalid token')
      }
      
      const config = this.getConfig()
      if (!config) {
        throw new Error('Database configuration not found')
      }

      // 模拟连接测试
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: 'Database connection successful (simulated)',
            data: {
              host: config.host,
              port: config.port,
              user: config.user,
              database: config.database || 'Not specified'
            }
          })
        }, 1000)
      })
    } catch (error) {
      return {
        success: false,
        error: `Database connection failed: ${error}`
      }
    }
  }

  // 执行SQL查询（模拟）
  async executeSql(sql: string, token: string): Promise<SqlExecutionResponse> {
    try {
      if (!this.isValidDemoToken(token)) {
        throw new Error('Invalid token')
      }

      if (!sql || typeof sql !== 'string') {
        throw new Error('SQL query is required')
      }

      // 保留trimmedSql变量供后续使用
      const trimmedSql = sql.trim().toLowerCase()
      
      // 演示模式：跳过SQL类型检查（生产环境中不建议）
      // const allowedStatements = ['select', 'show', 'describe', 'desc', 'explain']
      // const firstWord = trimmedSql.split(' ')[0]
      // if (!allowedStatements.includes(firstWord)) {
      //   throw new Error('Only SELECT, SHOW, DESCRIBE statements are allowed for security reasons')
      // }

      // 模拟SQL执行结果
      return new Promise((resolve) => {
        setTimeout(() => {
          // 根据SQL类型返回模拟数据
          if (trimmedSql.includes('show tables')) {
            resolve({
              success: true,
              data: [
                { 'Tables_in_hospital': 'patients' },
                { 'Tables_in_hospital': 'doctors' },
                { 'Tables_in_hospital': 'appointments' },
                { 'Tables_in_hospital': 'medical_records' }
              ],
              fields: [{ name: 'Tables_in_hospital', type: 'string', table: '' }],
              rowCount: 4
            })
          } else if (trimmedSql.includes('select') && trimmedSql.includes('patients')) {
            resolve({
              success: true,
              data: [
                { id: 1, name: 'John Doe', age: 35, phone: '123-456-7890' },
                { id: 2, name: 'Jane Smith', age: 28, phone: '987-654-3210' },
                { id: 3, name: 'Bob Johnson', age: 42, phone: '555-123-4567' }
              ],
              fields: [
                { name: 'id', type: 'int', table: 'patients' },
                { name: 'name', type: 'varchar', table: 'patients' },
                { name: 'age', type: 'int', table: 'patients' },
                { name: 'phone', type: 'varchar', table: 'patients' }
              ],
              rowCount: 3
            })
          } else {
            resolve({
              success: true,
              data: [{ message: 'Query executed successfully (simulated)' }],
              fields: [{ name: 'message', type: 'varchar', table: '' }],
              rowCount: 1
            })
          }
        }, 800)
      })
    } catch (error) {
      return {
        success: false,
        error: `SQL execution failed: ${error}`
      }
    }
  }

  // 获取数据库用户列表（模拟）
  async getDatabaseUsers(token: string): Promise<ApiResponse<DatabaseUser[]>> {
    try {
      if (!this.isValidDemoToken(token)) {
        throw new Error('Invalid token')
      }

      return new Promise((resolve) => {
        setTimeout(() => {
          const users: DatabaseUser[] = [
            { id: 1, username: 'root', host: 'localhost', locked: false, passwordExpired: false },
            { id: 2, username: 'admin', host: '%', locked: false, passwordExpired: false },
            { id: 3, username: 'readonly', host: '192.168.%', locked: false, passwordExpired: true },
            { id: 4, username: 'backup', host: '10.0.0.%', locked: true, passwordExpired: false }
          ]

          resolve({
            success: true,
            data: users
          })
        }, 600)
      })
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch database users: ${error}`
      }
    }
  }

  // 获取数据库表列表（模拟）
  async getTables(token: string): Promise<ApiResponse<string[]>> {
    try {
      if (!this.isValidDemoToken(token)) {
        throw new Error('Invalid token')
      }

      return new Promise((resolve) => {
        setTimeout(() => {
          const tables = [
            'patients',
            'doctors', 
            'appointments',
            'medical_records',
            'departments',
            'medications',
            'treatments',
            'billing'
          ]

          resolve({
            success: true,
            data: tables
          })
        }, 500)
      })
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch tables: ${error}`
      }
    }
  }
}

export const databaseService = new DatabaseService()
export type { DatabaseConfig, LoginResponse, ApiResponse, SqlExecutionResponse, DatabaseUser }