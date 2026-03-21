import { api } from '@/lib/axios';
import type { Tag, ApiResponse } from '@/types';

export const tagService = {
  // Get all active tags
  getAll: async () => {
    const { data } = await api.get<ApiResponse<{ tags: Tag[] }>>('/tags');
    // Backend returns { success: true, data: { tags: [...] } }
    return (data.data as any)?.tags || [];
  },

  // Get tag by ID
  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<Tag>>(`/tags/${id}`);
    return data;
  },
};

export default tagService;
