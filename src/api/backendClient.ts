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

// ── Driver photo proxy ───────────────────────────────────────────────────────
// React Native on Android cannot always resolve the Supabase storage hostname.
// Route photo requests through the backend instead.
export function getDriverPhotoProxyUrl(
  driverId: string,
  accessToken: string,
): string {
  return `${BACKEND_BASE_URL}/api/v1/admin/drivers/${encodeURIComponent(driverId)}/photo?token=${encodeURIComponent(accessToken)}`;
}

// ── Admin Drivers ────────────────────────────────────────────────────────────

export type DriverListItem = {
  id: string;
  auth_user_id: string;
  full_name: string;
  email: string;
  external_driver_id: string | null;
  display_driver_id: string;
  car_type: string;
  driver_type_label: string;
  status: string;
  status_label: "Active" | "Pending" | "Blocked";
  status_color: string;
  profile_photo_url: string | null;
  created_at: string | null;
};

export type DriversListResponse = {
  items: DriverListItem[];
  total: number;
  status_counts: {
    all: number;
    active: number;
    pending: number;
    blocked: number;
  };
};

export async function fetchAdminDrivers(
  accessToken: string,
  params: { search?: string; status?: string; limit?: number; offset?: number } = {},
): Promise<DriversListResponse> {
  const url = new URL(`${BACKEND_BASE_URL}/api/v1/admin/drivers`);
  if (params.search) url.searchParams.set("search", params.search);
  if (params.status) url.searchParams.set("status", params.status);
  if (params.limit != null) url.searchParams.set("limit", String(params.limit));
  if (params.offset != null) url.searchParams.set("offset", String(params.offset));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(extractErrorMessage(data, "Failed to load drivers."));
  }
  return data as DriversListResponse;
}

// ── Admin Driver Detail ───────────────────────────────────────────────────────

export type AdminOwnCarDetails = {
  id: string;
  vehicle_make_model: string | null;
  plate_number: string | null;
  insurance_provider: string | null;
  insurance_number: string | null;
  vehicle_year: number | null;
};

export type DriverDetailResponse = {
  id: string;
  auth_user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  external_driver_id: string | null;
  display_driver_id: string;
  car_type: string;
  driver_type_label: string;
  status: string;
  status_label: string;
  status_color: string;
  profile_photo_url: string | null;
  joined_date: string | null;
  joined_date_label: string;
  own_car_details: AdminOwnCarDetails | null;
};

export async function fetchAdminDriverDetail(
  accessToken: string,
  driverId: string,
): Promise<DriverDetailResponse> {
  const res = await fetch(
    `${BACKEND_BASE_URL}/api/v1/admin/drivers/${encodeURIComponent(driverId)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(extractErrorMessage(data, "Failed to load driver details."));
  }
  return data as DriverDetailResponse;
}

// ── Assign External Driver ID ─────────────────────────────────────────────────

export type AssignExternalDriverIdResponse = {
  id: string;
  external_driver_id: string;
  display_driver_id: string;
};

export async function assignExternalDriverId(
  accessToken: string,
  driverId: string,
  externalDriverId: string,
): Promise<AssignExternalDriverIdResponse> {
  const res = await fetch(
    `${BACKEND_BASE_URL}/api/v1/admin/drivers/${encodeURIComponent(driverId)}/external-id`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ external_driver_id: externalDriverId }),
    },
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(extractErrorMessage(data, "Failed to assign External Driver ID."));
  }
  return data as AssignExternalDriverIdResponse;
}

// ── Change Driver Status ──────────────────────────────────────────────────────

export type ChangeDriverStatusResponse = {
  id: string;
  status: string;
  status_label: string;
  status_color: string;
};

export async function changeDriverStatus(
  accessToken: string,
  driverId: string,
  newStatus: "active" | "pending" | "blocked",
): Promise<ChangeDriverStatusResponse> {
  const res = await fetch(
    `${BACKEND_BASE_URL}/api/v1/admin/drivers/${encodeURIComponent(driverId)}/status`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: newStatus }),
    },
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(extractErrorMessage(data, "Failed to change driver status."));
  }
  return data as ChangeDriverStatusResponse;
}

// ── Admin Driver Documents ────────────────────────────────────────────────────

export type DriverDocumentsDriverInfo = {
  id: string;
  auth_user_id: string;
  full_name: string;
  display_driver_id: string;
  driver_type_label: string;
  status_label: string;
  status_color: string;
  profile_photo_url: string | null;
};

export type DriverDocumentsSummary = {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
};

export type DriverDocumentItem = {
  id: string;
  document_type: string;
  title: string;
  description: string;
  status: string;
  review_status: string;
  status_label: string;
  status_color: string;
  uploaded_at: string | null;
  uploaded_at_label: string;
  file_name: string | null;
  mime_type: string | null;
  preview_url: string | null;
  file_url: string | null;
};

export type DriverDocumentsResponse = {
  driver: DriverDocumentsDriverInfo;
  summary: DriverDocumentsSummary;
  documents: DriverDocumentItem[];
};

export async function fetchAdminDriverDocuments(
  accessToken: string,
  driverId: string,
): Promise<DriverDocumentsResponse> {
  const res = await fetch(
    `${BACKEND_BASE_URL}/api/v1/admin/drivers/${encodeURIComponent(driverId)}/documents`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(extractErrorMessage(data, "Failed to load driver documents."));
  }
  return data as DriverDocumentsResponse;
}

// ── Update Document Status ────────────────────────────────────────────────────

export type UpdateDocumentStatusResponse = {
  document: DriverDocumentItem;
  summary: DriverDocumentsSummary;
};

export async function updateDocumentStatus(
  accessToken: string,
  driverId: string,
  documentId: string,
  newStatus: "approved" | "pending" | "rejected",
): Promise<UpdateDocumentStatusResponse> {
  const res = await fetch(
    `${BACKEND_BASE_URL}/api/v1/admin/drivers/${encodeURIComponent(driverId)}/documents/${encodeURIComponent(documentId)}/status`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: newStatus }),
    },
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(extractErrorMessage(data, "Failed to update document status."));
  }
  return data as UpdateDocumentStatusResponse;
}

// ── Create Admin Driver ───────────────────────────────────────────────────────

export type CreateDriverPayload = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  postal_code: string;
  car_type: "own_car" | "company_car";
  external_driver_id: string;
};

export type CreateDriverResponse = {
  id: string;
  auth_user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  postal_code: string | null;
  car_type: string;
  driver_type_label: string;
  status: string;
  status_label: string;
  status_color: string;
  external_driver_id: string | null;
  display_driver_id: string;
  profile_photo_url: string | null;
};

export async function adminCreateDriver(
  accessToken: string,
  payload: CreateDriverPayload,
): Promise<CreateDriverResponse> {
  const res = await fetch(`${BACKEND_BASE_URL}/api/v1/admin/drivers`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(extractErrorMessage(data, "Failed to create driver."));
  }
  return data as CreateDriverResponse;
}

// ── Create Warehouse User ─────────────────────────────────────────────────────

export type CreateWarehouseUserPayload = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  external_id: string;
};

export type CreateWarehouseUserResponse = {
  id: string;
  auth_user_id: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  external_id: string;
  role: string;
  status: string;
  status_label: string;
  status_color: string;
  // TODO: in production, email this password — do not return or display it
  temporary_password?: string;
};

export async function adminCreateWarehouseUser(
  accessToken: string,
  payload: CreateWarehouseUserPayload,
): Promise<CreateWarehouseUserResponse> {
  const res = await fetch(`${BACKEND_BASE_URL}/api/v1/admin/warehouse-users`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(extractErrorMessage(data, "Failed to create warehouse user."));
  }
  return data as CreateWarehouseUserResponse;
}

// ── Admin Warehouse Users ─────────────────────────────────────────────────────

export type WarehouseUserListItem = {
  id: string;
  auth_user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  external_id: string | null;
  display_external_id: string;
  status: string;
  status_label: "Active" | "Pending" | "Blocked";
  status_color: string;
  created_at: string | null;
};

export type WarehouseUsersListResponse = {
  items: WarehouseUserListItem[];
  total: number;
  status_counts: {
    all: number;
    active: number;
    pending: number;
    blocked: number;
  };
};

export async function fetchAdminWarehouseUsers(
  accessToken: string,
  params: { search?: string; status?: string; limit?: number; offset?: number } = {},
): Promise<WarehouseUsersListResponse> {
  const url = new URL(`${BACKEND_BASE_URL}/api/v1/admin/warehouse-users`);
  if (params.search) url.searchParams.set("search", params.search);
  if (params.status) url.searchParams.set("status", params.status);
  if (params.limit != null) url.searchParams.set("limit", String(params.limit));
  if (params.offset != null) url.searchParams.set("offset", String(params.offset));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(extractErrorMessage(data, "Failed to load warehouse users."));
  }
  return data as WarehouseUsersListResponse;
}

// ── Warehouse User Status & External ID ──────────────────────────────────────

export type ChangeWarehouseStatusResponse = {
  id: string;
  status: string;
  status_label: string;
  status_color: string;
  is_active: boolean;
};

export async function changeWarehouseUserStatus(
  accessToken: string,
  userId: string,
  newStatus: "active" | "pending" | "blocked",
): Promise<ChangeWarehouseStatusResponse> {
  const res = await fetch(
    `${BACKEND_BASE_URL}/api/v1/admin/warehouse-users/${userId}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ status: newStatus }),
    },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(extractErrorMessage(data, "Failed to change warehouse user status."));
  return data as ChangeWarehouseStatusResponse;
}

export type AssignWarehouseExternalIdResponse = {
  id: string;
  external_id: string;
  display_external_id: string;
};

export async function assignWarehouseExternalId(
  accessToken: string,
  userId: string,
  externalId: string,
): Promise<AssignWarehouseExternalIdResponse> {
  const res = await fetch(
    `${BACKEND_BASE_URL}/api/v1/admin/warehouse-users/${userId}/external-id`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ external_id: externalId }),
    },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(extractErrorMessage(data, "Failed to assign External ID."));
  return data as AssignWarehouseExternalIdResponse;
}

// ── Admin Dashboard ───────────────────────────────────────────────────────────

export type AdminDashboardSummary = {
  total_drivers: number;
  pending_verifications: number;
  active_drivers: number;
  driver_status: {
    active: number;
    pending: number;
    blocked: number;
  };
};

export async function fetchAdminDashboardSummary(
  accessToken: string,
): Promise<AdminDashboardSummary> {
  const res = await fetch(`${BACKEND_BASE_URL}/api/v1/admin/dashboard/summary`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(extractErrorMessage(data, "Failed to load dashboard summary."));
  }
  return data as AdminDashboardSummary;
}
