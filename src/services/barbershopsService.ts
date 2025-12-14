import { supabase } from '@/lib/supabase';

export interface Barbershop {
    id: string;
    name: string;
    rating: number;
    address: string;
    phone: string;
    hours: string;
    is_open: boolean;
    email: string;
    pix_key: string;
    status: 'disponivel' | 'indisponivel';
    data_pagamento?: string;
    data_vencimento?: string;
    owner_id?: string;
    created_at?: string;
    updated_at?: string;
}

export const barbershopsService = {
    async getAll(): Promise<Barbershop[]> {
        const { data, error } = await supabase
            .from('barbershops')
            .select('*')
            .order('name');

        if (error) throw error;
        return data || [];
    },

    async getById(id: string): Promise<Barbershop | null> {
        const { data, error } = await supabase
            .from('barbershops')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            throw error;
        }
        return data;
    },

    async create(barbershop: Omit<Barbershop, 'id' | 'created_at' | 'updated_at'>): Promise<Barbershop> {
        const { data, error } = await supabase
            .from('barbershops')
            .insert(barbershop)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: string, updates: Partial<Barbershop>): Promise<Barbershop> {
        const { data, error } = await supabase
            .from('barbershops')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('barbershops')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
