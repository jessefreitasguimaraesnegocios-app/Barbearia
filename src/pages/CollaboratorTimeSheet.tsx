import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calendar, Clock, FileText } from "lucide-react";
import { loadCollaborators } from "@/lib/collaborators-storage";
import { Collaborator } from "@/data/collaborators";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

type TimeClockRecord = {
  timestamp: string;
  type: "entrada" | "almoco-inicio" | "almoco-fim" | "saida";
};

const dateKey = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const CollaboratorTimeSheet = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [collaborator, setCollaborator] = useState<Collaborator | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"));
  const [records, setRecords] = useState<Array<{ date: string; records: TimeClockRecord[] }>>([]);

  useEffect(() => {
    if (!id) {
      navigate("/admin/colaboradores");
      return;
    }

    const collaborators = loadCollaborators();
    const found = collaborators.find((c) => c.id === id);
    
    if (!found) {
      navigate("/admin/colaboradores");
      return;
    }
    
    setCollaborator(found);
  }, [id, navigate]);

  useEffect(() => {
    if (!collaborator) return;

    const [year, month] = selectedMonth.split("-").map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = endOfMonth(startDate);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const monthRecords: Array<{ date: string; records: TimeClockRecord[] }> = [];

    days.forEach((day) => {
      const key = `time_clock_${collaborator.id}_${dateKey(day)}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const dayRecords = JSON.parse(raw) as TimeClockRecord[];
          if (dayRecords.length > 0) {
            monthRecords.push({
              date: dateKey(day),
              records: dayRecords.sort((a, b) => 
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
              ),
            });
          }
        } catch {
          // Ignore invalid data
        }
      }
    });

    setRecords(monthRecords.sort((a, b) => b.date.localeCompare(a.date)));
  }, [collaborator, selectedMonth]);

  const getRecordTypeLabel = (type: TimeClockRecord["type"]): string => {
    switch (type) {
      case "entrada":
        return "Entrada";
      case "almoco-inicio":
        return "Início do Almoço";
      case "almoco-fim":
        return "Fim do Almoço";
      case "saida":
        return "Saída";
      default:
        return type;
    }
  };

  const getRecordTypeBadge = (type: TimeClockRecord["type"]) => {
    switch (type) {
      case "entrada":
        return <Badge variant="default" className="bg-green-500">Entrada</Badge>;
      case "almoco-inicio":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Início Almoço</Badge>;
      case "almoco-fim":
        return <Badge variant="outline" className="border-yellow-600 text-yellow-600">Fim Almoço</Badge>;
      case "saida":
        return <Badge variant="destructive">Saída</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const calculateWorkTime = (dayRecords: TimeClockRecord[]): string | null => {
    const entrada = dayRecords.find((r) => r.type === "entrada");
    const almocoInicio = dayRecords.find((r) => r.type === "almoco-inicio");
    const almocoFim = dayRecords.find((r) => r.type === "almoco-fim");
    const saida = dayRecords.find((r) => r.type === "saida");

    if (!entrada || !saida) return null;

    const entradaTime = new Date(entrada.timestamp).getTime();
    const saidaTime = new Date(saida.timestamp).getTime();
    
    let totalTime = saidaTime - entradaTime;

    if (almocoInicio && almocoFim) {
      const almocoInicioTime = new Date(almocoInicio.timestamp).getTime();
      const almocoFimTime = new Date(almocoFim.timestamp).getTime();
      const almocoTime = almocoFimTime - almocoInicioTime;
      totalTime -= almocoTime;
    }

    const hours = Math.floor(totalTime / (1000 * 60 * 60));
    const minutes = Math.floor((totalTime % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}min`;
  };

  const getAvailableMonths = () => {
    const months: string[] = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(format(date, "yyyy-MM"));
    }
    
    return months;
  };

  if (!collaborator) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center gap-3 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/colaboradores/${id}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-display font-bold">
                Folha de <span className="text-primary">Ponto</span>
              </h1>
              <p className="text-muted-foreground">
                {collaborator.name}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <Card className="shadow-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Período</p>
                      <p className="text-lg font-semibold">
                        {format(parseISO(`${selectedMonth}-01`), "MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableMonths().map((month) => (
                        <SelectItem key={month} value={month}>
                          {format(parseISO(`${month}-01`), "MMMM 'de' yyyy", { locale: ptBR })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {records.length === 0 ? (
            <Card className="shadow-card border-border">
              <CardContent className="p-12 text-center">
                <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold mb-2">Nenhum registro encontrado</p>
                <p className="text-muted-foreground">
                  Não há registros de ponto para o período selecionado.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {records.map(({ date, records: dayRecords }) => {
                const workTime = calculateWorkTime(dayRecords);
                const dateObj = parseISO(date);
                
                return (
                  <Card key={date} className="shadow-card border-border">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-primary" />
                          {format(dateObj, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </CardTitle>
                        {workTime && (
                          <Badge variant="outline" className="text-lg px-4 py-2">
                            <Clock className="h-4 w-4 mr-2" />
                            {workTime}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {dayRecords.map((record, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              {getRecordTypeBadge(record.type)}
                              <div>
                                <p className="font-semibold">{getRecordTypeLabel(record.type)}</p>
                                <p className="text-sm text-muted-foreground">
                                  {format(parseISO(record.timestamp), "HH:mm:ss", { locale: ptBR })}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">
                                {format(parseISO(record.timestamp), "dd/MM/yyyy", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CollaboratorTimeSheet;

