import { logErrorForDebugging } from '../../utils/errorMessages'

type AsyncMethod = (...args: any[]) => Promise<any> | any

export function createService<T extends Record<string, AsyncMethod>>(name: string, methods: T): T {
    const service = {} as T

    for (const key of Object.keys(methods) as Array<keyof T>) {
        const method = methods[key]
        service[key] = (async (...args: Parameters<T[typeof key]>) => {
            try {
                return await method(...args)
            } catch (error) {
                logErrorForDebugging(error, `${name}.${String(key)}`, { args })
                throw error
            }
        }) as T[typeof key]
    }

    return service
}
