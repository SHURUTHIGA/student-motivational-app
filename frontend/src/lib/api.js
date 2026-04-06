const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || "").replace(/\/$/, "");

export function resolveApiUrl(pathname) {
    return API_BASE_URL ? `${API_BASE_URL}${pathname}` : pathname;
}
