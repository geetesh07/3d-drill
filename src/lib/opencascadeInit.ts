import { loadWasmModule } from './wasmLoader';

let OC: any = null;
let initializationPromise: Promise<any> | null = null;

export const initOpenCascade = async () => {
  try {
    if (!OC) {
      if (!initializationPromise) {
        // Use the correct paths for the OpenCascade files
        const modulePath = '/node_modules/opencascade.js/dist/opencascade.js';
        const wasmPath = '/node_modules/opencascade.js/dist/opencascade.wasm';
        
        console.log('Initializing OpenCascade...');
        initializationPromise = loadWasmModule(modulePath, wasmPath)
          .then((instance: any) => {
            console.log('OpenCascade initialized successfully');
            OC = instance;
            return OC;
          })
          .catch((error: Error) => {
            console.error('Failed to initialize OpenCascade:', error);
            throw error;
          });
      }
      OC = await initializationPromise;
    }
    return OC;
  } catch (error) {
    console.error('Error in OpenCascade initialization:', error);
    throw error;
  }
};

export default initOpenCascade; 