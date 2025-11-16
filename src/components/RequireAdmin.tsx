import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";

type Props = {
	children: ReactNode;
};

const RequireAdmin = ({ children }: Props) => {
	const location = useLocation();
	let isAdmin = false;
	try {
		const stored = localStorage.getItem("activeCollaborator");
		if (stored) {
			const parsed = JSON.parse(stored) as { role?: string };
			isAdmin = parsed.role === "socio";
		}
	} catch {
		isAdmin = false;
	}

	if (!isAdmin) {
		return <Navigate to="/" replace state={{ from: location }} />;
	}
	return <>{children}</>;
};

export default RequireAdmin;


