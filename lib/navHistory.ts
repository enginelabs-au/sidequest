let visitStack: string[] = [];
let forwardStack: string[] = [];

export function resetNavHistory(path: string): void {
  visitStack = [path];
  forwardStack = [];
}

function syncVisitTopTo(path: string): void {
  if (!visitStack.length) {
    visitStack = [path];
    return;
  }
  const top = visitStack[visitStack.length - 1];
  if (top === path) return;

  const idx = visitStack.lastIndexOf(path);
  if (idx >= 0) {
    const dropped = visitStack.slice(idx + 1);
    for (let i = dropped.length - 1; i >= 0; i -= 1) {
      forwardStack.push(dropped[i]);
    }
    visitStack = visitStack.slice(0, idx + 1);
    return;
  }

  visitStack.push(path);
}

/** Call immediately before `router.back()` so forward navigation can restore this screen. */
export function recordBackFrom(currentPath: string): void {
  syncVisitTopTo(currentPath);
  if (visitStack.length <= 1) return;
  const popped = visitStack.pop();
  if (popped) forwardStack.push(popped);
}

export function onPathChange(path: string): void {
  if (!visitStack.length) {
    visitStack = [path];
    return;
  }

  const top = visitStack[visitStack.length - 1];
  if (path === top) return;

  const prev = visitStack[visitStack.length - 2];
  const nextForward = forwardStack[forwardStack.length - 1];

  if (path === prev) {
    visitStack.pop();
    if (top) forwardStack.push(top);
    return;
  }

  if (path === nextForward) {
    forwardStack.pop();
    visitStack.push(path);
    return;
  }

  forwardStack = [];
  visitStack.push(path);
}

export function canGoForward(): boolean {
  return forwardStack.length > 0;
}

export function peekForward(): string | null {
  return forwardStack[forwardStack.length - 1] ?? null;
}

/** Pop and return the next forward destination (also updates visit stack). */
export function consumeForward(): string | null {
  const next = forwardStack.pop() ?? null;
  if (next) visitStack.push(next);
  return next;
}
