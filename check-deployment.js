#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Проверка готовности к деплойменту на Render...\n');

const checks = [];

// Проверка структуры проекта
function checkProjectStructure() {
  const requiredDirs = ['backend', 'frontend'];
  const requiredFiles = [
    'backend/package.json',
    'backend/Dockerfile',
    'backend/.dockerignore',
    'frontend/package.json',
    'DEPLOYMENT.md'
  ];

  let allGood = true;

  requiredDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      console.log(`✅ Директория ${dir} найдена`);
    } else {
      console.log(`❌ Директория ${dir} не найдена`);
      allGood = false;
    }
  });

  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ Файл ${file} найден`);
    } else {
      console.log(`❌ Файл ${file} не найден`);
      allGood = false;
    }
  });

  return allGood;
}

// Проверка package.json бэкенда
function checkBackendPackage() {
  try {
    const pkg = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
    let allGood = true;

    const requiredScripts = ['build', 'start', 'postbuild'];
    requiredScripts.forEach(script => {
      if (pkg.scripts[script]) {
        console.log(`✅ Скрипт "${script}" найден в backend/package.json`);
      } else {
        console.log(`❌ Скрипт "${script}" отсутствует в backend/package.json`);
        allGood = false;
      }
    });

    const requiredDeps = ['express', 'prisma', '@prisma/client'];
    requiredDeps.forEach(dep => {
      if (pkg.dependencies[dep]) {
        console.log(`✅ Зависимость "${dep}" найдена`);
      } else {
        console.log(`❌ Зависимость "${dep}" отсутствует`);
        allGood = false;
      }
    });

    return allGood;
  } catch (error) {
    console.log(`❌ Ошибка чтения backend/package.json: ${error.message}`);
    return false;
  }
}

// Проверка переменных окружения
function checkEnvironmentVariables() {
  const envExample = 'backend/env.example';
  if (!fs.existsSync(envExample)) {
    console.log(`❌ Файл ${envExample} не найден`);
    return false;
  }

  const envContent = fs.readFileSync(envExample, 'utf8');
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'OPENROUTER_API_KEY',
    'FRONTEND_URL'
  ];

  let allGood = true;
  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      console.log(`✅ Переменная ${varName} найдена в env.example`);
    } else {
      console.log(`❌ Переменная ${varName} отсутствует в env.example`);
      allGood = false;
    }
  });

  return allGood;
}

// Проверка API конфигурации фронтенда
function checkFrontendAPI() {
  const apiFile = 'frontend/src/services/api.ts';
  if (!fs.existsSync(apiFile)) {
    console.log(`❌ Файл ${apiFile} не найден`);
    return false;
  }

  const apiContent = fs.readFileSync(apiFile, 'utf8');
  if (apiContent.includes('REACT_APP_API_URL')) {
    console.log(`✅ Переменная REACT_APP_API_URL используется в API конфигурации`);
    return true;
  } else {
    console.log(`❌ Переменная REACT_APP_API_URL не найдена в API конфигурации`);
    return false;
  }
}

// Запуск всех проверок
console.log('📂 Проверка структуры проекта:');
checks.push(checkProjectStructure());

console.log('\n📦 Проверка backend/package.json:');
checks.push(checkBackendPackage());

console.log('\n🔧 Проверка переменных окружения:');
checks.push(checkEnvironmentVariables());

console.log('\n🌐 Проверка API конфигурации фронтенда:');
checks.push(checkFrontendAPI());

// Итоговый результат
console.log('\n' + '='.repeat(50));
if (checks.every(check => check)) {
  console.log('🎉 ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ!');
  console.log('✨ Проект готов к деплойменту на Render');
  console.log('\n📖 Читайте инструкцию в файле DEPLOYMENT.md');
  process.exit(0);
} else {
  console.log('❌ НЕКОТОРЫЕ ПРОВЕРКИ НЕ ПРОЙДЕНЫ');
  console.log('🔧 Исправьте ошибки перед деплойментом');
  process.exit(1);
} 