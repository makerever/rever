// Store to manage page data for breadcrumbs

import { create } from "zustand";

type DynamicCrumb = {
  id?: string;
  name?: string;
};

type Store = {
  dynamicCrumb: Record<string, DynamicCrumb>;
  setDynamicCrumb: (path: string, data: DynamicCrumb) => void;
};

export const useBreadcrumbStore = create<Store>((set) => ({
  dynamicCrumb: {},
  setDynamicCrumb: (path, data) =>
    set((state) => ({
      dynamicCrumb: {
        ...state.dynamicCrumb,
        [path]: data,
      },
    })),
}));
