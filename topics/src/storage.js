const PREFIX = 'teacher.';

function readStorage(key) {
    try {
        return window.localStorage.getItem(PREFIX + key);
    } catch {
        // приватный режим или запрет на хранилище
        return null;
    }
}

function writeStorage(key, value) {
    try {
        window.localStorage.setItem(PREFIX + key, value);
    } catch {
        // выбор просто не переживёт перезагрузку
    }
}

function removeStorage(key) {
    try {
        window.localStorage.removeItem(PREFIX + key);
    } catch {
        // нечего удалять — хранилища и так нет
    }
}

// ключи нашего приложения, начинающиеся с prefix, — уже без общего PREFIX
function storageKeys(prefix) {
    const keys = [];

    try {
        for (let index = 0; index < window.localStorage.length; index += 1) {
            const key = window.localStorage.key(index);
            if (key && key.startsWith(PREFIX + prefix)) {
                keys.push(key.slice(PREFIX.length));
            }
        }
    } catch {
        // хранилище недоступно — переносить нечего
    }

    return keys;
}

export { readStorage, writeStorage, removeStorage, storageKeys };
