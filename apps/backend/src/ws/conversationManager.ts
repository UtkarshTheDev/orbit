import { ConversationMessage } from "../services/aiService";

class ConversationManager {
  private conversations: Map<string, ConversationMessage[]> = new Map();

  /**
   * Get conversation history for a client
   */
  getHistory(clientId: string): ConversationMessage[] {
    if (!this.conversations.has(clientId)) {
      this.conversations.set(clientId, []);
    }
    return this.conversations.get(clientId)!;
  }

  /**
   * Add a message to a client's conversation history
   */
  addMessage(clientId: string, message: ConversationMessage): void {
    const history = this.getHistory(clientId);
    history.push(message);
    // Keep history to a reasonable length, max last 7 messages.
    if (history.length > 7) {
      this.conversations.set(clientId, history.slice(history.length - 7));
    }
  }

  /**
   * Clear conversation history for a client
   */
  clearHistory(clientId: string): void {
    this.conversations.delete(clientId);
  }
}

export const conversationManager = new ConversationManager();
