# Використовуємо офіційний образ Python
FROM python:3.11-slim

# Встановлюємо робочу директорію
WORKDIR /app

# Встановлюємо необхідні системні бібліотеки (для компіляції, якщо треба)
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Копіюємо requirements.txt та встановлюємо залежності
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копіюємо весь код у підпапку telegrambot/
# щоб імпорти telegrambot.xxx працювали правильно
COPY . ./telegrambot/

# Команда для запуску бота як модуля
CMD ["python", "-m", "telegrambot.tg_bot"]