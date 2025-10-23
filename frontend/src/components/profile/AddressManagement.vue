<template>
  <div class="address-management">
    <!-- 添加地址按钮 -->
    <button class="btn-add-address" @click="showAddDialog">
      <span class="icon">+</span>
      添加新地址
    </button>

    <!-- 加载中 -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 空状态 -->
    <div v-else-if="addresses.length === 0" class="empty-state">
      <div class="empty-icon icon-map-pin-large"></div>
      <p>还没有收货地址</p>
      <small>添加地址后,购买商品更方便</small>
    </div>

    <!-- 地址列表 -->
    <div v-else class="address-list">
      <div 
        v-for="address in addresses" 
        :key="address.id"
        :class="['address-card', { default: address.is_default }]"
      >
        <div class="address-header">
          <div class="address-name">
            {{ address.name }}
            <span class="address-phone">{{ address.phone }}</span>
          </div>
          <span v-if="address.is_default" class="default-badge">默认</span>
        </div>
        <div class="address-detail">
          {{ address.province }} {{ address.city }} {{ address.district }} {{ address.detail }}
        </div>
        <div class="address-actions">
          <button 
            v-if="!address.is_default"
            class="btn-action"
            @click="setAsDefault(address.id)"
          >
            设为默认
          </button>
          <button 
            class="btn-action"
            @click="editAddress(address)"
          >
            编辑
          </button>
          <button 
            class="btn-action btn-delete"
            @click="confirmDelete(address.id)"
          >
            删除
          </button>
        </div>
      </div>
    </div>

    <!-- 添加/编辑地址对话框 -->
    <div v-if="showDialog" class="dialog-overlay" @click="closeDialog">
      <div class="dialog-content" @click.stop>
        <h3 class="dialog-title">
          {{ editingAddress ? '编辑地址' : '添加地址' }}
        </h3>
        <form @submit.prevent="submitAddress" class="address-form">
          <div class="form-row">
            <div class="form-group">
              <label>收货人 *</label>
              <input 
                v-model="form.name" 
                type="text" 
                placeholder="请输入收货人姓名"
                required
              />
            </div>
            <div class="form-group">
              <label>联系电话 *</label>
              <input 
                v-model="form.phone" 
                type="tel" 
                placeholder="请输入手机号"
                required
              />
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>省份 *</label>
              <input 
                v-model="form.province" 
                type="text" 
                placeholder="如:北京市"
                required
              />
            </div>
            <div class="form-group">
              <label>城市 *</label>
              <input 
                v-model="form.city" 
                type="text" 
                placeholder="如:北京市"
                required
              />
            </div>
            <div class="form-group">
              <label>区县 *</label>
              <input 
                v-model="form.district" 
                type="text" 
                placeholder="如:海淀区"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label>详细地址 *</label>
            <textarea 
              v-model="form.detail" 
              placeholder="请输入详细地址,如街道、门牌号等"
              rows="3"
              required
            ></textarea>
          </div>

          <div class="form-checkbox">
            <label>
              <input v-model="form.is_default" type="checkbox" />
              设为默认地址
            </label>
          </div>

          <div class="dialog-actions">
            <button type="button" class="btn-cancel" @click="closeDialog">
              取消
            </button>
            <button type="submit" class="btn-submit">
              {{ editingAddress ? '保存' : '添加' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { 
  getAddresses, 
  createAddress, 
  updateAddress, 
  deleteAddress, 
  setDefaultAddress 
} from '@/api/address'
import toast from '@/utils/toast'
import { showDeleteConfirm } from '@/utils/dialog'

const loading = ref(false)
const addresses = ref([])
const showDialog = ref(false)
const editingAddress = ref(null)

const form = ref({
  name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  is_default: false
})

// 获取地址列表
const fetchAddresses = async () => {
  try {
    loading.value = true
    const response = await getAddresses()
    addresses.value = response.data || []
  } catch (error) {
    console.error('获取地址列表失败:', error)
    addresses.value = []
  } finally {
    loading.value = false
  }
}

// 显示添加对话框
const showAddDialog = () => {
  editingAddress.value = null
  resetForm()
  showDialog.value = true
}

// 编辑地址
const editAddress = (address) => {
  editingAddress.value = address
  form.value = {
    name: address.name,
    phone: address.phone,
    province: address.province,
    city: address.city,
    district: address.district,
    detail: address.detail,
    is_default: address.is_default
  }
  showDialog.value = true
}

// 提交地址
const submitAddress = async () => {
  try {
    if (editingAddress.value) {
      await updateAddress(editingAddress.value.id, form.value)
      toast.success('地址更新成功')
    } else {
      await createAddress(form.value)
      toast.success('地址添加成功')
    }
    closeDialog()
    await fetchAddresses()
  } catch (error) {
    console.error('操作失败:', error)
    toast.error(error.response?.data?.error || '操作失败')
  }
}

// 设为默认地址
const setAsDefault = async (addressId) => {
  try {
    await setDefaultAddress(addressId)
    await fetchAddresses()
    toast.success('已设为默认地址')
  } catch (error) {
    console.error('设置默认地址失败:', error)
    toast.error('操作失败')
  }
}

// 删除地址
const confirmDelete = async (addressId) => {
  const confirmed = await showDeleteConfirm('确定要删除这个地址吗？')
  
  if (!confirmed) return

  try {
    await deleteAddress(addressId)
    await fetchAddresses()
    toast.success('地址删除成功')
  } catch (error) {
    console.error('删除失败:', error)
    toast.error('删除失败')
  }
}

// 关闭对话框
const closeDialog = () => {
  showDialog.value = false
  editingAddress.value = null
  resetForm()
}

// 重置表单
const resetForm = () => {
  form.value = {
    name: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    detail: '',
    is_default: false
  }
}

onMounted(() => {
  fetchAddresses()
})
</script>

<style scoped>
.address-management {
  width: 100%;
}

/* 添加按钮 */
.btn-add-address {
  width: 100%;
  padding: 20px;
  border: 2px dashed #d0d0d0;
  border-radius: var(--radius-md);
  background: #fafafa;
  color: var(--text-secondary);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-base) var(--ease-in-out);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 24px;
}

.btn-add-address:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background: var(--bg-white);
}

.btn-add-address .icon {
  font-size: 24px;
}

/* 加载状态 */
.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  opacity: 0.3;
  position: relative;
}

.icon-map-pin-large::before {
  content: '';
  position: absolute;
  width: 40px;
  height: 40px;
  border: 4px solid #999;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  top: 10px;
  left: 50%;
  margin-left: -20px;
}

.icon-map-pin-large::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  background: #999;
  border-radius: 50%;
  top: 22px;
  left: 50%;
  margin-left: -8px;
}

.empty-state p {
  font-size: 18px;
  color: var(--text-secondary);
  margin: 0 0 8px 0;
}

.empty-state small {
  font-size: 14px;
  color: var(--text-tertiary);
}

/* 地址列表 */
.address-list {
  display: grid;
  gap: 16px;
}

.address-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 2px solid rgba(0, 0, 0, 0.06);
  border-radius: 16px;
  padding: 20px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.address-card:hover {
  border-color: var(--primary-color);
  box-shadow: 0 4px 16px rgba(255, 36, 66, 0.1);
}

.address-card.default {
  border-color: var(--primary-color);
  background: linear-gradient(135deg, #fff5f7 0%, #fff 100%);
}

.address-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.address-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 12px;
}

.address-phone {
  font-size: 16px;
  font-weight: 400;
  color: var(--text-secondary);
}

.default-badge {
  background: var(--primary-color);
  color: #fff;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.address-detail {
  font-size: 15px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 16px;
}

.address-actions {
  display: flex;
  gap: 12px;
}

.btn-action {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-action:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.btn-delete:hover {
  border-color: #f44336;
  color: #f44336;
  background: #ffebee;
}

/* 对话框 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border-radius: 24px;
  padding: 32px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 16px 64px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.dialog-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 24px 0;
}

.address-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.form-group input,
.form-group textarea {
  padding: 12px;
  border: 1px solid #d0d0d0;
  border-radius: var(--radius-sm);
  font-size: 14px;
  transition: all var(--transition-base) var(--ease-in-out);
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

.form-checkbox label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
}

.form-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.btn-cancel,
.btn-submit {
  flex: 1;
  padding: 12px;
  border-radius: var(--radius-sm);
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-base) var(--ease-in-out);
}

.btn-cancel {
  background: var(--bg-dark);
  color: var(--text-secondary);
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-submit {
  background: var(--primary-color);
  color: #fff;
}

.btn-submit:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-primary);
}

@media (max-width: 640px) {
  .dialog-content {
    padding: 24px 20px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .address-actions {
    flex-direction: column;
  }

  .btn-action {
    width: 100%;
  }
}
</style>
