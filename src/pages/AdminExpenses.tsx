import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, TrendingDown, TrendingUp, Plus, Trash2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

export type ExpenseType = "despesa" | "investimento";

export interface Expense {
  id: string;
  description: string;
  value: number;
  type: ExpenseType;
  date: string;
}

const STORAGE_KEY = "barberbook_admin_expenses";

const generateUUID = (): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;
};

const loadExpenses = (): Expense[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed.filter((exp: Expense) => 
        exp && 
        typeof exp.id === "string" &&
        typeof exp.description === "string" &&
        typeof exp.value === "number" &&
        (exp.type === "despesa" || exp.type === "investimento") &&
        typeof exp.date === "string"
      );
    }
    return [];
  } catch {
    return [];
  }
};

const saveExpenses = (expenses: Expense[]) => {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
};

const AdminExpenses = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [investments, setInvestments] = useState<Expense[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const allExpenses = loadExpenses();
    const now = new Date();
    setCurrentMonth(now);

    const startDate = startOfMonth(now);
    const endDate = endOfMonth(now);

    const monthExpenses = allExpenses.filter((exp) => {
      const expDate = parseISO(exp.date);
      return isWithinInterval(expDate, { start: startDate, end: endDate });
    });

    setExpenses(monthExpenses.filter((exp) => exp.type === "despesa"));
    setInvestments(monthExpenses.filter((exp) => exp.type === "investimento"));
  }, []);

  const addExpense = (type: ExpenseType) => {
    const today = new Date();
    const newExpense: Expense = {
      id: generateUUID(),
      description: "",
      value: 0,
      type,
      date: today.toISOString().split("T")[0],
    };

    const allExpenses = loadExpenses();
    allExpenses.push(newExpense);
    saveExpenses(allExpenses);

    if (type === "despesa") {
      setExpenses([...expenses, newExpense]);
    } else {
      setInvestments([...investments, newExpense]);
    }
  };

  const updateExpense = (id: string, field: keyof Expense, value: string | number) => {
    const allExpenses = loadExpenses();
    const updated = allExpenses.map((exp) =>
      exp.id === id ? { ...exp, [field]: value } : exp
    );
    saveExpenses(updated);

    const startDate = startOfMonth(currentMonth);
    const endDate = endOfMonth(currentMonth);

    const monthExpenses = updated.filter((exp) => {
      const expDate = parseISO(exp.date);
      return isWithinInterval(expDate, { start: startDate, end: endDate });
    });

    setExpenses(monthExpenses.filter((exp) => exp.type === "despesa"));
    setInvestments(monthExpenses.filter((exp) => exp.type === "investimento"));
  };

  const removeExpense = (id: string) => {
    const allExpenses = loadExpenses();
    const filtered = allExpenses.filter((exp) => exp.id !== id);
    saveExpenses(filtered);

    setExpenses(expenses.filter((exp) => exp.id !== id));
    setInvestments(investments.filter((exp) => exp.id !== id));

    toast({
      title: "Item removido",
      description: "O item foi removido com sucesso.",
    });
  };

  const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.value, 0);
  const totalInvestments = investments.reduce((sum, inv) => sum + inv.value, 0);
  const total = totalExpenses + totalInvestments;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center gap-3 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/financas")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-display font-bold">
                Despesas e <span className="text-primary">Investimentos</span>
              </h1>
              <p className="text-muted-foreground">
                {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="shadow-card border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-destructive" />
                  Despesas
                </CardTitle>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => addExpense("despesa")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {expenses.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhuma despesa registrada
                  </p>
                ) : (
                  expenses.map((expense) => (
                    <div key={expense.id} className="p-4 border border-border rounded-lg space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor={`desc-${expense.id}`} className="text-sm">Descrição</Label>
                            <Input
                              id={`desc-${expense.id}`}
                              value={expense.description}
                              onChange={(e) => updateExpense(expense.id, "description", e.target.value)}
                              placeholder="Descrição da despesa"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`value-${expense.id}`} className="text-sm">Valor (R$)</Label>
                            <Input
                              id={`value-${expense.id}`}
                              type="number"
                              step="0.01"
                              min="0"
                              value={expense.value || ""}
                              onChange={(e) => {
                                const numValue = parseFloat(e.target.value) || 0;
                                updateExpense(expense.id, "value", numValue);
                              }}
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeExpense(expense.id)}
                          className="text-destructive hover:text-destructive/80"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {expense.description && expense.value > 0 && (
                        <div className="pt-2 border-t border-border">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">Total</span>
                            <span className="text-lg font-bold text-destructive">
                              {currencyFormatter.format(expense.value)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
                {expenses.length > 0 && (
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-lg">Total de Despesas</span>
                      <span className="text-2xl font-bold text-destructive">
                        {currencyFormatter.format(totalExpenses)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-card border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Investimentos
                </CardTitle>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => addExpense("investimento")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {investments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhum investimento registrado
                  </p>
                ) : (
                  investments.map((investment) => (
                    <div key={investment.id} className="p-4 border border-border rounded-lg space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor={`inv-desc-${investment.id}`} className="text-sm">Descrição</Label>
                            <Input
                              id={`inv-desc-${investment.id}`}
                              value={investment.description}
                              onChange={(e) => updateExpense(investment.id, "description", e.target.value)}
                              placeholder="Descrição do investimento"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`inv-value-${investment.id}`} className="text-sm">Valor (R$)</Label>
                            <Input
                              id={`inv-value-${investment.id}`}
                              type="number"
                              step="0.01"
                              min="0"
                              value={investment.value || ""}
                              onChange={(e) => {
                                const numValue = parseFloat(e.target.value) || 0;
                                updateExpense(investment.id, "value", numValue);
                              }}
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeExpense(investment.id)}
                          className="text-destructive hover:text-destructive/80"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {investment.description && investment.value > 0 && (
                        <div className="pt-2 border-t border-border">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">Total</span>
                            <span className="text-lg font-bold text-green-500">
                              {currencyFormatter.format(investment.value)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
                {investments.length > 0 && (
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-lg">Total de Investimentos</span>
                      <span className="text-2xl font-bold text-green-500">
                        {currencyFormatter.format(totalInvestments)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Geral</p>
                  <p className="text-3xl font-bold text-primary">
                    {currencyFormatter.format(total)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Despesas: {currencyFormatter.format(totalExpenses)}</p>
                  <p className="text-sm text-muted-foreground">Investimentos: {currencyFormatter.format(totalInvestments)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminExpenses;

