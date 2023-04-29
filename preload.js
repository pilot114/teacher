window.addEventListener('DOMContentLoaded', () => {
    console.log('chrome', process.versions.chrome)
    console.log('node', process.versions.node)
    console.log('electron', process.versions.electron)

    process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
})