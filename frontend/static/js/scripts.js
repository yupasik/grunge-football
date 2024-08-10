const API_URL = 'http://localhost:8000';

document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signupForm');
    const signinForm = document.getElementById('signinForm');

    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const messageDiv = document.getElementById('message');

            // Очистка предыдущих сообщений
            messageDiv.innerHTML = '';
            messageDiv.className = '';

            // Простейшая проверка
            if (password !== confirmPassword) {
                messageDiv.textContent = 'Passwords do not match.';
                messageDiv.className = 'error';
                return;
            }

            // Отправка данных формы на сервер
            fetch('http://localhost:8000/api/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    messageDiv.textContent = 'Account created successfully! Redirecting to login...';
                    messageDiv.className = 'success';
                    setTimeout(() => window.location.href = '/signin.html', 2000);
                } else {
                    messageDiv.textContent = data.message || 'Registration failed.';
                    messageDiv.className = 'error';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                messageDiv.textContent = 'An error occurred. Please try again later.';
                messageDiv.className = 'error';
            });
        });
    }

    if (signinForm) {
        signinForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const messageDiv = document.getElementById('message');

            // Очистка предыдущих сообщений
            messageDiv.innerHTML = '';
            messageDiv.className = '';

            // Отправка данных формы на сервер
            fetch('http://localhost:8000/api/signin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            })
            .then(response => response.json())
            .then(data => {
                if (data.access_token) {
                    localStorage.setItem('access_token', data.access_token);
                    messageDiv.textContent = 'Login successful! Redirecting to account...';
                    messageDiv.className = 'success';
                    setTimeout(() => window.location.href = '/account.html', 2000);
                } else {
                    messageDiv.textContent = data.message || 'Login failed.';
                    messageDiv.className = 'error';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                messageDiv.textContent = 'An error occurred. Please try again later.';
                messageDiv.className = 'error';
            });
        });
    }

    // Функция для выхода из системы
    const logoutButton = document.getElementById('logout');
    if (logoutButton) {
        logoutButton.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('access_token');
            window.location.href = '/';
        });
    }

    // Пример функции для получения данных пользователя
    const loadUserData = function() {
        fetch('http://localhost:8000/api/users/me', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.username) {
                document.getElementById('username').textContent = data.username;
                document.getElementById('email').textContent = data.email;
            } else {
                console.error('Failed to load user data:', data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    };

    if (window.location.pathname === '/account.html') {
        loadUserData();
    }
});
