import * as activity from './activity.js'

// Tool calls are labeled "actions" in the UI and stack inside the turn's
// activity fold (single Actions row with a live count). Same exports as
// before so connection.js needs no changes.
export function handleToolCall(id, name, args, container) {
  activity.pushToolCall(id, name, args)
}

export function handleToolResult(id, name, output) {
  activity.pushToolResult(id, name, output)
}

export function clearPending() {
  activity.resetTurn()
}

export function pendingCount() {
  return activity.pendingCount()
}
