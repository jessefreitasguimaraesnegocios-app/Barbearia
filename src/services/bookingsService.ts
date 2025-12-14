import { supabase } from '@/lib/supabase';

export interface Booking {
    id: string;
    barbershop_id?: string;
    created_by?: string;
    customer_name?: string;
    customer_phone?: string;
    customer_cpf?: string;
    is_vip: boolean;
    vip_member_id?: string;
    metadata?: Record<string, any>;
    timestamp?: string;
}

export interface Appointment {
    id: string;
    booking_id?: string;
    service_id?: string;
    collaborator_id?: string;
    scheduled_at: string;
    duration?: string;
    client_name?: string;
    created_at?: string;
}

export interface BookingWithAppointments extends Booking {
    appointments?: Appointment[];
}

export const bookingsService = {
    async getAll(): Promise<Booking[]> {
        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .order('timestamp', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getById(id: string): Promise<BookingWithAppointments | null> {
        const { data, error } = await supabase
            .from('bookings')
            .select(`
        *,
        appointments (*)
      `)
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    },

    async getByCustomerCpf(cpf: string): Promise<Booking[]> {
        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('customer_cpf', cpf)
            .order('timestamp', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getUpcoming(): Promise<BookingWithAppointments[]> {
        const now = new Date().toISOString();

        const { data, error } = await supabase
            .from('bookings')
            .select(`
        *,
        appointments (*)
      `)
            .gte('timestamp', now)
            .order('timestamp', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async create(booking: Omit<Booking, 'id' | 'timestamp'>): Promise<Booking> {
        const { data, error } = await supabase
            .from('bookings')
            .insert(booking)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async createWithAppointments(
        booking: Omit<Booking, 'id' | 'timestamp'>,
        appointments: Omit<Appointment, 'id' | 'booking_id' | 'created_at'>[]
    ): Promise<BookingWithAppointments> {
        // Create booking first
        const { data: bookingData, error: bookingError } = await supabase
            .from('bookings')
            .insert(booking)
            .select()
            .single();

        if (bookingError) throw bookingError;

        // Create appointments with booking_id
        const appointmentsToInsert = appointments.map(apt => ({
            ...apt,
            booking_id: bookingData.id
        }));

        const { data: appointmentsData, error: appointmentsError } = await supabase
            .from('appointments')
            .insert(appointmentsToInsert)
            .select();

        if (appointmentsError) throw appointmentsError;

        return {
            ...bookingData,
            appointments: appointmentsData
        };
    },

    async update(id: string, updates: Partial<Booking>): Promise<Booking> {
        const { data, error } = await supabase
            .from('bookings')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('bookings')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
