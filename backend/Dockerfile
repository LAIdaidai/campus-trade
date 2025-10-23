# 后端 Dockerfile
FROM node:20-alpine AS backend-builder

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装所有依赖（包括 devDependencies，用于构建）
RUN npm ci && npm cache clean --force

# 复制源代码
COPY . .

# 构建 TypeScript
RUN npm run build

# 创建上传目录
RUN mkdir -p uploads/products uploads/avatars

FROM node:20-alpine AS production

# 安装 curl 用于健康检查
RUN apk add --no-cache curl

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 只安装生产依赖
RUN npm ci --only=production && npm cache clean --force

# 从构建阶段复制编译后的文件
COPY --from=backend-builder /app/dist ./dist
COPY --from=backend-builder /app/uploads ./uploads

# 设置环境变量
ENV NODE_ENV=production

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "dist/server.js"]

