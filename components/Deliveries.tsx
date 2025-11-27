import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { Delivery, Truck, Driver, Customer } from '../types';
import { Badge, getStatusBadgeVariant } from './ui/Badge';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { MapPin, Calendar, Truck as TruckIcon, User, Package, Plus, Trash2, Edit, CheckCircle } from 'lucide-react';

export const Deliveries: React.FC = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  
  // State for Selection
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Delivery>>({
    delivery_status: 'Planifie',
    pickup_date: new Date().toISOString().slice(0, 16),
  });

  const [statusUpdateData, setStatusUpdateData] = useState({
    status: 'Planifie',
    actualDate: '',
    notes: ''
  });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    const [d, t, dr, c] = await Promise.all([
      DataService.getDeliveries(),
      DataService.getTrucks(),
      DataService.getDrivers(),
      DataService.getCustomers()
    ]);
    setDeliveries(d);
    setTrucks(t);
    setDrivers(dr);
    setCustomers(c);
  };

  // Grouping Logic
  const groupedDeliveries = deliveries.reduce((acc, delivery) => {
    const owner = delivery.owner_name || 'Inconnu';
    if (!acc[owner]) acc[owner] = [];
    acc[owner].push(delivery);
    return acc;
  }, {} as Record<string, Delivery[]>);

  // --- Actions ---

  const handleOpenAdd = () => {
    setFormData({
      delivery_status: 'Planifie',
      pickup_date: new Date().toISOString().slice(0, 16),
      expected_delivery_date: new Date().toISOString().slice(0, 16),
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (delivery: Delivery) => {
    setFormData({
      ...delivery,
      pickup_date: delivery.pickup_date ? new Date(delivery.pickup_date).toISOString().slice(0, 16) : '',
      expected_delivery_date: delivery.expected_delivery_date ? new Date(delivery.expected_delivery_date).toISOString().slice(0, 16) : '',
    });
    setIsFormModalOpen(true);
  };

  const handleTruckChange = (truckId: string) => {
    const truck = trucks.find(t => t.truck_id === Number(truckId));
    if (truck) {
      // Smart Logic: Auto-fill driver
      const driver = drivers.find(d => d.truck_id === truck.truck_id && d.status === 'active');
      setFormData(prev => ({
        ...prev,
        truck_id: truck.truck_id,
        driver_name: driver ? `${driver.first_name} ${driver.last_name}` : '',
        driver_license: driver ? driver.license_number : '',
        owner_id: truck.owner_id
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.truck_id || !formData.customer_name) return;

    try {
      const payload: any = {
        truck_id: Number(formData.truck_id),
        driver_name: formData.driver_name || 'Inconnu',
        driver_license: formData.driver_license || '',
        customer_name: formData.customer_name || '',
        pickup_location: formData.pickup_location || '',
        delivery_location: formData.delivery_location || '',
        pickup_date: formData.pickup_date || new Date().toISOString(),
        expected_delivery_date: formData.expected_delivery_date || new Date().toISOString(),
        cargo_description: formData.cargo_description || '',
        cargo_weight_kg: Number(formData.cargo_weight_kg) || 0,
        distance_km: Number(formData.distance_km) || 0,
        delivery_status: formData.delivery_status || 'Planifie',
        notes: formData.notes || ''
      };

      if (formData.delivery_id) {
        await DataService.updateDelivery(formData.delivery_id, payload);
      } else {
        await DataService.addDelivery(payload);
      }
      setIsFormModalOpen(false);
      refreshData();
    } catch (e) {
      alert("Erreur lors de l'enregistrement");
    }
  };

  const openStatusUpdate = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setStatusUpdateData({
      status: delivery.delivery_status,
      actualDate: delivery.actual_delivery_date ? new Date(delivery.actual_delivery_date).toISOString().slice(0, 16) : '',
      notes: delivery.notes || ''
    });
    setIsStatusModalOpen(true);
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDelivery) return;
    
    await DataService.updateDelivery(selectedDelivery.delivery_id, {
      delivery_status: statusUpdateData.status as any,
      actual_delivery_date: statusUpdateData.actualDate || null,
      notes: statusUpdateData.notes
    });

    setIsStatusModalOpen(false);
    refreshData();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette livraison ?')) {
      await DataService.deleteDelivery(id);
      refreshData();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-white">Suivi des Livraisons</h1>
        <Button onClick={handleOpenAdd}>
          <Plus size={18} className="mr-2" /> Nouvelle Livraison
        </Button>
      </div>

      <div className="space-y-8">
        {Object.entries(groupedDeliveries).map(([ownerName, items]) => {
          const totalWeight = items.reduce((acc, i) => acc + i.cargo_weight_kg, 0) / 1000;
          
          return (
            <div key={ownerName} className="space-y-4">
              {/* Group Header */}
              <div className="flex items-center gap-4 pl-2 border-l-4 border-blue-500 bg-slate-900/40 p-3 rounded-r-lg">
                <h2 className="text-lg font-bold text-white">{ownerName}</h2>
                <div className="flex gap-4 text-sm text-slate-400">
                  <span className="flex items-center gap-1"><Package size={14}/> {items.length} BL</span>
                  <span className="flex items-center gap-1"><TruckIcon size={14}/> {totalWeight.toFixed(1)} Tonnes</span>
                </div>
              </div>

              {/* Delivery Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {items.map(d => (
                  <div key={d.delivery_id} className="glass-panel p-5 rounded-xl border-l-4 border-l-transparent hover:border-l-blue-500 transition-all group">
                    {/* Card Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="cursor-pointer" onClick={() => handleOpenEdit(d)}>
                        <span className="text-xs text-slate-500 font-mono hover:text-blue-400">#{d.delivery_id} (Modifier)</span>
                        <h3 className="font-semibold text-white">{d.customer_name}</h3>
                      </div>
                      <Badge variant={getStatusBadgeVariant(d.delivery_status)}>{d.delivery_status}</Badge>
                    </div>

                    {/* Route Visual */}
                    <div className="flex items-center justify-between text-sm text-slate-300 bg-slate-800/50 p-3 rounded-lg mb-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-500">Départ</span>
                        <span className="font-medium truncate max-w-[80px]">{d.pickup_location.split(' ')[0]}</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center px-2">
                        <span className="text-[10px] text-slate-500">{d.distance_km} km</span>
                        <div className="w-full h-px bg-slate-600 relative">
                          <div className="absolute -right-1 -top-1 w-2 h-2 border-t border-r border-slate-600 rotate-45" />
                        </div>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-xs text-slate-500">Arrivée</span>
                        <span className="font-medium truncate max-w-[80px]">{d.delivery_location.split(' ')[0]}</span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 text-sm text-slate-400 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        <span>{new Date(d.pickup_date).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package size={14} />
                        <span>{(d.cargo_weight_kg / 1000).toFixed(1)} T - {d.cargo_description}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User size={14} />
                        <span className="truncate">{d.driver_name}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-4 border-t border-white/10 opacity-60 group-hover:opacity-100 transition-opacity">
                      <Button variant="secondary" size="sm" className="flex-1 text-xs" onClick={() => openStatusUpdate(d)}>
                        <CheckCircle size={12} className="mr-1" /> Statut
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs border border-white/10" onClick={() => handleOpenEdit(d)}>
                        <Edit size={12} />
                      </Button>
                      <Button variant="danger" size="sm" className="text-xs" onClick={() => handleDelete(d.delivery_id)}>
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* NEW/EDIT DELIVERY MODAL */}
      <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={formData.delivery_id ? "Modifier Livraison" : "Nouvelle Livraison"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Camion</label>
              <select 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.truck_id || ''}
                onChange={(e) => handleTruckChange(e.target.value)}
                required
              >
                <option value="">Sélectionner un camion</option>
                {trucks.filter(t => t.status !== 'maintenance').map(t => (
                  <option key={t.truck_id} value={t.truck_id}>{t.license_plate} - {t.truck_model}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Client</label>
              <select 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.customer_name || ''}
                onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                required
              >
                <option value="">Sélectionner un client</option>
                {customers.map(c => (
                  <option key={c.customer_id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-800/50 p-3 rounded-lg">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Chauffeur (Auto)</label>
              <input 
                type="text" 
                value={formData.driver_name || ''} 
                readOnly 
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-400 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Permis (Auto)</label>
              <input 
                type="text" 
                value={formData.driver_license || ''} 
                readOnly 
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Lieu d'enlèvement</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-2.5 text-slate-500" />
                <input 
                  type="text" 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.pickup_location || ''}
                  onChange={(e) => setFormData({...formData, pickup_location: e.target.value})}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Lieu de livraison</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-2.5 text-slate-500" />
                <input 
                  type="text" 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.delivery_location || ''}
                  onChange={(e) => setFormData({...formData, delivery_location: e.target.value})}
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Date d'enlèvement</label>
              <input 
                type="datetime-local" 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.pickup_date}
                onChange={(e) => setFormData({...formData, pickup_date: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Date livraison prévue</label>
              <input 
                type="datetime-local" 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.expected_delivery_date}
                onChange={(e) => setFormData({...formData, expected_delivery_date: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
             <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1">Description Fret</label>
              <input 
                type="text" 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ex: Matériaux de construction"
                value={formData.cargo_description || ''}
                onChange={(e) => setFormData({...formData, cargo_description: e.target.value})}
                required
              />
             </div>
             <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Poids (kg)</label>
              <input 
                type="number" 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.cargo_weight_kg || 0}
                onChange={(e) => setFormData({...formData, cargo_weight_kg: Number(e.target.value)})}
                required
              />
             </div>
          </div>
          
          <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Distance (km)</label>
              <input 
                type="number" 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.distance_km || 0}
                onChange={(e) => setFormData({...formData, distance_km: Number(e.target.value)})}
                required
              />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button type="button" variant="ghost" onClick={() => setIsFormModalOpen(false)}>Annuler</Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </Modal>

      {/* STATUS UPDATE MODAL */}
      <Modal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} title="Mise à jour Statut">
        <form onSubmit={handleStatusUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Nouveau Statut</label>
            <select 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={statusUpdateData.status}
              onChange={(e) => setStatusUpdateData({...statusUpdateData, status: e.target.value})}
            >
              <option value="Planifie">Planifié</option>
              <option value="en_transit">En Transit</option>
              <option value="decharge">Déchargé</option>
              <option value="Retarde">Retardé</option>
              <option value="annule">Annulé</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Date réelle livraison</label>
            <input 
              type="datetime-local" 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={statusUpdateData.actualDate}
              onChange={(e) => setStatusUpdateData({...statusUpdateData, actualDate: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Notes / Observations</label>
            <textarea 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none h-24"
              value={statusUpdateData.notes}
              onChange={(e) => setStatusUpdateData({...statusUpdateData, notes: e.target.value})}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button type="button" variant="ghost" onClick={() => setIsStatusModalOpen(false)}>Annuler</Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};