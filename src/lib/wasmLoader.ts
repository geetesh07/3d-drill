// WebAssembly loader utility
export const loadWasmModule = async (moduleName: string, wasmBinaryFile: string) => {
  try {
    // First, try to load the module directly
    try {
      const module = await import(/* @vite-ignore */ moduleName);
      if (module.default) {
        return module.default({
          wasmBinaryFile,
          noInitialRun: true,
          noExitRuntime: true,
        });
      }
    } catch (error) {
      console.log('Direct import failed, trying script loading...', error);
    }

    // If direct import fails, try script loading
    return new Promise((resolve, reject) => {
      // Create a script element to load the module
      const script = document.createElement('script');
      script.src = moduleName;
      script.async = true;
      
      script.onload = () => {
        // @ts-ignore - Module will be available globally
        const module = window[moduleName.split('/').pop()?.replace('.js', '')];
        if (module) {
          resolve(module({
            wasmBinaryFile,
            noInitialRun: true,
            noExitRuntime: true,
          }));
        } else {
          reject(new Error(`Module ${moduleName} not found`));
        }
      };
      
      script.onerror = () => reject(new Error(`Failed to load ${moduleName}`));
      document.head.appendChild(script);
    });
  } catch (error) {
    console.error('Error loading WebAssembly module:', error);
    throw error;
  }
}; 