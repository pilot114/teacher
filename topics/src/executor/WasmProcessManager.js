
class PythonProcess {
    constructor() {
        this.worker = new Worker(new URL('../executor/pyWorker.js', import.meta.url), { type: 'module' })

        // route messages and errors to callbacks
        this.worker.onmessage = (event) => {
            const { type, result, error } = event.data;

            if (type === 'error' || type === 'stderr') {
                this.onError(error);
            }
            if (type === 'stdout') {
                this.onOutput(result);
            }
            if (type === 'result') {
                this.onResult(result);
            }
        };
    }

    sendInput(input) {
        // TODO
        console.log('python input: ' + input)
    }

    sendCode(code) {
        this.worker.postMessage(code);
    }

    terminate() {
        this.worker.terminate();
    }
}

import "@/wasm/wasm_exec.js";

if (!WebAssembly.instantiateStreaming) {
    // polyfill
    WebAssembly.instantiateStreaming = async (resp, importObject) => {
        const source = await (await resp).arrayBuffer();
        return await WebAssembly.instantiate(source, importObject);
    };
}

class GolangProcess {
    constructor() {
        // eslint-disable-next-line no-undef
        this.go = new Go();

        const decoder = new TextDecoder("utf-8");
        const self = this;

        let outputBuf = '';
        let errorBuf = '';

        global.fs.read = function(fd, buffer, offset, length, position, callback) {

            if (fd !== 0) {
                callback(null, 0);
            }

            const input = prompt("Введите данные для программы:");

            if (input !== null) {
                const bytes = new TextEncoder().encode(input);
                const toRead = Math.min(length, bytes.length - position);
                for (let i = 0; i < toRead; i++) {
                    buffer[offset + i] = bytes[position + i];
                }
                callback(null, toRead);
            } else {
                callback(null, 0);
            }
        };

        global.fs.writeSync = function(fd, buf) {
            if (fd === 1) {
                outputBuf += decoder.decode(buf);
                self.onOutput(outputBuf);
            }
            if (fd === 2) {
                errorBuf += decoder.decode(buf);
                self.onError(errorBuf);
            }
            return buf.length;
        };
    }

    async sendCode(code, name, env = {}, args = []) {
        this.go.exit = this.onResult;
        this.go.env = env;
        this.go.argv = args;

        let result = await WebAssembly.instantiateStreaming(fetch("go/" + name + ".wasm"), this.go.importObject)
        this.go.run(result.instance).catch((err) => {
            this.onError(err.message || "Неизвестная ошибка");
        });
    }

    terminate() {
    }
}

import { PhpWeb } from 'php-wasm/PhpWeb.mjs';

class PhpProcess {
    constructor() {
        this.php = new PhpWeb();

        this.php.addEventListener('output', (event) => {
            const data = event.detail.join("\n");
            this.onOutput(data)
        });
        this.php.addEventListener('error', (event) => {
            const data = event.detail.join("\n");
            this.onError(data)
        });

        this.result = null;
    }

    sendInput(input) {
        // TODO
        console.log('php input: ' + input);
        // this.php.inputString(input);
    }

    async sendCode(code) {
        const exitCode = await this.php.run(code);
        this.onResult(exitCode);
    }

    async terminate() {
        await this.php.refresh();
    }
}

class WasmProcessManager {

    constructor(language) {
        if (language === Langs.PYTHON) {
            this.executor = new PythonProcess();
            return;
        }
        if (language === Langs.PHP) {
            this.executor = new PhpProcess();
            return;
        }
        if (language === Langs.GO) {
            this.executor = new GolangProcess();
            return;
        }
        console.error("Unsupported language: " + language);
    }

    sendInput(input) {
        this.executor.sendInput(input);
    }
    sendCode(code, name, env = {}, args = []) {
        this.executor.sendCode(code, name, env, args);
    }

    onOutput(cb) {
        this.executor.onOutput = cb;
    }
    onError(cb) {
        this.executor.onError = cb;
    }
    onResult(cb) {
        this.executor.onResult = cb;
    }

    terminate() {
        this.executor.terminate();
    }
}

const Langs = Object.freeze({
    PHP: 'php',
    PYTHON: 'python',
    GO: 'go',
});

export { WasmProcessManager, Langs };