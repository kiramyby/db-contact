import { databaseService, type LoginResponse, type ApiResponse, type SqlExecutionResponse } from './database'

class ApiService {
  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      return await databaseService.login(username, password)
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Login failed')
    }
  }

  async testConnection(token: string): Promise<ApiResponse> {
    try {
      return await databaseService.testConnection(token)
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Connection test failed')
    }
  }

  async executeSql(sql: string, token: string): Promise<SqlExecutionResponse> {
    try {
      return await databaseService.executeSql(sql, token)
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'SQL execution failed')
    }
  }

  async getDatabaseUsers(token: string): Promise<ApiResponse> {
    try {
      return await databaseService.getDatabaseUsers(token)
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch users')
    }
  }

  async getTables(token: string): Promise<ApiResponse> {
    try {
      return await databaseService.getTables(token)
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch tables')
    }
  }

  // 配置数据库连接
  setDatabaseConfig(config: {
    host?: string
    port?: number
    user?: string
    password?: string
    database?: string
  }) {
    databaseService.setConfig(config)
  }
}

export const apiService = new ApiService()
export type { ApiResponse, LoginResponse, SqlExecutionResponse }
