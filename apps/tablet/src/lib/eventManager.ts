// Global event manager to prevent duplicate event listeners
// This ensures only one listener per event type across the entire app

type EventHandler = () => void;
type EventHandlers = Map<string, EventHandler>;

class EventManager {
  private handlers: EventHandlers = new Map();
  private isListening = false;
  private boundHandleGlobalEvent: (event: Event) => void;

  constructor() {
    this.boundHandleGlobalEvent = this.handleGlobalEvent.bind(this);
  }

  // Add event handler (only one per event type)
  addHandler(eventType: string, handler: EventHandler): void {
    // Remove existing handler if any
    if (this.handlers.has(eventType)) {
      console.log(`[EventManager] Replacing existing handler for ${eventType}`);
    }

    this.handlers.set(eventType, handler);

    // Set up global listener if not already listening
    if (!this.isListening) {
      this.setupGlobalListener();
    }
  }

  // Remove event handler
  removeHandler(eventType: string): void {
    if (this.handlers.has(eventType)) {
      console.log(`[EventManager] Removing handler for ${eventType}`);
      this.handlers.delete(eventType);
    }

    // Clean up global listener if no handlers left
    if (this.handlers.size === 0) {
      this.cleanupGlobalListener();
    }
  }

  // Set up the global event listener
  private setupGlobalListener(): void {
    if (this.isListening) return;

    console.log("[EventManager] Setting up global event listener");
    this.isListening = true;

    window.addEventListener("playPhotoSound", this.boundHandleGlobalEvent);
    window.addEventListener("playQrScannedSound", this.boundHandleGlobalEvent);
  }

  // Clean up the global event listener
  private cleanupGlobalListener(): void {
    if (!this.isListening) return;

    console.log("[EventManager] Cleaning up global event listener");
    this.isListening = false;

    window.removeEventListener("playPhotoSound", this.boundHandleGlobalEvent);
    window.removeEventListener(
      "playQrScannedSound",
      this.boundHandleGlobalEvent
    );
  }

  // Handle global events and route to specific handlers
  private handleGlobalEvent(event: Event): void {
    const eventType = event.type;
    const handler = this.handlers.get(eventType);

    if (handler) {
      console.log(`[EventManager] Routing ${eventType} to handler`);
      handler();
    } else {
      console.warn(`[EventManager] No handler found for ${eventType}`);
    }
  }

  // Get handler count for debugging
  getHandlerCount(): number {
    return this.handlers.size;
  }

  // Get all event types for debugging
  getEventTypes(): string[] {
    return Array.from(this.handlers.keys());
  }
}

// Export singleton instance
export const eventManager = new EventManager();
