module.exports = {
    apps: [{
        name: 'micuentaenorden-backend',
        script: 'npm',
        args: 'run dev',
        cwd: './backend',
        watch: false,
        env: {
            NODE_ENV: 'development'
        },
        log_file: './logs/combined.log',
        out_file: './logs/out.log',
        error_file: './logs/error.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        merge_logs: true
    }]
} 