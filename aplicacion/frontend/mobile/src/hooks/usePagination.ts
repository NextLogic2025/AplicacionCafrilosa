import { useState, useCallback, useRef, useEffect } from 'react'

interface PaginationState {
    page: number
    perPage: number
    totalPages: number
    totalItems: number
    hasMore: boolean
}

interface UsePaginationOptions {
    initialPage?: number
    perPage?: number
}

interface UsePaginationReturn<T> {
    data: T[]
    loading: boolean
    loadingMore: boolean
    error: string | null
    page: number
    totalPages: number
    totalItems: number
    hasMore: boolean
    loadMore: () => Promise<void>
    refresh: () => Promise<void>
    reset: () => void
}

type FetchFunction<T> = (page: number, perPage: number) => Promise<{
    items: T[]
    metadata: {
        total_items: number
        page: number
        per_page: number
        total_pages: number
    }
}>

export function usePagination<T>(
    fetchFn: FetchFunction<T>,
    options: UsePaginationOptions = {}
): UsePaginationReturn<T> {
    const { initialPage = 1, perPage = 20 } = options

    const [data, setData] = useState<T[]>([])
    const [loading, setLoading] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [pagination, setPagination] = useState<PaginationState>({
        page: initialPage,
        perPage,
        totalPages: 0,
        totalItems: 0,
        hasMore: true
    })

    const isLoadingRef = useRef(false)
    const lastTriggerRef = useRef(0)
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
    const THROTTLE_WINDOW = 400

    const fetchPage = useCallback(async (pageNum: number, isRefresh: boolean = false) => {
        if (isLoadingRef.current) return

        try {
            isLoadingRef.current = true

            if (isRefresh) {
                setLoading(true)
            } else {
                setLoadingMore(true)
            }
            setError(null)

            const response = await fetchFn(pageNum, perPage)

            setData(prev => isRefresh ? response.items : [...prev, ...response.items])

            setPagination({
                page: response.metadata.page,
                perPage: response.metadata.per_page,
                totalPages: response.metadata.total_pages,
                totalItems: response.metadata.total_items,
                hasMore: response.metadata.page < response.metadata.total_pages
            })
        } catch (err) {
            setError('Error al cargar datos')
            console.error('usePagination error:', err)
        } finally {
            setLoading(false)
            setLoadingMore(false)
            isLoadingRef.current = false
        }
    }, [fetchFn, perPage])

    const loadMoreInternal = useCallback(async () => {
        if (!pagination.hasMore || isLoadingRef.current) return
        await fetchPage(pagination.page + 1, false)
    }, [fetchPage, pagination.hasMore, pagination.page])

    const scheduleLoadMore = useCallback(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current)
            debounceTimerRef.current = null
        }

        const now = Date.now()
        const wait = Math.max(THROTTLE_WINDOW - (now - lastTriggerRef.current), 0)

        if (wait === 0) {
            lastTriggerRef.current = now
            loadMoreInternal()
            return
        }

        debounceTimerRef.current = setTimeout(() => {
            lastTriggerRef.current = Date.now()
            loadMoreInternal()
            debounceTimerRef.current = null
        }, wait)
    }, [loadMoreInternal])

    const loadMore = useCallback(async () => {
        scheduleLoadMore()
    }, [scheduleLoadMore])

    const refresh = useCallback(async () => {
        await fetchPage(1, true)
    }, [fetchPage])

    const reset = useCallback(() => {
        setData([])
        setPagination({
            page: initialPage,
            perPage,
            totalPages: 0,
            totalItems: 0,
            hasMore: true
        })
        setError(null)
    }, [initialPage, perPage])

    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current)
                debounceTimerRef.current = null
            }
        }
    }, [])

    return {
        data,
        loading,
        loadingMore,
        error,
        page: pagination.page,
        totalPages: pagination.totalPages,
        totalItems: pagination.totalItems,
        hasMore: pagination.hasMore,
        loadMore,
        refresh,
        reset
    }
}

/** Hook simplificado para listas con infinite scroll */
export function useInfiniteList<T>(
    fetchFn: FetchFunction<T>,
    options: UsePaginationOptions = {}
) {
    const pagination = usePagination(fetchFn, options)

    const onEndReached = useCallback(() => {
        if (pagination.hasMore && !pagination.loadingMore) {
            pagination.loadMore()
        }
    }, [pagination])

    return {
        ...pagination,
        onEndReached,
        onEndReachedThreshold: 0.5
    }
}
