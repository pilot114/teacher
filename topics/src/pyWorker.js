// pyodideWorker.js
self.importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.3/full/pyodide.js');

let pyodideReadyPromise = (async () => {
    /* global loadPyodide */
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

    const { code } = event.data;

    try {
        const result = await self.pyodide.runPythonAsync(code);
        self.postMessage({ type: 'result', result });
    } catch (error) {
        self.postMessage({ type: 'error', error: error.message });
    }
};
