import { apiRequest } from './api';

export interface DemoRequest {
  name: string;
  company?: string;
  email: string;
  phone?: string;
  useCase?: string;
}

export const demoService = {
  submitDemoRequest: async (data: DemoRequest) => {
    // Mock implementation for now. Hook up to a backend endpoint when available.
    // Example: return apiRequest('/demo-request', { method: 'POST', body: JSON.stringify(data) });
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 900));
  }
};
