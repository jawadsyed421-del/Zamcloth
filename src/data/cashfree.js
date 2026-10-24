// Loads Cashfree's checkout script once, only when a customer pays
let loading;
export function loadCashfree() {
    if (window.Cashfree) return Promise.resolve(window.Cashfree);
    if (!loading) {
        loading = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
            script.onload = () => resolve(window.Cashfree);
            script.onerror = () => { loading = null; reject(new Error('Could not load the payment window. Check your connection and try again.')); };
            document.head.appendChild(script);
        });
    }
    return loading;
}
