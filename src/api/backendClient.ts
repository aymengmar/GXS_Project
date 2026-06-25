// Backend base URL — update this to match your LAN IP when testing on a physical device
export const BACKEND_BASE_URL = "http://localhost:8000";

type RegisterPayload = {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  car_type: "own_car" | "company_car";
};

type RegisterResponse = {
  message: string;
  status: string;
};

export async function registerDriver(payload: RegisterPayload): Promise<RegisterResponse> {
  const res = await fetch(`${BACKEND_BASE_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    // FastAPI validation errors come as { detail: [...] } or { detail: "string" }
    const detail = data?.detail;
    if (Array.isArray(detail)) {
      throw new Error(detail.map((e: { msg: string }) => e.msg).join(", "));
    }
    throw new Error(typeof detail === "string" ? detail : "Registration failed. Please try again.");
  }

  return data as RegisterResponse;
}
