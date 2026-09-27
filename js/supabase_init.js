// Supabase Initialization
// This script fetches the URL and Anon Key from the backend and initializes the Supabase client.

(function() {
    async function initSupabase() {
        try {
            const configPath = window.SUPABASE_CONFIG_PATH || 'backend/get_supabase_config.php';
            const response = await fetch(configPath);
            if (!response.ok) throw new Error('Failed to fetch Supabase config');
            
            const config = await response.json();
            if (!config.url || !config.anonKey) {
                console.error('Supabase configuration is missing or incomplete.');
                return;
            }

            // The Supabase library should be loaded before this script
            if (typeof supabase === 'undefined') {
                console.error('Supabase library not found. Please ensure the official JS client is loaded.');
                return;
            }

            // Create and export the client globally
            window.supabaseClient = supabase.createClient(config.url, config.anonKey);
            console.log('Supabase initialized successfully over Port 443.');
            
            // Dispatch a custom event to notify other scripts that Supabase is ready
            window.dispatchEvent(new CustomEvent('supabaseReady', { detail: window.supabaseClient }));
            
        } catch (error) {
            console.error('Supabase Initialization Error:', error);
        }
    }

    // Run initialization
    initSupabase();
})();
