<template>
  <div class="user-management-container">
    <h2>数据库用户管理</h2>

    <div v-if="userStore.isLoggedIn">
      <div class="user-info">
        <p>欢迎, {{ userStore.user?.username }}!</p>
        <button @click="handleLogout">登出</button>
      </div>

      <div class="navigation-links">
        <router-link to="/data">返回数据库管理</router-link>
      </div>

      <!-- Error/Success Messages -->
      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
      <div v-if="successMessage" class="success-message">{{ successMessage }}</div>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-message">加载用户中...</div>

      <!-- Create New User Section -->
      <div class="create-user-section">
        <h3>创建新数据库用户</h3>
        <div class="form-group">
          <input
            v-model="newUser.username"
            type="text"
            placeholder="用户名"
            class="form-input"
          />
          <input
            v-model="newUser.host"
            type="text"
            placeholder="主机 (例如: '%', 'localhost')"
            class="form-input"
          />
          <input
            v-model="newUser.password"
            type="password"
            placeholder="密码"
            class="form-input"
          />
          <button @click="createUser" :disabled="isCreating" class="create-btn">
            {{ isCreating ? '创建中...' : '创建用户' }}
          </button>
        </div>
      </div>

      <!-- Users List -->
      <div v-if="!isLoading && databaseUsers.length > 0" class="users-section">
        <h3>数据库用户 ({{ databaseUsers.length }} 个用户)</h3>
        <div class="users-table-wrapper">
          <table class="users-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Host</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in databaseUsers" :key="`${user.User}@${user.Host}`">
                <td>{{ user.User }}</td>
                <td>{{ user.Host }}</td>
                <td class="actions-cell">
                  <button
                    @click="viewUserPrivileges(user.User, user.Host)"
                    class="action-btn view-btn"
                  >
                    View Privileges
                  </button>
                  <button
                    @click="showGrantPrivilegesModal(user.User, user.Host)"
                    class="action-btn grant-btn"
                  >
                    Grant Privileges
                  </button>
                  <button
                    v-if="!isSystemUser(user.User)"
                    @click="deleteUser(user.User, user.Host)"
                    class="action-btn delete-btn"
                    :disabled="isDeletingUser"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- User Privileges Modal -->
      <div v-if="showPrivilegesModal" class="modal-overlay" @click="closePrivilegesModal">
        <div class="modal-content" @click.stop>
          <h3>Privileges for {{ selectedUser?.User }}@{{ selectedUser?.Host }}</h3>
          <div v-if="userPrivileges.length > 0" class="privileges-list">
            <div
              v-for="(privilege, index) in userPrivileges"
              :key="index"
              class="privilege-item"
            >
              {{ Object.values(privilege)[0] }}
            </div>
          </div>
          <div v-else class="no-privileges">No privileges found for this user.</div>
          <button @click="closePrivilegesModal" class="close-btn">Close</button>
        </div>
      </div>

      <!-- Grant Privileges Modal -->
      <div v-if="showGrantModal" class="modal-overlay" @click="closeGrantModal">
        <div class="modal-content" @click.stop>
          <h3>Grant Privileges to {{ selectedUser?.User }}@{{ selectedUser?.Host }}</h3>
          <div class="privilege-form">
            <label>
              Privilege Type:
              <select v-model="privilegeForm.type" class="form-select">
                <option value="SELECT">SELECT</option>
                <option value="INSERT">INSERT</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
                <option value="CREATE">CREATE</option>
                <option value="DROP">DROP</option>
                <option value="ALTER">ALTER</option>
                <option value="ALL PRIVILEGES">ALL PRIVILEGES</option>
              </select>
            </label>
            <label>
              Database:
              <input
                v-model="privilegeForm.database"
                type="text"
                placeholder="Database name or * for all"
                class="form-input"
              />
            </label>
            <div class="modal-actions">
              <button @click="grantPrivileges" :disabled="isGrantingPrivileges" class="grant-btn">
                {{ isGrantingPrivileges ? 'Granting...' : 'Grant Privileges' }}
              </button>
              <button @click="closeGrantModal" class="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!isLoading && databaseUsers.length === 0" class="empty-state">
        <p>No database users found.</p>
      </div>
    </div>
    
    <div v-else>
      <p>Please <router-link to="/login">login</router-link> to access user management.</p>
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

const databaseUsers = ref<any[]>([]);
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);
const isCreating = ref(false);
const isDeletingUser = ref(false);
const isGrantingPrivileges = ref(false);

const showPrivilegesModal = ref(false);
const showGrantModal = ref(false);
const selectedUser = ref<any>(null);
const userPrivileges = ref<any[]>([]);

const newUser = ref({
  username: '',
  host: '%',
  password: ''
});

const privilegeForm = ref({
  type: 'SELECT',
  database: '*'
});

const systemUsers = ['root', 'mysql.sys', 'mysql.session', 'mysql.infoschema'];

const isSystemUser = (username: string) => {
  return systemUsers.includes(username);
};

const clearMessages = () => {
  errorMessage.value = null;
  successMessage.value = null;
};

const showError = (message: string) => {
  clearMessages();
  errorMessage.value = message;
  setTimeout(() => {
    errorMessage.value = null;
  }, 5000);
};

const showSuccess = (message: string) => {
  clearMessages();
  successMessage.value = message;
  setTimeout(() => {
    successMessage.value = null;
  }, 3000);
};

const loadDatabaseUsers = async () => {
  if (!userStore.token) return;
  
  isLoading.value = true;
  clearMessages();
  
  try {
    const response = await apiService.getDatabaseUsers(userStore.token);
    if (response.success) {
      databaseUsers.value = response.data;
    } else {
      showError('加载数据库用户失败');
    }
  } catch (error) {
    showError(error instanceof Error ? error.message : '加载数据库用户失败');
  } finally {
    isLoading.value = false;
  }
};

const createUser = async () => {
  if (!newUser.value.username || !newUser.value.password) {
    showError('用户名和密码是必填项');
    return;
  }
  
  if (!userStore.token) return;
  
  isCreating.value = true;
  clearMessages();
  
  try {
    const response = await apiService.createDatabaseUser(
      userStore.token,
      newUser.value.username,
      newUser.value.host,
      newUser.value.password
    );
    
    if (response.success) {
      showSuccess('用户创建成功');
      newUser.value = { username: '', host: '%', password: '' };
      await loadDatabaseUsers();
    }
  } catch (error) {
    showError(error instanceof Error ? error.message : '创建用户失败');
  } finally {
    isCreating.value = false;
  }
};

const deleteUser = async (username: string, host: string) => {
  if (!confirm(`您确定要删除用户 ${username}@${host} 吗？`)) {
    return;
  }
  
  if (!userStore.token) return;
  
  isDeletingUser.value = true;
  clearMessages();
  
  try {
    const response = await apiService.dropDatabaseUser(userStore.token, username, host);
    if (response.success) {
      showSuccess('用户删除成功');
      await loadDatabaseUsers();
    }
  } catch (error) {
    showError(error instanceof Error ? error.message : '删除用户失败');
  } finally {
    isDeletingUser.value = false;
  }
};

const viewUserPrivileges = async (username: string, host: string) => {
  if (!userStore.token) return;
  
  selectedUser.value = { User: username, Host: host };
  
  try {
    const response = await apiService.getUserPrivileges(userStore.token, username, host);
    if (response.success) {
      userPrivileges.value = response.data;
      showPrivilegesModal.value = true;
    }
  } catch (error) {
    showError(error instanceof Error ? error.message : '加载用户权限失败');
  }
};

const showGrantPrivilegesModal = (username: string, host: string) => {
  selectedUser.value = { User: username, Host: host };
  privilegeForm.value = { type: 'SELECT', database: '*' };
  showGrantModal.value = true;
};

const grantPrivileges = async () => {
  if (!selectedUser.value || !userStore.token) return;
  
  isGrantingPrivileges.value = true;
  
  try {
    const response = await apiService.grantPrivileges(
      userStore.token,
      privilegeForm.value.type,
      privilegeForm.value.database,
      selectedUser.value.User,
      selectedUser.value.Host
    );
    
    if (response.success) {
      showSuccess('权限授予成功');
      closeGrantModal();
    }
  } catch (error) {
    showError(error instanceof Error ? error.message : '授予权限失败');
  } finally {
    isGrantingPrivileges.value = false;
  }
};

const closePrivilegesModal = () => {
  showPrivilegesModal.value = false;
  selectedUser.value = null;
  userPrivileges.value = [];
};

const closeGrantModal = () => {
  showGrantModal.value = false;
  selectedUser.value = null;
};

const handleLogout = () => {
  userStore.logout();
  router.push('/');
};

onMounted(() => {
  if (userStore.isLoggedIn && userStore.token) {
    loadDatabaseUsers();
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

.error-message,
.success-message,
.loading-message {
  margin: 20px 0;
  padding: 15px 20px;
  border-radius: 6px;
  text-align: center;
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
  border: 1px solid #ffcdd2;
}

.success-message {
  background-color: #e8f5e8;
  color: #2e7d32;
  border: 1px solid #c8e6c9;
}

.loading-message {
  background-color: #e3f2fd;
  color: #1976d2;
  border: 1px solid #bbdefb;
}

.create-user-section {
  margin: 30px 0;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border: 1px solid #e9ecef;
}

.create-user-section h3 {
  margin: 0 0 20px 0;
  color: #495057;
  font-size: 18px;
}

.form-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.form-input {
  flex: 1;
  min-width: 200px;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
}

.form-select {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background-color: white;
}

.create-btn {
  padding: 10px 20px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s ease;
}

.create-btn:hover {
  background-color: #218838;
}

.create-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.users-section {
  margin: 30px 0;
}

.users-section h3 {
  margin: 0 0 20px 0;
  color: #495057;
  font-size: 18px;
}

.users-table-wrapper {
  overflow-x: auto;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  background-color: #fff;
}

.users-table th,
.users-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e9ecef;
}

.users-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #495057;
}

.users-table tr:hover {
  background-color: #f8f9fa;
}

.actions-cell {
  white-space: nowrap;
}

.action-btn {
  padding: 6px 12px;
  margin: 0 2px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.view-btn {
  background-color: #17a2b8;
  color: white;
}

.view-btn:hover {
  background-color: #138496;
}

.grant-btn {
  background-color: #28a745;
  color: white;
}

.grant-btn:hover {
  background-color: #218838;
}

.delete-btn {
  background-color: #dc3545;
  color: white;
}

.delete-btn:hover {
  background-color: #c82333;
}

.delete-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

.modal-content h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 18px;
}

.privileges-list {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 20px;
}

.privilege-item {
  padding: 8px 12px;
  margin-bottom: 8px;
  background-color: #f8f9fa;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  border: 1px solid #e9ecef;
}

.no-privileges {
  text-align: center;
  color: #6c757d;
  font-style: italic;
  margin: 20px 0;
}

.privilege-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.privilege-form label {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-weight: 500;
  color: #495057;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.close-btn,
.cancel-btn {
  padding: 8px 16px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.close-btn:hover,
.cancel-btn:hover {
  background-color: #5a6268;
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

button {
  transition: all 0.2s ease;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
