module.exports = {
    apps: [{
        name: "svelte-calendar",
        script: "build/index.js",
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: "production",
            PORT: 3000,
            ORIGIN: "https://your-domain.com" // Update this with your actual domain or IP
        }
    }]
};
