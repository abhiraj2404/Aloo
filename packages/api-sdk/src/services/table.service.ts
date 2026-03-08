import { apiClient } from "../client";

export const TableService = {
  getAllTables: async (shopId: string) => {
         
      const response = await apiClient.get(`/table/${shopId}`);
      return response.data.data.tables;

}

};