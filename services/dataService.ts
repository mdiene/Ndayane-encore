import { supabase } from '../supabaseClient';
import { Owner, Truck, Driver, Delivery, Customer, Location } from '../types';

export const DataService = {
  // --- OWNERS ---
  getOwners: async (): Promise<Owner[]> => {
    const { data, error } = await supabase.from('truck_owners').select('*').order('owner_id', { ascending: false });
    if (error) { console.error('Error fetching owners:', JSON.stringify(error)); return []; }
    return data as Owner[];
  },
  addOwner: async (owner: Omit<Owner, 'owner_id'>) => {
    const { data, error } = await supabase.from('truck_owners').insert([owner]).select().single();
    if (error) throw error;
    return data;
  },
  updateOwner: async (id: number, updates: Partial<Owner>) => {
    const { data, error } = await supabase.from('truck_owners').update(updates).eq('owner_id', id).select().single();
    if (error) throw error;
    return data;
  },
  deleteOwner: async (id: number) => {
    const { error } = await supabase.from('truck_owners').delete().eq('owner_id', id);
    if (error) throw error;
    return true;
  },
  
  // --- TRUCKS ---
  getTrucks: async (): Promise<Truck[]> => {
    const { data, error } = await supabase.from('trucks').select(`*, truck_owners (owner_name)`);
    if (error) { console.error('Error fetching trucks:', JSON.stringify(error)); return []; }
    return data.map((t: any) => ({ ...t, owner_name: t.truck_owners?.owner_name })) as Truck[];
  },
  addTruck: async (truck: Omit<Truck, 'truck_id' | 'owner_name'>) => {
    const { data, error } = await supabase.from('trucks').insert([truck]).select().single();
    if (error) throw error;
    return data;
  },
  updateTruck: async (id: number, updates: Partial<Truck>) => {
    // Remove derived fields before sending to Supabase
    const { owner_name, ...cleanUpdates } = updates as any;
    const { data, error } = await supabase.from('trucks').update(cleanUpdates).eq('truck_id', id).select().single();
    if (error) throw error;
    return data;
  },
  deleteTruck: async (id: number) => {
    const { error } = await supabase.from('trucks').delete().eq('truck_id', id);
    if (error) throw error;
    return true;
  },
  
  // --- DRIVERS ---
  getDrivers: async (): Promise<Driver[]> => {
    const { data, error } = await supabase.from('drivers').select(`*, trucks (license_plate)`);
    if (error) { console.error('Error fetching drivers:', JSON.stringify(error)); return []; }
    return data.map((d: any) => ({ ...d, truck_plate: d.trucks?.license_plate })) as Driver[];
  },
  addDriver: async (driver: Omit<Driver, 'driver_id' | 'truck_plate'>) => {
    const { data, error } = await supabase.from('drivers').insert([driver]).select().single();
    if (error) throw error;
    return data;
  },
  updateDriver: async (id: number, updates: Partial<Driver>) => {
    const { truck_plate, ...cleanUpdates } = updates as any;
    const { data, error } = await supabase.from('drivers').update(cleanUpdates).eq('driver_id', id).select().single();
    if (error) throw error;
    return data;
  },
  deleteDriver: async (id: number) => {
    const { error } = await supabase.from('drivers').delete().eq('driver_id', id);
    if (error) throw error;
    return true;
  },
  
  // --- CUSTOMERS ---
  getCustomers: async (): Promise<Customer[]> => {
    const { data, error } = await supabase.from('customers').select('*').order('customer_id', { ascending: false });
    if (error) { console.error('Error fetching customers:', JSON.stringify(error)); return []; }
    return data as Customer[];
  },
  addCustomer: async (customer: Omit<Customer, 'customer_id'>) => {
    const { data, error } = await supabase.from('customers').insert([customer]).select().single();
    if (error) throw error;
    return data;
  },
  updateCustomer: async (id: number, updates: Partial<Customer>) => {
    const { data, error } = await supabase.from('customers').update(updates).eq('customer_id', id).select().single();
    if (error) throw error;
    return data;
  },
  deleteCustomer: async (id: number) => {
    const { error } = await supabase.from('customers').delete().eq('customer_id', id);
    if (error) throw error;
    return true;
  },

  // --- LOCATIONS ---
  getLocations: async (): Promise<Location[]> => {
    const { data, error } = await supabase.from('locations').select('*').order('location_id', { ascending: false });
    if (error) { console.error('Error fetching locations:', JSON.stringify(error)); return []; }
    return data as Location[];
  },
  addLocation: async (location: Omit<Location, 'location_id'>) => {
    const { data, error } = await supabase.from('locations').insert([location]).select().single();
    if (error) throw error;
    return data;
  },
  updateLocation: async (id: number, updates: Partial<Location>) => {
    const { data, error } = await supabase.from('locations').update(updates).eq('location_id', id).select().single();
    if (error) throw error;
    return data;
  },
  deleteLocation: async (id: number) => {
    const { error } = await supabase.from('locations').delete().eq('location_id', id);
    if (error) throw error;
    return true;
  },

  // --- DELIVERIES ---
  getDeliveries: async (): Promise<Delivery[]> => {
    // 1. Fetch Deliveries
    const { data: deliveries, error: deliveryError } = await supabase
      .from('deliveries')
      .select('*')
      .order('delivery_id', { ascending: false });

    if (deliveryError) {
      console.error('Error fetching deliveries:', JSON.stringify(deliveryError));
      return [];
    }
    
    if (!deliveries || deliveries.length === 0) return [];

    // 2. Fetch Trucks with Owners to resolve relationships
    const { data: trucks, error: truckError } = await supabase
      .from('trucks')
      .select(`truck_id, truck_owners (owner_id, owner_name)`);

    if (truckError) {
      console.error('Error fetching trucks for delivery join:', JSON.stringify(truckError));
      return deliveries as Delivery[];
    }

    const truckMap = new Map();
    trucks?.forEach((t: any) => truckMap.set(t.truck_id, t.truck_owners));

    return deliveries.map((d: any) => {
      const ownerInfo = truckMap.get(d.truck_id);
      return {
        ...d,
        owner_id: ownerInfo?.owner_id,
        owner_name: ownerInfo?.owner_name
      };
    }) as Delivery[];
  },

  addDelivery: async (delivery: Omit<Delivery, 'delivery_id' | 'owner_name' | 'owner_id'>) => {
    const { data, error } = await supabase.from('deliveries').insert([delivery]).select().single();
    if (error) throw error;
    return data;
  },

  updateDelivery: async (id: number, updates: Partial<Delivery>) => {
    // Remove helper fields
    const { owner_name, owner_id, ...cleanUpdates } = updates as any;
    const { data, error } = await supabase.from('deliveries').update(cleanUpdates).eq('delivery_id', id).select().single();
    if (error) throw error;
    return data;
  },

  deleteDelivery: async (id: number) => {
    const { error } = await supabase.from('deliveries').delete().eq('delivery_id', id);
    if (error) throw error;
    return true;
  }
};