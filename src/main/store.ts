import {create} from "zustand";

export const useServiceWorkerStore = create((set) => ({
    serviceWorker: null,
}));
