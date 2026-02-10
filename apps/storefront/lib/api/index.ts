/**
 * Centralized API Services Export
 * 
 * Import services from here to maintain clean imports
 * Example: import { menuService, shopService } from '@/lib/api';
 */

export { default as apiClient } from './apiClient';
export { menuService } from './menu.service';
export { shopService } from './shop.service';
export { ApiError } from './types';
export type { ApiResponse, ApiErrorResponse } from './types';
