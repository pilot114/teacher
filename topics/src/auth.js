import { readStorage, writeStorage, removeStorage } from '@/storage.js';
import { request, setUnauthorizedHandler } from '@/api.js';

const KEY = 'auth';

// сессия в памяти; в хранилище лежит её копия, чтобы вход переживал перезагрузку
let session = restore();

function restore() {
    const raw = readStorage(KEY);
    if (!raw) {
        return null;
    }

    try {
        const saved = JSON.parse(raw);
        if (!saved.token || !saved.user) {
            return null;
        }

        // срок токена знаем заранее — не дёргаем сервер ради заведомо мёртвой сессии
        if (saved.expiresAt && new Date(saved.expiresAt) <= new Date()) {
            removeStorage(KEY);
            return null;
        }

        return saved;
    } catch (error) {
        removeStorage(KEY);
        return null;
    }
}

function currentUser() {
    return session ? session.user : null;
}

function token() {
    return session ? session.token : null;
}

async function login(loginName, password) {
    const payload = await request('/api/login', {
        method: 'POST',
        body: {login: loginName, password: password},
    });

    session = {token: payload.token, expiresAt: payload.expiresAt, user: payload.user};
    writeStorage(KEY, JSON.stringify(session));

    return session.user;
}

function logout() {
    session = null;
    removeStorage(KEY);
}

// запрос от имени вошедшего ученика
function authorized(path, options = {}) {
    return request(path, {...options, token: token()});
}

// сервер отверг токен — выходим и даём приложению показать форму входа
setUnauthorizedHandler(() => {
    if (session) {
        logout();
        window.dispatchEvent(new CustomEvent('teacher:signed-out'));
    }
});

export { authorized, currentUser, login, logout, token };
