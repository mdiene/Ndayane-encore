
import { supabase } from '../supabaseClient';
import { Owner, Truck, Driver, Delivery, Customer, Location, DeliveryDetail } from '../types';

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
  // Check if customers are used in deliveries to prevent deletion
  getUsedCustomerNames: async (): Promise<Set<string>> => {
    const { data, error } = await supabase.from('deliveries').select('customer_name');
    if (error) { 
      console.error('Error fetching used customers:', JSON.stringify(error)); 
      return new Set();
    }
    return new Set(data?.map((d: any) => d.customer_name) || []);
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
    // Map database columns to app type
    return data.map((l: any) => ({
      ...l,
      distance_km: l.location_distance // Map location_distance to distance_km
    })) as Location[];
  },
  addLocation: async (location: Omit<Location, 'location_id'>) => {
    // Map app type to database columns
    const payload = {
      name: location.name,
      address: location.address,
      location_type: location.location_type,
      location_distance: location.distance_km // Map distance_km to location_distance
    };
    const { data, error } = await supabase.from('locations').insert([payload]).select().single();
    if (error) throw error;
    return { ...data, distance_km: data.location_distance };
  },
  updateLocation: async (id: number, updates: Partial<Location>) => {
    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.address !== undefined) payload.address = updates.address;
    if (updates.location_type !== undefined) payload.location_type = updates.location_type;
    if (updates.distance_km !== undefined) payload.location_distance = updates.distance_km;

    const { data, error } = await supabase.from('locations').update(payload).eq('location_id', id).select().single();
    if (error) throw error;
    return { ...data, distance_km: data.location_distance };
  },
  deleteLocation: async (id: number) => {
    const { error } = await supabase.from('locations').delete().eq('location_id', id);
    if (error) throw error;
    return true;
  },

  // --- DELIVERIES ---
  getDeliveries: async (): Promise<Delivery[]> => {
    // 1. Fetch Deliveries and left join details including expense fields
    const { data: deliveries, error: deliveryError } = await supabase
      .from('deliveries')
      .select('*, detail_deliveries(id_detail_livraison, frais_de_route, frais_gazoil, frais_de_payage, charge_journaliere, frais_divers)')
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
      
      // Check if details exist and calculate total expenses
      const detailsArray = d.detail_deliveries;
      const hasDetails = Array.isArray(detailsArray) && detailsArray.length > 0;
      
      let totalExpenses = 0;
      if (hasDetails) {
        const details = detailsArray[0];
        totalExpenses = (details.frais_de_route || 0) + 
                        (details.frais_gazoil || 0) + 
                        (details.frais_de_payage || 0) + 
                        (details.charge_journaliere || 0) + 
                        (details.frais_divers || 0);
      }

      // Remove the detail_deliveries property from the object we return to avoid clutter
      const { detail_deliveries, ...deliveryData } = d;

      return {
        ...deliveryData,
        has_details: hasDetails,
        total_expenses: hasDetails ? totalExpenses : undefined,
        owner_id: ownerInfo?.owner_id,
        owner_name: ownerInfo?.owner_name
      };
    }) as Delivery[];
  },

  addDelivery: async (delivery: Omit<Delivery, 'delivery_id' | 'owner_name' | 'owner_id' | 'has_details' | 'total_expenses'>) => {
    const { owner_name, owner_id, has_details, total_expenses, ...cleanDelivery } = delivery as any;
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
    const { owner_name, owner_id, has_details, total_expenses, ...cleanUpdates } = updates as any;
    
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
  },

  // --- DELIVERY DETAILS (EXPENSES) ---
  getDeliveryDetail: async (deliveryId: number): Promise<DeliveryDetail | null> => {
    const { data, error } = await supabase
      .from('detail_deliveries')
      .select('*')
      .eq('delivery_id', deliveryId)
      .maybeSingle();
      
    if (error) {
      console.error('Error fetching delivery detail:', JSON.stringify(error));
      throw error;
    }
    return data as DeliveryDetail;
  },

  saveDeliveryDetail: async (detail: Partial<DeliveryDetail>) => {
    // If id exists, update; otherwise insert
    if (detail.id_detail_livraison) {
       const { data, error } = await supabase
         .from('detail_deliveries')
         .update(detail)
         .eq('id_detail_livraison', detail.id_detail_livraison)
         .select()
         .single();
       if (error) throw error;
       return data;
    } else {
       const { data, error } = await supabase
         .from('detail_deliveries')
         .insert([detail])
         .select()
         .single();
       if (error) throw error;
       return data;
    }
  }
};
