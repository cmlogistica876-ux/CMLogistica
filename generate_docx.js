import fs from 'fs';
import path from 'path';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  WidthType,
  AlignmentType,
  ShadingType
} from 'docx';

async function createWordDoc() {
  const primaryColor = "3B0764"; // Purple 950
  const secondaryColor = "581C87"; // Purple 900
  const textColor = "1C1917"; // Stone 900
  const lightBg = "F5F5F4"; // Stone 100
  const borderColor = "E7E5E4"; // Stone 200

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Title
          new Paragraph({
            text: "ESPECIFICACIONES TÉCNICAS Y LENGUAJES DEL PROYECTO",
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Sistema de Gestión Logística y Rastreo de Rutas - RutaTrack",
                bold: true,
                color: secondaryColor,
                size: 24,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),

          // Section 1: Intro
          new Paragraph({
            text: "1. Resumen General del Proyecto",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "RutaTrack es una plataforma web integral de gestión logística, monitoreo de rutas en tiempo real, asignación de conductores, administración de vehículos, clientes, guías de entrega, reportes analíticos y auditoría de accesos. Está desarrollada bajo una arquitectura de Single Page Application (SPA) moderna, limpia, de alto rendimiento y completamente responsiva.",
                size: 22,
                color: textColor,
              }),
            ],
            spacing: { after: 200 },
          }),

          // Section 2: Lenguajes por Módulo
          new Paragraph({
            text: "2. Lenguajes de Programación y Tecnologías por Módulo",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "A continuación se detalla qué lenguaje de programación y marcado se utilizó en cada sección del proyecto:",
                size: 22,
                color: textColor,
              }),
            ],
            spacing: { after: 150 },
          }),

          // Table of Languages
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableTableCell("Módulo / Componente", true, primaryColor),
                  new TableTableCell("Lenguaje Principal", true, primaryColor),
                  new TableTableCell("Descripción del Uso", true, primaryColor),
                ],
              }),
              new TableRow({
                children: [
                  new TableTableCell("Lógica de Negocio y Tipos (src/types.ts, src/services/*)", false),
                  new TableTableCell("TypeScript (.ts)", false),
                  new TableTableCell("Definición de interfaces fuertemente tipadas, contratos de datos, enums y servicios de base de datos.", false),
                ],
              }),
              new TableRow({
                children: [
                  new TableTableCell("Componentes de Interfaz de Usuario (src/components/*)", false),
                  new TableTableCell("TypeScript React (.tsx)", false),
                  new TableTableCell("Construcción declarativa de vistas como Dashboard, Lista de Usuarios, Vehículos, Clientes, Entregas, Mapa, Reportes y Auditoría.", false),
                ],
              }),
              new TableRow({
                children: [
                  new TableTableCell("Estructura de la Aplicación (src/App.tsx, main.tsx)", false),
                  new TableTableCell("TypeScript React (.tsx)", false),
                  new TableTableCell("Enrutamiento principal, gestión del estado global de la sesión, navegación de pestañas y modales.", false),
                ],
              }),
              new TableRow({
                children: [
                  new TableTableCell("Estilos y Diseño Visual (src/index.css)", false),
                  new TableTableCell("CSS3 / Tailwind CSS v4", false),
                  new TableTableCell("Sistema de diseño en cascada con clases de utilidad responsivas, paleta de colores profesional y micro-interacciones.", false),
                ],
              }),
              new TableRow({
                children: [
                  new TableTableCell("Documento Base Web (index.html)", false),
                  new TableTableCell("HTML5", false),
                  new TableTableCell("Estructura base del documento, metadatos, configuración de viewport y montado del elemento raíz del DOM.", false),
                ],
              }),
              new TableRow({
                children: [
                  new TableTableCell("Entorno de Ejecución y Servidor (package.json, Vite, Express)", false),
                  new TableTableCell("Node.js (JavaScript / JSON)", false),
                  new TableTableCell("Gestión de dependencias, scripts de compilación (Vite/Esbuild) y servidor web de desarrollo.", false),
                ],
              }),
              new TableRow({
                children: [
                  new TableTableCell("Reglas de Seguridad (firestore.rules)", false),
                  new TableTableCell("Firestore Security Rules Domain Language", false),
                  new TableTableCell("Políticas de autorización y control de lectura/escritura en la base de datos de Firebase.", false),
                ],
              }),
            ],
          }),

          // Section 3: Extensions and Libraries
          new Paragraph({
            text: "3. Extensiones, Librerías y Dependencias Utilizadas",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "El proyecto hace uso de un conjunto de librerías y dependencias especializadas para garantizar velocidad, seguridad y una excelente experiencia de usuario:",
                size: 22,
                color: textColor,
              }),
            ],
            spacing: { after: 150 },
          }),

          // Table of Packages
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableTableCell("Librería / Extensión", true, secondaryColor),
                  new TableTableCell("Versión", true, secondaryColor),
                  new TableTableCell("Función / Propósito en el Proyecto", true, secondaryColor),
                ],
              }),
              new TableRow({
                children: [
                  new TableTableCell("React", false),
                  new TableTableCell("^19.0.1", false),
                  new TableTableCell("Librería núcleo para la construcción del sistema basado en componentes reactivos y hooks.", false),
                ],
              }),
              new TableRow({
                children: [
                  new TableTableCell("TypeScript", false),
                  new TableTableCell("~5.8.2", false),
                  new TableTableCell("Extensión de JavaScript que añade tipos estáticos para prevenir errores en tiempo de desarrollo.", false),
                ],
              }),
              new TableRow({
                children: [
                  new TableTableCell("Tailwind CSS", false),
                  new TableTableCell("^4.1.14", false),
                  new TableTableCell("Framework CSS de utilidades para maquetación rápida, limpia y totalmente adaptativa a dispositivos móviles y escritorio.", false),
                ],
              }),
              new TableRow({
                children: [
                  new TableTableCell("Lucide React (lucide-react)", false),
                  new TableTableCell("^0.546.0", false),
                  new TableTableCell("Conjunto de íconos vectoriales modernos utilizados en menús, tablas, acciones y paneles informativos.", false),
                ],
              }),
              new TableRow({
                children: [
                  new TableTableCell("Motion (framer-motion)", false),
                  new TableTableCell("^12.23.24", false),
                  new TableTableCell("Animaciones fluidas para modales, transiciones entre pestañas y avisos de notificación.", false),
                ],
              }),
              new TableRow({
                children: [
                  new TableTableCell("Firebase Client SDK", false),
                  new TableTableCell("^12.15.0", false),
                  new TableTableCell("Integración con Cloud Firestore para la base de datos en tiempo real y autenticación de usuarios.", false),
                ],
              }),
              new TableRow({
                children: [
                  new TableTableCell("Vite", false),
                  new TableTableCell("^6.2.3", false),
                  new TableTableCell("Empaquetador web rápido de nueva generación que optimiza la compilación y sirve el dev server.", false),
                ],
              }),
              new TableRow({
                children: [
                  new TableTableCell("Express", false),
                  new TableTableCell("^4.21.2", false),
                  new TableTableCell("Framework web para Node.js que habilita la infraestructura de servidor full-stack.", false),
                ],
              }),
              new TableRow({
                children: [
                  new TableTableCell("Docx", false),
                  new TableTableCell("^9.5.0", false),
                  new TableTableCell("Librería de Node.js utilizada para generar automáticamente este documento oficial en formato Microsoft Word (.docx).", false),
                ],
              }),
            ],
          }),

          // Section 4: Structural Architecture
          new Paragraph({
            text: "4. Estructura de Archivos del Proyecto",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• /src/App.tsx: ", bold: true, size: 22 }),
              new TextRun({ text: "Enrutador principal y controlador de la barra lateral de navegación.\n", size: 22 }),
              new TextRun({ text: "• /src/types.ts: ", bold: true, size: 22 }),
              new TextRun({ text: "Modelos de datos para Guías, Conductores, Usuarios, Roles y Vehículos.\n", size: 22 }),
              new TextRun({ text: "• /src/services/db.ts: ", bold: true, size: 22 }),
              new TextRun({ text: "Capa de sincronización híbrida entre estado en memoria, LocalStorage y Firebase Firestore.\n", size: 22 }),
              new TextRun({ text: "• /src/components/UsersList.tsx: ", bold: true, size: 22 }),
              new TextRun({ text: "Gestión avanzada de usuarios operativos, asignación de roles, contraseñas y permisos modulares.\n", size: 22 }),
              new TextRun({ text: "• /src/components/DeliveriesList.tsx: ", bold: true, size: 22 }),
              new TextRun({ text: "Control y seguimiento de guías de entrega, estados y reasignación de transportadores.\n", size: 22 }),
              new TextRun({ text: "• /src/components/MapView.tsx: ", bold: true, size: 22 }),
              new TextRun({ text: "Visualizador gráfico e interactivo de ubicaciones y mapas de rutas.\n", size: 22 }),
              new TextRun({ text: "• /src/components/ReportsView.tsx: ", bold: true, size: 22 }),
              new TextRun({ text: "Módulo analítico con gráficos interactivos e indicadores clave de rendimiento (KPIs).\n", size: 22 }),
              new TextRun({ text: "• /src/components/AuditLogsView.tsx: ", bold: true, size: 22 }),
              new TextRun({ text: "Registro histórico detallado de acciones y seguridad del sistema.", size: 22 }),
            ],
            spacing: { after: 200 },
          }),

          // Footer info
          new Paragraph({
            children: [
              new TextRun({
                text: "Documento generado automáticamente para el sistema RutaTrack - Todos los derechos reservados.",
                italic: true,
                size: 18,
                color: "78716C",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 400 },
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  const filePath = path.join(publicDir, 'Especificaciones_del_Proyecto_RutaTrack.docx');
  fs.writeFileSync(filePath, buffer);
  console.log('Document created successfully at:', filePath);
}

function TableTableCell(text, isHeader = false, bgColor = "FFFFFF") {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: text,
            bold: isHeader,
            color: isHeader ? "FFFFFF" : "1C1917",
            size: isHeader ? 20 : 18,
          }),
        ],
      }),
    ],
    shading: {
      fill: isHeader ? bgColor : "FFFFFF",
      type: ShadingType.CLEAR,
    },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "E7E5E4" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "E7E5E4" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "E7E5E4" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "E7E5E4" },
    },
    margins: {
      top: 120,
      bottom: 120,
      left: 150,
      right: 150,
    },
  });
}

createWordDoc().catch(console.error);
