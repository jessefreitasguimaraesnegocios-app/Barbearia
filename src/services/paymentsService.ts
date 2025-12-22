import { supabase } from '@/lib/supabase';

export interface Payment {
    id: string;
    booking_id?: string;
    amount: number;
    currency: string;
    method: string;
    status: string;
    tx_id?: string;
    receipt_path?: string;
    created_at?: string;
}

export const paymentsService = {
    async getAll(): Promise<Payment[]> {
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getById(id: string): Promise<Payment | null> {
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    },

    async getByBooking(bookingId: string): Promise<Payment[]> {
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('booking_id', bookingId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async create(payment: Omit<Payment, 'id' | 'created_at'>): Promise<Payment> {
        const { data, error } = await supabase
            .from('payments')
            .insert(payment)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateStatus(id: string, status: string): Promise<Payment> {
        const { data, error } = await supabase
            .from('payments')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async uploadReceipt(id: string, file: File): Promise<Payment> {
        const fileName = `${id}-${Date.now()}.${file.name.split('.').pop()}`;
        const filePath = `receipts/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('receipts')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Update payment with receipt path
        const { data, error } = await supabase
            .from('payments')
            .update({ receipt_path: filePath })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: string, updates: Partial<Payment>): Promise<Payment> {
        const { data, error } = await supabase
            .from('payments')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('payments')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
