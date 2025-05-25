# Bloop.ai - AI-платформа для упрощенного онбординга

> **Создайте ИИ агента для вашей платформы за 5 минут**

## 🚀 О проекте

Bloop.ai - это SaaS-платформа, которая позволяет IT-стартапам быстро интегрировать ИИ-агентов на свои сайты для улучшения пользовательского опыта и автоматизации поддержки.

### Основные возможности:
- 🤖 Создание ИИ-агентов за 5 минут
- 🌐 Анализ сайтов с помощью компьютерного зрения
- 💬 Встраиваемые чат-виджеты
- 📚 Загрузка базы знаний (PDF, DOCX, TXT)
- 📊 Dashboard для управления агентами

## 🏗️ Архитектура

```
bloop-ai/
├── frontend/          # React.js приложение
├── backend/           # Node.js/Express API  
├── widget/            # Встраиваемый виджет
├── shared/            # Общие типы и утилиты
└── docs/              # Документация
```

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js, Prisma ORM
- **Database**: PostgreSQL
- **AI**: OpenRouter API (qwen/qwen2.5-vl-32b-instruct:free)
- **Deployment**: Railway

## 🚀 Быстрый старт

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend  
```bash
cd frontend
npm install
npm start
```

### Widget
```bash
cd widget
npm install
npm run build
```

## 📝 API Documentation

Документация API доступна в папке `/docs/api.md`

## 🤝 Contributing

1. Fork проект
2. Создайте feature branch
3. Commit изменения
4. Push в branch
5. Откройте Pull Request

## 📄 License

MIT License - см. файл LICENSE для подробностей. 