# 1. Беремо легкий образ Node.js (це середовище для запуску JavaScript/TypeScript)
FROM node:20-alpine

# 2. Робоча папка всередині контейнера
WORKDIR /app

# 3. Копіюємо package.json та встановлюємо бібліотеки (React, Tailwind тощо)
COPY package.json package-lock.json* ./
RUN npm install

# 4. Копіюємо весь інший код фронтенду
COPY . .

# 5. Відкриваємо порт 5173 (стандартний порт для Vite)
EXPOSE 5173

# 6. Запускаємо сервер розробки. 
# Прапорець --host обов'язковий, щоб Docker випустив сайт назовні!
CMD ["npm", "run", "dev", "--", "--host"]