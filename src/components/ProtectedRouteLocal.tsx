/**
 * Componente para proteger rotas usando autenticação local (localStorage)
 * Similar ao RequireAdmin, mas para usuários autenticados (qualquer colaborador)
 */
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

const ProtectedRouteLocal = ({ children }: Props) => {
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
		// Ouvir mudanças no localStorage para manter o estado sincronizado
		const handleStorage = (e: StorageEvent) => {
			if (e.key === "activeCollaborator") {
				try {
					const stored = localStorage.getItem("activeCollaborator");
					setActiveCollaborator(stored ? (JSON.parse(stored) as ActiveCollaborator) : null);
				} catch (error) {
					console.error('Erro ao verificar colaborador ativo no storage event:', error);
					setActiveCollaborator(null);
				}
			}
		};

		window.addEventListener("storage", handleStorage);

		// Também verificar mudanças locais (mesma aba)
		const checkLocalStorage = () => {
			try {
				const stored = localStorage.getItem("activeCollaborator");
				setActiveCollaborator(stored ? (JSON.parse(stored) as ActiveCollaborator) : null);
			} catch (error) {
				console.error('Erro ao verificar colaborador ativo:', error);
				setActiveCollaborator(null);
			}
		};

		// Verificar periodicamente para pegar mudanças na mesma aba
		const interval = setInterval(checkLocalStorage, 1000);

		return () => {
			window.removeEventListener("storage", handleStorage);
			clearInterval(interval);
		};
	}, []);

	// Se não há colaborador logado, redireciona para login
	if (!activeCollaborator) {
		return <Navigate to="/auth" replace state={{ from: location }} />;
	}

	return <>{children}</>;
};

export default ProtectedRouteLocal;

