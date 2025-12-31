'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Users,
  Plus,
  Search,
  MoreHorizontal,
  UserCog,
  Shield,
  Mail,
  Phone,
  Calendar,
  Power,
  PowerOff,
  Key,
  Pencil,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminUsers, useUserOperations } from '@/hooks/admin/useAdminUsers';
import type { AdminUser } from '@/types/admin';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// Schema para crear usuario
const createUserSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  role: z.enum(['admin', 'funcionario']),
  phone: z.string().optional(),
});

// Schema para editar usuario
const editUserSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
  email: z.string().email('Email inválido'),
  role: z.enum(['admin', 'funcionario']),
  phone: z.string().optional(),
});

// Schema para cambiar contraseña
const changePasswordSchema = z.object({
  newPassword: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type CreateUserForm = z.infer<typeof createUserSchema>;
type EditUserForm = z.infer<typeof editUserSchema>;
type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  funcionario: 'Funcionario',
  cliente: 'Cliente',
};

const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  funcionario: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  cliente: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

export default function UsuariosPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('staff'); // 'all', 'staff', 'admin', 'funcionario'
  const [activeFilter, setActiveFilter] = useState<string>('all'); // 'all', 'active', 'inactive'

  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // Build filters - exclude 'cliente' by default when 'staff' is selected
  const filters = {
    page,
    limit: 10,
    search: search || undefined,
    role: roleFilter === 'staff' ? undefined : (roleFilter === 'all' ? undefined : roleFilter as any),
    active: activeFilter === 'all' ? undefined : activeFilter === 'active',
  };

  const { data, isLoading } = useAdminUsers(filters);
  const { create, isCreating, update, isUpdating, changePassword, isChangingPassword, deactivate, activate } = useUserOperations();

  // Filter out clients if 'staff' is selected (since backend doesn't have a 'staff' role)
  const users = data?.data?.filter((user: AdminUser) => {
    if (roleFilter === 'staff') {
      return user.role !== 'cliente';
    }
    return true;
  }) || [];
  const pagination = data?.pagination;

  // Forms
  const createForm = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'funcionario',
      phone: '',
    },
  });

  const editForm = useForm<EditUserForm>({
    resolver: zodResolver(editUserSchema),
  });

  const passwordForm = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const handleCreate = (data: CreateUserForm) => {
    // Add +56 prefix to phone if provided
    const phoneClean = data.phone ? data.phone.replace(/\s/g, '') : '';
    const userData = {
      ...data,
      phone: phoneClean ? `+56${phoneClean}` : undefined,
    };
    create(userData, {
      onSuccess: () => {
        setCreateDialogOpen(false);
        createForm.reset();
      },
    });
  };

  const handleEdit = (data: EditUserForm) => {
    if (!selectedUser) return;
    // Add +56 prefix to phone if provided
    const phoneClean = data.phone ? data.phone.replace(/\s/g, '') : '';
    const userData = {
      ...data,
      phone: phoneClean ? `+56${phoneClean}` : undefined,
    };
    update(
      { id: selectedUser.id, data: userData },
      {
        onSuccess: () => {
          setEditDialogOpen(false);
          setSelectedUser(null);
        },
      }
    );
  };

  const handleChangePassword = (data: ChangePasswordForm) => {
    if (!selectedUser) return;
    changePassword(
      { id: selectedUser.id, newPassword: data.newPassword },
      {
        onSuccess: () => {
          setPasswordDialogOpen(false);
          setSelectedUser(null);
          passwordForm.reset();
        },
      }
    );
  };

  // Helper to remove +56 prefix for display in form
  const getPhoneWithoutPrefix = (phone: string | undefined) => {
    if (!phone) return '';
    return phone.startsWith('+56') ? phone.slice(3) : phone;
  };

  const openEditDialog = (user: AdminUser) => {
    setSelectedUser(user);
    editForm.reset({
      name: user.name,
      email: user.email,
      role: user.role as 'admin' | 'funcionario',
      phone: getPhoneWithoutPrefix(user.phone),
    });
    setEditDialogOpen(true);
  };

  const openPasswordDialog = (user: AdminUser) => {
    setSelectedUser(user);
    passwordForm.reset();
    setPasswordDialogOpen(true);
  };

  const handleToggleActive = (user: AdminUser) => {
    if (user.active) {
      deactivate(user.id);
    } else {
      activate(user.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestiona administradores y funcionarios del sistema
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>

            {/* Role Filter */}
            <Select
              value={roleFilter}
              onValueChange={(value) => {
                setRoleFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">Solo Staff</SelectItem>
                <SelectItem value="admin">Administradores</SelectItem>
                <SelectItem value="funcionario">Funcionarios</SelectItem>
                <SelectItem value="all">Todos (incl. clientes)</SelectItem>
              </SelectContent>
            </Select>

            {/* Active Filter */}
            <Select
              value={activeFilter}
              onValueChange={(value) => {
                setActiveFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {(search || roleFilter !== 'staff' || activeFilter !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setRoleFilter('staff');
                  setActiveFilter('all');
                  setPage(1);
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Limpiar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Usuarios
            {pagination && (
              <span className="text-sm font-normal text-muted-foreground">
                ({pagination.total} total)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No se encontraron usuarios</p>
            </div>
          ) : (
            <>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Creado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user: AdminUser) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              {user.role === 'admin' ? (
                                <Shield className="h-5 w-5 text-primary" />
                              ) : (
                                <UserCog className="h-5 w-5 text-primary" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {user.email}
                                </span>
                                {user.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {user.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={roleColors[user.role] || roleColors.cliente}>
                            {roleLabels[user.role] || user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.active ? 'default' : 'secondary'}>
                            {user.active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {user.createdAt
                              ? formatDistanceToNow(new Date(user.createdAt), {
                                  addSuffix: true,
                                  locale: es,
                                })
                              : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {user.role !== 'cliente' && (
                                <>
                                  <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openPasswordDialog(user)}>
                                    <Key className="mr-2 h-4 w-4" />
                                    Cambiar contraseña
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleToggleActive(user)}
                                className={user.active ? 'text-destructive' : 'text-green-600'}
                              >
                                {user.active ? (
                                  <>
                                    <PowerOff className="mr-2 h-4 w-4" />
                                    Desactivar
                                  </>
                                ) : (
                                  <>
                                    <Power className="mr-2 h-4 w-4" />
                                    Activar
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                        .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 1)
                        .map((p, i, arr) => {
                          const prevPage = arr[i - 1];
                          const showEllipsis = prevPage && p - prevPage > 1;
                          return (
                            <div key={p} className="flex items-center">
                              {showEllipsis && (
                                <PaginationItem>
                                  <span className="px-4">...</span>
                                </PaginationItem>
                              )}
                              <PaginationItem>
                                <PaginationLink
                                  onClick={() => setPage(p)}
                                  isActive={page === p}
                                  className="cursor-pointer"
                                >
                                  {p}
                                </PaginationLink>
                              </PaginationItem>
                            </div>
                          );
                        })}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                          className={page === pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Usuario</DialogTitle>
            <DialogDescription>
              Agrega un nuevo administrador o funcionario al sistema
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Nombre completo</Label>
              <Input
                id="create-name"
                {...createForm.register('name')}
                className={createForm.formState.errors.name ? 'border-destructive' : ''}
              />
              {createForm.formState.errors.name && (
                <p className="text-sm text-destructive">{createForm.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                {...createForm.register('email')}
                className={createForm.formState.errors.email ? 'border-destructive' : ''}
              />
              {createForm.formState.errors.email && (
                <p className="text-sm text-destructive">{createForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-password">Contraseña</Label>
              <Input
                id="create-password"
                type="password"
                {...createForm.register('password')}
                className={createForm.formState.errors.password ? 'border-destructive' : ''}
              />
              {createForm.formState.errors.password && (
                <p className="text-sm text-destructive">{createForm.formState.errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-role">Rol</Label>
              <Select
                value={createForm.watch('role')}
                onValueChange={(value) => createForm.setValue('role', value as 'admin' | 'funcionario')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="funcionario">Funcionario</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-phone">Teléfono (opcional)</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                  +56
                </span>
                <Input
                  id="create-phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="9 1234 5678"
                  maxLength={11}
                  className="rounded-l-none"
                  {...createForm.register('phone')}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Creando...' : 'Crear Usuario'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica los datos del usuario
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre completo</Label>
              <Input
                id="edit-name"
                {...editForm.register('name')}
                className={editForm.formState.errors.name ? 'border-destructive' : ''}
              />
              {editForm.formState.errors.name && (
                <p className="text-sm text-destructive">{editForm.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                {...editForm.register('email')}
                className={editForm.formState.errors.email ? 'border-destructive' : ''}
              />
              {editForm.formState.errors.email && (
                <p className="text-sm text-destructive">{editForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-role">Rol</Label>
              <Select
                value={editForm.watch('role')}
                onValueChange={(value) => editForm.setValue('role', value as 'admin' | 'funcionario')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="funcionario">Funcionario</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">Teléfono (opcional)</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                  +56
                </span>
                <Input
                  id="edit-phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="9 1234 5678"
                  maxLength={11}
                  className="rounded-l-none"
                  {...editForm.register('phone')}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Contraseña</DialogTitle>
            <DialogDescription>
              Establece una nueva contraseña para {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={passwordForm.handleSubmit(handleChangePassword)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nueva contraseña</Label>
              <Input
                id="new-password"
                type="password"
                {...passwordForm.register('newPassword')}
                className={passwordForm.formState.errors.newPassword ? 'border-destructive' : ''}
              />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-sm text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar contraseña</Label>
              <Input
                id="confirm-password"
                type="password"
                {...passwordForm.register('confirmPassword')}
                className={passwordForm.formState.errors.confirmPassword ? 'border-destructive' : ''}
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPasswordDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isChangingPassword}>
                {isChangingPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
