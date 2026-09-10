import { vi } from "vitest";

import type { ExportResponse, PreviewResponse, WorkerRequest } from "../browser/tokenWorker";

// Stands in for the real Worker global that useWorker constructs. The hooks under test only ever
// touch postMessage, onmessage and terminate, so the double covers exactly those, and records
// every instance it hands out because a test's only way to reach the worker a hook created is to
// look up the one that was constructed for it.
export class FakeWorker {
  static instances: FakeWorker[] = [];
  onmessage: ((event: MessageEvent) => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();

  constructor() {
    FakeWorker.instances.push(this);
  }

  emit(data: PreviewResponse | ExportResponse) {
    this.onmessage?.({ data } as MessageEvent);
  }
}

// Clearing the instance list matters as much as stubbing the global: it is static, so without
// this a test would find the previous test's worker sitting at index 0.
export const installFakeWorker = () => {
  FakeWorker.instances = [];
  vi.stubGlobal("Worker", FakeWorker);
};

export const lastPostedRequest = (worker: FakeWorker): WorkerRequest => {
  const calls = worker.postMessage.mock.calls;

  return calls[calls.length - 1][0] as WorkerRequest;
};
