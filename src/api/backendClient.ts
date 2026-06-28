export const BACKEND_BASE_URL =
  process.env.EXPO_PUBLIC_BACKEND_BASE_URL ?? "http://127.0.0.1:8000";

type OwnCarDetails = {
  vehicle_make_model: string;
  plate_number: string;
  insurance_provider: string;
  insurance_number: string;
  vehicle_year: string;
};

type RegisterPayload = {
  access_token?: string;
  email?: string;
  postal_code: string;
  full_name: string;
  phone: string;
  car_type: "own_car" | "company_car";
  own_car_details?: OwnCarDetails;
};

type RegisterResponse = {
  message: string;
  status: string;
};

export async function registerDriver(
  payload: RegisterPayload,
): Promise<RegisterResponse> {
  const body: Omit<RegisterPayload, "email"> = {
    access_token: payload.access_token,
    postal_code: payload.postal_code,
    full_name: payload.full_name,
    phone: payload.phone,
    car_type: payload.car_type,
  };

  if (payload.car_type === "own_car" && payload.own_car_details) {
    body.own_car_details = payload.own_car_details;
  }

  const res = await fetch(`${BACKEND_BASE_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    // FastAPI validation errors come as { detail: [...] } or { detail: "string" }
    const detail = data?.detail;
    if (Array.isArray(detail)) {
      throw new Error(detail.map((e: { msg: string }) => e.msg).join(", "));
    }
    throw new Error(
      typeof detail === "string"
        ? detail
        : "Registration failed. Please try again.",
    );
  }

  return data as RegisterResponse;
}

type SendCodeResponse = {
  message: string;
};

type VerifyCodeResponse = {
  verified: boolean;
  message: string;
  auth_user_id?: string;
  access_token?: string;
};

function extractErrorMessage(data: unknown, fallback: string): string {
  const detail = (data as { detail?: unknown })?.detail;
  if (Array.isArray(detail))
    return detail.map((e: { msg: string }) => e.msg).join(", ");
  if (typeof detail === "string") return detail;
  return fallback;
}

export async function sendEmailVerificationCode(
  email: string,
): Promise<SendCodeResponse> {
  const res = await fetch(
    `${BACKEND_BASE_URL}/api/v1/auth/email-verification/send-code`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    },
  );
  const data = await res.json();
  if (!res.ok)
    throw new Error("Could not send verification email. Please try again later.");
  return data as SendCodeResponse;
}

export async function verifyEmailCode(
  email: string,
  code: string,
): Promise<VerifyCodeResponse> {
  const res = await fetch(
    `${BACKEND_BASE_URL}/api/v1/auth/email-verification/verify-code`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    },
  );
  const data = await res.json();
  if (!res.ok)
    throw new Error(
      extractErrorMessage(data, "Verification failed. Please try again."),
    );
  return data as VerifyCodeResponse;
}

type UploadDocumentResponse = {
  message: string;
};

export async function uploadDocument(
  file: { uri: string; name: string; mimeType: string },
  documentType: string,
  accessToken: string,
): Promise<UploadDocumentResponse> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    // XHR's native module handles the { uri, name, type } file object in React Native
    (formData as any).append("file", { uri: file.uri, name: file.name, type: file.mimeType });
    formData.append("document_type", documentType);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BACKEND_BASE_URL}/api/v1/driver-documents/upload`);
    xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data as UploadDocumentResponse);
        } else {
          reject(new Error(extractErrorMessage(data, "Document upload failed. Please try again.")));
        }
      } catch {
        reject(new Error("Document upload failed. Please try again."));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.ontimeout = () => reject(new Error("Upload timed out. Please try again."));
    xhr.send(formData);
  });
}

// ── Login ────────────────────────────────────────────────────────────────────

type AdminUserInfo = {
  auth_user_id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
};

export type AdminLoginResponse = {
  access_token: string;
  refresh_token: string;
  user: AdminUserInfo;
  next_route: "admin_dashboard";
};

export type DriverLoginResponse = {
  access_token: string;
  id: string;
  email: string;
  full_name: string;
  car_type: string;
  status: string;
  external_driver_id: string | null;
};

export type LoginResponse = AdminLoginResponse | DriverLoginResponse;

export function isAdminLoginResponse(r: LoginResponse): r is AdminLoginResponse {
  return (r as AdminLoginResponse).next_route === "admin_dashboard";
}

export async function loginUser(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const res = await fetch(`${BACKEND_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    const detail = (data as { detail?: unknown })?.detail;
    if (typeof detail === "object" && detail !== null && "message" in detail) {
      throw new Error((detail as { message: string }).message);
    }
    if (Array.isArray(detail)) {
      throw new Error(detail.map((e: { msg: string }) => e.msg).join(", "));
    }
    if (typeof detail === "string") throw new Error(detail);
    throw new Error("Login failed. Please try again.");
  }

  return data as LoginResponse;
}
