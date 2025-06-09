<template>
  <div class="user-management-container">
    <h2>Database User Management</h2>
    <div v-if="userStore.isLoggedIn">
      <div v-if="isLoading" class="loading-message">Loading user data...</div>
      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

      <table v-if="!isLoading && dbUsers.length > 0">
        <thead>
          <tr>
            <th>User ID</th>
            <th>Username</th>
            <th>Host</th>
            <th>Account Status</th>
            <th>Password Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in dbUsers" :key="user.id">
            <td>{{ user.id }}</td>
            <td>{{ user.username }}</td>
            <td>{{ user.host }}</td>
            <td>
              <span :class="{ 'status-locked': user.locked, 'status-active': !user.locked }">
                {{ user.locked ? 'Locked' : 'Active' }}
              </span>
            </td>
            <td>
              <span :class="{ 'status-expired': user.passwordExpired, 'status-valid': !user.passwordExpired }">
                {{ user.passwordExpired ? 'Expired' : 'Valid' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!isLoading && !errorMessage && dbUsers.length === 0" class="empty-state">
        <p>No database users found or unable to fetch data.</p>
      </div>
      <div class="navigation-links">
        <router-link to="/data">Go back to Data View</router-link>
      </div>
    </div>
    <div v-else>
      <p>Please <router-link to="/">login</router-link> to view user management.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { apiService } from '@/services/api';

interface DbUser {
  id: number;
  username: string;
  host: string;
  locked: boolean;
  passwordExpired: boolean;
}

const userStore = useUserStore();
const dbUsers = ref<DbUser[]>([]);
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);

const fetchDatabaseUsers = async () => {
  if (!userStore.token) {
    errorMessage.value = 'Authentication token missing. Please login again.';
    return;
  }

  isLoading.value = true;
  errorMessage.value = null;
  dbUsers.value = [];

  try {
    const response = await apiService.getDatabaseUsers(userStore.token);
    
    if (response.success) {
      dbUsers.value = response.data || [];
    } else {
      throw new Error(response.error || 'Failed to fetch database users');
    }

  } catch (error) {
    console.error("Error fetching database users:", error);
    errorMessage.value = error instanceof Error ? error.message : "Failed to fetch database users.";
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  if (userStore.isLoggedIn) {
    fetchDatabaseUsers();
  }
});
</script>

<style scoped>
.user-management-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
}

.user-management-container h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-size: 2rem;
  font-weight: 600;
}

.loading-message,
.error-message {
  margin: 20px auto;
  padding: 15px 20px;
  border-radius: 6px;
  max-width: 600px;
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
  max-width: 1000px;
  margin: 20px auto;
  border-collapse: collapse;
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
}

tr:hover {
  background-color: #f8f9fa;
}

.status-locked {
  color: #dc3545;
  font-weight: 500;
}

.status-active {
  color: #28a745;
  font-weight: 500;
}

.status-expired {
  color: #ffc107;
  font-weight: 500;
}

.status-valid {
  color: #28a745;
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
}

.navigation-links {
  text-align: center;
  margin: 20px 0;
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
</style>
