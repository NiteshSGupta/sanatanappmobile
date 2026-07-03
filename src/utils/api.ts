import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// In development with Android emulator, use 10.0.2.2 to access localhost
// Replace with your live URL in production (e.g., https://brahmacharyapath.com)
export const API_BASE_URL = 'http://localhost:8002/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

export default api;
