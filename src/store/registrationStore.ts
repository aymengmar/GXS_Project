type OwnCarDetails = {
  vehicle_make_model: string;
  plate_number: string;
  insurance_provider: string;
  insurance_number: string;
  vehicle_year: string;
};

export type DocumentFile = {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
};

type RegistrationData = {
  email: string;
  postal_code: string;
  full_name: string;
  phone: string;
  car_type: "own_car" | "company_car";
  own_car_details?: OwnCarDetails;
  email_verified?: boolean;
  auth_user_id?: string;
  access_token?: string;
  driver_photo?: DocumentFile;
  identity_document?: DocumentFile;
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
  setVerified(data: { auth_user_id: string; access_token: string }) {
    if (_pending) {
      _pending = { ..._pending, email_verified: true, ...data };
    }
  },
  setIdDocuments(docs: { driver_photo: DocumentFile; identity_document: DocumentFile }) {
    if (_pending) {
      _pending = { ..._pending, ...docs };
    }
  },
  clear() {
    _pending = null;
  },
};
