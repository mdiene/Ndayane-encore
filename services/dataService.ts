import { supabase } from '../supabaseClient';
import { Owner, Truck, Driver, Delivery, Customer, Location } from '../types';

export const DataService = {
  // --- OWNERS ---
  getOwners: async (): Promise<Owner[]> => {
    const { data, error } = await supabase.from('truck_owners').select('*').order('owner_id', { ascending: false });
    if (error) { 
      console.error('Error fetching owners:', JSON.stringify(error)); 
      return []; 
    }
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
    if (error) { 
      console.error('Error fetching trucks:', JSON.stringify(error)); 
      return []; 
    }
    return data.map((t: any) => {
        // Handle array or object response from relationship
        const ownerName = Array.isArray(t.truck_owners) 
            ? t.truck_owners[0]?.owner_name 
            : t.truck_owners?.owner_name;
        return { ...t, owner_name: ownerName };
    }) as Truck[];
  },
  addTruck: async (truck: Omit<Truck, 'truck_id' | 'owner_name'>) => {
    // Clean potential joined fields if passed by mistake
    const { owner_name, truck_owners, ...cleanTruck } = truck as any;
    const { data, error } = await supabase.from('trucks').insert([cleanTruck]).select().single();
    if (error) throw error;
    return data;
  },
  updateTruck: async (id: number, updates: Partial<Truck>) => {
    // Remove derived fields and joined relationship objects before sending to Supabase
    const { owner_name, truck_owners, ...cleanUpdates } = updates as any;
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
    if (error) { 
      console.error('Error fetching drivers:', JSON.stringify(error)); 
      return []; 
    }
    return data.map((d: any) => {
        const plate = Array.isArray(d.trucks) 
            ? d.trucks[0]?.license_plate 
            : d.trucks?.license_plate;
        return { ...d, truck_plate: plate };
    }) as Driver[];
  },
  addDriver: async (driver: Omit<Driver, 'driver_id' | 'truck_plate'>) => {
    // Clean potentially joined fields
    const { truck_plate, trucks, ...cleanDriver } = driver as any;
    const { data, error } = await supabase.from('drivers').insert([cleanDriver]).select().single();
    if (error) throw error;
    return data;
  },
  updateDriver: async (id: number, updates: Partial<Driver>) => {
    // Remove joined 'trucks' object and 'truck_plate' helper
    const { truck_plate, trucks, ...cleanUpdates } = updates as any;
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
    if (error) { 
      console.error('Error fetching customers:', JSON.stringify(error)); 
      return []; 
    }
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
    if (error) { 
      console.error('Error fetching locations:', JSON.stringify(error)); 
      return []; 
    }
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
      // Return deliveries even if truck join fails, albeit without owner info
      return deliveries as Delivery[];
    }

    const truckMap = new Map();
    trucks?.forEach((t: any) => {
        // Handle array vs object response from Supabase relationship
        const owners = t.truck_owners;
        const owner = Array.isArray(owners) ? owners[0] : owners;
        truckMap.set(t.truck_id, owner);
    });

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
    const { owner_name, owner_id, ...cleanDelivery } = delivery as any;
    const payload = {
        ...cleanDelivery,
        cargo_weight_kg: delivery.cargo_weight_kg === 0 || delivery.cargo_weight_kg === null ? null : delivery.cargo_weight_kg,
        distance_km: delivery.distance_km === 0 || delivery.distance_km === null ? null : delivery.distance_km,
        cargo_description: delivery.cargo_description || null,
        delivery_location_id: delivery.delivery_location_id || null
    };

    const { data, error } = await supabase.from('deliveries').insert([payload]).select().single();
    if (error) throw error;
    return data;
  },

  updateDelivery: async (id: number, updates: Partial<Delivery>) => {
    const { owner_name, owner_id, ...cleanUpdates } = updates as any;
    
    // Clean numeric fields
    if (cleanUpdates.cargo_weight_kg === '' || cleanUpdates.cargo_weight_kg === 0) cleanUpdates.cargo_weight_kg = null;
    if (cleanUpdates.distance_km === '' || cleanUpdates.distance_km === 0) cleanUpdates.distance_km = null;
    
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