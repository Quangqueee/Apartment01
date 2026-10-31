import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format as formatInTimeZone, toDate } from "date-fns-tz";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  })
    .format(price * 1000000)
    .replace(" ₫", "  VND/tháng");
}

export function timestampSeconds(timestamp: {
  seconds?: number;
  _seconds?: number;
  nanoseconds?: number;
} | null | undefined): number | null {
  if (!timestamp) return null;
  const seconds = timestamp.seconds ?? timestamp._seconds;
  return typeof seconds === "number" ? seconds : null;
}

export function formatDate(timestamp: { seconds: number; nanoseconds: number }): string {
  const seconds = timestampSeconds(timestamp);
  if (seconds === null) {
    return "";
  }
  const date = new Date(seconds * 1000);

  // Return an ISO 8601 format string (e.g., "2023-11-15"). This is timezone-agnostic and consistent.
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function removeVietnameseTones(str: string) {
  if (!str) return "";
  str = str.toLowerCase();
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  str = str.replace(/\u02C6|\u0306|\u031B/g, "");
  return str;
}

export function formatRelativeTime(timestamp: { seconds: number } | any) {
  const seconds = timestampSeconds(timestamp);
  if (seconds === null || seconds === 0) return "N/A";

  const now = new Date();
  const updateDate = new Date(seconds * 1000);
  const diffInMs = now.getTime() - updateDate.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInHours < 1) {
    return "Vừa xong";
  } else if (diffInHours < 24) {
    return `${diffInHours} giờ trước`;
  } else if (diffInDays < 7) {
    return `${diffInDays} ngày trước`;
  } else {
    // Trả về định dạng DD/MM/YYYY
    return updateDate.toLocaleDateString('vi-VN');
  }
}

const SEARCH_KEYWORD_MAX_GRAM = 5;

export function tokenizeSearchKeywords(text: string): string[] {
  if (!text) return [];

  const normalized = removeVietnameseTones(text)
    .replace(/[\/,\-_?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized.split(" ").filter(Boolean);
}

function withWordInitialDStroke(phrase: string): string {
  return phrase.replace(/\bd/g, "đ");
}

export function searchKeywordIndexValues(phrase: string): string[] {
  const folded = phrase.replace(/đ/g, "d");
  return [...new Set([folded, withWordInitialDStroke(folded)])];
}

export function generateSearchKeywords(text: string): string[] {
  const words = tokenizeSearchKeywords(text);
  const keywords = new Set<string>();

  words.forEach((word) => keywords.add(word));

  for (let i = 0; i < words.length; i++) {
    let combined = "";
    for (let j = i; j < Math.min(i + SEARCH_KEYWORD_MAX_GRAM, words.length); j++) {
      combined = combined ? `${combined} ${words[j]}` : words[j];
      keywords.add(combined);
    }
  }

  for (const keyword of [...keywords]) {
    const dotted = withWordInitialDStroke(keyword);
    if (dotted !== keyword) keywords.add(dotted);
  }

  return Array.from(keywords);
}

export type ApartmentTextSearchPlan = {
  tokens: string[];
  firestoreValue: string;
  firestoreValues: string[];
};

/** AND mọi từ khóa của bất kỳ câu query nào. */
export function planApartmentTextSearch(query: string): ApartmentTextSearchPlan | null {
  const tokens: string[] = [];
  const seen = new Set<string>();

  for (const token of tokenizeSearchKeywords(query)) {
    if (seen.has(token)) continue;
    seen.add(token);
    tokens.push(token);
  }

  if (tokens.length === 0) return null;

  const firestoreValue = tokens.slice(0, SEARCH_KEYWORD_MAX_GRAM).join(" ");
  return {
    tokens,
    firestoreValue,
    firestoreValues: searchKeywordIndexValues(firestoreValue),
  };
}

type SearchableApartment = {
  title?: string | null;
  address?: string | null;
  sourceCode?: string | null;
  landlordPhoneNumber?: string | null;
  searchKeywords?: string[] | null;
};

export function matchesAllSearchTokens(
  apt: SearchableApartment,
  tokens: string[],
  extraFields: Array<string | null | undefined> = [],
): boolean {
  if (tokens.length === 0) return true;

  const indexed = new Set(
    (apt.searchKeywords ?? []).map((keyword) => keyword.replace(/đ/g, "d")),
  );
  const textTokens = new Set(
    tokenizeSearchKeywords(
      [
        apt.title,
        apt.address,
        apt.sourceCode,
        apt.landlordPhoneNumber,
        ...extraFields,
      ]
        .filter(Boolean)
        .join(" "),
    ),
  );

  return tokens.every((token) => indexed.has(token) || textTokens.has(token));
}

export function normalizeSearchText(text: string): string {
  return removeVietnameseTones(text || "")
    .replace(/[\/,\-_?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchesApartmentSearch(
  apt: SearchableApartment,
  searchQuery: string,
  extraFields: Array<string | null | undefined> = [],
): boolean {
  const plan = planApartmentTextSearch(searchQuery);
  if (!plan) return true;
  return matchesAllSearchTokens(apt, plan.tokens, extraFields);
}