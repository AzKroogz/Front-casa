export function shouldEnterIdle(lastInteractionMs, nowMs, timeoutMs) {
  return nowMs - lastInteractionMs >= timeoutMs;
}
