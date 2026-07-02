import type { AdminLoginResponse, DriverLoginResponse } from "@/api/backendClient";

type AdminSession = {
  kind: "admin";
  access_token: string;
  refresh_token: string;
  user: AdminLoginResponse["user"];
};

type DriverSession = {
  kind: "driver";
  access_token: string;
  id: string;
  email: string;
  full_name: string;
  car_type: string;
  status: string;
  external_driver_id: string | null;
  must_change_password: boolean;
};

export type AppSession = AdminSession | DriverSession;

let _session: AppSession | null = null;

export const sessionStore = {
  setAdmin(response: AdminLoginResponse) {
    _session = {
      kind: "admin",
      access_token: response.access_token,
      refresh_token: response.refresh_token,
      user: response.user,
    };
  },
  setDriver(response: DriverLoginResponse) {
    _session = {
      kind: "driver",
      access_token: response.access_token,
      id: response.id,
      email: response.email,
      full_name: response.full_name,
      car_type: response.car_type,
      status: response.status,
      external_driver_id: response.external_driver_id,
      must_change_password: response.must_change_password ?? false,
    };
  },
  get(): AppSession | null {
    return _session;
  },
  clear() {
    _session = null;
  },
};
