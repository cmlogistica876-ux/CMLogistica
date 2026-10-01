/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { DbService } from "./services/db";
import { User, UserRole, UserStatus, RouteStatus } from "./types";

// Components
import Dashboard from "./components/Dashboard";
import MapView from "./components/MapView";
import DriverView from "./components/DriverView";
import ReportsView from "./components/ReportsView";
import AuditLogsView from "./components/AuditLogsView";
import UsersList from "./components/UsersList";
import DriversList from "./components/DriversList";
import VehiclesList from "./components/VehiclesList";
import ClientsList from "./components/ClientsList";
import DeliveriesList from "./components/DeliveriesList";
import RoutesList from "./components/RoutesList";
import DeliveryDetail from "./components/DeliveryDetail";
import TickerTape from "./components/TickerTape";
import LoginView from "./components/LoginView";
import ForcePasswordChangeView from "./components/ForcePasswordChangeView";

// Icons
import {
  Truck,
  LayoutDashboard,
  MapPin,
  Package,
  Navigation,
  Award,
  Building,
  Users,
  BarChart3,
  ShieldCheck,
  Smartphone,
  CheckCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  LogOut,
  FileText,
  Flame
} from "lucide-react";
import FirebaseStatusModal from "./components/FirebaseStatusModal";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);
  const [showFirebaseModal, setShowFirebaseModal] = useState<boolean>(false);

  // Role simulator states
  const [simulatedRole, setSimulatedRole] = useState<UserRole>(() => {
    const user = DbService.getCurrentUser();
    return user ? user.role : UserRole.SuperAdmin;
  });

  // Stats for the top quick status strip
  const [totalDeliveries, setTotalDeliveries] = useState<number>(0);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [failedCount, setFailedCount] = useState<number>(0);
  const [activeRoutes, setActiveRoutes] = useState<number>(0);

  const loadData = () => {
    const user = DbService.getCurrentUser();
    setCurrentUser(user);
    if (user) {
      setSimulatedRole(user.role);
    }

    // Compute stats
    const dels = DbService.getDeliveries();
    setTotalDeliveries(dels.length);
    setCompletedCount(dels.filter((d) => d.status === "Entregada").length);
    setFailedCount(dels.filter((d) => d.status === "Fallida").length);

    const rts = DbService.getRoutes();
    setActiveRoutes(rts.filter((r) => r.status === RouteStatus.EnCurso).length);
  };

  useEffect(() => {
    // Initialize base DB and run background sync with Firebase Firestore
    DbService.getUsers(); 
    loadData();
    DbService.initFirebaseSync();

    const unsubscribe = DbService.subscribeToDb(loadData);
    return () => unsubscribe();
  }, []);

  // Update role simulator in db
  const handleRoleSimulationChange = (role: UserRole) => {
    setSimulatedRole(role);
    DbService.simulateRoleChange(role);
    // Reset view when switching role
    setSelectedDeliveryId(null);
    if (role === UserRole.Conductor) {
      setActiveTab("driver-cockpit");
    } else {
      setActiveTab("dashboard");
    }
  };

  const handleResetSim = () => {
    if (confirm("¿Estás seguro de reiniciar los datos a los valores semilla de Colombia?")) {
      DbService.resetDatabaseToSeed();
      setSelectedDeliveryId(null);
      setActiveTab("dashboard");
    }
  };

  const getRolePermission = (moduleId: string): { enabled: boolean; accessType: "read" | "edit" } => {
    if (!currentUser) return { enabled: false, accessType: "read" };
    
    const roles = DbService.getRoles();
    const role = roles.find((r) => r.name === currentUser.role);
    if (!role) {
      // Fallback logic for unseeded roles or legacy string structures using name-based inference
      const roleLower = currentUser.role.toLowerCase();
      if (roleLower.includes("super")) {
        return { enabled: true, accessType: "edit" };
      }
      if (roleLower.includes("admin") || roleLower.includes("operativo")) {
        if (moduleId === "audit") return { enabled: true, accessType: "read" };
        return { enabled: true, accessType: "edit" };
      }
      if (roleLower.includes("coord") || roleLower.includes("logistica")) {
        if (["users", "audit"].includes(moduleId)) return { enabled: false, accessType: "read" };
        return { enabled: true, accessType: "edit" };
      }
      if (roleLower.includes("conduct") || roleLower.includes("transport")) {
        if (["dashboard", "map", "deliveries"].includes(moduleId)) return { enabled: true, accessType: "read" };
        if (moduleId === "driver-cockpit") return { enabled: true, accessType: "edit" };
        return { enabled: false, accessType: "read" };
      }
      if (roleLower.includes("client") || roleLower.includes("consult")) {
        if (["dashboard", "map", "deliveries", "reports"].includes(moduleId)) return { enabled: true, accessType: "read" };
        return { enabled: false, accessType: "read" };
      }
      if (roleLower.includes("audit")) {
        if (moduleId === "driver-cockpit") return { enabled: false, accessType: "read" };
        return { enabled: true, accessType: "read" };
      }
      return { enabled: true, accessType: "read" };
    }

    const permission = role.permissions.find((p) => p.moduleId === moduleId);
    return permission ? { enabled: permission.enabled, accessType: permission.accessType } : { enabled: false, accessType: "read" };
  };

  // Nav categories depending on role
  const getNavItems = () => {
    const base = [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "map", label: "Seguimiento de Envíos", icon: Package },
      { id: "deliveries", label: "Despachos / Órdenes", icon: Package },
      { id: "routes", label: "Planificador de Rutas", icon: Navigation },
      { id: "drivers", label: "Ficha Conductores", icon: Award },
      { id: "vehicles", label: "Ficha Vehículos", icon: Truck },
      { id: "clients", label: "Clientes", icon: Building },
      { id: "users", label: "Usuarios & Roles", icon: Users },
      { id: "reports", label: "Estadísticas & Reportes", icon: BarChart3 },
      { id: "audit", label: "Auditoría Log", icon: ShieldCheck },
      { id: "driver-cockpit", label: "Cabina Conductor (Móvil)", icon: Smartphone }
    ];

    return base.filter((item) => getRolePermission(item.id).enabled);
  };

  // Render subviews
  const renderContent = () => {
    if (selectedDeliveryId) {
      return (
        <DeliveryDetail
          deliveryId={selectedDeliveryId}
          onBack={() => setSelectedDeliveryId(null)}
        />
      );
    }

    const navToView = (view: string, targetId?: string) => {
      if (view === "deliveries" && targetId) {
        setSelectedDeliveryId(targetId);
      } else {
        setActiveTab(view);
      }
    };

    switch (activeTab) {
      case "dashboard":
        return <Dashboard onNavigateToView={navToView} />;
      case "map":
        return <MapView />;
      case "deliveries":
        return (
          <DeliveriesList
            onNavigateToDetail={(id) => setSelectedDeliveryId(id)}
          />
        );
      case "routes":
        return <RoutesList />;
      case "drivers":
        return <DriversList />;
      case "vehicles":
        return <VehiclesList />;
      case "clients":
        return <ClientsList />;
      case "users":
        return <UsersList />;
      case "reports":
        return <ReportsView />;
      case "audit":
        return <AuditLogsView />;
      case "driver-cockpit":
        return <DriverView onLogout={() => handleRoleSimulationChange(UserRole.SuperAdmin)} />;
      default:
        return <Dashboard onNavigateToView={navToView} />;
    }
  };

  const navItems = getNavItems();

  if (!currentUser) {
    return <LoginView onLoginSuccess={loadData} />;
  }

  if (currentUser.mustChangePassword) {
    return <ForcePasswordChangeView currentUser={currentUser} onPasswordChanged={loadData} />;
  }

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans" id="rutatrack-app-shell">
      {/* Simulation / Role Picker Alert Ribbon */}
      <div className="bg-purple-950 text-purple-100 text-xs py-2.5 px-4 flex flex-col md:flex-row items-center justify-between gap-3 border-b border-purple-900">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse shrink-0" />
          <p className="font-semibold text-purple-200">
            Simulador de RutaTrack • Entorno de Evaluación Logística (Colombia)
          </p>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-purple-300 text-[11px]">Rol Activo:</span>
            <select
              value={simulatedRole}
              onChange={(e) => handleRoleSimulationChange(e.target.value as UserRole)}
              className="bg-purple-900 border border-purple-800 text-stone-100 font-bold py-1 px-2.5 rounded text-xs focus:outline-none cursor-pointer"
            >
              <option value={UserRole.SuperAdmin}>Super Admin</option>
              <option value={UserRole.CoordinadorLogistico}>Coordinador Logístico</option>
              <option value={UserRole.Conductor}>Transportador / Conductor</option>
              <option value={UserRole.Cliente}>Cliente Corporativo</option>
              <option value={UserRole.Auditor}>Auditor Externo</option>
            </select>
          </div>

          <a
            href="/Especificaciones_del_Proyecto_RutaTrack.docx"
            download="Especificaciones_del_Proyecto_RutaTrack.docx"
            className="bg-purple-800 hover:bg-purple-700 text-stone-100 font-semibold text-[11px] py-1 px-2.5 rounded flex items-center gap-1.5 transition border border-purple-700 shadow-xs"
            title="Descargar archivo Word con la especificación de lenguajes y extensiones del proyecto"
          >
            <FileText className="w-3.5 h-3.5 text-purple-200" /> Especificaciones (.docx)
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFirebaseModal(true)}
              className="bg-orange-600 hover:bg-orange-500 text-white font-semibold text-[11px] py-1 px-2.5 rounded flex items-center gap-1.5 transition border border-orange-500 shadow-xs"
              title="Ver estado y sincronizar tablas en Firebase Firestore"
            >
              <Flame className="w-3.5 h-3.5 text-white" /> Tablas Firebase
            </button>

            <button
              onClick={handleResetSim}
              className="text-stone-400 hover:text-stone-100 font-medium text-[11px] flex items-center gap-1 transition"
              title="Restablecer datos por defecto"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reestablecer DB
            </button>
          </div>
        </div>
      </div>

      {/* Main Container Header */}
      <header className="bg-white border-b border-stone-200 shadow-sm shrink-0 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-purple-900 text-stone-100 p-2.5 rounded-xl shadow-md flex items-center justify-center">
            <Truck className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
              RutaTrack <span className="text-xs bg-stone-100 text-stone-600 font-bold px-2 py-0.5 rounded-full border border-stone-200">v1.2.0</span>
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Optimización de última milla • Ruteo inteligente, asignación de vehículos, trazabilidad en tiempo real, gestión de novedades y captura de evidencias con firma digital.
            </p>
          </div>
        </div>

        {/* Dispatch status strip */}
        <div className="flex items-center gap-6 text-stone-800 flex-wrap">
          {/* Firebase Connection Pill */}
          <button
            onClick={() => setShowFirebaseModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200 text-xs font-bold transition shadow-xs cursor-pointer group"
            title="Haz clic para ver las tablas y sincronizar con Firebase Firestore"
          >
            <Flame className="w-4 h-4 text-orange-600 group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <span className="block text-[9px] uppercase tracking-wider text-orange-600 font-mono font-bold leading-none">Firebase Conectado</span>
              <span className="block text-xs font-mono font-bold text-stone-900 truncate max-w-[150px]">{DbService.getFirebaseProjectInfo().projectId}</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 ml-0.5" title="En línea"></span>
          </button>

          <div className="hidden sm:block border-l border-stone-200 pl-4">
            <span className="text-[10px] uppercase font-bold text-stone-400 block">Total Órdenes</span>
            <span className="text-lg font-mono font-bold">{totalDeliveries}</span>
          </div>

          <div className="hidden sm:block border-l border-stone-200 pl-4">
            <span className="text-[10px] uppercase font-bold text-stone-400 block text-emerald-600">Entregados</span>
            <span className="text-lg font-mono font-bold text-emerald-600">{completedCount}</span>
          </div>

          <div className="hidden sm:block border-l border-stone-200 pl-4">
            <span className="text-[10px] uppercase font-bold text-stone-400 block text-rose-500">Fallidos</span>
            <span className="text-lg font-mono font-bold text-rose-500">{failedCount}</span>
          </div>

          <div className="hidden sm:block border-l border-stone-200 pl-4">
            <span className="text-[10px] uppercase font-bold text-stone-400 block text-blue-600">En Tránsito</span>
            <span className="text-lg font-mono font-bold text-blue-600">{activeRoutes}</span>
          </div>

          <div className="border-l border-stone-200 pl-4 flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs font-bold block text-stone-900">{currentUser?.displayName}</span>
              <span className="text-[10px] font-mono text-stone-400 block capitalize">{currentUser?.role}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-900 flex items-center justify-center font-bold text-xs border border-purple-200">
              {currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : "U"}
            </div>
            <button
              onClick={() => {
                DbService.logout();
                setCurrentUser(null);
              }}
              title="Cerrar Sesión"
              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition shrink-0"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Driver mobile cockpit full container override to ensure native aspect-ratio testing */}
      {simulatedRole === UserRole.Conductor ? (
        <main className="flex-1 overflow-y-auto bg-purple-950">
          <DriverView onLogout={() => handleRoleSimulationChange(UserRole.SuperAdmin)} />
        </main>
      ) : (
        /* Dispatcher Desktop layout with full sidebar navigation grid */
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <aside className="w-64 bg-white border-r border-stone-200 hidden md:flex flex-col justify-between p-4 shrink-0 overflow-y-auto">
            <div className="flex flex-col gap-5">
              {[
                {
                  title: "Operaciones & Control",
                  items: ["dashboard", "map", "deliveries", "routes"]
                },
                {
                  title: "Recursos & Maestros",
                  items: ["drivers", "vehicles", "clients"]
                },
                {
                  title: "Auditoría & Seguridad",
                  items: ["users", "reports", "audit"]
                },
                {
                  title: "Entorno de Prueba",
                  items: ["driver-cockpit"]
                }
              ].map((cat) => {
                const visibleItems = navItems.filter((item) => cat.items.includes(item.id));
                if (visibleItems.length === 0) return null;

                return (
                  <div key={cat.title} className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-3 mb-1.5 block">
                      {cat.title}
                    </span>
                    {visibleItems.map((item) => {
                      const Icon = item.icon;
                      const isSelected = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setSelectedDeliveryId(null);
                            setActiveTab(item.id);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                            isSelected
                              ? "bg-purple-900 text-stone-100 shadow-sm"
                              : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isSelected ? "text-purple-200" : "text-stone-400"}`} />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Bottom credential badge */}
            <div className="mt-8 border-t border-stone-150 pt-4 px-3">
              <span className="text-[10px] font-mono text-stone-400 block">Empresa vinculada:</span>
              <span className="text-xs font-extrabold text-stone-800 block mt-0.5">CM Logística</span>
              <span className="text-[10px] font-mono text-stone-400 block mt-1 break-all">
                cmlogistica876@gmail.com
              </span>
            </div>
          </aside>

          {/* Main content viewport */}
          <main className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">
            {/* Simple responsive tab navigation for mobile viewports */}
            <div className="md:hidden flex overflow-x-auto gap-2 pb-2 scrollbar-none border-b border-stone-200">
              {navItems.map((item) => {
                const isSelected = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedDeliveryId(null);
                      setActiveTab(item.id);
                    }}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                      isSelected ? "bg-purple-900 text-white" : "bg-white text-stone-600 border border-stone-200"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {renderContent()}
          </main>
        </div>
      )}
      <TickerTape onSelectDelivery={(id) => setSelectedDeliveryId(id)} />
      <FirebaseStatusModal
        isOpen={showFirebaseModal}
        onClose={() => setShowFirebaseModal(false)}
      />
    </div>
  );
}
