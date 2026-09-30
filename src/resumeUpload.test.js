import { waitForUploadTask } from "./resumeUpload";

const createUploadTask = () => {
  const task = {
    cancel: jest.fn(),
    on: jest.fn((event, onProgress, onError, onComplete) => {
      task.handlers = { onProgress, onError, onComplete };
      return task.unsubscribe;
    }),
    snapshot: { ref: "resume-ref" },
    unsubscribe: jest.fn(),
  };
  return task;
};

describe("waitForUploadTask", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test("reports progress and resolves when the upload completes", async () => {
    const task = createUploadTask();
    const onProgress = jest.fn();
    const result = waitForUploadTask(task, onProgress);

    task.handlers.onProgress({ bytesTransferred: 25, totalBytes: 100 });
    task.handlers.onComplete();

    await expect(result).resolves.toEqual(task.snapshot);
    expect(onProgress).toHaveBeenCalledWith(25);
    expect(task.unsubscribe).toHaveBeenCalledTimes(1);
  });

  test("rejects Firebase upload errors and unsubscribes", async () => {
    const task = createUploadTask();
    const uploadError = new Error("storage/unauthorized");
    const result = waitForUploadTask(task, jest.fn());

    task.handlers.onError(uploadError);

    await expect(result).rejects.toBe(uploadError);
    expect(task.unsubscribe).toHaveBeenCalledTimes(1);
    expect(task.cancel).not.toHaveBeenCalled();
  });

  test("cancels and rejects an upload that exceeds its timeout", async () => {
    jest.useFakeTimers();
    const task = createUploadTask();
    const result = waitForUploadTask(task, jest.fn(), 100);

    jest.advanceTimersByTime(100);

    await expect(result).rejects.toThrow(/Upload timed out after 1 seconds/);
    expect(task.cancel).toHaveBeenCalledTimes(1);
    expect(task.unsubscribe).toHaveBeenCalledTimes(1);
  });
});
