# frontend/Dockerfile
FROM nginx:alpine

# Удаление стандартного конфигурационного файла Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Копирование нового конфигурационного файла
COPY nginx.conf /etc/nginx/conf.d

# Копирование файлов фронтенда
COPY . /usr/share/nginx/html
