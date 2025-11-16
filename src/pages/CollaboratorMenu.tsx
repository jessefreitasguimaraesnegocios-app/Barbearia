import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type ActiveCollaborator = {
	id: string;
	name: string;
	email: string;
	role: string;
};

type TimeClockRecord = {
	timestamp: string;
	type: "entrada" | "almoco-inicio" | "almoco-fim" | "saida";
};

const getActive = (): ActiveCollaborator | null => {
	try {
		const stored = localStorage.getItem("activeCollaborator");
		return stored ? JSON.parse(stored) : null;
	} catch {
		return null;
	}
};

const todayKey = () => {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const CollaboratorMenu = () => {
	const navigate = useNavigate();
	const [active, setActive] = useState<ActiveCollaborator | null>(() => getActive());
	const [records, setRecords] = useState<TimeClockRecord[]>([]);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [pendingType, setPendingType] = useState<TimeClockRecord["type"] | null>(null);

	const storageKey = useMemo(() => {
		return active ? `time_clock_${active.id}_${todayKey()}` : "";
	}, [active]);

	useEffect(() => {
		const onStorage = (e: StorageEvent) => {
			if (e.key === "activeCollaborator") {
				setActive(getActive());
			}
		};
		window.addEventListener("storage", onStorage);
		return () => window.removeEventListener("storage", onStorage);
	}, []);

	useEffect(() => {
		if (!storageKey) return;
		try {
			const raw = localStorage.getItem(storageKey);
			setRecords(raw ? (JSON.parse(raw) as TimeClockRecord[]) : []);
		} catch {
			setRecords([]);
		}
	}, [storageKey]);

	const appendRecord = (type: TimeClockRecord["type"]) => {
		if (!storageKey) return;
		const next = [...records, { timestamp: new Date().toISOString(), type }];
		setRecords(next);
		localStorage.setItem(storageKey, JSON.stringify(next));
	};

	const requestRecord = (type: TimeClockRecord["type"]) => {
		setPendingType(type);
		setConfirmOpen(true);
	};

	const confirmRecord = () => {
		if (pendingType) {
			appendRecord(pendingType);
		}
		setConfirmOpen(false);
		setPendingType(null);
	};

	const logout = () => {
		try {
			localStorage.removeItem("activeCollaborator");
		} finally {
			navigate("/");
		}
	};

	return (
		<div className="min-h-screen bg-background">
			<Navbar />
			<main className="pt-24 pb-20">
				<div className="container mx-auto px-4 grid gap-6 md:grid-cols-2">
					<Card className="shadow-card border-border">
						<CardHeader>
							<CardTitle>Perfil</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div><span className="text-muted-foreground">Nome:</span> <span className="font-medium">{active?.name ?? "-"}</span></div>
							<div><span className="text-muted-foreground">E-mail:</span> <span className="font-medium">{active?.email ?? "-"}</span></div>
							<div><span className="text-muted-foreground">Função:</span> <span className="font-medium">{active?.role ?? "-"}</span></div>
							<div className="pt-2">
								<AlertDialog>
									<AlertDialogTrigger asChild>
										<Button variant="destructive">Sair</Button>
									</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle>Deseja realmente sair?</AlertDialogTitle>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel>Cancelar</AlertDialogCancel>
											<AlertDialogAction onClick={logout}>Sair</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							</div>
						</CardContent>
					</Card>

					<Card className="shadow-card border-border">
						<CardHeader>
							<CardTitle>Registro de Ponto (Hoje)</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex flex-wrap gap-2">
								<Button variant="secondary" onClick={() => requestRecord("entrada")}>Registrar Entrada</Button>
								<Button variant="secondary" onClick={() => requestRecord("almoco-inicio")}>Início Almoço</Button>
								<Button variant="secondary" onClick={() => requestRecord("almoco-fim")}>Fim Almoço</Button>
								<Button variant="secondary" onClick={() => requestRecord("saida")}>Registrar Saída</Button>
							</div>
							<AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>
											{pendingType === "entrada" && "Confirmar registro de Entrada?"}
											{pendingType === "almoco-inicio" && "Confirmar Início do Almoço?"}
											{pendingType === "almoco-fim" && "Confirmar Fim do Almoço?"}
											{pendingType === "saida" && "Confirmar registro de Saída?"}
										</AlertDialogTitle>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>Cancelar</AlertDialogCancel>
										<AlertDialogAction onClick={confirmRecord}>Confirmar</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
							<ul className="space-y-2">
								{records.map((r, idx) => (
									<li key={idx} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
										<span className="capitalize">{r.type.replace("-", " ")}</span>
										<span className="text-muted-foreground">{new Date(r.timestamp).toLocaleTimeString()}</span>
									</li>
								))}
								{records.length === 0 && <div className="text-sm text-muted-foreground">Sem registros hoje.</div>}
							</ul>
						</CardContent>
					</Card>

					<Card className="md:col-span-2 shadow-card border-border">
						<CardHeader>
							<CardTitle>Fila de Clientes Agendados</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-sm text-muted-foreground">Em breve: integração com os agendamentos. Por enquanto, esta seção é um placeholder.</div>
						</CardContent>
					</Card>
				</div>
			</main>
		</div>
	);
};

export default CollaboratorMenu;


