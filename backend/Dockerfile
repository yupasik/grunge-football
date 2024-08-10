# backend/Dockerfile
FROM python:3.12

# Установка Poetry
RUN pip install poetry

# Создание рабочей директории
WORKDIR /app

# Копирование файлов проекта
COPY pyproject.toml poetry.lock /app/

# Установка зависимостей
RUN poetry install --no-root

# Копирование остальных файлов проекта
COPY . /app

# Команда для запуска FastAPI сервера
CMD ["poetry", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
