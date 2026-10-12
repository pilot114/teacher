// Адрес API задаётся переменной VUE_APP_API_URL при сборке.
// По умолчанию в разработке это локальный бэкенд, в сборке — тот же домен, что и фронт.
const DEFAULT_BASE = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8090';
const BASE = (process.env.VUE_APP_API_URL || DEFAULT_BASE).replace(/\/$/, '');

class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

// вызывается при 401: токен протух или учётку удалили
let onUnauthorized = () => {};

function setUnauthorizedHandler(handler) {
    onUnauthorized = handler;
}

// keepalive: запрос доходит до сервера, даже если страницу в этот момент закрывают или перезагружают
async function request(path, {method = 'GET', body, token, keepalive = false} = {}) {
    const headers = {};
    if (body !== undefined) {
        headers['Content-Type'] = 'application/json';
    }
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    let response;
    try {
        response = await fetch(BASE + path, {
            method,
            headers,
            body: body === undefined ? undefined : JSON.stringify(body),
            keepalive,
        });
    } catch (error) {
        throw new ApiError('Сервер недоступен. Проверьте связь и попробуйте ещё раз.', 0);
    }

    // наш API всегда отвечает JSON; всё остальное значит, что запрос ушёл не туда
    const payload = await response.json().catch(() => null);

    if (response.status === 401 && payload) {
        onUnauthorized();
    }

    if (!response.ok || payload === null) {
        throw new ApiError(payload?.error ?? describe(response), response.status);
    }

    return payload;
}

// 404 и 405 на месте API — обычно признак того, что фронт стучится в статику:
// сборка без VUE_APP_API_URL ходит на свой же домен, а тот POST не принимает.
function describe(response) {
    const address = BASE || window.location.origin;

    if (response.status === 404 || response.status === 405) {
        return `Адрес ${address} отвечает как обычный сайт, а не как API (${response.status}). Проверьте VUE_APP_API_URL и что бэкенд запущен.`;
    }

    return `Ошибка сервера (${response.status}) от ${address}`;
}

export { ApiError, request, setUnauthorizedHandler };
