# 🚀 Деплоймент на Render.com

## 📋 Предварительные требования

1. **GitHub репозиторий** - весь код должен быть загружен в GitHub
2. **Аккаунт Render** - зарегистрируйтесь на [render.com](https://render.com)
3. **OpenRouter API ключ** - получите на [openrouter.ai](https://openrouter.ai)

## 🎯 Архитектура деплоймента

- **Бэкенд**: Web Service (Node.js)
- **Фронтенд**: Static Site (React)
- **База данных**: PostgreSQL (можно использовать существующую Railway или создать новую)

## 🔧 Пошаговая инструкция

### 1. Создание бэкенд сервиса

1. **Заходим в Render Dashboard** → "New" → "Web Service"
2. **Подключаем GitHub репозиторий**
3. **Настраиваем сервис:**
   - **Name**: `bloop-ai-backend`
   - **Environment**: `Node`
   - **Region**: `Frankfurt` (Европа) или `Oregon` (США)
   - **Branch**: `main` или `master`
   - **Root Directory**: `backend`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`

### 2. Настройка переменных окружения бэкенда

В разделе **Environment Variables** добавляем:

```env
NODE_ENV=production
PORT=5001
DATABASE_URL=<ваша_postgresql_url>
JWT_SECRET=<сгенерируйте_случайную_строку>
JWT_EXPIRES_IN=7d
OPENROUTER_API_KEY=<ваш_openrouter_api_ключ>
OPENROUTER_MODEL=qwen/qwen2.5-vl-32b-instruct:free
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
FRONTEND_URL=<будет_заполнено_после_создания_фронтенда>
```

### 3. Создание базы данных (если нужна новая)

1. **Dashboard** → "New" → "PostgreSQL"
2. **Name**: `bloop-ai-database`
3. **Database Name**: `bloop_ai_prod`
4. **User**: `bloop_user`
5. **Region**: тот же что и бэкенд
6. **Plan**: Free ($0/month)

**Скопируйте Connection String и добавьте в `DATABASE_URL`**

### 4. Создание фронтенд сервиса

1. **Dashboard** → "New" → "Static Site"
2. **Подключаем тот же GitHub репозиторий**
3. **Настраиваем сайт:**
   - **Name**: `bloop-ai-frontend`
   - **Branch**: `main` или `master`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm ci && npm run build`
   - **Publish Directory**: `build`

### 5. Настройка переменных окружения фронтенда

```env
REACT_APP_API_URL=<URL_вашего_бэкенда>/api
```

**Пример**: `https://bloop-ai-backend.onrender.com/api`

### 6. Обновление CORS в бэкенде

После получения URL фронтенда, обновите `FRONTEND_URL` в бэкенде:

```env
FRONTEND_URL=https://bloop-ai-frontend.onrender.com
```

## 🔄 Автоматический деплой

После настройки, каждый push в GitHub автоматически запустит деплой:

1. **Бэкенд**: пересоберется и перезапустится
2. **Фронтенд**: пересоберется и обновится

## 📊 Рекомендуемые планы Render

### Для начала (бесплатно):
- **Бэкенд**: Free Plan (512MB RAM, засыпает при неактивности)
- **Фронтенд**: Free Plan (100GB bandwidth)
- **База данных**: Free PostgreSQL (1GB)

### Для продакшена:
- **Бэкенд**: Starter Plan ($7/мес, постоянно активен)
- **Фронтенд**: Остается бесплатным
- **База данных**: Basic PostgreSQL ($7/мес, 1GB)

## 🛠️ Дополнительные настройки

### Health Check
Бэкенд уже содержит endpoint `/health` для мониторинга.

### Домен
В настройках Static Site можно подключить собственный домен.

### SSL
HTTPS настраивается автоматически для всех сервисов.

### Логи
Логи доступны в реальном времени в Render Dashboard.

## 🚨 Важные моменты

1. **Первый запуск может занять 5-10 минут**
2. **Free план засыпает через 15 минут неактивности**
3. **Пробуждение может занять 30-60 секунд**
4. **Не забудьте добавить реальный OPENROUTER_API_KEY**
5. **DATABASE_URL должен содержать правильные креды PostgreSQL**

## 🔍 Проверка деплоймента

1. **Бэкенд health check**: `https://your-backend.onrender.com/health`
2. **Фронтенд**: `https://your-frontend.onrender.com`
3. **Логи**: в Render Dashboard для отладки

## 📞 Поддержка

- **Render Docs**: [render.com/docs](https://render.com/docs)
- **Status Page**: [status.render.com](https://status.render.com)
- **Community**: [community.render.com](https://community.render.com)

---

**🎉 После успешного деплоймента ваш AI-ассистент будет доступен 24/7 в интернете!** 