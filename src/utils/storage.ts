export const STORAGE_KEY = 'fitgen_store_v1';

export const saveToStorage = (data: any) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error('Failed to save to storage', e);
    }
};

export const loadFromStorage = () => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error('Failed to load from storage', e);
        return null;
    }
};
