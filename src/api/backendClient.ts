// Backend base URL — update this to match your LAN IP when testing on a physical device
export const BACKEND_BASE_URL = "http://127.0.0.1:8000";
//export const BACKEND_BASE_URL = "http://192.168.2.129:8000";
type OwnCarDetails = {
  vehicle_make_model: string;
  plate_number: string;
  insurance_provider: string;
  insurance_number: string;
  vehicle_year: string;
};

type RegisterPayload = {
  email: string;
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
  const body: RegisterPayload = {
    email: payload.email,
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
