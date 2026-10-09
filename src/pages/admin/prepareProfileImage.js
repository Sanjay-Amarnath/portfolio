async function decodeImage(file) {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // Fall through to the browser's image decoder.
    }
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function prepareProfileImage(file) {
  let bitmap;
  try {
    bitmap = await decodeImage(file);
  } catch {
    throw new Error("The browser could not decode this image format. Try converting it to a standard image format first.");
  }

  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not prepare this image for upload.");
    context.drawImage(bitmap, 0, 0);
    const png = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!png) throw new Error("Could not convert this image to PNG.");
    return new File([png], file.name.replace(/\.[^.]+$/, "") + ".png", {
      type: "image/png",
    });
  } finally {
    if (typeof bitmap.close === "function") bitmap.close();
  }
}
