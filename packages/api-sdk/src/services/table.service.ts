import { apiClient } from "../client";

export const TableService = {
  getAllTables: async (shopId: string) => {
    const response = await apiClient.get(`/table/${shopId}`);
    return response.data.data.tables;
  },

  createTable: async (shopId: string, tableNumber: number) => {
    const response = await apiClient.post(`/table`, { shopId, tableNumber });
    return response.data.data.table;
  },

  updateTable: async (id: string, tableNumber: number) => {
    const response = await apiClient.put(`/table/${id}`, { tableNumber });
    return response.data.data.table;
  },

  deleteTable: async (id: string) => {
    const response = await apiClient.delete(`/table/${id}`);
    return response.data;
  },
};
