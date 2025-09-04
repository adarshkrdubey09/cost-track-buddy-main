export interface ChatApiResponse {
  message: string;
  error?: string;
}

export class ChatApiService {
  private baseUrl = 'https://ai.rosmerta.dev/expense/api/sql/query';

  async sendMessage(message: string): Promise<ChatApiResponse> {
    const payload = { question: message };
    console.log("Sending request to backend:", this.baseUrl, payload);

    try {
      // ✅ Always fetch the latest token
      const token = localStorage.getItem("access_token");

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}), // add only if token exists
        },
        body: JSON.stringify(payload),
      });

      console.log("Response status:", response.status);

      // ✅ Handle unauthorized → redirect to login if needed
      if (response.status === 401) {
        console.warn("Unauthorized. Redirecting to login...");
        // Example: clear token & redirect
        localStorage.removeItem("access_token");
        window.location.href = "/login"; 
        return {
          message: "Session expired. Please log in again.",
          error: "Unauthorized (401)",
        };
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Response data:", data);

      return data;
    } catch (error) {
      console.error('Chat API error:', error);
      return {
        message: "I'm sorry, I'm having trouble connecting right now. Please try again later.",
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const chatApi = new ChatApiService();
