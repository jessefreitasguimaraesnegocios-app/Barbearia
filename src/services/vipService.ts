import { supabase } from '@/lib/supabase';

export interface VipMember {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    cpf?: string;
    billing_cycle: 'monthly' | 'annual';
    payment_status: 'paid' | 'pending' | 'overdue';
    joined_at?: string;
    expires_at?: string;
    barbershop_id?: string;
}

export const vipService = {
    async getAll(): Promise<VipMember[]> {
        const { data, error } = await supabase
            .from('vip_members')
            .select('*')
            .order('name');

        if (error) throw error;
        return data || [];
    },

    async getById(id: string): Promise<VipMember | null> {
        const { data, error } = await supabase
            .from('vip_members')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    },

    async findByCpf(cpf: string): Promise<VipMember | null> {
        // Use the SQL function for CPF search (removes formatting)
        const { data, error } = await supabase
            .rpc('find_vip_by_cpf', { search_cpf: cpf });

        if (error) throw error;
        return data && data.length > 0 ? data[0] : null;
    },

    async getByBarbershop(barbershopId: string): Promise<VipMember[]> {
        const { data, error } = await supabase
            .from('vip_members')
            .select('*')
            .eq('barbershop_id', barbershopId)
            .order('name');

        if (error) throw error;
        return data || [];
    },

    async create(vipMember: Omit<VipMember, 'id' | 'joined_at'>): Promise<VipMember> {
        const { data, error } = await supabase
            .from('vip_members')
            .insert(vipMember)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: string, updates: Partial<VipMember>): Promise<VipMember> {
        const { data, error } = await supabase
            .from('vip_members')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('vip_members')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async checkExpiration(id: string): Promise<boolean> {
        const member = await this.getById(id);
        if (!member || !member.expires_at) return false;

        const expirationDate = new Date(member.expires_at);
        const now = new Date();

        return expirationDate > now;
    },

    async renewMembership(id: string, billingCycle: 'monthly' | 'annual'): Promise<VipMember> {
        const now = new Date();
        const expiresAt = new Date(now);

        if (billingCycle === 'monthly') {
            expiresAt.setMonth(expiresAt.getMonth() + 1);
        } else {
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        }

        return this.update(id, {
            billing_cycle: billingCycle,
            payment_status: 'paid',
            expires_at: expiresAt.toISOString()
        });
    }
};
