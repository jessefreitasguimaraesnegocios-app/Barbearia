import { Navigate, useLocation } from "react-router-dom";
import { ReactNode, useEffect, useState } from "react";

type Props = {
	children: ReactNode;
};

type ActiveCollaborator = {
	id: string;
	name: string;
	email: string;
	role: string;
	loggedAt?: string;
};

const RequireAdmin = ({ children }: Props) => {
	const location = useLocation();
	// Ler do localStorage imediatamente no estado inicial (igual ao Navbar)
	const [activeCollaborator, setActiveCollaborator] = useState<ActiveCollaborator | null>(() => {
		try {
			const stored = localStorage.getItem("activeCollaborator");
			return stored ? (JSON.parse(stored) as ActiveCollaborator) : null;
		} catch {
			return null;
		}
	});

	useEffect(() => {
		// Verificar colaborador ativo no localStorage (mesma lógica do Navbar)
		const checkAdmin = () => {
			try {
				const stored = localStorage.getItem("activeCollaborator");
				if (stored) {
					const parsed = JSON.parse(stored) as ActiveCollaborator;
					setActiveCollaborator(parsed);
				} else {
					setActiveCollaborator(null);
				}
			} catch (error) {
				console.error('Erro ao verificar colaborador ativo:', error);
				setActiveCollaborator(null);
			}
		};

		// Verificar imediatamente
		checkAdmin();

		// Ouvir mudanças no localStorage
		const handleStorage = (e: StorageEvent) => {
			if (e.key === "activeCollaborator") {
				checkAdmin();
			}
		};

		window.addEventListener("storage", handleStorage);

		return () => {
			window.removeEventListener("storage", handleStorage);
		};
	}, []);

	// Verificar se o colaborador tem role de admin (socio ou dono)
	const isAdmin = activeCollaborator && (
		activeCollaborator.role === "socio" ||
		activeCollaborator.role === "dono" ||
		activeCollaborator.role === "socio-barbeiro" ||
		activeCollaborator.role === "dono-barbeiro" ||
		activeCollaborator.role === "socio-investidor"
	);

	// Se não tem colaborador ativo ou não é admin, redirecionar para home (não para auth)
	if (!activeCollaborator || !isAdmin) {
		return <Navigate to="/" replace state={{ from: location }} />;
	}

	return <>{children}</>;
};

export default RequireAdmin;


