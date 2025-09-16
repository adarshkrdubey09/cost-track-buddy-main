// src/utils/chatApi.ts
export interface ChatApiResponse {
  message: string;
  error?: string;
}

export interface ChatMessageResponse {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export class ChatApiService {
  private baseUrl = 'https://ai.rosmerta.dev/expense/api';

  /**
   * Send a message to a conversation
   * @param message User message
   * @param convoId Conversation ID
   */
  async sendMessage(message: string, convoId: string): Promise<ChatApiResponse> {
    const payload = { question: message, convo_id: convoId };
    console.log("Sending request to backend:", `${this.baseUrl}/sql/query`, payload);

    try {
      const token = localStorage.getItem("access_token");

      const response = await fetch(`${this.baseUrl}/sql/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      console.log("Response status:", response.status);

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        window.location.href = "login";
        return {
          message: "Session expired. Please log in again.",
          error: "Unauthorized (401)",
        };
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ChatApiResponse = await response.json();
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

  /**
   * Get all messages for a conversation
   * @param convoId Conversation ID
   */
  async getMessages(convoId: string): Promise<ChatMessageResponse[]> {
    try {
      const token = localStorage.getItem("access_token");

      const response = await fetch(`${this.baseUrl}/chat/conversations/${convoId}/messages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        window.location.href = "login";
        return [];
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ChatMessageResponse[] = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
  }
}

export const chatApi = new ChatApiService();
