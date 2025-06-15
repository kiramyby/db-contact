// API 响应类型定义
export interface LoginResponse {
  success: boolean
  token: string
  user: {
    username: string
    userId: number
  }
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface SqlExecutionResponse {
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

const API_BASE_URL = 'http://localhost:3000/api';

export async function executeSql(sql: string): Promise<SqlExecutionResponse> {
    const response = await fetch(`${API_BASE_URL}/execute-sql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute SQL');
    }

    const result = await response.json();
    return {
        success: true,
        data: result.results,
        fields: result.fields,
        rowCount: result.results?.length || 0
    };
}

class ApiService {
  async login(username: string, password: string): Promise<LoginResponse> {
    if (!username || !password) {
      throw new Error('username and password are required');
    }

    try {
      await executeSql('SELECT 1');
      return {
        success: true,
        token: `token_${username}_${Date.now()}`,
        user: {
          username,
          userId: 1
        }
      };
    } catch (error) {
      throw new Error('failed to connect to the database');
    }
  }

  async testConnection(token: string): Promise<ApiResponse> {
    try {
      await executeSql('SELECT 1 as test');
      return {
        success: true,
        message: 'Successfully connected to the database',
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'failed to connect to the database');
    }
  }

  async executeSql(sql: string, token: string): Promise<SqlExecutionResponse> {
    try {
      return await executeSql(sql);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'failed to execute SQL');
    }
  }

  async getTables(token: string): Promise<ApiResponse> {
    try {
      const result = await executeSql('SHOW TABLES');
      const tables = result.data?.map((row: any) => Object.values(row)[0]) || [];
      return {
        success: true,
        data: tables
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'failed to get tables');
    }
  }

  async getDatabaseUsers(token: string): Promise<ApiResponse> {
    try {
      const result = await executeSql("SELECT User, Host FROM mysql.user ORDER BY User");
      return {
        success: true,
        data: result.data || []
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'failed to get database users');
    }
  }

  async getUserPrivileges(token: string, user: string, host: string): Promise<ApiResponse> {
    try {
      const result = await executeSql(`SHOW GRANTS FOR '${user}'@'${host}'`);
      return {
        success: true,
        data: result.data || []
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'failed to get user privileges');
    }
  }

  async createDatabaseUser(token: string, username: string, host: string, password: string): Promise<ApiResponse> {
    try {
      await executeSql(`CREATE USER '${username}'@'${host}' IDENTIFIED BY '${password}'`);
      return {
        success: true,
        message: 'User created successfully'
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'failed to create user');
    }
  }

  async grantPrivileges(token: string, privileges: string, database: string, username: string, host: string): Promise<ApiResponse> {
    try {
      await executeSql(`GRANT ${privileges} ON ${database}.* TO '${username}'@'${host}'`);
      await executeSql('FLUSH PRIVILEGES');
      return {
        success: true,
        message: 'Privileges granted successfully'
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'failed to grant privileges');
    }
  }

  async revokePrivileges(token: string, privileges: string, database: string, username: string, host: string): Promise<ApiResponse> {
    try {
      await executeSql(`REVOKE ${privileges} ON ${database}.* FROM '${username}'@'${host}'`);
      await executeSql('FLUSH PRIVILEGES');
      return {
        success: true,
        message: 'Privileges revoked successfully'
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'failed to revoke privileges')
    }
  }

  async dropDatabaseUser(token: string, username: string, host: string): Promise<ApiResponse> {
    try {
      await executeSql(`DROP USER '${username}'@'${host}'`);
      return {
        success: true,
        message: 'User deleted successfully'
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'failed to delete user')
    }
  }

  setDatabaseConfig(config: {
    host?: string
    port?: number
    user?: string
    password?: string
    database?: string
  }) {
    localStorage.setItem('dbConfig', JSON.stringify(config));
  }
}

export const apiService = new ApiService()
