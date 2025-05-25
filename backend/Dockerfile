# Используем официальный Node.js runtime как родительский образ
FROM node:18-alpine

# Устанавливаем рабочую директорию в контейнере
WORKDIR /app

# Копируем package.json и package-lock.json (если доступен)
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production

# Копируем prisma схему для генерации клиента
COPY prisma ./prisma/

# Генерируем Prisma client
RUN npx prisma generate

# Копируем исходный код
COPY . .

# Компилируем TypeScript
RUN npm run build

# Создаем не-root пользователя
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Меняем владельца файлов
RUN chown -R nodejs:nodejs /app
USER nodejs

# Экспонируем порт
EXPOSE 5001

# Команда для запуска приложения
CMD ["npm", "start"] 