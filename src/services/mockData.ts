/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  User,
  UserRole,
  UserStatus,
  Driver,
  DriverStatus,
  Vehicle,
  VehicleStatus,
  Client,
  Delivery,
  DeliveryStatus,
  Route,
  RouteStatus,
  Incident,
  IncidentType,
  IncidentStatus,
  AuditLog,
  SystemSettings
} from "../types";

// User Seed Data (10 Users)
export const SEED_USERS: User[] = [
  {
    uid: "u-superadmin-1",
    displayName: "Carlos Martínez (SuperAdmin)",
    email: "cmlogistica876@gmail.com",
    phone: "+57 315 123 4567",
    role: UserRole.SuperAdmin,
    status: UserStatus.Activo,
    createdAt: "2026-06-01T08:00:00Z",
    updatedAt: "2026-06-01T08:00:00Z",
    lastLoginAt: "2026-07-07T16:50:00Z"
  },
  {
    uid: "u-adminop-1",
    displayName: "Diana Restrepo (Operativo)",
    email: "diana.restrepo@rutatrack.co",
    phone: "+57 310 987 6543",
    role: UserRole.AdminOperativo,
    status: UserStatus.Activo,
    createdAt: "2026-06-02T09:00:00Z",
    updatedAt: "2026-06-02T09:00:00Z",
    lastLoginAt: "2026-07-07T15:30:00Z"
  },
  {
    uid: "u-coord-1",
    displayName: "Andrés Giraldo (Coordinador)",
    email: "andres.giraldo@rutatrack.co",
    phone: "+57 301 222 3344",
    role: UserRole.CoordinadorLogistico,
    status: UserStatus.Activo,
    createdAt: "2026-06-03T10:00:00Z",
    updatedAt: "2026-06-03T10:00:00Z",
    lastLoginAt: "2026-07-07T16:00:00Z"
  },
  {
    uid: "u-coord-2",
    displayName: "Paula Mendoza (Coordinador)",
    email: "paula.mendoza@rutatrack.co",
    phone: "+57 312 333 4455",
    role: UserRole.CoordinadorLogistico,
    status: UserStatus.Activo,
    createdAt: "2026-06-03T10:30:00Z",
    updatedAt: "2026-06-03T10:30:00Z",
    lastLoginAt: "2026-07-07T14:15:00Z"
  },
  // Drivers associated with user logins
  {
    uid: "u-driver-1",
    displayName: "Juan Carlos Beltrán",
    email: "juan.beltran@rutatrack.co",
    phone: "+57 311 444 5566",
    role: UserRole.Conductor,
    status: UserStatus.Activo,
    driverId: "drv-1",
    createdAt: "2026-06-04T08:00:00Z",
    updatedAt: "2026-06-04T08:00:00Z",
    lastLoginAt: "2026-07-07T06:00:00Z"
  },
  {
    uid: "u-driver-2",
    displayName: "Mateo Rodríguez",
    email: "mateo.rodriguez@rutatrack.co",
    phone: "+57 313 555 6677",
    role: UserRole.Conductor,
    status: UserStatus.Activo,
    driverId: "drv-2",
    createdAt: "2026-06-04T08:30:00Z",
    updatedAt: "2026-06-04T08:30:00Z"
  },
  {
    uid: "u-driver-3",
    displayName: "Luis Eduardo Ospina",
    email: "luis.ospina@rutatrack.co",
    phone: "+57 314 666 7788",
    role: UserRole.Conductor,
    status: UserStatus.Activo,
    driverId: "drv-3",
    createdAt: "2026-06-04T09:00:00Z",
    updatedAt: "2026-06-04T09:00:00Z"
  },
  {
    uid: "u-driver-4",
    displayName: "Jorge Eliécer Gaitán",
    email: "jorge.gaitan@rutatrack.co",
    phone: "+57 317 777 8899",
    role: UserRole.Conductor,
    status: UserStatus.Activo,
    driverId: "drv-4",
    createdAt: "2026-06-04T09:30:00Z",
    updatedAt: "2026-06-04T09:30:00Z"
  },
  {
    uid: "u-driver-5",
    displayName: "Fernando Hoyos",
    email: "fernando.hoyos@rutatrack.co",
    phone: "+57 318 888 9900",
    role: UserRole.Conductor,
    status: UserStatus.Activo,
    driverId: "drv-5",
    createdAt: "2026-06-04T10:00:00Z",
    updatedAt: "2026-06-04T10:00:00Z"
  },
  // Cliente User
  {
    uid: "u-client-1",
    displayName: "Almacenes Éxito (Soporte)",
    email: "exito.logistica@exito.com.co",
    phone: "+57 320 111 2233",
    role: UserRole.Cliente,
    status: UserStatus.Activo,
    clientId: "cli-1",
    createdAt: "2026-06-05T08:00:00Z",
    updatedAt: "2026-06-05T08:00:00Z"
  },
  // Auditor User
  {
    uid: "u-auditor-1",
    displayName: "Héctor Fabio Castro",
    email: "hector.auditor@rutatrack.co",
    phone: "+57 316 222 3333",
    role: UserRole.Auditor,
    status: UserStatus.Activo,
    createdAt: "2026-06-05T14:00:00Z",
    updatedAt: "2026-06-05T14:00:00Z"
  }
];

// Driver Seed Data (5 Drivers)
export const SEED_DRIVERS: Driver[] = [
  {
    id: "drv-1",
    userId: "u-driver-1",
    name: "Juan Carlos Beltrán",
    document: "79888123",
    phone: "+57 311 444 5566",
    email: "juan.beltran@rutatrack.co",
    licenseNumber: "C2-79888123",
    status: DriverStatus.EnRuta,
    assignedVehicleId: "veh-1",
    createdAt: "2026-06-04T08:00:00Z",
    updatedAt: "2026-07-07T08:00:00Z"
  },
  {
    id: "drv-2",
    userId: "u-driver-2",
    name: "Mateo Rodríguez",
    document: "1019023456",
    phone: "+57 313 555 6677",
    email: "mateo.rodriguez@rutatrack.co",
    licenseNumber: "C1-1019023456",
    status: DriverStatus.EnRuta,
    assignedVehicleId: "veh-2",
    createdAt: "2026-06-04T08:30:00Z",
    updatedAt: "2026-07-07T08:30:00Z"
  },
  {
    id: "drv-3",
    userId: "u-driver-3",
    name: "Luis Eduardo Ospina",
    document: "80234567",
    phone: "+57 314 666 7788",
    email: "luis.ospina@rutatrack.co",
    licenseNumber: "C2-80234567",
    status: DriverStatus.Disponible,
    assignedVehicleId: "veh-3",
    createdAt: "2026-06-04T09:00:00Z",
    updatedAt: "2026-07-07T09:00:00Z"
  },
  {
    id: "drv-4",
    userId: "u-driver-4",
    name: "Jorge Eliécer Gaitán",
    document: "1020345678",
    phone: "+57 317 777 8899",
    email: "jorge.gaitan@rutatrack.co",
    licenseNumber: "C2-1020345678",
    status: DriverStatus.EnRuta,
    assignedVehicleId: "veh-4",
    createdAt: "2026-06-04T09:30:00Z",
    updatedAt: "2026-07-07T09:30:00Z"
  },
  {
    id: "drv-5",
    userId: "u-driver-5",
    name: "Fernando Hoyos",
    document: "16789123",
    phone: "+57 318 888 9900",
    email: "fernando.hoyos@rutatrack.co",
    licenseNumber: "C1-16789123",
    status: DriverStatus.Inactivo,
    assignedVehicleId: undefined,
    createdAt: "2026-06-04T10:00:00Z",
    updatedAt: "2026-07-07T10:00:00Z"
  }
];

// Vehicle Seed Data (5 Vehicles - located in Bogota, Medellin, Cali, Barranquilla, and Bogota-Sur)
export const SEED_VEHICLES: Vehicle[] = [
  {
    id: "veh-1",
    plate: "SZK-980",
    type: "Turbo NHR",
    brand: "Chevrolet",
    model: "2023",
    capacity: 3500, // kg
    status: VehicleStatus.EnRuta,
    assignedDriverId: "drv-1",
    currentLocation: {
      lat: 4.6750, // Bogota Norte
      lng: -74.0550,
      heading: 180,
      speed: 45,
      accuracy: 8,
      updatedAt: "2026-07-07T16:50:00-07:00"
    },
    createdAt: "2026-06-01T08:00:00Z",
    updatedAt: "2026-07-07T16:50:00-07:00"
  },
  {
    id: "veh-2",
    plate: "WML-432",
    type: "Van Cargo",
    brand: "Renault",
    model: "2022",
    capacity: 1200, // kg
    status: VehicleStatus.EnRuta,
    assignedDriverId: "drv-2",
    currentLocation: {
      lat: 6.2300, // Medellin Poblado
      lng: -75.5700,
      heading: 90,
      speed: 32,
      accuracy: 10,
      updatedAt: "2026-07-07T16:48:00-07:00"
    },
    createdAt: "2026-06-01T08:30:00Z",
    updatedAt: "2026-07-07T16:48:00-07:00"
  },
  {
    id: "veh-3",
    plate: "KLO-556",
    type: "Estacas FTR",
    brand: "Isuzu",
    model: "2020",
    capacity: 7000, // kg
    status: VehicleStatus.Disponible,
    assignedDriverId: "drv-3",
    currentLocation: {
      lat: 3.4400, // Cali Chipichape
      lng: -76.5200,
      heading: 0,
      speed: 0,
      accuracy: 5,
      updatedAt: "2026-07-07T16:15:00-07:00"
    },
    createdAt: "2026-06-01T09:00:00Z",
    updatedAt: "2026-07-07T16:15:00-07:00"
  },
  {
    id: "veh-4",
    plate: "TRX-778",
    type: "Turbo NPR",
    brand: "Hino",
    model: "2024",
    capacity: 4500, // kg
    status: VehicleStatus.EnRuta,
    assignedDriverId: "drv-4",
    currentLocation: {
      lat: 10.9850, // Barranquilla Prado
      lng: -74.7950,
      heading: 270,
      speed: 15, // Detenido en trafico
      accuracy: 12,
      updatedAt: "2026-07-07T16:51:00-07:00"
    },
    createdAt: "2026-06-01T09:30:00Z",
    updatedAt: "2026-07-07T16:51:00-07:00"
  },
  {
    id: "veh-5",
    plate: "MHU-112",
    type: "Furgón Carry",
    brand: "Suzuki",
    model: "2021",
    capacity: 800, // kg
    status: VehicleStatus.Inactivo,
    assignedDriverId: undefined,
    currentLocation: {
      lat: 4.5980, // Bogota Centro/Sur
      lng: -74.0758,
      heading: 0,
      speed: 0,
      accuracy: 15,
      updatedAt: "2026-07-07T10:00:00-07:00"
    },
    createdAt: "2026-06-01T10:00:00Z",
    updatedAt: "2026-07-07T10:00:00-07:00"
  }
];

// Client Seed Data (5 Clients)
export const SEED_CLIENTS: Client[] = [
  {
    id: "cli-1",
    name: "Almacenes Éxito S.A.",
    taxId: "890.900.608-9",
    address: "Carrera 48 # 32B Sur - 139",
    city: "Medellín",
    contactName: "Juan Pablo Urrego",
    contactPhone: "+57 320 111 2233",
    contactEmail: "logistica.exito@exito.com",
    status: UserStatus.Activo,
    createdAt: "2026-06-05T08:00:00Z",
    updatedAt: "2026-06-05T08:00:00Z"
  },
  {
    id: "cli-2",
    name: "Homecenter Sodimac Colombia",
    taxId: "800.242.106-2",
    address: "Avenida Carrera 68 # 80-77",
    city: "Bogotá",
    contactName: "Martha Cecilia Silva",
    contactPhone: "+57 310 444 8888",
    contactEmail: "despachos@homecenter.co",
    status: UserStatus.Activo,
    createdAt: "2026-06-05T09:00:00Z",
    updatedAt: "2026-06-05T09:00:00Z"
  },
  {
    id: "cli-3",
    name: "Tecnoquímicas S.A.",
    taxId: "890.300.254-1",
    address: "Calle 23 # 4-64",
    city: "Cali",
    contactName: "Esteban Aristizábal",
    contactPhone: "+57 312 876 5432",
    contactEmail: "distribucion@tq.com.co",
    status: UserStatus.Activo,
    createdAt: "2026-06-05T10:00:00Z",
    updatedAt: "2026-06-05T10:00:00Z"
  },
  {
    id: "cli-4",
    name: "Olimpica S.A.",
    taxId: "890.100.554-3",
    address: "Calle 30 # 45-120",
    city: "Barranquilla",
    contactName: "Gustavo Char",
    contactPhone: "+57 300 777 9999",
    contactEmail: "entregas@olimpica.com",
    status: UserStatus.Activo,
    createdAt: "2026-06-05T11:00:00Z",
    updatedAt: "2026-06-05T11:00:00Z"
  },
  {
    id: "cli-5",
    name: "Nutresa Distribución",
    taxId: "890.900.056-1",
    address: "Calle 52 # 47-42",
    city: "Medellín",
    contactName: "Carlos Mario Duque",
    contactPhone: "+57 315 500 6000",
    contactEmail: "entregas@nutresa.com.co",
    status: UserStatus.Activo,
    createdAt: "2026-06-05T12:00:00Z",
    updatedAt: "2026-06-05T12:00:00Z"
  }
];

// Deliveries Seed Data (30 Deliveries)
export const SEED_DELIVERIES: Delivery[] = [
  // Route 1 Deliveries (Bogota - SZK-980)
  {
    id: "del-101",
    code: "ENT-101",
    clientId: "cli-2",
    routeId: "rt-1",
    address: "Calle 26 # 69-76, Edificio Elemento",
    city: "Bogotá",
    location: { lat: 4.6540, lng: -74.1100 },
    scheduledDate: "2026-07-07",
    timeWindowStart: "08:00",
    timeWindowEnd: "11:00",
    status: DeliveryStatus.Entregada,
    priority: "Alta",
    notes: "Entregar en sótano 1, área de recibo. Preguntar por Supervisor Rojas.",
    evidenceIds: ["ev-1"],
    receivedByName: "Humberto Rojas",
    receivedByDocument: "19444555",
    deliveredAt: "2026-07-07T09:15:00-07:00",
    createdAt: "2026-07-06T14:00:00Z",
    updatedAt: "2026-07-07T09:15:00-07:00"
  },
  {
    id: "del-102",
    code: "ENT-102",
    clientId: "cli-2",
    routeId: "rt-1",
    address: "Avenida Chile (Calle 72) # 10-34",
    city: "Bogotá",
    location: { lat: 4.6580, lng: -74.0560 },
    scheduledDate: "2026-07-07",
    timeWindowStart: "10:00",
    timeWindowEnd: "13:00",
    status: DeliveryStatus.Entregada,
    priority: "Media",
    notes: "No se permite parqueo sobre la principal. Usar bahía de carga.",
    evidenceIds: ["ev-2"],
    receivedByName: "Adriana Pérez",
    receivedByDocument: "52777888",
    deliveredAt: "2026-07-07T11:40:00-07:00",
    createdAt: "2026-07-06T14:00:00Z",
    updatedAt: "2026-07-07T11:40:00-07:00"
  },
  {
    id: "del-103",
    code: "ENT-103",
    clientId: "cli-2",
    routeId: "rt-1",
    address: "Carrera 15 # 93-60, Parque de la 93",
    city: "Bogotá",
    location: { lat: 4.6780, lng: -74.0510 },
    scheduledDate: "2026-07-07",
    timeWindowStart: "13:00",
    timeWindowEnd: "16:00",
    status: DeliveryStatus.EnSitio,
    priority: "Alta",
    notes: "Cajas pesadas de herramientas de construcción. Se necesita carretilla.",
    evidenceIds: [],
    createdAt: "2026-07-06T14:00:00Z",
    updatedAt: "2026-07-07T16:30:00-07:00"
  },
  {
    id: "del-104",
    code: "ENT-104",
    clientId: "cli-2",
    routeId: "rt-1",
    address: "Calle 127 # 15-45, Unicentro",
    city: "Bogotá",
    location: { lat: 4.7010, lng: -74.0450 },
    scheduledDate: "2026-07-07",
    timeWindowStart: "15:00",
    timeWindowEnd: "18:00",
    status: DeliveryStatus.EnCamino,
    priority: "Baja",
    notes: "Entrar por la bahía lateral de muelles de carga.",
    evidenceIds: [],
    createdAt: "2026-07-06T14:00:00Z",
    updatedAt: "2026-07-07T15:00:00-07:00"
  },

  // Route 2 Deliveries (Medellin - WML-432)
  {
    id: "del-201",
    code: "ENT-201",
    clientId: "cli-1",
    routeId: "rt-2",
    address: "Carrera 43A # 1-50, San Fernando Plaza",
    city: "Medellín",
    location: { lat: 6.2020, lng: -75.5720 },
    scheduledDate: "2026-07-07",
    timeWindowStart: "08:00",
    timeWindowEnd: "11:00",
    status: DeliveryStatus.Entregada,
    priority: "Alta",
    notes: "Factura original debe venir firmada con sello húmedo.",
    evidenceIds: ["ev-3"],
    receivedByName: "Andrés Restrepo",
    receivedByDocument: "71999000",
    deliveredAt: "2026-07-07T08:50:00-07:00",
    createdAt: "2026-07-06T14:15:00Z",
    updatedAt: "2026-07-07T08:50:00-07:00"
  },
  {
    id: "del-202",
    code: "ENT-202",
    clientId: "cli-5",
    routeId: "rt-2",
    address: "Carrera 70 # 44-15, Estadio",
    city: "Medellín",
    location: { lat: 6.2490, lng: -75.5900 },
    scheduledDate: "2026-07-07",
    timeWindowStart: "10:00",
    timeWindowEnd: "13:00",
    status: DeliveryStatus.Fallida,
    priority: "Media",
    notes: "Llamar 15 minutos antes de llegar para despejar garaje de descarga.",
    evidenceIds: [],
    failureReason: "Cliente ausente",
    createdAt: "2026-07-06T14:15:00Z",
    updatedAt: "2026-07-07T11:20:00-07:00"
  },
  {
    id: "del-203",
    code: "ENT-203",
    clientId: "cli-1",
    routeId: "rt-2",
    address: "Calle 50 # 52-25, Parque Berrío",
    city: "Medellín",
    location: { lat: 6.2510, lng: -75.5680 },
    scheduledDate: "2026-07-07",
    timeWindowStart: "13:00",
    timeWindowEnd: "16:00",
    status: DeliveryStatus.EnCamino,
    priority: "Media",
    notes: "Área peatonal restringida de 11:00 a 17:00. Ingresar con permiso impreso.",
    evidenceIds: [],
    createdAt: "2026-07-06T14:15:00Z",
    updatedAt: "2026-07-07T13:00:00-07:00"
  },

  // Route 4 Deliveries (Barranquilla - TRX-778)
  {
    id: "del-401",
    code: "ENT-401",
    clientId: "cli-4",
    routeId: "rt-4",
    address: "Vía 40 # 73-290, Complejo Industrial",
    city: "Barranquilla",
    location: { lat: 11.0210, lng: -74.8150 },
    scheduledDate: "2026-07-07",
    timeWindowStart: "08:00",
    timeWindowEnd: "12:00",
    status: DeliveryStatus.Entregada,
    priority: "Alta",
    notes: "Se requiere casco, botas y chaleco reflectivo para ingresar.",
    evidenceIds: ["ev-4"],
    receivedByName: "Carlos Fuentes",
    receivedByDocument: "87000111",
    deliveredAt: "2026-07-07T09:45:00-07:00",
    createdAt: "2026-07-06T14:30:00Z",
    updatedAt: "2026-07-07T09:45:00-07:00"
  },
  {
    id: "del-402",
    code: "ENT-402",
    clientId: "cli-4",
    routeId: "rt-4",
    address: "Carrera 46 # 84-12, Centro Comercial",
    city: "Barranquilla",
    location: { lat: 10.9990, lng: -74.8110 },
    scheduledDate: "2026-07-07",
    timeWindowStart: "13:00",
    timeWindowEnd: "17:00",
    status: DeliveryStatus.EnCamino,
    priority: "Baja",
    notes: "Entregar en local 201, segundo nivel.",
    evidenceIds: [],
    createdAt: "2026-07-06T14:30:00Z",
    updatedAt: "2026-07-07T13:00:00-07:00"
  },

  // 21 Additional Deliveries to complete 30 Deliveries
  ...Array.from({ length: 21 }, (_, index) => {
    const idNum = index + 500;
    const isOdd = index % 2 === 0;
    const cities = ["Bogotá", "Medellín", "Cali", "Barranquilla"];
    const city = cities[index % cities.length];
    
    // Choose route mapping
    let routeId: string | undefined;
    if (city === "Bogotá") routeId = "rt-5"; // Route 5 Bogota
    else if (city === "Medellín") routeId = "rt-6"; // Route 6 Medellin
    else if (city === "Cali") routeId = "rt-7"; // Route 7 Cali
    else routeId = "rt-8"; // Route 8 Barranquilla

    return {
      id: `del-${idNum}`,
      code: `ENT-${idNum}`,
      clientId: `cli-${(index % 5) + 1}`,
      routeId,
      address: `Avenida Principal No. ${index * 7 + 10} - ${index + 1} (${city})`,
      city,
      location: {
        lat: city === "Bogotá" ? 4.60 + (index * 0.008) :
             city === "Medellín" ? 6.22 + (index * 0.005) :
             city === "Cali" ? 3.42 + (index * 0.004) :
             10.97 + (index * 0.005),
        lng: city === "Bogotá" ? -74.08 - (index * 0.004) :
             city === "Medellín" ? -75.58 - (index * 0.003) :
             city === "Cali" ? -76.51 - (index * 0.002) :
             -74.80 - (index * 0.003)
      },
      scheduledDate: "2026-07-08", // Siguiente día
      timeWindowStart: isOdd ? "08:00" : "14:00",
      timeWindowEnd: isOdd ? "12:00" : "18:00",
      status: DeliveryStatus.Asignada,
      priority: (index % 3 === 0 ? "Alta" : index % 3 === 1 ? "Media" : "Baja") as "Baja" | "Media" | "Alta",
      notes: "Entrega programada estándar de paquetería logística.",
      evidenceIds: [],
      createdAt: "2026-07-07T10:00:00Z",
      updatedAt: "2026-07-07T10:00:00Z"
    };
  })
];

// Route Seed Data (10 Routes)
export const SEED_ROUTES: Route[] = [
  {
    id: "rt-1",
    code: "RUT-BOG-001",
    name: "Ruta Bogotá Norte - Chapinero",
    driverId: "drv-1",
    vehicleId: "veh-1",
    deliveryIds: ["del-101", "del-102", "del-103", "del-104"],
    status: RouteStatus.EnCurso,
    plannedStartAt: "2026-07-07T07:30:00-07:00",
    actualStartAt: "2026-07-07T07:45:00-07:00",
    createdAt: "2026-07-06T15:00:00Z",
    updatedAt: "2026-07-07T15:00:00Z"
  },
  {
    id: "rt-2",
    code: "RUT-MED-001",
    name: "Ruta Medellín Centro - Poblado",
    driverId: "drv-2",
    vehicleId: "veh-2",
    deliveryIds: ["del-201", "del-202", "del-203"],
    status: RouteStatus.EnCurso,
    plannedStartAt: "2026-07-07T08:00:00-07:00",
    actualStartAt: "2026-07-07T08:10:00-07:00",
    createdAt: "2026-07-06T15:30:00Z",
    updatedAt: "2026-07-07T13:00:00Z"
  },
  {
    id: "rt-3",
    code: "RUT-CAL-001",
    name: "Ruta Cali Norte - Oeste",
    driverId: "drv-3",
    vehicleId: "veh-3",
    deliveryIds: [], // Sin entregas asignadas hoy
    status: RouteStatus.Asignada,
    plannedStartAt: "2026-07-07T08:00:00-07:00",
    createdAt: "2026-07-06T16:00:00Z",
    updatedAt: "2026-07-07T10:00:00Z"
  },
  {
    id: "rt-4",
    code: "RUT-BAQ-001",
    name: "Ruta Barranquilla Industrial - Prado",
    driverId: "drv-4",
    vehicleId: "veh-4",
    deliveryIds: ["del-401", "del-402"],
    status: RouteStatus.EnCurso,
    plannedStartAt: "2026-07-07T08:30:00-07:00",
    actualStartAt: "2026-07-07T08:45:00-07:00",
    createdAt: "2026-07-06T16:30:00Z",
    updatedAt: "2026-07-07T13:00:00Z"
  },
  // 6 Additional routes to complete 10 Routes (all for subsequent date)
  {
    id: "rt-5",
    code: "RUT-BOG-002",
    name: "Siguiente Día - Bogotá Sur",
    driverId: "drv-1",
    vehicleId: "veh-1",
    deliveryIds: [], // Will contain generated deliveries
    status: RouteStatus.Planificada,
    plannedStartAt: "2026-07-08T07:00:00-07:00",
    createdAt: "2026-07-07T11:00:00Z",
    updatedAt: "2026-07-07T11:00:00Z"
  },
  {
    id: "rt-6",
    code: "RUT-MED-002",
    name: "Siguiente Día - Medellín Laureles",
    driverId: "drv-2",
    vehicleId: "veh-2",
    deliveryIds: [],
    status: RouteStatus.Planificada,
    plannedStartAt: "2026-07-08T07:30:00-07:00",
    createdAt: "2026-07-07T11:15:00Z",
    updatedAt: "2026-07-07T11:15:00Z"
  },
  {
    id: "rt-7",
    code: "RUT-CAL-002",
    name: "Siguiente Día - Cali Sur Ciudad Jardín",
    driverId: "drv-3",
    vehicleId: "veh-3",
    deliveryIds: [],
    status: RouteStatus.Planificada,
    plannedStartAt: "2026-07-08T07:30:00-07:00",
    createdAt: "2026-07-07T11:30:00Z",
    updatedAt: "2026-07-07T11:30:00Z"
  },
  {
    id: "rt-8",
    code: "RUT-BAQ-002",
    name: "Siguiente Día - Barranquilla Norte",
    driverId: "drv-4",
    vehicleId: "veh-4",
    deliveryIds: [],
    status: RouteStatus.Planificada,
    plannedStartAt: "2026-07-08T08:00:00-07:00",
    createdAt: "2026-07-07T11:45:00Z",
    updatedAt: "2026-07-07T11:45:00Z"
  },
  {
    id: "rt-9",
    code: "RUT-BOG-003",
    name: "Siguiente Día - Bogotá Occidente",
    driverId: undefined,
    vehicleId: undefined,
    deliveryIds: [],
    status: RouteStatus.Planificada,
    plannedStartAt: "2026-07-08T08:30:00-07:00",
    createdAt: "2026-07-07T12:00:00Z",
    updatedAt: "2026-07-07T12:00:00Z"
  },
  {
    id: "rt-10",
    code: "RUT-GEN-004",
    name: "Ruta de Contingencia Nacional",
    driverId: undefined,
    vehicleId: undefined,
    deliveryIds: [],
    status: RouteStatus.Planificada,
    plannedStartAt: "2026-07-08T09:00:00-07:00",
    createdAt: "2026-07-07T12:30:00Z",
    updatedAt: "2026-07-07T12:30:00Z"
  }
];

// Seed incidents / novedades (10 Incidents)
export const SEED_INCIDENTS: Incident[] = [
  {
    id: "inc-1",
    routeId: "rt-1",
    deliveryId: "del-103",
    driverId: "drv-1",
    vehicleId: "veh-1",
    type: IncidentType.Trafico,
    description: "Retraso de 20 minutos por tráfico pesado en la Autopista Norte con Calle 100.",
    status: IncidentStatus.Abierto,
    location: { lat: 4.6860, lng: -74.0580 },
    createdAt: "2026-07-07T15:20:00-07:00",
    updatedAt: "2026-07-07T15:20:00-07:00"
  },
  {
    id: "inc-2",
    routeId: "rt-2",
    deliveryId: "del-202",
    driverId: "drv-2",
    vehicleId: "veh-2",
    type: IncidentType.ClienteAusente,
    description: "Se timbró varias veces en la recepción y llamé al celular de contacto, pero no atienden.",
    status: IncidentStatus.Abierto,
    location: { lat: 6.2490, lng: -75.5900 },
    createdAt: "2026-07-07T11:15:00-07:00",
    updatedAt: "2026-07-07T11:15:00-07:00"
  },
  {
    id: "inc-3",
    routeId: "rt-4",
    deliveryId: "del-402",
    driverId: "drv-4",
    vehicleId: "veh-4",
    type: IncidentType.Trafico,
    description: "Trancón masivo por reparación de vía en la Calle 30.",
    status: IncidentStatus.Abierto,
    location: { lat: 10.9850, lng: -74.7950 },
    createdAt: "2026-07-07T16:10:00-07:00",
    updatedAt: "2026-07-07T16:10:00-07:00"
  },
  {
    id: "inc-4",
    routeId: "rt-1",
    deliveryId: "del-101",
    driverId: "drv-1",
    vehicleId: "veh-1",
    type: IncidentType.DireccionIncorrecta,
    description: "La nomenclatura del edificio es antigua, se contactó a la oficina central para confirmar.",
    status: IncidentStatus.Solucionado,
    location: { lat: 4.6540, lng: -74.1100 },
    createdAt: "2026-07-07T08:30:00-07:00",
    updatedAt: "2026-07-07T09:00:00-07:00"
  },
  ...Array.from({ length: 6 }, (_, index) => {
    const types = [
      IncidentType.VehiculoVarado,
      IncidentType.Accidente,
      IncidentType.RechazoEntrega,
      IncidentType.Trafico,
      IncidentType.ClienteAusente,
      IncidentType.Otro
    ];
    return {
      id: `inc-mock-${index + 10}`,
      routeId: index % 2 === 0 ? "rt-1" : "rt-2",
      deliveryId: index % 2 === 0 ? `del-10${index + 1}` : undefined,
      driverId: index % 2 === 0 ? "drv-1" : "drv-2",
      vehicleId: index % 2 === 0 ? "veh-1" : "veh-2",
      type: types[index % types.length],
      description: `Reporte preventivo: incidencia operativa de control registrada por auditoría. Detalle #${index + 1}.`,
      status: index % 3 === 0 ? IncidentStatus.Abierto : IncidentStatus.Solucionado,
      createdAt: `2026-07-07T12:00:0${index}-07:00`,
      updatedAt: `2026-07-07T12:30:0${index}-07:00`
    };
  })
];

// Seed Audits
export const SEED_AUDITS: AuditLog[] = [
  {
    id: "aud-1",
    userId: "u-superadmin-1",
    userEmail: "cmlogistica876@gmail.com",
    action: "Carga Inicial de Datos Semilla",
    entityType: "System",
    entityId: "system",
    before: undefined,
    after: JSON.stringify({ description: "Carga de 1 superadministrador, 5 vehículos, 5 clientes, 30 entregas y 10 rutas logísticas colombianas." }),
    createdAt: "2026-07-07T16:53:55-07:00"
  },
  {
    id: "aud-2",
    userId: "u-adminop-1",
    userEmail: "diana.restrepo@rutatrack.co",
    action: "Inicio de Ruta Logística",
    entityType: "Route",
    entityId: "rt-1",
    before: JSON.stringify({ status: RouteStatus.Asignada }),
    after: JSON.stringify({ status: RouteStatus.EnCurso, driverId: "drv-1" }),
    createdAt: "2026-07-07T07:45:00-07:00"
  }
];

export const DEFAULT_SETTINGS: SystemSettings = {
  companyName: "RutaTrack Colombia",
  defaultMapCenter: { lat: 4.7110, lng: -74.0721 }, // Bogotá
  locationUpdateIntervalSeconds: 15,
  allowedRoles: Object.values(UserRole),
  updatedAt: "2026-07-07T16:53:55-07:00"
};
