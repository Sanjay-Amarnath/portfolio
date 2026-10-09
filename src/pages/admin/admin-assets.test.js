import projects from "../../../public/data/projects.json";
import { writeFile } from "node:fs/promises";
import adminAssetsHandler, {
  validateProfileImage,
  validateProjects,
} from "../../../api/admin-assets";

jest.mock("node:fs/promises", () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
}));

test("accepts and serializes the published portfolio project list", () => {
  const result = validateProjects(Buffer.from(JSON.stringify(projects)));

  expect(JSON.parse(result.toString("utf8"))).toEqual(projects);
});

test("rejects duplicate project slugs", () => {
  const duplicateProjects = [projects[0], { ...projects[1], slug: projects[0].slug }];

  expect(() => validateProjects(Buffer.from(JSON.stringify(duplicateProjects)))).toThrow(
    `The project slug "${projects[0].slug}" is duplicated.`,
  );
});

test("rejects unsafe project links", () => {
  const unsafeProjects = [{
    ...projects[0],
    href: ["java", "script:alert(1)"].join(""),
  }];

  expect(() => validateProjects(Buffer.from(JSON.stringify(unsafeProjects)))).toThrow(
    `Project ${projects[0].slug} has an invalid link.`,
  );
});

test("accepts a browser-normalized PNG profile image and rejects non-PNG payloads", () => {
  const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(() => validateProfileImage(png)).not.toThrow();
  expect(() => validateProfileImage(Buffer.from("not an image"))).toThrow(
    "The selected profile image is not a valid PNG file.",
  );
});

test("local admin upload saves a validated PNG locally without contacting GitHub", async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";
  const fetchSpy = jest.spyOn(global, "fetch");
  const request = {
    method: "PUT",
    url: "/api/admin-assets?asset=profileImage",
    headers: {
      host: "localhost:3000",
      authorization: "Bearer local-admin-upload-test",
      "content-type": "application/json",
    },
    body: {
      fileBase64: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).toString("base64"),
    },
  };
  const response = {
    statusCode: 0,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    setHeader() {},
  };

  try {
    await adminAssetsHandler(request, response);

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      savedLocally: true,
      bytesValidated: 8,
      message: "Saved to the local portfolio. No GitHub repository was changed.",
    });
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringMatching(/[\\/]public[\\/]images[\\/]sanjay\.png$/),
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  } finally {
    process.env.NODE_ENV = previousNodeEnv;
    fetchSpy.mockRestore();
    writeFile.mockClear();
  }
});

test("local upload token cannot bypass authentication outside development", async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousFirebaseApiKey = process.env.REACT_APP_FIREBASE_API_KEY;
  const previousServerFirebaseApiKey = process.env.FIREBASE_API_KEY;
  process.env.NODE_ENV = "production";
  delete process.env.REACT_APP_FIREBASE_API_KEY;
  delete process.env.FIREBASE_API_KEY;
  const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  const request = {
    method: "PUT",
    url: "/api/admin-assets?asset=profileImage",
    headers: {
      host: "localhost:3000",
      authorization: "Bearer local-admin-upload-test",
      "content-type": "image/png",
    },
    async *[Symbol.asyncIterator]() {},
  };
  const response = {
    statusCode: 0,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    setHeader() {},
  };

  try {
    await adminAssetsHandler(request, response);

    expect(response.statusCode).toBe(500);
    expect(response.body.error).toBe("Firebase API key is not configured on the server.");
  } finally {
    process.env.NODE_ENV = previousNodeEnv;
    if (previousFirebaseApiKey === undefined) delete process.env.REACT_APP_FIREBASE_API_KEY;
    else process.env.REACT_APP_FIREBASE_API_KEY = previousFirebaseApiKey;
    if (previousServerFirebaseApiKey === undefined) delete process.env.FIREBASE_API_KEY;
    else process.env.FIREBASE_API_KEY = previousServerFirebaseApiKey;
    consoleError.mockRestore();
  }
});
