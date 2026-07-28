import { create } from 'axios';

// In development with Android emulator, use 10.0.2.2 to access localhost
// Replace with your live URL in production (e.g., https://brahmacharyapath.com)
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://brahmacharyapath.com/api';

const api = create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

export default api;
