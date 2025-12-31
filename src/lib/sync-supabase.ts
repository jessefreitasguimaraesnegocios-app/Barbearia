/**
 * Funções para sincronizar dados do Supabase com localStorage
 */

import { isSupabaseReady, supabase } from '@/integrations/supabase/client';
import { Barbershop } from '@/data/barbershops';
import { ServiceItem } from '@/data/services';
import { Collaborator } from '@/data/collaborators';
import { persistBarbershops } from './barbershops-storage';
import { persistServices } from './services-storage';
import { persistCollaborators } from './collaborators-storage';

/**
 * Converte dados do Supabase para o formato do app
 */
function convertBarbershopFromSupabase(db: any): Barbershop {
  return {
    id: db.id,
    name: db.name,
    rating: Number(db.rating) || 0,
    address: db.address || '',
    phone: db.phone || '',
    hours: db.hours || '',
    isOpen: db.is_open ?? true,
    email: db.email || '',
    pixKey: db.pix_key || '',
    status: db.status || 'disponivel',
    dataPagamento: db.data_pagamento || undefined,
    dataVencimento: db.data_vencimento || undefined,
  };
}

function convertServiceFromSupabase(db: any): ServiceItem {
  return {
    id: db.id,
    title: db.title,
    price: Number(db.price) || 0,
    duration: db.duration || '',
    description: db.description || '',
    features: Array.isArray(db.features) ? db.features : [],
    promotionScope: db.promotion_scope || 'none',
    discountPercentage: db.discount_percentage || null,
  };
}

function convertCollaboratorFromSupabase(db: any): Collaborator {
  return {
    id: db.id,
    name: db.name,
    phone: db.phone || '',
    email: db.email || '',
    cpf: db.cpf || '',
    password: db.password_hash || '',
    role: db.role,
    specialty: db.specialty || '',
    paymentMethod: db.payment_method || undefined,
    photoUrl: db.photo_url || undefined,
    experience: db.experience || undefined,
    workSchedule: db.work_schedule || undefined,
    chairRentalAmount: db.chair_rental_amount || undefined,
    salary: db.salary || undefined,
    percentagePercentage: db.percentage_percentage || undefined,
    pixKey: db.pix_key || '',
    createdAt: db.created_at || new Date().toISOString(),
  };
}

/**
 * Sincroniza barbearias do Supabase para localStorage
 */
export async function syncBarbershopsFromSupabase(): Promise<Barbershop[] | null> {
  if (!isSupabaseReady() || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('barbershops')
      .select('*')
      .order('name');

    if (error) {
      console.error('Erro ao buscar barbearias do Supabase:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    const barbershops = data.map(convertBarbershopFromSupabase);
    persistBarbershops(barbershops);
    return barbershops;
  } catch (error) {
    console.error('Erro ao sincronizar barbearias:', error);
    return null;
  }
}

/**
 * Sincroniza serviços do Supabase para localStorage
 */
export async function syncServicesFromSupabase(): Promise<ServiceItem[] | null> {
  if (!isSupabaseReady() || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('title');

    if (error) {
      console.error('Erro ao buscar serviços do Supabase:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    const services = data.map(convertServiceFromSupabase);
    persistServices(services);
    return services;
  } catch (error) {
    console.error('Erro ao sincronizar serviços:', error);
    return null;
  }
}

/**
 * Sincroniza colaboradores do Supabase para localStorage
 */
export async function syncCollaboratorsFromSupabase(): Promise<Collaborator[] | null> {
  if (!isSupabaseReady() || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('collaborators')
      .select('*')
      .order('name');

    if (error) {
      console.error('Erro ao buscar colaboradores do Supabase:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    const collaborators = data.map(convertCollaboratorFromSupabase);
    persistCollaborators(collaborators);
    return collaborators;
  } catch (error) {
    console.error('Erro ao sincronizar colaboradores:', error);
    return null;
  }
}

/**
 * Sincroniza todos os dados do Supabase
 */
export async function syncAllFromSupabase() {
  const results = await Promise.all([
    syncBarbershopsFromSupabase(),
    syncServicesFromSupabase(),
    syncCollaboratorsFromSupabase(),
  ]);

  return {
    barbershops: results[0],
    services: results[1],
    collaborators: results[2],
  };
}

