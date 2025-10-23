<template>
  <div class="captcha-modal" v-if="visible" @click="handleClose">
    <div class="captcha-box" @click.stop>
      <div class="captcha-header">
        <h3>{{ title }}</h3>
        <button class="close-btn" @click="handleClose">&times;</button>
      </div>
      
      <div class="captcha-content">
        <!-- 滑块验证 -->
        <div v-if="type === 'slider'" class="slider-captcha">
          <div class="puzzle-container">
            <canvas ref="canvasRef" class="background-canvas"></canvas>
            <canvas ref="blockRef" class="block-canvas" :style="blockStyle"></canvas>
          </div>
          
          <div class="slider-tip">
            <span v-if="!verified && !failed">👆 拖动下方滑块，将拼图块拖到暗色缺口处</span>
            <span v-if="verified" class="tip-success">✓ 验证成功</span>
            <span v-if="failed" class="tip-failed">✗ 验证失败，请重试</span>
          </div>
          
          <div class="slider-container" :class="{ success: verified, failed: failed }">
            <div class="slider-mask" :style="sliderMaskStyle">
              <span v-if="!verified && !failed">{{ sliderText }}</span>
              <span v-if="verified">✓ 验证成功</span>
              <span v-if="failed">✗ 验证失败,请重试</span>
            </div>
            <div 
              class="slider-button"
              :style="sliderButtonStyle"
              @mousedown="handleDragStart"
              @touchstart="handleDragStart"
            >
              <i class="arrow">→</i>
            </div>
          </div>
        </div>

        <!-- 拼图验证 -->
        <div v-if="type === 'puzzle'" class="puzzle-captcha">
          <div class="puzzle-container">
            <canvas ref="puzzleCanvasRef" class="background-canvas"></canvas>
            <div class="puzzle-pieces">
              <div 
                v-for="(piece, index) in puzzlePieces" 
                :key="index"
                class="puzzle-piece"
                :class="{ placed: piece.placed, correct: piece.correct }"
                :style="piece.style"
                @mousedown="(e) => startDragPiece(e, index)"
                @touchstart="(e) => startDragPiece(e, index)"
              >
                <canvas :ref="el => setPieceCanvas(el, index)"></canvas>
              </div>
            </div>
          </div>
          
          <div class="puzzle-status">
            <span v-if="!verified && !failed">拖动拼图块到正确位置</span>
            <span v-if="verified" class="success">✓ 验证成功!</span>
            <span v-if="failed" class="failed">✗ 验证失败,请重试</span>
          </div>
        </div>

        <div class="captcha-footer">
          <button class="refresh-btn" @click="refresh">
            <Icon name="refresh" /> 刷新
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  type: { type: String, default: 'slider' }, // 'slider' | 'puzzle'
  title: { type: String, default: '安全验证' }
})

const emit = defineEmits(['close', 'success'])

// 滑块验证相关
const canvasRef = ref(null)
const blockRef = ref(null)
const sliderX = ref(0)
const blockX = ref(0)
const isDragging = ref(false)
const verified = ref(false)
const failed = ref(false)
const puzzleX = ref(0)

// 拼图验证相关
const puzzleCanvasRef = ref(null)
const puzzlePieces = ref([])
const currentPiece = ref(null)

const sliderText = computed(() => '向右滑动完成验证')

const sliderMaskStyle = computed(() => ({
  width: `${sliderX.value}px`
}))

const sliderButtonStyle = computed(() => ({
  left: `${sliderX.value}px`
}))

const blockStyle = computed(() => {
  // 拼图块直接跟随滑块的像素位置移动
  return { 
    left: `${blockX.value}px`,
    top: '0px'
  }
})

// 初始化滑块验证
const initSlider = async () => {
  await nextTick()
  
  if (!canvasRef.value || !blockRef.value) return

  const canvas = canvasRef.value
  const block = blockRef.value
  const ctx = canvas.getContext('2d')
  const blockCtx = block.getContext('2d')

  // 设置canvas尺寸 - 使用容器宽度
  const containerWidth = canvas.parentElement.clientWidth
  const canvasWidth = Math.min(containerWidth, 300)
  const canvasHeight = Math.floor(canvasWidth / 2) // 保持2:1比例
  
  canvas.width = canvasWidth
  canvas.height = canvasHeight
  
  // block canvas设置为和主canvas一样的大小（会被CSS缩放）
  block.width = canvasWidth
  block.height = canvasHeight

  // 先绘制一个占位背景
  ctx.fillStyle = '#f0f0f0'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  // 添加加载提示
  ctx.fillStyle = '#999'
  ctx.font = '14px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('加载中...', canvas.width / 2, canvas.height / 2)

  // 生成随机背景图 - 使用更可靠的图片源
  const img = new Image()
  img.crossOrigin = "anonymous"
  
  // 使用多个备选图片源
  const imageUrls = [
    `https://picsum.photos/${canvasWidth}/${canvasHeight}?random=${Date.now()}`,
    `https://source.unsplash.com/random/${canvasWidth}x${canvasHeight}?sig=${Date.now()}`,
  ]
  
  let currentUrlIndex = 0
  
  const tryLoadImage = () => {
    if (currentUrlIndex >= imageUrls.length) {
      // 如果所有图片源都失败，使用纯色背景
      drawWithColorBackground(ctx, blockCtx, canvas.width, canvas.height)
      return
    }
    
    img.src = imageUrls[currentUrlIndex]
  }
  
  img.onload = () => {
    // 清除加载提示
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    
    // 生成随机拼图位置
    const puzzleSize = Math.floor(canvas.width / 6) // 动态计算拼图大小
    puzzleX.value = Math.floor(Math.random() * (canvas.width - puzzleSize - 50)) + 50
    const puzzleY = Math.floor(Math.random() * (canvas.height - puzzleSize - 30)) + 20
    
    // 绘制拼图形状
    const r = Math.floor(puzzleSize / 5) // 拼图凸起半径
    
    // 在主画布上绘制拼图缺口（暗色阴影）
    ctx.save()
    drawPuzzlePath(ctx, puzzleX.value, puzzleY, puzzleSize, r)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fill()
    ctx.restore()
    
    // 绘制缺口边框，使其更明显
    ctx.save()
    drawPuzzlePath(ctx, puzzleX.value, puzzleY, puzzleSize, r)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.restore()

    // 绘制拼图块到单独的canvas - 只绘制拼图块部分
    blockCtx.clearRect(0, 0, block.width, block.height)
    
    // 创建拼图路径并裁剪
    blockCtx.save()
    // 在0位置绘制（因为这个canvas会通过CSS移动）
    drawPuzzlePath(blockCtx, 0, puzzleY, puzzleSize, r)
    blockCtx.clip()
    
    // 绘制对应的图片部分
    blockCtx.drawImage(
      img,
      puzzleX.value, 0,  // 从puzzleX位置截取
      puzzleSize + 20, canvas.height,  // 截取的大小
      0, 0,  // 绘制到canvas的0位置
      puzzleSize + 20, canvas.height
    )
    blockCtx.restore()
    
    // 添加拼图块边框
    blockCtx.save()
    drawPuzzlePath(blockCtx, 0, puzzleY, puzzleSize, r)
    blockCtx.strokeStyle = '#fff'
    blockCtx.lineWidth = 3
    blockCtx.stroke()
    blockCtx.restore()
  }
  
  img.onerror = () => {
    currentUrlIndex++
    tryLoadImage()
  }
  
  tryLoadImage()
}

// 使用纯色背景作为后备方案
const drawWithColorBackground = (ctx, blockCtx, canvasWidth, canvasHeight) => {
  const width = canvasWidth
  const height = canvasHeight
  // 生成渐变背景
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#667eea')
  gradient.addColorStop(1, '#764ba2')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
  
  // 添加一些装饰图案
  ctx.fillStyle = 'rgba(255,255,255,0.1)'
  for (let i = 0; i < 20; i++) {
    ctx.beginPath()
    ctx.arc(
      Math.random() * width,
      Math.random() * height,
      Math.random() * 30 + 10,
      0,
      Math.PI * 2
    )
    ctx.fill()
  }
  
  // 生成拼图位置
  const puzzleSize = Math.floor(width / 6)
  puzzleX.value = Math.floor(Math.random() * (width - puzzleSize - 50)) + 50
  const puzzleY = Math.floor(Math.random() * (height - puzzleSize - 30)) + 20
  const r = Math.floor(puzzleSize / 5)
  
  // 在主画布上绘制拼图缺口（暗色阴影）
  ctx.save()
  drawPuzzlePath(ctx, puzzleX.value, puzzleY, puzzleSize, r)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fill()
  ctx.restore()
  
  // 绘制缺口边框，使其更明显
  ctx.save()
  drawPuzzlePath(ctx, puzzleX.value, puzzleY, puzzleSize, r)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.restore()
  
  // 复制背景到拼图块
  const imageData = ctx.getImageData(0, 0, width, height)
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = width
  tempCanvas.height = height
  const tempCtx = tempCanvas.getContext('2d')
  const tempGradient = tempCtx.createLinearGradient(0, 0, width, height)
  tempGradient.addColorStop(0, '#667eea')
  tempGradient.addColorStop(1, '#764ba2')
  tempCtx.fillStyle = tempGradient
  tempCtx.fillRect(0, 0, width, height)
  
  tempCtx.fillStyle = 'rgba(255,255,255,0.1)'
  for (let i = 0; i < 20; i++) {
    tempCtx.beginPath()
    tempCtx.arc(
      Math.random() * width,
      Math.random() * height,
      Math.random() * 30 + 10,
      0,
      Math.PI * 2
    )
    tempCtx.fill()
  }
  
  // 绘制拼图块到单独的canvas - 只绘制拼图块部分
  blockCtx.clearRect(0, 0, width, height)
  
  // 创建拼图路径并裁剪
  blockCtx.save()
  // 在0位置绘制（因为这个canvas会通过CSS移动）
  drawPuzzlePath(blockCtx, 0, puzzleY, puzzleSize, r)
  blockCtx.clip()
  
  // 绘制对应的图片部分
  blockCtx.drawImage(
    tempCanvas,
    puzzleX.value, 0,  // 从puzzleX位置截取
    puzzleSize + 20, height,  // 截取的大小
    0, 0,  // 绘制到canvas的0位置
    puzzleSize + 20, height
  )
  blockCtx.restore()
  
  // 添加拼图块边框
  blockCtx.save()
  drawPuzzlePath(blockCtx, 0, puzzleY, puzzleSize, r)
  blockCtx.strokeStyle = '#fff'
  blockCtx.lineWidth = 3
  blockCtx.stroke()
  blockCtx.restore()
}

// 绘制拼图路径
const drawPuzzlePath = (ctx, x, y, size, r) => {
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + size / 2 - r, y)
  ctx.arc(x + size / 2, y, r, Math.PI, 0, false)
  ctx.lineTo(x + size, y)
  ctx.lineTo(x + size, y + size / 2 - r)
  ctx.arc(x + size, y + size / 2, r, -Math.PI / 2, Math.PI / 2, false)
  ctx.lineTo(x + size, y + size)
  ctx.lineTo(x + size / 2 + r, y + size)
  ctx.arc(x + size / 2, y + size, r, 0, Math.PI, true)
  ctx.lineTo(x, y + size)
  ctx.closePath()
}

// 拖拽开始
const handleDragStart = (e) => {
  if (verified.value || failed.value) return
  isDragging.value = true
  failed.value = false
}

// 拖拽中
const handleDrag = (e) => {
  if (!isDragging.value) return
  
  e.preventDefault()
  
  const event = e.touches ? e.touches[0] : e
  const container = document.querySelector('.slider-container')
  if (!container) return
  
  const rect = container.getBoundingClientRect()
  const buttonWidth = 45 // 滑块按钮宽度
  let x = event.clientX - rect.left - (buttonWidth / 2)
  
  if (x < 0) x = 0
  if (x > rect.width - buttonWidth) x = rect.width - buttonWidth
  
  sliderX.value = x
  blockX.value = x
}

// 拖拽结束
const handleDragEnd = () => {
  if (!isDragging.value) return
  isDragging.value = false
  
  // 验证位置
  const canvas = canvasRef.value
  const puzzleContainer = canvas?.parentElement
  
  if (!canvas || !puzzleContainer) {
    failed.value = true
    setTimeout(reset, 1000)
    return
  }
  
  // 获取canvas实际宽度和容器显示宽度
  const canvasWidth = canvas.width  // canvas实际像素宽度
  const containerWidth = puzzleContainer.clientWidth  // 容器显示宽度
  
  // 拼图在容器坐标系中的位置（考虑缩放）
  const puzzleDisplayX = (puzzleX.value / canvasWidth) * containerWidth
  
  // blockX是滑块移动的距离（容器坐标系）
  const tolerance = 10 // 容差（像素）
  
  if (Math.abs(blockX.value - puzzleDisplayX) < tolerance) {
    verified.value = true
    setTimeout(() => {
      emit('success')
      handleClose()
    }, 1000)
  } else {
    failed.value = true
    setTimeout(reset, 1000)
  }
}

// 重置
const reset = () => {
  sliderX.value = 0
  blockX.value = 0
  verified.value = false
  failed.value = false
  setTimeout(() => {
    initSlider()
  }, 100)
}

// 刷新
const refresh = () => {
  reset()
}

// 关闭
const handleClose = () => {
  if (!verified.value) {
    reset()
  }
  emit('close')
}

// 初始化拼图验证
const initPuzzle = async () => {
  await nextTick()
  
  if (!puzzleCanvasRef.value) return

  const canvas = puzzleCanvasRef.value
  const ctx = canvas.getContext('2d')
  
  canvas.width = 300
  canvas.height = 300

  const img = new Image()
  img.crossOrigin = "anonymous"
  img.src = `https://picsum.photos/300/300?random=${Math.random()}`
  
  img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    
    // 生成拼图块
    createPuzzlePieces(canvas, img)
  }
}

// 创建拼图块
const createPuzzlePieces = (canvas, img) => {
  const pieceSize = 100
  const cols = 3
  const rows = 3
  const pieces = []
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const index = row * cols + col
      pieces.push({
        id: index,
        correctX: col * pieceSize,
        correctY: row * pieceSize,
        currentX: Math.random() * 200,
        currentY: 300 + Math.random() * 50,
        placed: false,
        correct: false,
        style: computed(() => ({
          left: `${pieces[index]?.currentX || 0}px`,
          top: `${pieces[index]?.currentY || 0}px`,
          width: `${pieceSize}px`,
          height: `${pieceSize}px`
        }))
      })
    }
  }
  
  // 打乱顺序
  pieces.sort(() => Math.random() - 0.5)
  puzzlePieces.value = pieces
  
  // 绘制每个拼图块
  nextTick(() => {
    pieces.forEach((piece, index) => {
      const pieceCanvas = document.querySelectorAll('.puzzle-piece canvas')[index]
      if (pieceCanvas) {
        const ctx = pieceCanvas.getContext('2d')
        pieceCanvas.width = pieceSize
        pieceCanvas.height = pieceSize
        
        const row = Math.floor(piece.id / cols)
        const col = piece.id % cols
        
        ctx.drawImage(
          img,
          col * pieceSize, row * pieceSize, pieceSize, pieceSize,
          0, 0, pieceSize, pieceSize
        )
      }
    })
  })
}

const setPieceCanvas = (el, index) => {
  // Canvas ref 设置
}

const startDragPiece = (e, index) => {
  // 拼图块拖拽逻辑 (简化版,完整实现较复杂)
  currentPiece.value = index
}

// 监听visible变化，重新初始化
watch(() => props.visible, (newVal) => {
  if (newVal) {
    setTimeout(() => {
      if (props.type === 'slider') {
        initSlider()
      } else {
        initPuzzle()
      }
    }, 100)
  }
})

// 生命周期
onMounted(() => {
  if (props.visible) {
    if (props.type === 'slider') {
      initSlider()
    } else {
      initPuzzle()
    }
  }
  
  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('mouseup', handleDragEnd)
  document.addEventListener('touchmove', handleDrag)
  document.addEventListener('touchend', handleDragEnd)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', handleDragEnd)
  document.removeEventListener('touchmove', handleDrag)
  document.removeEventListener('touchend', handleDragEnd)
})
</script>

<style scoped>
.captcha-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.2s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.captcha-box {
  background: white;
  border-radius: var(--radius-md);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  max-width: 400px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s;
}

@keyframes slideUp {
  from { transform: translateY(50px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.captcha-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.captcha-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f5f5f5;
  color: var(--text-primary);
}

.captcha-content {
  padding: 20px;
}

/* 滑块验证样式 */
.slider-captcha {
  width: 100%;
}

.puzzle-container {
  position: relative;
  margin-bottom: 15px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: #f5f5f5;
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.slider-tip {
  text-align: center;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 10px;
  padding: 8px;
  background: #f9f9f9;
  border-radius: 6px;
  font-weight: 500;
}

.slider-tip .tip-success {
  color: #52c41a;
}

.slider-tip .tip-failed {
  color: #ff4d4f;
}

.background-canvas {
  display: block;
  width: 100%;
  height: auto;
  border-radius: var(--radius-sm);
  background: #f0f0f0;
}

.block-canvas {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  width: 100%;
  height: auto;
}

.slider-container {
  position: relative;
  background: #f7f9fa;
  border-radius: 25px;
  height: 40px;
  line-height: 40px;
  text-align: center;
  user-select: none;
  transition: all var(--transition-base) var(--ease-in-out);
  overflow: visible;
  z-index: 1;
}

.slider-container.success {
  background: #e6f7e6;
  color: #52c41a;
}

.slider-container.failed {
  background: #ffe6e6;
  color: #ff4d4f;
}

.slider-mask {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--primary-light));
  border-radius: 25px;
  transition: width 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
}

.slider-button {
  position: absolute;
  top: 0;
  left: 0;
  width: 40px;
  height: 40px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  transition: box-shadow 0.2s;
  z-index: 10;
  border: 2px solid #fff;
}

.slider-button:active {
  cursor: grabbing;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.slider-button .arrow {
  font-style: normal;
  font-size: 20px;
  color: var(--primary-color);
  font-weight: bold;
}

/* 拼图验证样式 */
.puzzle-pieces {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.puzzle-piece {
  position: absolute;
  cursor: move;
  border: 1px solid #ddd;
  border-radius: 4px;
  transition: box-shadow 0.2s;
}

.puzzle-piece:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 10;
}

.puzzle-piece.placed {
  cursor: default;
  border-color: #52c41a;
}

.puzzle-piece canvas {
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.puzzle-status {
  text-align: center;
  padding: 10px;
  font-size: 14px;
  color: var(--text-secondary);
}

.puzzle-status .success {
  color: #52c41a;
}

.puzzle-status .failed {
  color: #ff4d4f;
}

.captcha-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 15px;
}

.refresh-btn {
  padding: 8px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: white;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  transition: all 0.2s;
}

.refresh-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

/* 移动端响应式 */
@media (max-width: 768px) {
  .captcha-modal {
    padding: 10px;
    align-items: center;
    justify-content: center;
  }

  .captcha-box {
    width: 95%;
    max-width: 100%;
    margin: auto;
  }

  .captcha-header {
    padding: 15px;
  }

  .captcha-header h3 {
    font-size: 16px;
  }

  .captcha-content {
    padding: 15px;
  }

  .puzzle-container {
    margin-bottom: 12px;
    min-height: 120px;
  }

  .slider-tip {
    font-size: 11px;
    margin-bottom: 8px;
    padding: 6px;
    line-height: 1.4;
  }

  .background-canvas {
    max-width: 100%;
    width: 100%;
    height: auto;
  }

  .block-canvas {
    max-width: 100%;
    width: 100%;
    height: auto;
  }

  .slider-container {
    height: 45px;
    line-height: 45px;
    font-size: 13px;
    border: 1px solid #e0e0e0;
  }

  .slider-button {
    width: 45px;
    height: 45px;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
  }

  .slider-button .arrow {
    font-size: 22px;
  }

  .slider-mask {
    font-size: 13px;
  }
  
  .slider-mask span {
    display: block;
    width: 100%;
  }

  .puzzle-status {
    font-size: 13px;
    padding: 8px;
  }

  .refresh-btn {
    padding: 6px 12px;
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .captcha-box {
    width: 98%;
    border-radius: 10px;
  }

  .captcha-header {
    padding: 12px;
  }

  .captcha-header h3 {
    font-size: 15px;
  }

  .close-btn {
    font-size: 24px;
    width: 26px;
    height: 26px;
  }

  .captcha-content {
    padding: 12px;
  }

  .puzzle-container {
    min-height: 100px;
    margin-bottom: 10px;
  }

  .slider-tip {
    font-size: 10px;
    margin-bottom: 8px;
    padding: 5px;
    line-height: 1.3;
  }

  .slider-container {
    height: 42px;
    line-height: 42px;
    font-size: 12px;
    border: 1px solid #e0e0e0;
  }

  .slider-button {
    width: 42px;
    height: 42px;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
  }

  .slider-button .arrow {
    font-size: 20px;
  }

  .slider-mask {
    font-size: 12px;
  }
  
  .slider-mask span {
    display: block;
    width: 100%;
  }
}

/* iPad竖屏优化 */
@media (min-width: 481px) and (max-width: 1024px) and (orientation: portrait) {
  .captcha-box {
    max-width: 450px;
    width: 85%;
  }

  .captcha-header {
    padding: 18px;
  }

  .captcha-content {
    padding: 18px;
  }

  .slider-container {
    height: 48px;
    line-height: 48px;
    border: 1px solid #e0e0e0;
  }

  .slider-button {
    width: 48px;
    height: 48px;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
  }
  
  .slider-button .arrow {
    font-size: 24px;
  }
}
</style>
