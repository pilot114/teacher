const PREFIX = 'teacher.';

function readStorage(key) {
    try {
        return window.localStorage.getItem(PREFIX + key);
    } catch (error) {
        // приватный режим или запрет на хранилище
        return null;
    }
}

function writeStorage(key, value) {
    try {
        window.localStorage.setItem(PREFIX + key, value);
    } catch (error) {
        // выбор просто не переживёт перезагрузку
    }
}

export { readStorage, writeStorage };
