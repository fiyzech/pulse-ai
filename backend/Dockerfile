# 1. Беремо офіційний, легкий образ Python
FROM python:3.12-slim

# 2. Вказуємо робочу папку всередині контейнера
WORKDIR /app

# 3. Копіюємо файл із залежностями та встановлюємо їх
# Робимо це окремим кроком, щоб Docker кешував бібліотеки
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. Копіюємо весь наш код у контейнер
COPY . .

# 5. Вказуємо команду, яка запустить наш сервер
# Зверни увагу: host 0.0.0.0 обов'язковий для Docker!
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]