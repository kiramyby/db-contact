<template>
  <div class="data-container">
    <h2>Hospital Database Management</h2>
    <div v-if="userStore.isLoggedIn">
      <div class="user-info">
        <p>Welcome, {{ userStore.user?.username }}!</p>
        <button @click="handleLogout">Logout</button>
      </div>

      <div v-if="connectionStatus" class="connection-status" :class="{ 'error': connectionStatus.includes('❌') }">
        {{ connectionStatus }}
      </div>

      <div class="query-container">
        <div class="query-help">
          <h3>Available Tables:</h3>
          <div v-if="availableTables.length > 0" class="tables-list">
            <span 
              v-for="table in availableTables" 
              :key="table" 
              class="table-tag"
              @click="insertSampleQuery(`SELECT * FROM ${table} LIMIT 10`)"
            >
              {{ table }}
            </span>
          </div>
          <div v-else class="no-tables">No tables found or not connected</div>
          
          <h3>Sample Queries:</h3>
          <div class="sample-queries">
            <button 
              type="button" 
              class="sample-btn"
              @click="insertSampleQuery('SHOW TABLES')"
            >
              Show Tables
            </button>
            <button 
              type="button" 
              class="sample-btn"
              @click="insertSampleQuery('SHOW DATABASES')"
            >
              Show Databases
            </button>
            <button 
              type="button" 
              class="sample-btn"
              @click="insertSampleQuery('SELECT VERSION()')"
            >
              MySQL Version
            </button>
          </div>
        </div>
        
        <textarea 
          v-model="sqlQuery"
          placeholder="Enter your SQL query here...&#10;Example: SELECT * FROM table_name LIMIT 10"
          rows="4"
        ></textarea>
        <button @click="executeSqlQuery" :disabled="isLoading">
          {{ isLoading ? 'Executing...' : 'Execute SQL Query' }}
        </button>
      </div>
      
      <div class="navigation-links">
        <router-link to="/user-management">Manage Database Users</router-link>
      </div>

      <div v-if="isLoading" class="loading-message">Executing query...</div>
      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

      <div v-if="!isLoading && displayedData.length > 0" class="results-container">
        <h3>Query Results ({{ displayedData.length }} rows)</h3>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th v-for="(value, key) in displayedData[0]" :key="key">{{ key }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in displayedData" :key="index">
                <td v-for="(value, key) in item" :key="key">{{ value }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div v-if="!isLoading && !errorMessage && displayedData.length === 0 && hasExecutedQuery" class="empty-state">
        <p>No data returned for your query, or the query returned an empty result set.</p>
      </div>
    </div>
    <div v-else>
      <p>Please <router-link to="/">login</router-link> to access the database.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/userStore';
import { apiService } from '@/services/api';

const userStore = useUserStore();
const router = useRouter();
const sqlQuery = ref('');
const displayedData = ref<any[]>([]);
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);
const hasExecutedQuery = ref(false);
const connectionStatus = ref<string>('');
const availableTables = ref<string[]>([]);

const testConnection = async () => {
  if (!userStore.token) return;
  
  try {
    const response = await apiService.testConnection(userStore.token);
    if (response.success) {
      connectionStatus.value = `✅ Connected to database successfully`;
      if (response.message) {
        connectionStatus.value += ` - ${response.message}`;
      }
    }
  } catch (error) {
    connectionStatus.value = `❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
};

const loadTables = async () => {
  if (!userStore.token) return;
  
  try {
    const response = await apiService.getTables(userStore.token);
    if (response.success) {
      availableTables.value = response.data;
    }
  } catch (error) {
    console.error('Failed to load tables:', error);
  }
};

const executeSqlQuery = async () => {
  const query = sqlQuery.value.trim();
  if (!query) {
    alert("SQL query cannot be empty.");
    return;
  }

  if (!userStore.token) {
    alert("Authentication token missing. Please login again.");
    router.push('/');
    return;
  }

  isLoading.value = true;
  errorMessage.value = null;
  displayedData.value = [];
  hasExecutedQuery.value = true;

  try {
    const result = await apiService.executeSql(query, userStore.token);
    
    if (result.success) {
      displayedData.value = result.data || [];
      console.log(`Query executed successfully. ${result.rowCount || 0} rows returned.`);
    } else {
      throw new Error(result.error || 'Query execution failed');
    }

  } catch (error) {
    console.error("Error executing SQL query:", error);
    errorMessage.value = error instanceof Error ? error.message : 'Unknown error occurred';
    displayedData.value = [];
  } finally {
    isLoading.value = false;
  }
};

const insertSampleQuery = (query: string) => {
  sqlQuery.value = query;
};

const handleLogout = () => {
  userStore.logout();
  router.push('/');
  displayedData.value = [];
  sqlQuery.value = '';
  hasExecutedQuery.value = false;
  errorMessage.value = null;
  connectionStatus.value = '';
};

onMounted(() => {
  if (userStore.isLoggedIn && userStore.token) {
    testConnection();
    loadTables();
  }
});
</script>

<style scoped>
.data-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
}

.data-container h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-size: 2rem;
  font-weight: 600;
}

.user-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 15px 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.user-info p {
  margin: 0;
  font-weight: 500;
  color: #333;
}

.query-container {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border: 1px solid #e9ecef;
}

.query-help {
  margin-bottom: 20px;
}

.query-help h3 {
  margin: 15px 0 10px 0;
  color: #495057;
  font-size: 16px;
}

.tables-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 15px;
}

.table-tag {
  background-color: #e3f2fd;
  color: #1976d2;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.table-tag:hover {
  background-color: #bbdefb;
}

.no-tables {
  color: #6c757d;
  font-style: italic;
  font-size: 14px;
}

.sample-queries {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 15px;
}

.sample-btn {
  background-color: #f8f9fa;
  color: #495057;
  border: 1px solid #dee2e6;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sample-btn:hover {
  background-color: #e9ecef;
  border-color: #adb5bd;
}

.query-container textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  font-family: 'Courier New', monospace;
  margin-bottom: 15px;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
  resize: vertical;
  min-height: 100px;
}

.query-container textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
}

.connection-status {
  margin: 15px 0;
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.connection-status.error {
  background-color: #ffebee;
  color: #c62828;
  border: 1px solid #ffcdd2;
}

.results-container {
  margin-top: 20px;
}

.results-container h3 {
  margin-bottom: 15px;
  color: #333;
  font-size: 18px;
}

.table-wrapper {
  overflow-x: auto;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.navigation-links {
  margin: 20px 0;
  text-align: center;
}

.navigation-links a {
  color: #007bff;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.navigation-links a:hover {
  background-color: #e3f2fd;
}

.loading-message,
.error-message {
  margin: 20px 0;
  padding: 15px 20px;
  border-radius: 6px;
  text-align: center;
}

.loading-message {
  background-color: #e3f2fd;
  color: #1976d2;
  border: 1px solid #bbdefb;
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
  border: 1px solid #ffcdd2;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

th,
td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e9ecef;
}

th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #495057;
  position: sticky;
  top: 0;
}

tr:hover {
  background-color: #f8f9fa;
}

button {
  padding: 12px 24px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s ease;
}

button:hover {
  background-color: #0056b3;
}

button:active {
  transform: translateY(1px);
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
}

.empty-state p {
  font-size: 16px;
  margin: 0;
}
</style>
