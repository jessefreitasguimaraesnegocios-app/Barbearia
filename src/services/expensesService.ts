import { supabase } from '@/lib/supabase';

export interface Expense {
    id: string;
    barbershop_id?: string;
    description?: string;
    value: number;
    type: 'despesa' | 'investimento';
    date: string;
    created_at?: string;
    created_by?: string;
}

export const expensesService = {
    async getAll(): Promise<Expense[]> {
        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .order('date', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getById(id: string): Promise<Expense | null> {
        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    },

    async getByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getByType(type: 'despesa' | 'investimento'): Promise<Expense[]> {
        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .eq('type', type)
            .order('date', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getTotalByType(type: 'despesa' | 'investimento'): Promise<number> {
        const { data, error } = await supabase
            .from('expenses')
            .select('value')
            .eq('type', type);

        if (error) throw error;

        return data?.reduce((sum, expense) => sum + (expense.value || 0), 0) || 0;
    },

    async getMonthlyReport(month: number, year: number): Promise<{
        expenses: Expense[];
        totalDespesas: number;
        totalInvestimentos: number;
        total: number;
    }> {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];

        const expenses = await this.getByDateRange(startDate, endDate);

        const totalDespesas = expenses
            .filter(e => e.type === 'despesa')
            .reduce((sum, e) => sum + e.value, 0);

        const totalInvestimentos = expenses
            .filter(e => e.type === 'investimento')
            .reduce((sum, e) => sum + e.value, 0);

        return {
            expenses,
            totalDespesas,
            totalInvestimentos,
            total: totalDespesas + totalInvestimentos
        };
    },

    async create(expense: Omit<Expense, 'id' | 'created_at'>): Promise<Expense> {
        const { data, error } = await supabase
            .from('expenses')
            .insert(expense)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: string, updates: Partial<Expense>): Promise<Expense> {
        const { data, error } = await supabase
            .from('expenses')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
