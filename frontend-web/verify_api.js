
// Mock window and other browser globals
global.window = {
    location: { origin: 'http://localhost' },
    Capacitor: undefined
};

global.AbortController = class AbortController {
    constructor() {
        this.signal = { aborted: false };
    }
    abort() {
        this.signal.aborted = true;
    }
}

// Minimal fetch mock
global.fetch = (url, options) => {
    return new Promise((resolve, reject) => {
        // console.log(`[MockFetch] Request to ${url}`);
        
        if (options.signal && options.signal.aborted) {
            reject({ name: 'AbortError' });
            return;
        }

        // Simulate network delay
        setTimeout(() => {
             if (options.signal && options.signal.aborted) {
                reject({ name: 'AbortError' });
            } else {
                resolve({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    json: async () => ({ status: 'mock_success' })
                });
            }
        }, 100); // Fast response by default
    });
};

// Import environment simulation
// effectively simulating: import.meta.env.VITE_API_URL
const importMetaEnv = {
    VITE_API_URL: undefined // Test detected logic
};

// Function from api.js (we'll copy the logic here to test it since we can't import ES modules easily in this quick script without setup)
function getApiBase(viteUrl, isCapacitor) {
    let API_BASE = viteUrl || (isCapacitor ? '' : '/trackapp/api');
    
    if (API_BASE && /^https?:\/\/[^\/]+:?\d*[\/]?$/.test(API_BASE)) {
        // console.log('⚠️ Detected root URL in VITE_API_URL. Appending /trackapp/api automatically.');
        API_BASE = API_BASE.replace(/\/$/, '') + '/trackapp/api';
    }
    return API_BASE;
}

// Test Cases
console.log('--- URL Logic Tests ---');
console.log('1. Web Default:', getApiBase(undefined, false) === '/trackapp/api' ? 'PASS' : 'FAIL');
console.log('2. Mobile Default (Missing):', getApiBase(undefined, true) === '' ? 'PASS' : 'FAIL');
console.log('3. Mobile Correct:', getApiBase('http://api.com/trackapp/api', true) === 'http://api.com/trackapp/api' ? 'PASS' : 'FAIL');
console.log('4. Mobile Root fix:', getApiBase('http://192.168.1.5:3000', true) === 'http://192.168.1.5:3000/trackapp/api' ? 'PASS' : 'FAIL');
console.log('5. Mobile Root fix (slash):', getApiBase('http://192.168.1.5:3000/', true) === 'http://192.168.1.5:3000/trackapp/api' ? 'PASS' : 'FAIL');

console.log('\n--- Timeout Logic Simulation ---');
async function testSafeFetch(timeoutMs) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs); // Real implementation uses 15000
    
    try {
        // Simulate fetch taking 200ms
        await new Promise((resolve, reject) => {
            setTimeout(() => {
                if (controller.signal.aborted) reject({ name: 'AbortError' });
                else resolve();
            }, 200);
        });
        clearTimeout(timeoutId);
        return 'SUCCESS';
    } catch (e) {
        if (e.name === 'AbortError') return 'TIMEOUT';
        throw e;
    }
}

// Run async tests
(async () => {
    const res1 = await testSafeFetch(500); // Timeout (500) > Fetch (200) -> Should Succeed
    console.log('1. Request completes in time:', res1 === 'SUCCESS' ? 'PASS' : 'FAIL');

    const res2 = await testSafeFetch(50); // Timeout (50) < Fetch (200) -> Should Timeout
    console.log('2. Request times out:', res2 === 'TIMEOUT' ? 'PASS' : 'FAIL');

    console.log('\n✅ Verification Script Complete');
})();
