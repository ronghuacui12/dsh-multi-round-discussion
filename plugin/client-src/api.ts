/** Thin HTTP client for the plugin's own routes. */
const PREFIX = '/dsh-mmd';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(PREFIX + path, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });
  const text = await response.text();
  let body: any = undefined;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    body = undefined;
  }
  if (!response.ok) {
    throw new Error((body && body.error) || `${response.status} ${response.statusText}`);
  }
  return body as T;
}

export const api = {
  settings: () => request<any>('/settings'),
  saveSettings: (patch: any) => request<any>('/settings', { method: 'POST', body: JSON.stringify(patch) }),
  models: () => request<any>('/models'),
  runs: () => request<any>('/runs'),
  run: (id: string) => request<any>(`/runs/${encodeURIComponent(id)}`),
  removeRun: (id: string) => request<any>(`/runs/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  control: (id: string, control: any) =>
    request<any>(`/runs/${encodeURIComponent(id)}/control`, { method: 'POST', body: JSON.stringify({ control }) }),
  start: (payload: any) => request<any>('/runs', { method: 'POST', body: JSON.stringify(payload) }),
  uploadAvatar: (key: string, dataUrl: string) =>
    request<any>('/avatars', { method: 'POST', body: JSON.stringify({ key, dataUrl }) }),
};

/** Subscribe to the run-event stream. Returns an unsubscribe function. */
export function subscribeEvents(onRuns: (runs: any[]) => void, onRun: (run: any) => void): () => void {
  if (typeof EventSource === 'undefined') return () => {};
  const source = new EventSource(PREFIX + '/events');
  source.addEventListener('snapshot', (event) => {
    try {
      onRuns(JSON.parse((event as MessageEvent).data).runs ?? []);
    } catch {}
  });
  source.addEventListener('run-updated', (event) => {
    try {
      onRun(JSON.parse((event as MessageEvent).data));
    } catch {}
  });
  return () => source.close();
}
