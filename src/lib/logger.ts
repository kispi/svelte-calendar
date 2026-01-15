export const logger = {
    info: (message: string, meta?: Record<string, any>) => {
        console.log(
            JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'info',
                message,
                ...meta
            })
        )
    },
    warn: (message: string, meta?: Record<string, any>) => {
        console.warn(
            JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'warn',
                message,
                ...meta
            })
        )
    },
    error: (message: string, meta?: Record<string, any>) => {
        console.error(
            JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'error',
                message,
                ...meta
            })
        )
    },
    debug: (message: string, meta?: Record<string, any>) => {
        if (import.meta.env.MODE !== 'production') {
            console.debug(
                JSON.stringify({
                    timestamp: new Date().toISOString(),
                    level: 'debug',
                    message,
                    ...meta
                })
            )
        }
    }
}
