import { apiRequest } from './api';

export interface DemoRequest {
  companyName: string;
  email: string;
  phone: string;
}

export const demoService = {
  submitDemoRequest: async (data: DemoRequest) => {
    // Mock implementation for now
    console.log("Submitting demo request:", data);
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1000));
    // In production: return apiRequest('/demo-request', { method: 'POST', body: JSON.stringify(data) });
  }
};
