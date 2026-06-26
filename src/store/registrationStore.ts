type OwnCarDetails = {
  vehicle_make_model: string;
  plate_number: string;
  insurance_provider: string;
  insurance_number: string;
  vehicle_year: string;
};

type RegistrationData = {
  email: string;
  postal_code: string;
  full_name: string;
  phone: string;
  car_type: "own_car" | "company_car";
  own_car_details?: OwnCarDetails;
};

let _pending: RegistrationData | null = null;

export const registrationStore = {
  set(data: RegistrationData) {
    _pending = data;
  },
  get(): RegistrationData | null {
    return _pending;
  },
  setOwnCarDetails(details: OwnCarDetails) {
    if (_pending) {
      _pending = { ..._pending, own_car_details: details };
    }
  },
  clear() {
    _pending = null;
  },
};
