"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Copy,
  Plus,
  Search,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface StudentData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  lastLogin?: Date;
  enrollments: {
    id: string;
    status: string;
    enrolledAt: Date;
    subscriptionType: string;
    cohort: {
      id: string;
      name: string;
    };
  }[];
  billingInfo?: {
    nifCif: string;
    fiscalName: string;
    businessType: string;
  };
  paymentSummary: {
    totalPaid: number;
    pending: number;
  };
}

interface InvitationData {
  id: string;
  code: string;
  type: string;
  cohortId: string;
  cohort: {
    id: string;
    name: string;
  };
  email?: string;
  maxUses: number;
  usedCount: number;
  expiresAt?: Date;
  isActive: boolean;
  price?: number;
  installmentsOk: boolean;
  createdBy: string;
  createdAt: Date;
  creator: {
    firstName: string;
    lastName: string;
  };
}

interface Stats {
  totalStudents: number;
  active: number;
  pending: number;
  totalRevenue: number;
}

interface Cohort {
  id: string;
  name: string;
}

export default function AccesosPage() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [invitations, setInvitations] = useState<InvitationData[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCohort, setFilterCohort] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Expanded student states
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  // Modal states
  const [createLinkDialogOpen, setCreateLinkDialogOpen] = useState(false);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);

  // Form states
  const [linkForm, setLinkForm] = useState({
    type: "PAYMENT",
    cohortId: "",
    email: "",
    maxUses: "5",
    price: "",
    installmentsOk: false,
  });

  const [enrollForm, setEnrollForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    cohortId: "",
    subscriptionType: "NORMAL",
    paymentMethod: "",
  });

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/admin/accesos");

      if (!response.ok) {
        throw new Error("Failed to fetch access data");
      }

      const data = await response.json();
      setStudents(data.students);
      setInvitations(data.invitations);
      setStats(data.stats);

      // Extract unique cohorts from students and invitations
      const cohortSet = new Set<string>();
      data.students.forEach((s: StudentData) => {
        s.enrollments.forEach((e) => {
          cohortSet.add(JSON.stringify(e.cohort));
        });
      });
      data.invitations.forEach((i: InvitationData) => {
        cohortSet.add(JSON.stringify(i.cohort));
      });

      const uniqueCohorts = Array.from(cohortSet).map((c) => JSON.parse(c));
      setCohorts(uniqueCohorts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      toast.error("Failed to load access data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter students
  const filteredStudents = students.filter((student) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      student.firstName.toLowerCase().includes(query) ||
      student.lastName.toLowerCase().includes(query) ||
      student.email.toLowerCase().includes(query);

    let matchesCohort = true;
    if (filterCohort) {
      matchesCohort = student.enrollments.some((e) => e.cohortId === filterCohort);
    }

    let matchesStatus = true;
    if (filterStatus) {
      matchesStatus = student.enrollments.some((e) => e.status === filterStatus);
    }

    return matchesSearch && matchesCohort && matchesStatus;
  });

  // Handle create invitation
  const handleCreateLink = async () => {
    try {
      if (!linkForm.cohortId) {
        toast.error("Please select a cohort");
        return;
      }

      setIsCreatingLink(true);
      const response = await fetch("/api/admin/accesos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: linkForm.type,
          cohortId: linkForm.cohortId,
          email: linkForm.email || null,
          maxUses: parseInt(linkForm.maxUses),
          price: linkForm.type === "PAYMENT" ? parseFloat(linkForm.price) : null,
          installmentsOk: linkForm.installmentsOk,
          expiresAt: null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create invitation link");
      }

      toast.success("Invitation link created successfully");
      setCreateLinkDialogOpen(false);
      setLinkForm({
        type: "PAYMENT",
        cohortId: "",
        email: "",
        maxUses: "5",
        price: "",
        installmentsOk: false,
      });
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create link");
    } finally {
      setIsCreatingLink(false);
    }
  };

  // Handle enroll student
  const handleEnroll = async () => {
    try {
      if (!enrollForm.email || !enrollForm.firstName || !enrollForm.lastName || !enrollForm.cohortId) {
        toast.error("Please fill in all required fields");
        return;
      }

      setIsEnrolling(true);
      const response = await fetch("/api/admin/accesos/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enrollForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to enroll student");
      }

      toast.success("Student enrolled successfully");
      setEnrollDialogOpen(false);
      setEnrollForm({
        email: "",
        firstName: "",
        lastName: "",
        cohortId: "",
        subscriptionType: "NORMAL",
        paymentMethod: "",
      });
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to enroll student");
    } finally {
      setIsEnrolling(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  // Get initials for avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "PAUSED":
        return "bg-orange-100 text-orange-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Accesos</h1>
        <p className="text-muted-foreground mt-2">
          Administra estudiantes, enlaces de invitación y accesos
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Estudiantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Estudiantes Activos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.active}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pendientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.pending}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ingresos Totales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                €{stats.totalRevenue.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="alumnos" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="alumnos">Alumnos</TabsTrigger>
          <TabsTrigger value="enlaces">Enlaces</TabsTrigger>
          <TabsTrigger value="crear">Crear Acceso</TabsTrigger>
        </TabsList>

        {/* Tab 1: Alumnos */}
        <TabsContent value="alumnos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estudiantes</CardTitle>
              <CardDescription>
                Gestiona la información y estatus de los estudiantes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre o email..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <Select value={filterCohort} onValueChange={setFilterCohort}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por cohorte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas las cohortes</SelectItem>
                    {cohorts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por estatus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos los estatus</SelectItem>
                    <SelectItem value="ACTIVE">Activo</SelectItem>
                    <SelectItem value="PENDING">Pendiente</SelectItem>
                    <SelectItem value="PAUSED">Pausado</SelectItem>
                    <SelectItem value="CANCELLED">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Students List */}
              <div className="space-y-2">
                {filteredStudents.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    No se encontraron estudiantes
                  </div>
                ) : (
                  filteredStudents.map((student) => (
                    <div key={student.id} className="border rounded-lg">
                      {/* Main Row */}
                      <button
                        onClick={() =>
                          setExpandedStudent(
                            expandedStudent === student.id ? null : student.id
                          )
                        }
                        className="w-full text-left p-4 hover:bg-muted/50 transition-colors flex items-center gap-4"
                      >
                        {/* Avatar */}
                        <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-semibold text-sm">
                          {getInitials(student.firstName, student.lastName)}
                        </div>

                        {/* Info */}
                        <div className="flex-grow min-w-0">
                          <div className="font-semibold">
                            {student.firstName} {student.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground truncate">
                            {student.email}
                          </div>
                        </div>

                        {/* Cohort */}
                        {student.enrollments[0] && (
                          <div className="flex-shrink-0 text-sm">
                            {student.enrollments[0].cohort.name}
                          </div>
                        )}

                        {/* Status Badge */}
                        {student.enrollments[0] && (
                          <Badge
                            className={getStatusColor(
                              student.enrollments[0].status
                            )}
                          >
                            {student.enrollments[0].status}
                          </Badge>
                        )}

                        {/* Subscription Type */}
                        {student.enrollments[0] && (
                          <Badge variant="outline">
                            {student.enrollments[0].subscriptionType}
                          </Badge>
                        )}

                        {/* Payment Status */}
                        <div className="flex-shrink-0 text-sm">
                          <span className="font-medium">
                            €{student.paymentSummary.totalPaid.toFixed(2)}
                          </span>
                          {student.paymentSummary.pending > 0 && (
                            <span className="text-red-600 ml-2">
                              (€{student.paymentSummary.pending.toFixed(2)} pendiente)
                            </span>
                          )}
                        </div>

                        {/* Chevron */}
                        <div className="flex-shrink-0">
                          {expandedStudent === student.id ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </button>

                      {/* Expanded Details */}
                      {expandedStudent === student.id && (
                        <div className="border-t bg-muted/30 p-4 space-y-4">
                          {/* Billing Info */}
                          {student.billingInfo && (
                            <div className="space-y-2">
                              <h4 className="font-semibold text-sm">
                                Información Fiscal
                              </h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">
                                    NIF/CIF:
                                  </span>
                                  <div>{student.billingInfo.nifCif}</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    Nombre Fiscal:
                                  </span>
                                  <div>{student.billingInfo.fiscalName}</div>
                                </div>
                                <div className="col-span-2">
                                  <span className="text-muted-foreground">
                                    Tipo de Negocio:
                                  </span>
                                  <div>{student.billingInfo.businessType}</div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Enrollment Info */}
                          <div className="space-y-2">
                            <h4 className="font-semibold text-sm">
                              Información de Matrícula
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">
                                  Inscrito:
                                </span>
                                <div>
                                  {new Date(
                                    student.enrollments[0].enrolledAt
                                  ).toLocaleDateString("es-ES")}
                                </div>
                              </div>
                              {student.lastLogin && (
                                <div>
                                  <span className="text-muted-foreground">
                                    Último acceso:
                                  </span>
                                  <div>
                                    {new Date(student.lastLogin).toLocaleDateString(
                                      "es-ES"
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 pt-2">
                            <Button size="sm" variant="outline">
                              Activar
                            </Button>
                            <Button size="sm" variant="outline">
                              Pausar
                            </Button>
                            <Button size="sm" variant="outline" className="text-destructive">
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Enlaces */}
        <TabsContent value="enlaces" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Enlaces de Invitación</CardTitle>
                <CardDescription>
                  Crea y gestiona enlaces para que los estudiantes se registren
                </CardDescription>
              </div>
              <Dialog open={createLinkDialogOpen} onOpenChange={setCreateLinkDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Enlace
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Crear Nuevo Enlace de Invitación</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Tipo
                      </label>
                      <Select
                        value={linkForm.type}
                        onValueChange={(value) =>
                          setLinkForm({ ...linkForm, type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FREE">Gratuito</SelectItem>
                          <SelectItem value="PAYMENT">De Pago</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Cohorte
                      </label>
                      <Select
                        value={linkForm.cohortId}
                        onValueChange={(value) =>
                          setLinkForm({ ...linkForm, cohortId: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una cohorte" />
                        </SelectTrigger>
                        <SelectContent>
                          {cohorts.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Email (opcional)
                      </label>
                      <Input
                        type="email"
                        placeholder="usuario@ejemplo.com"
                        value={linkForm.email}
                        onChange={(e) =>
                          setLinkForm({ ...linkForm, email: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Máximo de Usos
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={linkForm.maxUses}
                        onChange={(e) =>
                          setLinkForm({ ...linkForm, maxUses: e.target.value })
                        }
                      />
                    </div>

                    {linkForm.type === "PAYMENT" && (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Precio (€)
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={linkForm.price}
                          onChange={(e) =>
                            setLinkForm({ ...linkForm, price: e.target.value })
                          }
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="installments"
                        checked={linkForm.installmentsOk}
                        onChange={(e) =>
                          setLinkForm({
                            ...linkForm,
                            installmentsOk: e.target.checked,
                          })
                        }
                      />
                      <label htmlFor="installments" className="text-sm font-medium">
                        Permitir pagos en cuotas
                      </label>
                    </div>

                    <Button
                      onClick={handleCreateLink}
                      disabled={isCreatingLink}
                      className="w-full"
                    >
                      {isCreatingLink && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      Crear Enlace
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {invitations.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    No hay enlaces de invitación aún
                  </div>
                ) : (
                  invitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="border rounded-lg p-4 flex items-center justify-between gap-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-grow min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                            {inv.code}
                          </code>
                          <Badge
                            className={inv.type === "PAYMENT" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}
                          >
                            {inv.type === "PAYMENT" ? "De Pago" : "Gratuito"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {inv.cohort.name}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Usos: {inv.usedCount}/{inv.maxUses}
                          {inv.price && ` • €${inv.price.toFixed(2)}`}
                          {inv.expiresAt && ` • Expira: ${new Date(inv.expiresAt).toLocaleDateString("es-ES")}`}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            copyToClipboard(
                              `${window.location.origin}/register?code=${inv.code}`
                            )
                          }
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Badge
                          variant="outline"
                          className={
                            inv.isActive ? "bg-green-50" : "bg-red-50"
                          }
                        >
                          {inv.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Crear Acceso */}
        <TabsContent value="crear" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Crear Acceso Manual</CardTitle>
              <CardDescription>
                Registra un nuevo estudiante manualmente en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-2xl space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email *
                    </label>
                    <Input
                      type="email"
                      placeholder="usuario@ejemplo.com"
                      value={enrollForm.email}
                      onChange={(e) =>
                        setEnrollForm({
                          ...enrollForm,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Nombre *
                    </label>
                    <Input
                      placeholder="Juan"
                      value={enrollForm.firstName}
                      onChange={(e) =>
                        setEnrollForm({
                          ...enrollForm,
                          firstName: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Apellido *
                    </label>
                    <Input
                      placeholder="Pérez"
                      value={enrollForm.lastName}
                      onChange={(e) =>
                        setEnrollForm({
                          ...enrollForm,
                          lastName: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Cohorte *
                    </label>
                    <Select
                      value={enrollForm.cohortId}
                      onValueChange={(value) =>
                        setEnrollForm({
                          ...enrollForm,
                          cohortId: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una cohorte" />
                      </SelectTrigger>
                      <SelectContent>
                        {cohorts.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Tipo de Suscripción *
                    </label>
                    <Select
                      value={enrollForm.subscriptionType}
                      onValueChange={(value) =>
                        setEnrollForm({
                          ...enrollForm,
                          subscriptionType: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BECA">Beca</SelectItem>
                        <SelectItem value="NORMAL">Normal</SelectItem>
                        <SelectItem value="INVITACION">Invitación</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Método de Pago
                    </label>
                    <Input
                      placeholder="Ej: Tarjeta, Transferencia"
                      value={enrollForm.paymentMethod}
                      onChange={(e) =>
                        setEnrollForm({
                          ...enrollForm,
                          paymentMethod: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <Button
                  onClick={handleEnroll}
                  disabled={isEnrolling}
                  className="w-full"
                  size="lg"
                >
                  {isEnrolling && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Crear Estudiante
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
