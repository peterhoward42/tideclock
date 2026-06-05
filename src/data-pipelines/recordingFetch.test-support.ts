type FetchCall = {
  readonly input: RequestInfo | URL;
  readonly init?: RequestInit;
};

/**
 * Test fake for injected `fetchImpl` seams. Records every call and returns
 * responses from an explicit handler.
 */
export class RecordingFetch {
  readonly calls: FetchCall[] = [];

  constructor(
    private readonly respond: (
      call: FetchCall,
      index: number
    ) => Response | Promise<Response>
  ) {}

  fetch: typeof fetch = (input, init) => {
    const call = { input, init };
    this.calls.push(call);
    return Promise.resolve(this.respond(call, this.calls.length - 1));
  };
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
