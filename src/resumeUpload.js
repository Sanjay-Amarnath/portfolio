export function waitForUploadTask(uploadTask, onProgress, timeoutMs = 60_000) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let unsubscribe = () => {};
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      unsubscribe();
      reject(
        new Error(
          `Upload timed out after ${Math.ceil(timeoutMs / 1000)} seconds. Check that Firebase Storage is enabled and try again.`
        )
      );
      uploadTask.cancel();
    }, timeoutMs);

    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      unsubscribe();
      callback(value);
    };

    unsubscribe = uploadTask.on(
      "state_changed",
      (snapshot) => {
        if (snapshot.totalBytes > 0) {
          onProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
        }
      },
      (error) => finish(reject, error),
      () => finish(resolve, uploadTask.snapshot)
    );
  });
}
