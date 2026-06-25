type RegistrationData = {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  car_type: "own_car" | "company_car";
};

let _pending: RegistrationData | null = null;

export const registrationStore = {
  set(data: RegistrationData) {
    _pending = data;
  },
  get(): RegistrationData | null {
    return _pending;
  },
  clear() {
    _pending = null;
  },
};
