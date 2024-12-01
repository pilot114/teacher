
class PythonExecutor {
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

class GolangExecutor {
    sendCode(code) {
        this.onOutput(code);
    }

    terminate() {
    }
}

import { PhpWeb } from 'php-wasm/PhpWeb.mjs';

class PhpExecutor {
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

class ExecutionWrapper {

    constructor(language) {
        if (language === Langs.PYTHON) {
            this.executor = new PythonExecutor();
            return;
        }
        if (language === Langs.PHP) {
            this.executor = new PhpExecutor();
            return;
        }
        if (language === Langs.GO) {
            this.executor = new GolangExecutor();
            return;
        }
        console.error("Unsupported language: " + language);
    }

    sendInput(input) {
        this.executor.sendInput(input);
    }
    sendCode(code) {
        this.executor.sendCode(code);
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

export { ExecutionWrapper, Langs };