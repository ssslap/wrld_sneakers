# ⚡ Быстрый деплой на GitHub Pages

## 🚀 5 простых шагов

### 1️⃣ Инициализация Git
```bash
cd /home/wrld/Documents/wrld_sneakers
git init
git add .
git commit -m "🎉 Initial commit: WRLD Sneakers website"
```

### 2️⃣ Создать репозиторий на GitHub
- Перейти на https://github.com/new
- Repository name: `wrld-sneakers`
- Public (обязательно!)
- НЕ добавляйте README
- Create repository

### 3️⃣ Подключить и загрузить
```bash
# Замените YOUR_USERNAME на ваш GitHub username!
git remote add origin https://github.com/YOUR_USERNAME/wrld-sneakers.git
git branch -M main
git push -u origin main
```

### 4️⃣ Подождать автоматический деплой
- Откройте вкладку **Actions** на GitHub
- Дождитесь зеленой галочки ✅ (1-2 минуты)

### 5️⃣ Открыть сайт!
```
https://YOUR_USERNAME.github.io/wrld-sneakers/
```

---

## 🔄 Обновить сайт

```bash
git add .
git commit -m "✨ Описание изменений"
git push
```

GitHub автоматически обновит сайт!

---

## ✅ Готово!

Полная инструкция: [DEPLOY_INSTRUCTIONS.md](DEPLOY_INSTRUCTIONS.md)
