type FormValue = FormDataEntryValue | null;

function stringFromFormValue(value: FormValue) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export async function readRequestBody<T extends Record<string, unknown>>(
  request: Request
): Promise<T> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as T;
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await request.formData();
    const body: Record<string, unknown> = {};

    formData.forEach((value, key) => {
      body[key] = stringFromFormValue(value);
    });

    return body as T;
  }

  return {} as T;
}

export function optionalString(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
