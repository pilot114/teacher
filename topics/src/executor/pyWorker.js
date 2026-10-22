// pyodideWorker.js — модульный воркер: importScripts в нём недоступен
import { loadPyodide } from 'https://cdn.jsdelivr.net/pyodide/v314.0.7/full/pyodide.mjs';

let pyodideReadyPromise = (async () => {
    self.pyodide = await loadPyodide();

    self.pyodide.setStdout({
        batched: false,
        write: (data) => {
            const decoder = new TextDecoder('utf-8');
            const result = decoder.decode(data);
            self.postMessage({ type: 'stdout', result });
        }
    });
    self.pyodide.setStderr({
        batched: false,
        write: (data) => {
            const decoder = new TextDecoder('utf-8');
            const error = decoder.decode(data);
            self.postMessage({ type: 'stderr', error });
        }
    });
})();

self.onmessage = async (event) => {
    await pyodideReadyPromise;

    try {
        const result = await self.pyodide.runPythonAsync(event.data);
        self.postMessage({ type: 'result', result });
    } catch (error) {
        self.postMessage({ type: 'error', error: error.message });
    }
};
