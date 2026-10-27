import { vi } from "vitest";

import type {
  ExportResponse,
  PreviewResponse,
  WorkerRequest,
} from "@/browser/tokenWorker";

// Stands in for Worker, covering only what useWorker uses. It records every
// instance, since that's how a test reaches the worker a hook created.
export class FakeWorker {
  static instances: FakeWorker[] = [];
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();

  constructor() {
    FakeWorker.instances.push(this);
  }

  emit(data: PreviewResponse | ExportResponse) {
    this.onmessage?.({ data } as MessageEvent);
  }

  // What the browser fires when the worker script itself fails, e.g. it never
  // loaded.
  fail(message: string) {
    this.onerror?.({ message } as ErrorEvent);
  }
}

// Clearing the instance list matters as much as stubbing the global: it is
// static, so without this a test would find the previous test's worker sitting
// at index 0.
export const installFakeWorker = () => {
  FakeWorker.instances = [];
  vi.stubGlobal("Worker", FakeWorker);
};

export const lastPostedRequest = (worker: FakeWorker): WorkerRequest => {
  const calls = worker.postMessage.mock.calls;

  return calls[calls.length - 1][0] as WorkerRequest;
};
