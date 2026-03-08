const API_BASE_URL = 'http://localhost:8000/api';

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return token;
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    window.location.href = 'login.html';
}

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

async function refreshToken() {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) {
        logout();
        return false;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                refresh: refresh
            })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.access);
            return true;
        } else {
            logout();
            return false;
        }
    } catch (error) {
        console.error('Ошибка при обновлении токена:', error);
        logout();
        return false;
    }
}

async function fetchWithAuth(url, options = {}) {
    let token = checkAuth();
    if (!token) return null;

    options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };

    let response = await fetch(url, options);

    if (response.status === 401) {
        const refreshed = await refreshToken();
        if (refreshed) {
            token = localStorage.getItem('token');
            options.headers['Authorization'] = `Bearer ${token}`;
            response = await fetch(url, options);
        } else {
            return null;
        }
    }

    return response;
}

function updateNavigation() {
    const token = localStorage.getItem('token');
    const headerIcons = document.querySelector('.header-icons');
    
    if (headerIcons) {
        if (token) {
            headerIcons.innerHTML = `
                <span class="username">${localStorage.getItem('username') || 'Пользователь'}</span>
                <button onclick="logout()" class="btn logout-btn">Выйти</button>
            `;
        } else {
            headerIcons.innerHTML = `
                <a href="login.html" class="slowhover">Вход</a>
                <a href="register.html" class="btn">Регистрация</a>
            `;
        }
    }
}

document.addEventListener('DOMContentLoaded', updateNavigation);