import { createConsumer } from '@rails/actioncable'

let consumer

// Lazy-init so test environments that don't open WebSockets stay quiet.
// Path matches the cable mount in api/config/routes.rb — moved to
// /api/v1/cable so the path-scoped refresh-token cookie reaches the
// upgrade request. Protocol resolves from window.location (https → wss).
export function cableConsumer() {
  if (!consumer) {
    consumer = createConsumer('/api/v1/cable')
  }
  return consumer
}

export function disconnectCable() {
  if (consumer) {
    consumer.disconnect()
    consumer = undefined
  }
}
