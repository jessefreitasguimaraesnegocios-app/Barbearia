import { supabase } from '@/lib/supabase';

export type CollaboratorRole =
    | 'barbeiro'
    | 'barbeiro-junior'
    | 'faxineira'
    | 'socio'
    | 'atendente'
    | 'socio-barbeiro'
    | 'dono-barbeiro'
    | 'dono'
    | 'socio-investidor';

export type PaymentMethod =
    | 'salario-fixo'
    | 'aluguel-cadeira-100'
    | 'aluguel-cadeira-50'
    | 'recebe-100-por-cliente'
    | 'recebe-50-por-cliente'
    | 'porcentagem';

export interface Collaborator {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    cpf?: string;
    password_hash?: string;
    role: CollaboratorRole;
    specialty?: string;
    payment_method?: PaymentMethod;
    photo_url?: string;
    experience?: string;
    work_schedule?: string;
    chair_rental_amount?: number;
    salary?: number;
    percentage_percentage?: number;
    pix_key?: string;
    created_at?: string;
    barbershop_id?: string;
}

export const collaboratorsService = {
    async getAll(): Promise<Collaborator[]> {
        const { data, error } = await supabase
            .from('collaborators')
            .select('*')
            .order('name');

        if (error) throw error;
        return data || [];
    },

    async getById(id: string): Promise<Collaborator | null> {
        const { data, error } = await supabase
            .from('collaborators')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    },

    async getByBarbershop(barbershopId: string): Promise<Collaborator[]> {
        const { data, error } = await supabase
            .from('collaborators')
            .select('*')
            .eq('barbershop_id', barbershopId)
            .order('name');

        if (error) throw error;
        return data || [];
    },

    async getByRole(role: CollaboratorRole): Promise<Collaborator[]> {
        const { data, error } = await supabase
            .from('collaborators')
            .select('*')
            .eq('role', role)
            .order('name');

        if (error) throw error;
        return data || [];
    },

    async create(collaborator: Omit<Collaborator, 'id' | 'created_at'>): Promise<Collaborator> {
        const { data, error } = await supabase
            .from('collaborators')
            .insert(collaborator)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: string, updates: Partial<Collaborator>): Promise<Collaborator> {
        const { data, error } = await supabase
            .from('collaborators')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('collaborators')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async updateWorkSchedule(id: string, schedule: string): Promise<Collaborator> {
        return this.update(id, { work_schedule: schedule });
    }
};
