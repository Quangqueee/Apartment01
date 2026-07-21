export const PRICE_FILTER_MIN = 0;
export const PRICE_FILTER_MAX = 50;

type PriceRangeParts = {
    min: number;
    max: number | null;
};

const normalizePriceValue = (value: number) => {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Number(value.toFixed(1)));
};

export const parsePriceRange = (priceRange?: string): PriceRangeParts => {
    if (!priceRange || priceRange === "all") {
        return { min: PRICE_FILTER_MIN, max: null };
    }

    const [rawMin = "", rawMax = ""] = priceRange.split("-");
    const parsedMin = rawMin === "" ? PRICE_FILTER_MIN : Number(rawMin);
    const parsedMax = rawMax === "" ? null : Number(rawMax);

    const min = normalizePriceValue(parsedMin);
    const max =
        parsedMax === null || Number.isNaN(parsedMax)
            ? null
            : normalizePriceValue(parsedMax);

    if (max !== null && min > max) {
        return { min: max, max: min };
    }

    return { min, max };
};

export const serializePriceRange = ({
    min,
    max,
}: {
    min: number;
    max: number | null;
}) => {
    const safeMin = normalizePriceValue(min);
    const safeMax = max === null ? null : normalizePriceValue(max);
    return `${safeMin}-${safeMax === null ? "" : safeMax}`;
};

export const isPriceInRange = (
    apartmentPrice: number,
    range: PriceRangeParts
) => {
    const price = normalizePriceValue(apartmentPrice);
    const meetsMin = price >= range.min;
    const meetsMax = range.max === null ? true : price <= range.max;
    return meetsMin && meetsMax;
};

