import { prepareProfileImage } from "./prepareProfileImage";

const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];

test("always decodes and normalizes even PNG-labeled images before upload", async () => {
  const close = jest.fn();
  const drawImage = jest.fn();
  const previousCreateImageBitmap = Object.getOwnPropertyDescriptor(global, "createImageBitmap");
  const previousToBlob = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, "toBlob");
  const toBlob = jest.fn((callback) => {
    callback(new Blob([Uint8Array.from(pngSignature)], { type: "image/png" }));
  });
  const getContext = jest.spyOn(HTMLCanvasElement.prototype, "getContext")
    .mockReturnValue({ drawImage });
  Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", {
    configurable: true,
    value: toBlob,
  });
  global.createImageBitmap = jest.fn().mockResolvedValue({
    width: 20,
    height: 10,
    close,
  });

  const sourceImage = new File([Uint8Array.from(pngSignature)], "portrait.png", {
    type: "image/png",
  });
  try {
    const converted = await prepareProfileImage(sourceImage);

    expect(converted.name).toBe("portrait.png");
    expect(converted.type).toBe("image/png");
    expect(global.createImageBitmap).toHaveBeenCalledWith(sourceImage);
    expect(drawImage).toHaveBeenCalled();
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), "image/png");
    expect(close).toHaveBeenCalled();
  } finally {
    getContext.mockRestore();
    if (previousCreateImageBitmap) {
      Object.defineProperty(global, "createImageBitmap", previousCreateImageBitmap);
    } else {
      delete global.createImageBitmap;
    }
    if (previousToBlob) {
      Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", previousToBlob);
    } else {
      delete HTMLCanvasElement.prototype.toBlob;
    }
  }
});
