export interface ChatApiResponse {
  message: string;
  error?: string;
}

export class ChatApiService {
  private baseUrl = 'http://127.0.0.1:8000/api/v1/sql/query';

  async sendMessage(message: string): Promise<ChatApiResponse> {
  const payload = { question: message };
  console.log("Sending request to backend:", this.baseUrl, payload); // <-- log

  try {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log("Response status:", response.status); // <-- log status

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Response data:", data); // <-- log response
    return data;
  } catch (error) {
    console.error('Chat API error:', error);
    return {
      message: "I'm sorry, I'm having trouble connecting right now. Please try again later.",
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}


}

export const chatApi = new ChatApiService();