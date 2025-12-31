import { supabase } from '@/integrations/supabase/client';

export interface Service {
    id: string;
    title: string;
    price: number;
    duration: string;
    description: string;
    features: string[];
    promotion_scope: 'all' | 'vip' | 'none';
    discount_percentage?: number | null;
}

export const servicesService = {
    async getAll(): Promise<Service[]> {
        const { data, error } = await supabase
            .from('services')
            .select('*')
            .order('title');

        if (error) throw error;
        return data || [];
    },

    async getById(id: string): Promise<Service | null> {
        const { data, error } = await supabase
            .from('services')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    },

    async create(service: Omit<Service, 'id'>): Promise<Service> {
        const { data, error } = await supabase
            .from('services')
            .insert(service)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: string, updates: Partial<Service>): Promise<Service> {
        const { data, error } = await supabase
            .from('services')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('services')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async getByPromotionScope(scope: 'all' | 'vip' | 'none'): Promise<Service[]> {
        const { data, error } = await supabase
            .from('services')
            .select('*')
            .eq('promotion_scope', scope)
            .order('price');

        if (error) throw error;
        return data || [];
    }
};
