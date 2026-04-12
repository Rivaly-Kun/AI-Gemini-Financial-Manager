import { restClient } from "@massive.com/client-js";

const envApiKey = (import.meta.env.VITE_MASSIVE_API_KEY ??
    import.meta.env.VITE_STOCKMARKT_API_KEY) as string | undefined;

export const stockmarkekey = envApiKey;

export type MarketQuote = {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
};

export const getStockMarketApiKey = () => {
    const trimmed = envApiKey?.trim();
    return trimmed ? trimmed : undefined;
};

const getRestClient = (apiKey: string) =>
    restClient(apiKey, "https://api.massive.com");

const quoteCache = new Map<
    string,
    { timestamp: number; value: MarketQuote }
>();
let lastRequestAt = 0;
const RATE_LIMIT_MS = 1100;
const CACHE_TTL_MS = 60_000;

const waitForRateLimit = async () => {
    const now = Date.now();
    const elapsed = now - lastRequestAt;
    if (elapsed < RATE_LIMIT_MS) {
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_MS - elapsed));
    }
    lastRequestAt = Date.now();
};

export const fetchLastStocksQuote = async (
    symbol: string,
    apiKey: string | undefined = getStockMarketApiKey(),
): Promise<MarketQuote> => {
    if (!apiKey) {
        throw new Error("Missing Massive API key.");
    }

    const cacheKey = symbol.toUpperCase();
    const cached = quoteCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.value;
    }
    const client = getRestClient(apiKey);
    const formatDate = (date: Date) => date.toISOString().slice(0, 10);
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(toDate.getDate() - 10);

    try {
        await waitForRateLimit();
        const response = await client.getStocksAggregates({
            stocksTicker: symbol,
            multiplier: "1",
            timespan: "day",
            from: formatDate(fromDate),
            to: formatDate(toDate),
            adjusted: "true",
            sort: "desc",
            limit: "2",
        } as unknown as Parameters<typeof client.getStocksAggregates>[0]);

        const payload = (response as { data?: unknown })?.data ?? response;
        const results = (payload as { results?: Array<Record<string, unknown>> })
            ?.results;

        if (!results || results.length === 0) {
            throw new Error("Massive returned empty aggregates.");
        }

        const latest = results[0] as { c?: number };
        const previous = results[1] as { c?: number } | undefined;
        const price = Number(latest?.c ?? "NaN");
        const prevPrice = Number(previous?.c ?? "NaN");
        const change =
            Number.isFinite(price) && Number.isFinite(prevPrice)
                ? price - prevPrice
                : 0;
        const changePercent =
            Number.isFinite(price) && Number.isFinite(prevPrice) && prevPrice !== 0
                ? (change / prevPrice) * 100
                : 0;

        if (!Number.isFinite(price)) {
            throw new Error("Invalid aggregate data received.");
        }

        const result: MarketQuote = {
            symbol,
            price,
            change,
            changePercent,
        };
        quoteCache.set(cacheKey, { timestamp: Date.now(), value: result });
        return result;
    } catch (error) {
        const errorWithStatus = error as { response?: { status?: number } };
        if (errorWithStatus?.response?.status === 429) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            quoteCache.delete(cacheKey);
            return fetchLastStocksQuote(symbol, apiKey);
        }
        if (errorWithStatus?.response?.status === 403) {
            throw new Error(
                "Massive REST access denied for this endpoint. Check plan or key.",
            );
        }
        throw error;
    }
};