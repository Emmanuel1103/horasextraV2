import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { User, UserRole } from "@/types";
import { getAllUsers, updateUserRole } from "@/services/usersService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

export const UsersConfigTab = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [showAdminsOnly, setShowAdminsOnly] = useState(false);
    const { user: currentUser } = useAuth();

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await getAllUsers();
            setUsers(data);
        } catch (error) {
            toast.error("Error al cargar usuarios");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        try {
            const updatedUser = await updateUserRole(userId, newRole);
            setUsers(users.map(u => u.id === userId ? updatedUser : u));
            toast.success(`Rol de ${updatedUser.name} actualizado a ${newRole}`);
        } catch (error) {
            toast.error("Error al actualizar el rol");
        }
    };

    // Filter logic
    const filteredUsers = users.filter(user => {
        const matchesSearch = searchTerm.trim() === "" ||
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole = showAdminsOnly ? user.role === "NOMINA" : true;

        return matchesSearch && matchesRole;
    });

    const shouldShowTable = searchTerm.trim() !== "" || showAdminsOnly;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Gestión de usuarios
                </CardTitle>
                <CardDescription>
                    Administra los usuarios y sus roles. Los usuarios acceden con su cuenta corporativa.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Search and Filters Bar */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Buscar por nombre o correo..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <Button
                            variant={showAdminsOnly ? "default" : "outline"}
                            onClick={() => setShowAdminsOnly(!showAdminsOnly)}
                            className={showAdminsOnly ? "bg-green-700 hover:bg-green-800" : ""}
                        >
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Administrador
                        </Button>
                        <Button variant="outline" size="icon" onClick={loadUsers} disabled={loading} title="Actualizar lista">
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>

                <div className="border rounded-lg overflow-hidden flex flex-col">
                    <div className="grid grid-cols-12 bg-muted/50 p-3 text-sm font-semibold border-b text-center items-center">
                        <div className="col-span-4">Usuario</div>
                        <div className="col-span-4">Email</div>
                        <div className="col-span-4">Rol</div>
                    </div>

                    {!shouldShowTable ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground min-h-[300px]">
                            <Search className="h-12 w-12 text-gray-200 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-1">Buscar usuarios</h3>
                            <p className="max-w-sm text-sm">
                                Ingresa el nombre o correo del usuario en el buscador, o filtra por administradores para ver los resultados.
                            </p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground min-h-[300px]">
                            <Users className="h-12 w-12 text-gray-200 mb-4" />
                            <p>No se encontraron usuarios que coincidan con la búsqueda.</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {filteredUsers.map((u) => (
                                <div key={u.id} className="grid grid-cols-12 p-3 text-sm items-center hover:bg-muted/20 transition-colors">
                                    <div className="col-span-4 font-medium flex flex-col items-center text-center">
                                        <span className="truncate w-full">{u.name}</span>
                                        {u.id === currentUser?.id && (
                                            <Badge variant="outline" className="text-[10px] mt-1 h-5 bg-blue-50 text-blue-700 border-blue-200">Tú</Badge>
                                        )}
                                    </div>
                                    <div className="col-span-4 text-muted-foreground truncate text-center px-2" title={u.email}>
                                        {u.email}
                                    </div>
                                    <div className="col-span-4 flex flex-col items-center justify-center gap-2">
                                        <div className="flex items-center gap-2">
                                            <Select
                                                value={u.role}
                                                onValueChange={(val) => handleRoleChange(u.id, val as UserRole)}
                                                disabled={u.id === currentUser?.id}
                                            >
                                                <SelectTrigger className="h-8 w-[140px] text-center justify-center">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="COLABORADOR">Colaborador</SelectItem>
                                                    <SelectItem value="NOMINA">Nómina</SelectItem>
                                                </SelectContent>
                                            </Select>

                                        </div>
                                        {u.role === "NOMINA" && (
                                            <Badge className="bg-green-600 hover:bg-green-700 text-[10px] h-5">
                                                Admin
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-green-50 p-3 rounded-md border border-green-100 text-xs text-green-800">
                    <p className="font-semibold mb-1">Roles de usuario:</p>
                    <ul className="list-disc pl-4 space-y-1">
                        <li><strong>Colaborador:</strong> Solo puede reportar horas extras.</li>
                        <li><strong>Nómina (Admin):</strong> Tiene acceso total a configuración y gestión de horas extras.</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
};
