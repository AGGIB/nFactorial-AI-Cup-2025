# ✅ Быстрый чек-лист для деплоймента на Render

## 📋 Подготовка (уже сделано ✅)

- [x] Dockerfile для бэкенда создан
- [x] .dockerignore настроен  
- [x] CORS настройки обновлены
- [x] Package.json скрипты готовы
- [x] API конфигурация фронтенда готова
- [x] Переменные окружения документированы

## 🚀 Деплоймент

### 1. GitHub репозиторий
- [ ] Код загружен в GitHub
- [ ] Все изменения закоммичены
- [ ] Repository public или private с доступом для Render

### 2. Регистрация на Render
- [ ] Аккаунт создан на [render.com](https://render.com)
- [ ] GitHub подключен к аккаунту Render

### 3. Создание бэкенд сервиса
- [ ] New → Web Service
- [ ] GitHub репозиторий подключен
- [ ] Name: `bloop-ai-backend`
- [ ] Environment: `Node`
- [ ] Root Directory: `backend`
- [ ] Build Command: `npm ci && npm run build`
- [ ] Start Command: `npm start`

### 4. Переменные окружения бэкенда
```env
NODE_ENV=production
PORT=5001
DATABASE_URL=postgresql://... # Ваша Railway БД или новая Render БД
JWT_SECRET=your-secret-key-here # Сгенерируйте случайную строку
JWT_EXPIRES_IN=7d
OPENROUTER_API_KEY=sk-or-v1-... # Ваш ключ OpenRouter
OPENROUTER_MODEL=qwen/qwen2.5-vl-32b-instruct:free
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
FRONTEND_URL=https://your-frontend.onrender.com # Будет после создания фронтенда
```

### 5. Создание фронтенд сервиса
- [ ] New → Static Site
- [ ] Тот же GitHub репозиторий
- [ ] Name: `bloop-ai-frontend`
- [ ] Root Directory: `frontend`
- [ ] Build Command: `npm ci && npm run build`
- [ ] Publish Directory: `build`

### 6. Переменные окружения фронтенда
```env
REACT_APP_API_URL=https://your-backend.onrender.com/api
```

### 7. Финальная настройка
- [ ] Обновить `FRONTEND_URL` в бэкенде с реальным URL фронтенда
- [ ] Проверить `/health` endpoint бэкенда
- [ ] Проверить загрузку фронтенда
- [ ] Протестировать регистрацию/авторизацию

## 🔍 Проверка деплоймента

### Бэкенд проверки:
- [ ] `https://your-backend.onrender.com/health` возвращает OK
- [ ] Логи показывают успешное подключение к БД
- [ ] Prisma client сгенерирован

### Фронтенд проверки:
- [ ] Сайт загружается
- [ ] API запросы проходят
- [ ] Виджет работает
- [ ] Автоматизация браузера функционирует

## 🚨 Важные моменты

- **Первый запуск**: может занять 5-10 минут
- **Free план**: засыпает через 15 минут неактивности
- **Пробуждение**: может занять 30-60 секунд
- **Логи**: доступны в реальном времени в Render Dashboard

## 💰 Планы

### Бесплатно:
- Бэкенд: Free Plan (512MB RAM, засыпает)
- Фронтенд: Free Plan (100GB bandwidth)

### Продакшн:
- Бэкенд: Starter ($7/мес, 24/7)
- Фронтенд: остается бесплатным

---

**🎉 После выполнения всех пунктов ваш AI-ассистент будет доступен в интернете!** 