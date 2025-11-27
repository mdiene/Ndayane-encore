export type OwnerType = 'Individuel' | 'Entreprise';
export type TruckType = 'Semi remorque' | '10 roues' | '12 roues' | 'plateau';
export type TruckStatus = 'active' | 'en_transit' | 'maintenance' | 'demobilise';
export type DeliveryStatus = 'Planifie' | 'en_transit' | 'decharge' | 'Retarde' | 'annule';
export type DriverStatus = 'active' | 'inactive' | 'on_leave';

export interface Owner {
  owner_id: number;
  owner_name: string;
  owner_type: OwnerType;
  phone_number: string;
  email: string;
  address: string;
  tax_id: string;
  created_at?: string;
}

export interface Truck {
  truck_id: number;
  owner_id: number;
  license_plate: string;
  truck_model: string;
  truck_type: TruckType;
  capacity_kg: number;
  status: TruckStatus;
  manufacture_year: number;
  insurance_expiry: string;
  last_service_date: string;
  owner_name?: string; // Joined field
}

export interface Driver {
  driver_id: number;
  first_name: string;
  last_name: string;
  license_number: string;
  phone_number: string;
  email: string;
  status: DriverStatus;
  truck_id?: number | null;
  truck_plate?: string; // Joined field
}

export interface Customer {
  customer_id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface Location {
  location_id: number;
  name: string;
  address: string;
  location_type: string;
  pickup_location?: string;
  delivery_location?: string;
  distance_km: number;
}

export interface Delivery {
  delivery_id: number;
  truck_id: number;
  owner_id?: number; // Helper for grouping
  owner_name?: string; // Helper for grouping
  driver_name: string;
  driver_license: string;
  customer_name: string;
  pickup_location: string;
  delivery_location: string;
  pickup_date: string;
  expected_delivery_date: string;
  actual_delivery_date?: string | null;
  cargo_description: string;
  cargo_weight_kg: number;
  distance_km: number;
  delivery_status: DeliveryStatus;
  notes: string;
}
