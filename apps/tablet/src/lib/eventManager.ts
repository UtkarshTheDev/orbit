// Global event manager to prevent duplicate event listeners
// This ensures only one listener per event type across the entire app

type EventHandler = () => void;
type EventHandlers = Map<string, EventHandler>;

// Debounce function to prevent rapid firing of the same event
// Returns both the debounced function and the timeout ID for external tracking
function createDebouncedFunction(func: Function, wait: number): [(...args: any[]) => void, () => number | null] {
  let timeout: number | null = null;
  
  const debouncedFunc = (...args: any[]) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = window.setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
    return timeout;
  };
  
  const getTimeoutId = () => timeout;
  
  return [debouncedFunc, getTimeoutId];
}

class EventManager {
  private handlers: EventHandlers = new Map();
  private isListening = false;
  private boundHandleGlobalEvent: (event: Event) => void;
  private eventLocks: Map<string, boolean> = new Map();
  private eventTimeouts: Map<string, number> = new Map();

  constructor() {
    this.boundHandleGlobalEvent = this.handleGlobalEvent.bind(this);
  }

  // Add event handler (only one per event type)
  addHandler(eventType: string, handler: EventHandler): void {
    // Remove existing handler if any
    if (this.handlers.has(eventType)) {
      console.log(`[EventManager] Replacing existing handler for ${eventType}`);
      // Clear any existing timeouts for this event type
      if (this.eventTimeouts.has(eventType)) {
        window.clearTimeout(this.eventTimeouts.get(eventType));
        this.eventTimeouts.delete(eventType);
      }
    }

    this.handlers.set(eventType, handler);
    this.eventLocks.set(eventType, false);

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
      
      // Clear any existing timeouts for this event type
      if (this.eventTimeouts.has(eventType)) {
        window.clearTimeout(this.eventTimeouts.get(eventType));
        this.eventTimeouts.delete(eventType);
      }
      
      this.eventLocks.delete(eventType);
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
    
    // Clear all timeouts
    this.eventTimeouts.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    this.eventTimeouts.clear();
    this.eventLocks.clear();
  }

  // Handle global events and route to specific handlers
  private handleGlobalEvent(event: Event): void {
    const eventType = event.type;
    const handler = this.handlers.get(eventType);

    // Check if this event type is locked (already being processed)
    if (this.eventLocks.get(eventType)) {
      console.log(`[EventManager] Event ${eventType} is locked, ignoring duplicate`);
      return;
    }

    if (handler) {
      console.log(`[EventManager] Routing ${eventType} to handler`);
      
      // Lock this event type to prevent duplicate processing
      this.eventLocks.set(eventType, true);
      
      // Execute the handler
      handler();
      
      // Use createDebouncedFunction to unlock this event type after a delay
      // This prevents rapid firing of the same event
      const [unlockEvent, getTimeoutId] = createDebouncedFunction(() => {
        this.eventLocks.set(eventType, false);
        this.eventTimeouts.delete(eventType);
      }, 1000); // 1 second lock to prevent duplicate sounds
      
      // Call the debounced function and store the timeout ID
      unlockEvent();
      const timeoutId = getTimeoutId();
      if (timeoutId !== null) {
        this.eventTimeouts.set(eventType, timeoutId);
      }
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
  
  // Clear all event locks (useful for testing or reset)
  clearEventLocks(): void {
    this.eventLocks.forEach((_, key) => {
      this.eventLocks.set(key, false);
    });
  }
}

// Export singleton instance
export const eventManager = new EventManager();
