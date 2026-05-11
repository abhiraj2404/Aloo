import { apiClient } from "../client";
import type { AddonGroup, CreateAddonGroupInput, UpdateAddonGroupInput } from "@repo/types";

export const AddonGroupService = {
  list: async (): Promise<AddonGroup[]> => {
    const res = await apiClient.get(`/addon-group`);
    return res?.data?.data?.addonGroups ?? [];
  },

  create: async (input: CreateAddonGroupInput): Promise<AddonGroup> => {
    const res = await apiClient.post(`/addon-group`, input);
    return res?.data?.data?.addonGroup;
  },

  update: async (id: string, input: UpdateAddonGroupInput): Promise<AddonGroup> => {
    const res = await apiClient.put(`/addon-group/${id}`, input);
    return res?.data?.data?.addonGroup;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/addon-group/${id}`);
  },
};
