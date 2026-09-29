import './style.css'
import html2pdf from 'html2pdf.js'

const app = document.querySelector('#app')

const userData = {
  name: "Antonio José Muriel Gálvez",
  initials: "AM",
  title: "Ingeniero Informático",
  subtitle: "Administrador de Sistemas & Redes | Ciberseguridad",
  bio: "Especializado en diseño de redes, administración de sistemas y seguridad informática. Apasionado por aprender, compartir conocimientos y afrontar nuevos retos tecnológicos.",
  contact: {
    email: "antoniojse2001@gmail.com",
    linkedin: "https://www.linkedin.com/in/antonio-josé-muriel-gálvez-438199229",
    github: "https://github.com/tosito1",
    whatsapp: "https://wa.me/34693045322",
    location: "Granada / Herrera, España"
  },
  languages: [
    { name: "Español", level: "Nativo", overall: "Nacido y criado en España" },
    {
      name: "Inglés",
      level: "B2",
      scores: [
        { name: "Listening", level: "B1", score: 24 },
        { name: "Reading", level: "B1", score: 32 },
        { name: "Speaking", level: "B2", score: 41 },
        { name: "Writing", level: "B2", score: 40 }
      ],
      overall: "Aptis ESOL (British Council)"
    }
  ],
  license: "Permiso de conducir B"
}

const experience = [
  {
    role: "Administrador de Sistemas (Prácticas)",
    company: "Nanobytes",
    location: "Granada, España",
    period: "Junio 2025 - Septiembre 2025",
    description: "Implementación y mantenimiento de servidores, virtualización y seguridad informática.",
    current: false
  }
]

const projects = [
  {
    title: "Seguridad en Autenticación (TFG)",
    subtitle: "Solución Passwordless FIDO2 & PrivacyIDEA",
    description: "Trabajo Fin de Grado centrado en la implementación de autenticación fuerte basada en criptografía asimétrica, eliminando el phishing mediante estándares FIDO2 y WebAuthn.",
    tags: ["FIDO2", "WebAuthn", "PrivacyIDEA", "SimpleSAMLphp", "Ciberseguridad"],
    icon: "shield",
    details: {
      features: [
        "Despliegue de infraestructura IdP/SP con SimpleSAMLphp",
        "Gestión centralizada de tokens con PrivacyIDEA",
        "Integración de llaves físicas YubiKey (FIPS & Bio)",
        "Adaptación al Esquema Nacional de Seguridad (ENS)"
      ],
      github: "https://github.com/tosito1/TFG"
    }
  },
  {
    title: "Gestión de Socios & Notificaciones",
    subtitle: "Sistema de Gestión Integral",
    description: "Aplicación con roles diferenciados, sistema de autenticación robusto y notificaciones push dinámicas.",
    tags: ["Kotlin", "Firebase", "Push Notifications"],
    icon: "users",
    details: {
      features: [
        "Sistema de roles (Admin/Usuario/Socio)",
        "Notificaciones push segmentadas vía Firebase Cloud Messaging",
        "Generación de reportes automáticos",
        "Seguridad avanzada en el acceso a datos"
      ],
      github: "https://github.com/tosito1"
    }
  },
  {
    title: "Paniculas - Gestión Cinematográfica",
    subtitle: "Sistema Web Enterprise (Java EE)",
    description: "Plataforma robusta para la administración de catálogos de películas, perfiles de usuario y reseñas profesionales.",
    tags: ["Java EE", "GlassFish", "JSP", "MVC", "DAO"],
    icon: "video",
    details: {
      features: [
        "Arquitectura MVC completa con patrón DAO",
        "Despliegue en servidor empresarial GlassFish",
        "Sistema interactivo de reseñas y calificaciones",
        "Panel administrativo con CRUD completo de contenidos"
      ],
      github: "https://github.com/tosito1/Paniculas-GlassFish"
    }
  },
  {
    title: "Cloud Computing Enterprise",
    subtitle: "Arquitectura & Despliegue Cloud",
    description: "Desarrollo y despliegue de una infraestructura en la nube escalable utilizando contenedores, automatización con Ansible y principios DevOps.",
    tags: ["Docker", "Ansible", "Cloud", "Linux", "Node.js"],
    icon: "cloud",
    details: {
      features: [
        "Infraestructura como Código (IaC) con Ansible",
        "Contenedorización completa mediante Docker",
        "Arquitectura de microservicios distribuida",
        "Administración avanzada de servidores Linux"
      ],
      github: "https://github.com/tosito1/Cloud-Computing"
    }
  },
  {
    title: "DSS - Sistemas Distribuidos & Servicios",
    subtitle: "Arquitecturas Software & Middleware",
    description: "Laboratorio avanzado que abarca desde microservicios con Spring Boot y SOA empresarial hasta aplicaciones móviles y Web Semántica.",
    tags: ["Spring Boot", "SOA", "Android", "Semantic Web", "BPEL"],
    icon: "layers",
    details: {
      features: [
        "Arquitectura SOA con Oracle SOA Suite & BPEL",
        "Microservicios con Spring Boot & Security",
        "App Android distribuida con Kotlin",
        "Modelado de conocimiento con OWL & SPARQL"
      ],
      github: "https://github.com/tosito1/DSS"
    }
  },
  {
    title: "Tratamiento Inteligente de Datos (TID)",
    subtitle: "Data Science & Machine Learning",
    description: "Pipeline completo de Ciencia de Datos: desde el análisis exploratorio y minería de reglas de asociación hasta modelos predictivos avanzados y NLP.",
    tags: ["Data Science", "Python", "KNIME", "Machine Learning", "NLP"],
    icon: "chart",
    details: {
      features: [
        "Minería de reglas de asociación (Apriori/Market Basket)",
        "Clasificación y Regresión (Random Forest, XGBoost)",
        "Procesamiento de Lenguaje Natural (IMDb sentiment)",
        "Análisis de Series Temporales financieras (Tesla stock)"
      ],
      github: "https://github.com/tosito1/TID"
    }
  },
  {
    title: "Inteligencia Computacional",
    subtitle: "Deep Learning & Optimización",
    description: "Desarrollo de redes neuronales desde cero, arquitecturas CNN avanzadas para OCR y resolución de problemas NP-difíciles (QAP) mediante Algoritmos Genéticos.",
    tags: ["TensorFlow", "Deep Learning", "Genetic Algorithms", "NumPy", "Python"],
    icon: "cpu",
    details: {
      features: [
        "OCR con CNN (99.72% accuracy en MNIST)",
        "Redes Neuronales implementadas desde cero",
        "Algoritmos Genéticos para Optimizacion Combinatoria (QAP)",
        "Estrategias evolutivas Baldwinianas y Lamarckianas"
      ],
      github: "https://github.com/tosito1/Inteligencia-Computacional"
    }
  },
  {
    title: "Paquito Flores - Android APP",
    subtitle: "Gestión de Caseta de Socios (GIDM)",
    description: "Aplicación móvil integral para la gestión de peñas y casetas, con finanzas en tiempo real, votaciones dinámicas y sincronización offline-first.",
    tags: ["Kotlin", "Jetpack Compose", "Firebase", "Firestore", "MVVM"],
    icon: "phone",
    details: {
      features: [
        "Arquitectura MVVM con Repository Pattern",
        "Sincronización en tiempo real (Firestore) y local (Room)",
        "Sistema de roles (Socio, Tesorero, Presidente, Admin)",
        "Notificaciones push segmentadas con FCM y WorkManager"
      ],
      github: "https://github.com/tosito1/Paquito-Flores"
    }
  },
  {
    title: "Museo Arqueológico de Granada",
    subtitle: "Recreación Web Full-Stack (SSBW)",
    description: "Plataforma web completa desarrollada desde el scraping de datos inicial hasta el despliegue de una API REST protegida y testing E2E automatizado.",
    tags: ["Node.js", "Express", "PostgreSQL", "Prisma", "Docker"],
    icon: "museum",
    details: {
      features: [
        "Arquitectura Backend con Express & Prisma ORM",
        "Diseño de interfaz con Nunjucks & CSS Premium",
        "Infraestructura en contenedores Docker (PostgreSQL)",
        "Automatización con Playwright (Scraping & E2E Testing)"
      ],
      github: "https://github.com/tosito1/Museo-Arqueologico"
    }
  },
  {
    title: "Hexápodo con IA Autónoma",
    subtitle: "Visión Artificial, NLP & Robótica",
    description: "Robot hexápodo capaz de detectar intrusos, navegar de forma segura mediante CNNs en el edge y responder a comandos de voz con modelos Transformer.",
    tags: ["TFLite", "Raspberry Pi", "Whisper", "Python", "Computer Vision"],
    icon: "robot",
    details: {
      features: [
        "Detección de intrusos con Edge AI (99.8% Precision)",
        "Navegación segura con CNN customizada (99.58% Accuracy)",
        "Interacción por voz basada en OpenAI Whisper",
        "Arquitectura multihilo y máquina de estados robusta"
      ],
      github: "https://github.com/tosito1/Robot-Hexapodo-IA"
    }
  }
]

const certificates = [
  {
    title: "Aptis ESOL International Certificate: B2",
    issuer: "British Council",
    date: "2023",
    icon: "award"
  },
  {
    title: "Cisco® CCNA v7: ENSA",
    issuer: "Cisco Networking Academy",
    date: "2024",
    icon: "award"
  },
  {
    title: "Cisco® CCNA v7: SRWE",
    issuer: "Cisco Networking Academy",
    date: "2023",
    icon: "award"
  },
  {
    title: "Cisco® CCNA v7: ITN",
    issuer: "Cisco Networking Academy",
    date: "2022",
    icon: "award"
  },
  {
    title: "Curso Avanzado FIWARE",
    issuer: "Telefónica (La Lonja)",
    date: "2023",
    icon: "award"
  }
]

const education = [
  {
    degree: "Máster en Ingeniería Informática",
    institution: "Universidad de Granada",
    period: "2024 - Actualidad",
    status: "En curso"
  },
  {
    degree: "Grado en Ingeniería Informática",
    institution: "Universidad de Huelva",
    period: "2020 - 2024",
    status: "Completado"
  }
]

const skillCategories = [
  {
    category: "Lenguajes de Programación",
    skills: ["Python", "C++", "Java", "Kotlin", "JavaScript", "SQL", "Bash"]
  },
  {
    category: "Redes & Ciberseguridad",
    skills: ["Cisco CCNA", "OSPF", "BGP", "VLANs", "Kali Linux", "Metasploit", "Wireshark"]
  },
  {
    category: "Infraestructura & Cloud",
    skills: ["Docker", "Kubernetes", "Virtualización", "Linux", "Windows Server", "AWS", "Azure", "GCP"]
  },
  {
    category: "Inteligencia Artificial & IoT",
    skills: ["TensorFlow", "PyTorch", "OpenCV", "Raspberry Pi", "Arduino"]
  }
]

// SVG Icons
const icons = {
  shield: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`,
  robot: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="10" x="3" y="11" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" x2="8" y1="16" y2="16"/><line x1="16" x2="16" y1="16" y2="16"/><path d="M9 21v-5h6v5"/><path d="M5 11V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4"/></svg>`,
  chat: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z"/><path d="M20 9v11a2 2 0 0 1-2 2H6l4-4h8a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"/></svg>`,
  users: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  award: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>`,
  calendar: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`,
  building: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>`,
  location: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  mail: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  linkedin: `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z"/></svg>`,
  github: `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"/></svg>`,
  whatsapp: `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>`,
  museum: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 22h20"/><path d="M6 12v10"/><path d="M10 12v10"/><path d="M14 12v10"/><path d="M18 12v10"/><path d="M2 10h20l-10-8-10 8Z"/></svg>`,
  arrow: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`,
  arrowLeft: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m11 17-5-5 5-5"/><path d="M18 12H6"/></svg>`,
  code: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  server: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>`,
  cloud: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>`,
  cpu: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>`,
  phone: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z"/></svg>`,
  arrowUp: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>`,
  video: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>`,
  close: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
  database: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/></svg>`,
  layers: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>`,
  chart: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>`,
  download: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="3" y2="15"/></svg>`,
  globe: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  car: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9C2.1 11.6 2 12.1 2 12.6V16c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>`
}

const skillIcons = {
  "Lenguajes de Programación": icons.code,
  "Redes & Ciberseguridad": icons.shield,
  "Infraestructura & Cloud": icons.cloud,
  "Inteligencia Artificial & IoT": icons.cpu
}

// Render Social Links Shared Helper
const renderSocialLinks = () => `
  <ul class="example-2">
    <li class="icon-content">
      <a href="${userData.contact.linkedin}" data-social="linkedin" aria-label="LinkedIn" target="_blank" class="social-btn">
        <div class="filled"></div>
        ${icons.linkedin}
        <span class="pdf-only-link-text">${userData.contact.linkedin}</span>
        <div class="tooltip">LinkedIn</div>
      </a>
    </li>
    <li class="icon-content">
      <a href="${userData.contact.github}" data-social="github" aria-label="GitHub" target="_blank" class="social-btn">
        <div class="filled"></div>
        ${icons.github}
        <span class="pdf-only-link-text">${userData.contact.github}</span>
        <div class="tooltip">GitHub</div>
      </a>
    </li>
    <li class="icon-content">
      <a href="${userData.contact.whatsapp}" data-social="whatsapp" aria-label="WhatsApp" target="_blank" class="social-btn">
        <div class="filled"></div>
        ${icons.whatsapp}
        <span class="pdf-only-link-text">${userData.contact.whatsapp}</span>
        <div class="tooltip">WhatsApp</div>
      </a>
    </li>
    <li class="icon-content">
      <a href="mailto:${userData.contact.email}" data-social="email" aria-label="Email" class="social-btn">
        <div class="filled"></div>
        ${icons.mail}
        <span class="pdf-only-link-text">${userData.contact.email}</span>
        <div class="tooltip">Email</div>
      </a>
    </li>
  </ul>
`

// Render Background Animation
const renderBackground = () => `
  <div class="bg-animation">
    <div class="grid-pattern"></div>
    <div class="particles">
      ${Array(20).fill(0).map((_, i) => `
        <div class="particle" style="
          left: ${Math.random() * 100}%;
          top: ${Math.random() * 100}%;
          animation-delay: ${Math.random() * 20}s;
          animation-duration: ${15 + Math.random() * 10}s;
        "></div>
      `).join('')}
    </div>
  </div>
`

// Render Hero Section
const renderHero = () => `
  <section id="hero" class="hero">
    ${renderBackground()}
    <div class="hero-content">
      <div class="avatar-wrapper">
        <div class="avatar">
          <img src="foto-cv.jpg" alt="${userData.name}" style="width: 100%; height: 100%; object-fit: cover; object-position: center 35%; border-radius: 50%;">
        </div>
        <div class="status-indicator" title="Disponible para proyectos"></div>
      </div>
      <h1 class="gradient-text">${userData.name}</h1>
      <p class="hero-subtitle">
        <span class="typing-text">${userData.title}</span>
      </p>
      <p class="hero-description">${userData.bio}</p>
      <div class="hero-actions">
        <a href="#contact" class="btn btn-primary">Contacto</a>
        <a href="#projects" class="btn btn-secondary">Proyectos</a>
      </div>
      <div class="social-links-hero">
        ${renderSocialLinks()}
      </div>
    </div>
  </section>
`

// Render Experience
const renderExperience = () => `
  <section id="experience" class="container reveal">
    <div class="section-header">
      <h2 class="gradient-text">Experiencia Profesional</h2>
      <p>Mi trayectoria en el mundo de la tecnología</p>
    </div>
    ${experience.map(exp => `
      <div class="experience-card">
        <div class="experience-header">
          <div>
            <h3 class="experience-title">${exp.role}</h3>
            <p class="experience-company">
              ${icons.building}
              ${exp.company} · ${exp.location}
            </p>
          </div>
          <span class="experience-badge">${exp.current ? 'Actual' : exp.period}</span>
        </div>
        <p class="experience-description">${exp.description}</p>
      </div>
    `).join('')}
  </section>
`

// Render Projects
const renderProjects = () => `
  <section id="projects" class="container reveal">
    <div class="section-header">
      <h2 class="gradient-text">Proyectos Destacados</h2>
      <p>Algunos de los proyectos en los que he trabajado</p>
    </div>
    <div class="projects-grid">
      ${projects.map((project, index) => `
        <div class="card reveal reveal-delay-${(index % 4) + 1}">
          <div class="card-icon">
            ${icons[project.icon]}
          </div>
          <h3>${project.title}</h3>
          <p class="project-subtitle" style="color: var(--accent-tertiary); font-size: 0.85rem; margin-bottom: 0.5rem;">${project.subtitle}</p>
          <p>${project.description}</p>
          <div class="tags">
            ${project.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
          <a href="${project.title.toLowerCase().includes('paniculas') ? '#proyecto/paniculas' :
    project.title.toLowerCase().includes('cloud') ? '#proyecto/cloud' :
      project.title.toLowerCase().includes('dss') ? '#proyecto/dss' :
        project.title.toLowerCase().includes('tid') ? '#proyecto/tid' :
          project.title.toLowerCase().includes('computacional') ? '#proyecto/ic' :
            project.title.toLowerCase().includes('paquito') ? '#proyecto/paquito' :
              project.title.toLowerCase().includes('museo') ? '#proyecto/museo' :
                project.title.toLowerCase().includes('hex') ? '#proyecto/hexapodo' :
                  project.title.toLowerCase().includes('seguridad') ? '#proyecto/tfg' :
                    '#'}" class="card-link">
            Ver detalles
            ${icons.arrow}
          </a>
        </div>
      `).join('')}
    </div>
  </section>
`

// Render Certificates
const renderCertificates = () => `
  <section id="certificates" class="container reveal">
    <div class="section-header">
      <h2 class="gradient-text">Certificaciones</h2>
      <p>Formación y certificaciones obtenidas</p>
    </div>
    <div class="certificates-grid">
      ${certificates.map((cert, index) => `
        <div class="certificate-card reveal reveal-delay-${(index % 3) + 1}">
          <div class="certificate-icon">
            ${icons[cert.icon]}
          </div>
          <div class="certificate-content">
            <h3>${cert.title}</h3>
            <p>${cert.issuer}</p>
            <span class="certificate-date">
              ${icons.calendar}
              ${cert.date}
            </span>
          </div>
        </div>
      `).join('')}
    </div>
  </section>
`

// Render Education
const renderEducation = () => `
  <section id="education" class="container reveal">
    <div class="section-header">
      <h2 class="gradient-text">Formación Académica</h2>
      <p>Mi recorrido educativo</p>
    </div>
    <div class="timeline">
      ${education.map((edu, index) => `
        <div class="timeline-item reveal reveal-delay-${(index % 2) + 1}">
          <div class="timeline-content">
            <span class="timeline-period">${edu.period}</span>
            <h3>${edu.degree}</h3>
            <p>
              ${icons.building}
              ${edu.institution}
            </p>
            <span style="display: inline-block; margin-top: 0.5rem; font-size: 0.8rem; color: ${edu.status === 'En curso' ? 'var(--accent-tertiary)' : 'var(--success)'};">
              ${edu.status === 'En curso' ? '📚 En curso' : '✓ Completado'}
            </span>
          </div>
        </div>
      `).join('')}
    </div>
  </section>
`

// Render Skills
const renderSkills = () => `
  <section id="skills" class="container reveal">
    <div class="section-header">
      <h2 class="gradient-text">Habilidades Técnicas</h2>
      <p>Tecnologías y herramientas que domino</p>
    </div>
    <div class="skills-container">
      ${skillCategories.map((cat, index) => `
        <div class="skill-category reveal reveal-delay-${(index % 4) + 1}">
          <h3 class="skill-category-title">
            ${skillIcons[cat.category] || icons.code}
            ${cat.category}
          </h3>
          <div class="skills-grid">
            ${cat.skills.map(skill => `
              <span class="skill-tag">${skill}</span>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  </section>
`

// Render Contact
const renderContact = () => `
  <section id="contact" class="container reveal">
    <div class="section-header">
      <h2 class="gradient-text">Contacto</h2>
      <p>¿Tienes un proyecto en mente? Hablemos</p>
    </div>
    <div class="contact-grid">
      <a href="mailto:${userData.contact.email}" class="contact-card">
        <div class="contact-icon">
          ${icons.mail}
        </div>
        <div class="contact-info">
          <h3>Email</h3>
          <p>${userData.contact.email}</p>
        </div>
      </a>
      <a href="${userData.contact.linkedin}" target="_blank" class="contact-card">
        <div class="contact-icon">
          ${icons.linkedin}
        </div>
        <div class="contact-info">
          <h3>LinkedIn</h3>
          <p>Conecta conmigo</p>
        </div>
      </a>
      <a href="${userData.contact.github}" target="_blank" class="contact-card">
        <div class="contact-icon">
          ${icons.github}
        </div>
        <div class="contact-info">
          <h3>GitHub</h3>
          <p>Ver mi código</p>
        </div>
      </a>
      <a href="${userData.contact.whatsapp}" target="_blank" class="contact-card">
        <div class="contact-icon">
          ${icons.phone}
        </div>
        <div class="contact-info">
          <h3>WhatsApp</h3>
          <p>Envía un mensaje</p>
        </div>
      </a>
    </div>
  </section>
`

// Render Languages Section
const renderLanguages = () => `
  <section id="languages" class="container reveal">
    <div class="section-header">
      <h2 class="gradient-text">Idiomas</h2>
      <p>Competencia lingüística acreditada</p>
    </div>
    <div class="languages-grid">
      ${userData.languages.map(lang => `
        <div class="language-card">
          <div class="language-content">
            <div class="language-main">
              <div class="language-icon">
                ${icons.globe}
              </div>
              <div class="language-info">
                <h3>${lang.name}</h3>
                <div class="language-level-wrapper">
                  <span class="language-level-text">${lang.level}</span>
                  ${lang.overall ? `<span class="language-overall">${lang.overall}</span>` : ''}
                  <div class="language-bar">
                    <div class="language-progress" style="width: ${lang.level.toLowerCase().includes('nativo') ? '100%' :
    lang.level.includes('C2') ? '95%' :
      lang.level.includes('C1') ? '85%' :
        lang.level.includes('B2') ? '70%' :
          lang.level.includes('B1') ? '55%' : '40%'
  }"></div>
                  </div>
                </div>
              </div>
            </div>
            ${lang.scores ? `
              <div class="language-scores">
                ${lang.scores.map(s => `
                  <div class="score-item">
                    <span class="score-name">${s.name}</span>
                    <span class="score-level">${s.level}</span>
                    <span class="score-value">${s.score}/50</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  </section>
`

// Render Other Information Section
const renderOtherInfo = () => `
  <section id="other-info" class="container reveal">
    <div class="section-header">
      <h2 class="gradient-text">Otra Información</h2>
      <p>Certificaciones adicionales y permisos</p>
    </div>
    <div class="contact-grid">
      <div class="contact-card">
        <div class="contact-icon">
          ${icons.car}
        </div>
        <div class="contact-info">
          <h3>Permiso de Conducir</h3>
          <p>${userData.license}</p>
        </div>
      </div>
    </div>
  </section>
`

// Render Footer
const renderFooter = () => `
  <footer>
    <div class="footer-content">
      <div class="footer-logo">${userData.name}</div>
      <p style="color: var(--text-secondary); margin-bottom: 1rem;">${userData.title}</p>
      <div class="footer-social">
        ${renderSocialLinks()}
      </div>
      <p class="footer-text">
        &copy; ${new Date().getFullYear()} Portfolio. Diseñado con pasión.
        <br>
        <span style="margin-top: 0.5rem; display: inline-block; color: var(--text-muted);">
          ${icons.location} ${userData.contact.location}
        </span>
      </p>
    </div>
  </footer>
`

// Project Detail View
const renderProjectPaniculas = () => `
  <div class="project-page">
    <div class="container reveal">
      <a href="#home" class="project-back-btn">
        ${icons.arrowLeft} Volver al Portfolio
      </a>
      
      <header class="project-hero">
        <h1 class="gradient-text">Paniculas</h1>
        <p class="modal-subtitle">Gestión Cinematográfica | Java Enterprise Edition</p>
      </header>

      <div class="project-grid">
        <div class="project-main-content">
          <section>
            <h2>1. Descripción del proyecto</h2>
            <p>Panículas es una aplicación web desarrollada en <strong>Java Enterprise Edition</strong> desplegada sobre un servidor de aplicaciones <strong>GlassFish</strong>.</p>
            <p>El objetivo del proyecto es implementar una aplicación web completa utilizando el stack clásico de Java EE, integrando backend, lógica de negocio y despliegue en servidor empresarial.</p>
            <p>Los servidores de aplicaciones como GlassFish permiten ejecutar aplicaciones empresariales Java proporcionando servicios como contenedores de servlets, gestión de seguridad, persistencia y despliegue de aplicaciones web.</p>
            <p>Este tipo de arquitectura es habitual en entornos corporativos donde se requieren aplicaciones escalables y estructuradas en capas.</p>
          </section>

          <section>
            <h2>2. Arquitectura del proyecto</h2>
            <p>El proyecto sigue una arquitectura típica de aplicaciones Java EE, donde la aplicación se ejecuta dentro de un servidor de aplicaciones.</p>
            
            <div class="architecture-container">
              <div class="arch-node">Cliente (Navegador)</div>
              <div class="arch-arrow">▼ HTTP</div>
              <div class="arch-node">Servidor GlassFish</div>
              <div class="arch-arrow">▼</div>
              <div class="arch-node">Controladores (Servlets)</div>
              <div class="arch-arrow">▼</div>
              <div class="arch-node">Lógica de Negocio</div>
              <div class="arch-arrow">▼</div>
              <div class="arch-node">Base de Datos (MySQL)</div>
            </div>

            <p>El servidor de aplicaciones implementa el estándar Java EE, proporcionando soporte para tecnologías como Servlets, JSP, JSF, JPA, EJB y Web Services.</p>
          </section>

          <section>
            <h2>4. ¿Qué aprendí en este proyecto?</h2>
            <ul class="learning-list">
              <li class="learning-item"><strong>Desarrollo Java EE:</strong> Estructuración de aplicaciones web, lógica de servidor y organización en capas.</li>
              <li class="learning-item"><strong>Despliegue Empresarial:</strong> Trabajo con GlassFish, gestión de archivos .war y configuración de dominios.</li>
              <li class="learning-item"><strong>Arquitectura Cliente-Servidor:</strong> Comprensión profunda del flujo HTTP y generación dinámica de contenido.</li>
              <li class="learning-item"><strong>Entornos Corporativos:</strong> Enfoque en escalabilidad, modularidad y mantenimiento a largo plazo.</li>
            </ul>
          </section>

          <section>
            <h2>5. Retos técnicos encontrados</h2>
            <p>Durante el desarrollo, me enfrenté a retos como la configuración inicial del servidor GlassFish, el manejo del ciclo de vida de la aplicación web y la resolución de errores de dependencias en un entorno de servidor real.</p>
          </section>

            <p>El resultado es una aplicación web funcional que demuestra habilidades en desarrollo backend robusto, uso de servidores empresariales y arquitectura de sistemas complejos.</p>
          </section>

          <div style="margin-top: 5rem; text-align: center;">
            <a href="#home" class="btn btn-secondary">
              ${icons.arrowLeft} Volver al Inicio
            </a>
          </div>
        </div>

        <aside class="project-sidebar">
          <div class="sidebar-card">
            <h3>Tecnologías utilizadas</h3>
            <div class="tech-list-detailed">
              <div class="tech-item-detailed">
                <strong>Backend</strong>
                <span>Java EE, Servlets, JSP, MVC</span>
              </div>
              <div class="tech-item-detailed">
                <strong>Servidor</strong>
                <span>GlassFish 5.1 (Implementación de referencia)</span>
              </div>
              <div class="tech-item-detailed">
                <strong>Base de Datos</strong>
                <span>MySQL con conexión JDBC</span>
              </div>
              <div class="tech-item-detailed">
                <strong>Herramientas</strong>
                <span>NetBeans / IntelliJ, Git, GitHub</span>
              </div>
            </div>
          </div>
          
          <div class="sidebar-card">
            <h3>Repositorio</h3>
            <a href="https://github.com/tosito1/Paniculas-GlassFish" target="_blank" class="btn btn-primary" style="width: 100%;">
              ${icons.github} Ver código fuente
            </a>
          </div>
        </aside>
      </div>
    </div>
  </div>
`

// Render Scroll to Top Button
const renderScrollTop = () => `
  <button class="scroll-top" id="scrollTop" aria-label="Volver arriba">
    ${icons.arrowUp}
  </button>
`

// Mobile menu toggle
const createMobileMenu = () => {
  const menuToggle = document.querySelector('.menu-toggle')
  const navLinks = document.querySelector('.nav-links')

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('active')
      navLinks.classList.toggle('active')
    })

    // Close menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('active')
        navLinks.classList.remove('active')
      })
    })
  }
}

// Header scroll effect
const handleHeaderScroll = () => {
  const header = document.querySelector('header')
  const scrollTop = document.getElementById('scrollTop')

  window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
      header?.classList.add('scrolled')
      scrollTop?.classList.add('visible')
    } else {
      header?.classList.remove('scrolled')
      scrollTop?.classList.remove('visible')
    }
  })

  scrollTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  })
}

// Intersection Observer for reveal animations
const initRevealAnimations = () => {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active')
      }
    })
  }, observerOptions)

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
}

// Project Detail View - Cloud Computing
const renderProjectCloud = () => `
  <div class="project-page">
    <div class="container reveal">
      <a href="#home" class="project-back-btn">
        ${icons.arrowLeft} Volver al Portfolio
      </a>
      
      <header class="project-hero">
        <h1 class="gradient-text">Cloud Computing</h1>
        <p class="modal-subtitle">Proyecto Académico | Máster en Ingeniería Informática</p>
      </header>

      <div class="project-grid">
        <div class="project-main-content">
          <section>
            <h2>1. Descripción del proyecto</h2>
            <p>Este proyecto consiste en el desarrollo y despliegue de una aplicación en un entorno de computación en la nube, aplicando los principios de arquitectura cloud moderna.</p>
            <p>El objetivo fue diseñar una infraestructura capaz de ejecutar aplicaciones de forma escalable, distribuida y reproducible, utilizando herramientas de virtualización, contenedores y automatización del despliegue.</p>
            <p>La computación en la nube permite desplegar aplicaciones en infraestructuras remotas bajo demanda, utilizando modelos de servicio como IaaS, PaaS o SaaS, que abstraen la gestión del hardware y permiten escalar recursos dinámicamente.</p>
          </section>

          <section>
            <h2>2. Arquitectura del sistema</h2>
            <p>El proyecto implementa una arquitectura distribuida basada en microservicios, optimizada para entornos cloud escalables.</p>
            
            <div class="architecture-container">
              <div class="arch-node">Usuario</div>
              <div class="arch-arrow">▼ HTTP</div>
              <div class="arch-node">Load Balancer / Reverse Proxy</div>
              <div class="arch-arrow">▼</div>
              <div class="arch-node">Aplicación en Contenedores (Docker)</div>
              <div class="arch-arrow">▼</div>
              <div class="arch-node">Base de Datos / Backend Services</div>
            </div>

            <p>Esta estructura permite que cada componente se escale de forma independiente según la carga del sistema, un principio fundamental del Cloud Computing moderno.</p>
          </section>

          <section>
            <h2>3. Tecnologías clave</h2>
            <p><strong>Docker:</strong> Utilizado para la contenedorización, garantizando la reproducibilidad y aislamiento de dependencias.</p>
            <p><strong>Ansible:</strong> Implementación de Infrastructure as Code (IaC) para la automatización total de la configuración y despliegue de servidores.</p>
            <p><strong>Virtualización:</strong> Uso de máquinas virtuales (VM) para simular entornos cloud reales mediante hipervisores.</p>
          </section>

          <section>
            <h2>4. Conceptos y Aprendizajes</h2>
            <ul class="learning-list">
              <li class="learning-item"><strong>Contenedorización:</strong> Empaquetado de aplicaciones consistentes con Docker.</li>
              <li class="learning-item"><strong>Infraestructura como Código:</strong> Automatización reproducible del despliegue con Ansible.</li>
              <li class="learning-item"><strong>Arquitecturas Escalables:</strong> Diseño de sistemas preparados para escalado horizontal.</li>
              <li class="learning-item"><strong>Administración Linux:</strong> Gestión avanzada de servidores y networking en entornos cloud.</li>
            </ul>
          </section>

          <section>
            <h2>5. Retos técnicos</h2>
            <p>Los principales retos incluyeron la resolución de dependencias en entornos distribuidos, la configuración precisa de redes entre contenedores y la automatización de procesos de despliegue complejos para asegurar una infraestructura robusta.</p>
          </section>

          <section>
            <h2>6. Resultado</h2>
            <p>Un entorno cloud realista que demuestra la capacidad de diseñar, automatizar y gestionar infraestructuras modernas basadas en microservicios y contenedores.</p>
          </section>

          <div style="margin-top: 5rem; text-align: center;">
            <a href="#home" class="btn btn-secondary">
              ${icons.arrowLeft} Volver al Inicio
            </a>
          </div>
        </div>

        <aside class="project-sidebar">
          <div class="sidebar-card">
            <h3>Stack Tecnológico</h3>
            <div class="tech-list-detailed">
              <div class="tech-item-detailed">
                <strong>Infraestructura</strong>
                <span>Docker, Ansible, Linux, VM</span>
              </div>
              <div class="tech-item-detailed">
                <strong>Backend</strong>
                <span>Node.js, Express, MongoDB</span>
              </div>
              <div class="tech-item-detailed">
                <strong>Arquitectura</strong>
                <span>REST API, Microservicios, IaaS</span>
              </div>
              <div class="tech-item-detailed">
                <strong>DevOps</strong>
                <span>Git, GitHub, Automatización</span>
              </div>
            </div>
          </div>
          
          <div class="sidebar-card">
            <h3>Repositorio</h3>
            <a href="https://github.com/tosito1/Cloud-Computing" target="_blank" class="btn btn-primary" style="width: 100%;">
              ${icons.github} Ver código fuente
            </a>
          </div>
        </aside>
      </div>
    </div>
  </div>
`

// Project Detail View - DSS
const renderProjectDSS = () => `
  <div class="project-page">
    <div class="container reveal">
      <a href="#home" class="project-back-btn">
        ${icons.arrowLeft} Volver al Portfolio
      </a>
      
      <header class="project-hero">
        <h1 class="gradient-text">Desarrollo de Sistemas de Software</h1>
        <p class="modal-subtitle">Componentes y Servicios | Sistemas Distribuidos</p>
      </header>

      <div class="project-grid">
        <div class="project-main-content">
          <section>
            <h2>Laboratorio de Arquitecturas Software</h2>
            <p>Este proyecto es un compendio de 5 prácticas avanzadas que exploran diferentes paradigmas de construcción de software moderno y distribuido.</p>
          </section>

          <section>
            <h2>1. Aplicación Web & API (Spring Boot)</h2>
            <p>Desarrollo de un backend robusto para la gestión de productos con seguridad avanzada.</p>
            <ul class="learning-list">
              <li class="learning-item"><strong>Seguridad:</strong> RBAC (Role-Based Access Control) con Spring Security.</li>
              <li class="learning-item"><strong>Backend:</strong> REST API consumible, exportación SQL y base de datos H2.</li>
            </ul>
          </section>

          <section>
            <h2>2. Arquitectura SOA Empresarial</h2>
            <p>Implementación de servicios distribuidos mediante el paradigma SOA utilizando el stack de Oracle.</p>
            <div class="architecture-container">
              <div class="arch-node">Cliente (SOAP)</div>
              <div class="arch-arrow">▼</div>
              <div class="arch-node">Oracle SOA Suite</div>
              <div class="arch-arrow">▼ Orquestación</div>
              <div class="arch-node">Procesos BPEL</div>
              <div class="arch-arrow">▼</div>
              <div class="arch-node">Servicios WSDL/XML</div>
            </div>
          </section>

          <section>
            <h2>3. Cliente Móvil Android (Kotlin)</h2>
            <p>App nativa sincronizada en tiempo real con el backend de Spring Boot.</p>
            <ul class="learning-list">
              <li class="learning-item"><strong>Integración:</strong> Consumo de APIs REST y sincronización de carrito.</li>
              <li class="learning-item"><strong>Funciones:</strong> Geoposicionamiento de tiendas en mapas.</li>
            </ul>
          </section>

          <section>
            <h2>4 & 5. Web Semántica e Inferencia</h2>
            <p>Modelado de conocimiento complejo y consultas de grafos.</p>
            <ul class="learning-list">
              <li class="learning-item"><strong>Ontologías:</strong> Diseño OWL con Protégé y razonadores semánticos.</li>
              <li class="learning-item"><strong>Explotación:</strong> Consultas avanzadas SPARQL para deducción de datos.</li>
            </ul>
          </section>

          <div style="margin-top: 5rem; text-align: center;">
            <a href="#home" class="btn btn-secondary">
              ${icons.arrowLeft} Volver al Inicio
            </a>
          </div>
        </div>

        <aside class="project-sidebar">
          <div class="sidebar-card">
            <h3>Stack Multitecnológico</h3>
            <div class="tech-list-detailed">
              <div class="tech-item-detailed">
                <strong>Backend & Web</strong>
                <span>Spring Boot, Security, Java, JSP</span>
              </div>
              <div class="tech-item-detailed">
                <strong>Móvil</strong>
                <span>Android, Kotlin, REST Client</span>
              </div>
              <div class="tech-item-detailed">
                <strong>Middleware SOA</strong>
                <span>Oracle SOA Suite, BPEL, SOAP, WSDL</span>
              </div>
              <div class="tech-item-detailed">
                <strong>Web Semántica</strong>
                <span>Protégé, OWL, SPARQL, RDF</span>
              </div>
            </div>
          </div>
          
          <div class="sidebar-card">
            <h3>Repositorio</h3>
            <a href="https://github.com/tosito1/DSS" target="_blank" class="btn btn-primary" style="width: 100%;">
              ${icons.github} Ver repositorio
            </a>
          </div>
        </aside>
      </div>
    </div>
  </div>
`

// Project Detail View - TID (Tratamiento Inteligente de Datos)
const renderProjectTID = () => `
  <div class="project-page">
    <div class="container reveal">
      <a href="#home" class="project-back-btn">
        ${icons.arrowLeft} Volver al Portfolio
      </a>
      
      <header class="project-hero">
        <h1 class="gradient-text">Tratamiento Inteligente de Datos</h1>
        <p class="modal-subtitle">Data Science | Machine Learning | Minería de Datos</p>
      </header>

      <div class="project-grid">
        <div class="project-main-content">
          <section>
            <h2>Ciencia de Datos Aplicada</h2>
            <p>Este proyecto es un laboratorio intensivo de Data Science que cubre desde la visualización exploratoria hasta el despliegue de modelos complejos de Deep Learning y NLP sobre datasets reales de diversos dominios.</p>
          </section>

          <div class="practice-grid">
            <div class="practice-card reveal">
              <span class="practice-tag">PRÍCTICA 1</span>
              <h3>Análisis Exploratorio (EDA)</h3>
              <p>Estadística descriptiva y visualización avanzada (NBA/Finanzas) con KNIME. Análisis de outliers, correlaciones de Pearson y diagramas multinivel.</p>
            </div>
            
            <div class="practice-card reveal">
              <span class="practice-tag">PRÍCTICA 2</span>
              <h3>Preparación & Limpieza</h3>
              <p>Pipelines de datos críticos: Imputación de nulos, reducción de dimensionalidad con PCA, balanceo de clases con SMOTE y discretización CAIM.</p>
            </div>

            <div class="practice-card reveal">
              <span class="practice-tag">PRÍCTICA 3</span>
              <h3>Association Rules (Apriori)</h3>
              <p>Market Basket Analysis aplicado a retail. Generación de itemsets frecuentes y reglas de asociación basadas en Support, Confidence y Lift.</p>
            </div>

            <div class="practice-card reveal">
              <span class="practice-tag">PRÍCTICA 4</span>
              <h3>Clustering No Supervisado</h3>
              <p>Segmentación de perfiles mediante K-Means, DBSCAN y clustering jerárquico. Reconstrucción de categorías químicas de vinos y roles deportivos.</p>
            </div>

            <div class="practice-card reveal">
              <span class="practice-tag">PRÍCTICA 5</span>
              <h3>Predictor de Rendimiento</h3>
              <p>Feature Engineering avanzado para crear métricas ofensivas/defensivas personalizadas y clasificación con Random Forest de alto rendimiento.</p>
            </div>

            <div class="practice-card reveal">
              <span class="practice-tag">PRÍCTICA 6</span>
              <h3>Predicción de Siniestralidad</h3>
              <p>Modelado de machine learning sobre 28,000 registros para predecir fatalidad en accidentes con Decision Trees, SVM y Naive Bayes.</p>
            </div>

            <div class="practice-card reveal">
              <span class="practice-tag">PRÍCTICA 8</span>
              <h3>NLP & Sentiment Analysis</h3>
              <p>Clasificación automática de reseñas IMDb mediante procesamiento de texto (TF-IDF, Bag of Words) y árboles de decisión distribuidos.</p>
            </div>

            <div class="practice-card reveal">
              <span class="practice-tag">PRÍCTICA 9</span>
              <h3>Series Temporales Financieras</h3>
              <p>Predicción de valores bursátiles (Tesla) con Python. Uso de Medias Móviles, Transformada de Fourier para ruido y regressores XGBoost.</p>
            </div>
          </div>

          <section>
            <h2>Principales Conclusiones</h2>
            <p>A lo largo de este proyecto, he consolidado el ciclo de vida completo de un proyecto TID: desde la recolección y limpieza hasta la inferencia y visualización de resultados en entornos profesionales de computación distribuida.</p>
          </section>

          <div style="margin-top: 5rem; text-align: center;">
            <a href="#home" class="btn btn-secondary">
              ${icons.arrowLeft} Volver al Inicio
            </a>
          </div>
        </div>

        <aside class="project-sidebar">
          <div class="sidebar-card">
            <h3>Stack Tecnológico</h3>
            <div class="tech-list-detailed">
              <div class="tech-item-detailed">
                <strong>Análisis & Workflow</strong>
                <span>KNIME Analytics Platform, Google Colab</span>
              </div>
              <div class="tech-item-detailed">
                <strong>Ciencia de Datos</strong>
                <span>Python (Pandas, Scikit-learn, Scipy)</span>
              </div>
              <div class="tech-item-detailed">
                <strong>ML Avanzado</strong>
                <span>XGBoost, Statsmodels, SMOTE</span>
              </div>
              <div class="tech-item-detailed">
                <strong>Visualización</strong>
                <span>Seaborn, Matplotlib, Plotly</span>
              </div>
            </div>
          </div>
          
          <div class="sidebar-card">
            <h3>Repositorio</h3>
            <a href="https://github.com/tosito1/TID" target="_blank" class="btn btn-primary" style="width: 100%;">
              ${icons.github} Ver repositorio
            </a>
          </div>
        </aside>
      </div>
    </div>
  </div>
`

// Project Detail View - IC (Inteligencia Computacional)
const renderProjectIC = () => `
  <div class="project-page">
    <div class="container reveal">
      <a href="#home" class="project-back-btn">
        ${icons.arrowLeft} Volver al Portfolio
      </a>
      
      <header class="project-hero">
        <h1 class="gradient-text">Inteligencia Computacional</h1>
        <p class="modal-subtitle">Deep Learning & Optimización Evolutiva en Problemas Complejos</p>
      </header>

      <div class="project-grid">
        <div class="project-main-content">
          <section>
            <h2>Visión Artificial & Metaheurísticas</h2>
            <p>Este proyecto recopila investigaciones prácticas sobre el diseño de modelos de aprendizaje profundo y algoritmos metaheurísticos aplicados a problemas NP-difíciles y reconocimiento de patrones.</p>
          </section>

          <section>
            <h2>1. Reconocimiento Óptico (OCR) con Deep Learning</h2>
            <p>Evolución desde implementaciones manuales con NumPy hasta arquitecturas SOTA (State of the Art) para el dataset MNIST.</p>
            
            <div class="practice-grid">
              <div class="practice-card">
                <span class="practice-tag">ALGO DESDE CERO</span>
                <h3>Matemática de Redes</h3>
                <p>Implementación manual de <strong>Forward/Backpropagation</strong>. Uso de inicializaciones avanzadas como <strong>He Initialization</strong> y <strong>Xavier/Glorot</strong> para estabilidad de gradientes.</p>
              </div>
              <div class="practice-card">
                <span class="practice-tag">MODELOS DEEP</span>
                <h3>MLP & CNN</h3>
                <p>Comparativa entre Perceptrones Multicapa con activaciones <strong>Leaky ReLU</strong> y Redes Convolucionales con <strong>Global Average Pooling</strong>.</p>
              </div>
            </div>

            <div class="sidebar-card" style="margin: 2rem 0; width: 100%;">
              <h3>Resultados Experimentales</h3>
              <ul class="learning-list" style="columns: 2;">
                <li>Red Manual: <strong>91.22%</strong></li>
                <li>MLP: <strong>98.08%</strong></li>
                <li style="color: var(--accent-primary);">CNN Optimizada: <strong>99.72%</strong></li>
                <li>Optimización im2col con NumPy</li>
              </ul>
            </div>

            <h3>Regularización y Robustez</h3>
            <p>Para alcanzar el 99.72%, se aplicó un pipeline de entrenamiento avanzado:</p>
            <ul class="learning-list">
              <li class="learning-item"><strong>Optimización:</strong> AdamW con ReduceLROnPlateau y Early Stopping.</li>
              <li class="learning-item"><strong>Regularización:</strong> Batch Normalization y Dropout selectivo (30-50%).</li>
              <li class="learning-item"><strong>Data Augmentation:</strong> Rotaciones, zoom y desplazamientos dinámicos.</li>
            </ul>
          </section>

          <section>
            <h2>2. Optimización Combinatoria (QAP)</h2>
            <p>Resolución del Problema de Asignación Cuadrática (instancia <strong>tai256c</strong>) utilizando Algoritmos Genéticos y evolución híbrida.</p>
            
            <div class="practice-grid">
              <div class="practice-card">
                <span class="practice-tag">TEORÍA EVOLUTIVA</span>
                <h3>Lamarck vs Baldwin</h3>
                <p>Implementación de estrategias <strong>Lamarckianas</strong> (mejora de genotipo) y <strong>Baldwinianas</strong> (solo fitness), demostrando convergencia superior en la primera.</p>
              </div>
              <div class="practice-card">
                <span class="practice-tag">METAHEURÍSTICAS</span>
                <h3>Búsqueda Local</h3>
                <p>Hibridación con <strong>Simulated Annealing</strong> y operadores <strong>2-opt/3-opt</strong> para escapar de óptimos locales en espacios de 256! combinaciones.</p>
              </div>
            </div>

            <h3>Ingeniería Genética para Permutaciones</h3>
            <ul class="learning-list">
              <li class="learning-item"><strong>Cruce Especializado:</strong> Order Crossover (OX) y Cycle Crossover (CX) para garantizar validez.</li>
              <li class="learning-item"><strong>Mutación Adaptativa:</strong> Swap y Scramble mutation con probabilidad dinámica.</li>
              <li class="learning-item"><strong>Estructura Poblacional:</strong> Niching para preservar diversidad y Elitismo del 10%.</li>
            </ul>
          </section>

          <div style="margin-top: 5rem; text-align: center;">
            <a href="#home" class="btn btn-secondary">
              ${icons.arrowLeft} Volver al Inicio
            </a>
          </div>
        </div>

        <aside class="project-sidebar">
          <div class="sidebar-card">
            <h3>Capacidades IA</h3>
            <div class="tech-list-detailed">
              <div class="tech-item-detailed">
                <strong>Frameworks</strong>
                <span>TensorFlow, Keras, NumPy, SciPy</span>
              </div>
              <div class="tech-item-detailed">
                <strong>Modelado</strong>
                <span>CNN, MLP, OCR, Redes Neuronales</span>
              </div>
              <div class="tech-item-detailed">
                <strong>Optimización</strong>
                <span>Algoritmos Genéticos, QAP, Búsqueda Local</span>
              </div>
              <div class="tech-item-detailed">
                <strong>Performance</strong>
                <span>Joblib, Paralelización, im2col</span>
              </div>
            </div>
          </div>
          
          <div class="sidebar-card">
            <h3>Repositorio</h3>
            <a href="https://github.com/tosito1/Inteligencia-Computacional" target="_blank" class="btn btn-primary" style="width: 100%;">
              ${icons.github} Ver repositorio
            </a>
          </div>
        </aside>
      </div>
    </div>
  </div>
`

// Project Detail View - Paquito Flores (Android)
const renderProjectPaquito = () => `
  <div class="project-page">
    <div class="container reveal">
      <a href="#home" class="project-back-btn">
        ${icons.arrowLeft} Volver al Portfolio
      </a>
      
      <header class="project-hero">
        <h1 class="gradient-text">Paquito Flores</h1>
        <p class="modal-subtitle">Gestión de Información en Dispositivos Móviles (GIDM) | Kotlin & Compose</p>
      </header>

      <div class="project-grid">
        <div class="project-main-content">
          <section>
            <h2>Gestión Integral de Asociaciones</h2>
            <p><strong>Paquito Flores</strong> es una aplicación Android de alto rendimiento diseñada para la gestión total de una caseta de socios. Implementa un stack tecnológico moderno centrado en la reactividad y la sincronización de datos en tiempo real.</p>
          </section>

          <div class="practice-grid">
            <div class="practice-card reveal">
              <span class="practice-tag">UI MODERNA</span>
              <h3>Jetpack Compose + MD3</h3>
              <p>Interfaz declarativa con Material Design 3. Uso intensivo de <strong>States</strong> para una UI reactiva que se actualiza automáticamente al cambiar los datos.</p>
            </div>
            
            <div class="practice-card reveal">
              <span class="practice-tag">ARQUITECTURA</span>
              <h3>MVVM Scalable</h3>
              <p>Estructura modular con <strong>Repository Pattern</strong>. Separación estricta entre la UI, la lógica de negocio y las fuentes de datos (Firebase/Room).</p>
            </div>

            <div class="practice-card reveal">
              <span class="practice-tag">PERSISTENCIA</span>
              <h3>Sincronización Híbrida</h3>
              <p>Arquitectura <strong>Offline-First</strong> combinando <strong>Room</strong> para datos locales y <strong>Firestore</strong> para la nube, asegurando consistencia total.</p>
            </div>

            <div class="practice-card reveal">
              <span class="practice-tag">CLOUD SERVICES</span>
              <h3>Firebase Ecosystem</h3>
              <p>Gestión de <strong>roles complejos</strong> vía Firebase Auth y notificaciones push segmentadas a través de <strong>FCM</strong> y <strong>WorkManager</strong>.</p>
            </div>
          </div>

          <section>
            <h2>Capacidades Técnicas</h2>
            <ul class="learning-list">
              <li class="learning-item"><strong>Gestión Financiera:</strong> Módulo de contabilidad avanzada con trazabilidad de cuotas, ingresos, gastos y sistema de multas automatizado.</li>
              <li class="learning-item"><strong>Votaciones Digitales:</strong> Sistema democrático integrado que utiliza DB en tiempo real para visualizar resultados de encuestas instantáneamente.</li>
              <li class="learning-item"><strong>Background Processing:</strong> Uso de WorkManager para sincronización de datos y disparadores de notificaciones programadas.</li>
              <li class="learning-item"><strong>Roles Multinivel:</strong> Implementación de permisos granulares para Socios, Tesoreros, Presidentes y Administradores.</li>
            </ul>
          </section>

          <div style="margin-top: 5rem; text-align: center;">
            <a href="#home" class="btn btn-secondary">
              ${icons.arrowLeft} Volver al Inicio
            </a>
          </div>
        </div>

        <aside class="project-sidebar">
          <div class="sidebar-card">
            <h3>Stack Tecnológico</h3>
            <div class="tech-list-detailed">
              <div class="tech-item-detailed">
                <strong>Lenguaje Core</strong>
                <span>Kotlin, Coroutines, Flow</span>
              </div>
              <div class="tech-item-detailed">
                <strong>Interfaz</strong>
                <span>Jetpack Compose, Navigation</span>
              </div>
              <div class="tech-item-detailed">
                <strong>Back-as-a-Service</strong>
                <span>Firebase (Firestore, Auth, FCM)</span>
              </div>
              <div class="tech-item-detailed">
                <strong>Local Storage</strong>
                <span>Room Database, WorkManager</span>
              </div>
            </div>
          </div>
          
          <div class="sidebar-card">
            <h3>Repositorio</h3>
            <a href="https://github.com/tosito1/Paquito-Flores" target="_blank" class="btn btn-primary" style="width: 100%;">
              ${icons.github} Ver repositorio
            </a>
          </div>
        </aside>
      </div>
    </div>
  </div>
`

// Project Detail View - Museo Arqueológico (Full-Stack)
const renderProjectMuseo = () => `
  <div class="project-page">
    <div class="container reveal">
      <a href="#home" class="project-back-btn">
        ${icons.arrowLeft} Volver al Portfolio
      </a>
      
      <header class="project-hero">
        <h1 class="gradient-text">Museo Arqueológico de Granada</h1>
        <p class="modal-subtitle">Desarrollo Web Full-Stack | Arquitectura, Datos y Automatización</p>
      </header>

      <div class="project-grid">
        <div class="project-main-content">
          <section>
            <h2>Ingeniería Web de Principio a Fin</h2>
            <p>Este proyecto recrea la plataforma digital del Museo Arqueológico y Etnológico de Granada, abordando retos críticos del desarrollo web moderno: captura de datos mediante <strong>scraping</strong>, diseño de <strong>APIs seguras</strong> y despliegue sobre <strong>contendedores</strong>.</p>
          </section>

          <div class="practice-grid">
            <div class="practice-card reveal">
              <span class="practice-tag">ESTRUCTURA</span>
              <h3>Backend & ORM</h3>
              <p>Construcción de una API profesional con <strong>Node.js</strong> y <strong>Express</strong>. Integración de <strong>Prisma ORM</strong> para una gestión tipada y eficiente de la base de datos, facilitando migraciones y consultas complejas.</p>
            </div>
            
            <div class="practice-card reveal">
              <span class="practice-tag">VIRTUALIZACIÓN</span>
              <h3>Infraestructura Docker</h3>
              <p>Virtualización del entorno de base de datos <strong>PostgreSQL</strong> mediante Docker. Esto garantiza un entorno de desarrollo reproducible y aísla la capa de persistencia para mayor seguridad y portabilidad.</p>
            </div>

            <div class="practice-card reveal">
              <span class="practice-tag">CALIDAD</span>
              <h3>Testing & Automation</h3>
              <p>Uso avanzado de <strong>Playwright</strong> para dos propósitos críticos: el <strong>scraping</strong> automatizado de las piezas del museo y la ejecución de pruebas <strong>E2E</strong> que validan los flujos de usuario.</p>
            </div>

            <div class="practice-card reveal">
              <span class="practice-tag">PROTECCIÓN</span>
              <h3>Seguridad & Auth</h3>
              <p>Implementación de un sistema de autenticación basado en <strong>JWT (JSON Web Tokens)</strong> y almacenamiento seguro en cookies. Control de acceso granular para proteger rutas administrativas y de usuario.</p>
            </div>
          </div>

          <section>
            <h2>Ciclo Completo de Desarrollo</h2>
            <div class="sidebar-card" style="margin: 2rem 0; width: 100%;">
              <ul class="learning-list" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <li class="learning-item"><strong>Templating:</strong> Renderizado dinámico con Nunjucks para una UI modular.</li>
                <li class="learning-item"><strong>Observabilidad:</strong> Logging centralizado con Winston para auditoría y debug.</li>
                <li class="learning-item"><strong>Data Extraction:</strong> Proceso de scraping de contenido real del museo.</li>
                <li class="learning-item"><strong>API RESTful:</strong> Endpoints documentados y protegidos para el catálogo.</li>
              </ul>
            </div>
            
            <h3>Metodología y Calidad</h3>
            <p>El desarrollo siguió un enfoque centrado en la mantenibilidad. El uso de <strong>cookies seguras</strong> junto a JWT evita ataques comunes, mientras que la suite de pruebas con Playwright asegura que cada nueva funcionalidad no rompa la estabilidad del sistema.</p>
          </section>

          <div style="margin-top: 5rem; text-align: center;">
            <a href="#home" class="btn btn-secondary">
              ${icons.arrowLeft} Volver al Inicio
            </a>
          </div>
        </div>

        <aside class="project-sidebar">
          <div class="sidebar-card">
            <h3>Stack Tecnológico</h3>
            <div class="tech-list-detailed">
              <div class="tech-item-detailed">
                <strong>Servidor</strong>
                <span>Node.js, Express, Winston</span>
              </div>
              <div class="tech-item-detailed">
                <strong>Frontend</strong>
                <span>Nunjucks, JS (Vanilla), CSS3</span>
              </div>
              <div class="tech-item-detailed">
                <strong>Datos</strong>
                <span>PostgreSQL, Prisma, Docker</span>
              </div>
              <div class="tech-item-detailed">
                <strong>QA</strong>
                <span>Playwright, JWT, Cookie-Parser</span>
              </div>
            </div>
          </div>
          
          <div class="sidebar-card">
            <h3>Repositorio</h3>
            <a href="https://github.com/tosito1/Museo-Arqueologico" target="_blank" class="btn btn-primary" style="width: 100%;">
              ${icons.github} Ver repositorio
            </a>
          </div>
        </aside>
      </div>
    </div>
  </div>
`

// Project Detail View - TFG Seguridad
const renderProjectTFG = () => `
  <div class="project-page">
    <div class="container reveal">
      <a href="#home" class="project-back-btn">
        ${icons.arrowLeft} Volver al Portfolio
      </a>
      
      <header class="project-hero">
        <h1 class="gradient-text">Seguridad en Autenticación: TFG</h1>
        <p class="modal-subtitle">FIDO2, WebAuthn & PrivacyIDEA | Passwordless Innovation</p>
      </header>

      <div class="project-grid">
        <div class="project-main-content">
          <section>
            <h2>Fortaleciendo la Identidad Digital</h2>
            <p>Este Trabajo Fin de Grado aborda la crisis de las contraseñas estáticas mediante el despliegue de una infraestructura de autenticación moderna para la <strong>Universidad de Huelva</strong>. La solución elimina vulnerabilidades críticas como el phishing e ingeniería social mediante criptografía de clave pública.</p>
          </section>

          <div class="practice-grid">
            <div class="practice-card reveal">
              <span class="practice-tag">ESTÍNDARES</span>
              <h3>FIDO2 & WebAuthn</h3>
              <p>Implementación de autenticación fuerte basada en hardware. Uso de <strong>CTAP</strong> para la comunicación segura entre el navegador y autenticadores físicos.</p>
            </div>
            
            <div class="practice-card reveal">
              <span class="practice-tag">GESTIÓN</span>
              <h3>PrivacyIDEA</h3>
              <p>Despliegue de un backend centralizado de código abierto para la gestión de múltiples factores (MFA) y administración de ciclos de vida de tokens.</p>
            </div>

            <div class="practice-card reveal">
              <span class="practice-tag">FEDERACIÓN</span>
              <h3>SimpleSAMLphp</h3>
              <p>Configuración de flujos de identidad federada (SAML) actuando como <strong>Proveedor de Identidad (IdP)</strong> y <strong>Proveedor de Servicios (SP)</strong>.</p>
            </div>

            <div class="practice-card reveal">
              <span class="practice-tag">NORMATIVA</span>
              <h3>Cumplimiento ENS</h3>
              <p>Adaptación de la infraestructura a los requisitos del <strong>Esquema Nacional de Seguridad (ENS)</strong> en España para entornos críticos.</p>
            </div>
          </div>

          <section>
            <h2>Arquitectura Distribuida</h2>
            <p>Para garantizar la seguridad y escalabilidad, el sistema se diseñó en tres capas independientes:</p>
            <ul class="learning-list">
              <li class="learning-item"><strong>Servidor SP:</strong> Punto de entrada accesible que solicita la autenticación al IdP.</li>
              <li class="learning-item"><strong>Servidor IdP:</strong> Núcleo de verificacion alojado en red segura, conectado a PrivacyIDEA.</li>
              <li class="learning-item"><strong>Servidor PrivacyIDEA:</strong> Gestor de tokens y base de datos SQL para el almacenamiento de credenciales criptográficas.</li>
            </ul>
          </section>

          <section>
            <h2>Análisis de Hardware (YubiKey)</h2>
            <p>Se evaluó la integración de diversos dispositivos del ecosistema Yubico:</p>
            <ul class="learning-list">
              <li class="learning-item"><strong>Serie 5 FIPS:</strong> Certificación AAL3 (NIST) para entornos gubernamentales.</li>
              <li class="learning-item"><strong>Serie YubiKey Bio:</strong> Autenticación biométrica mediante huella dactilar integrada en hardware.</li>
              <li class="learning-item"><strong>Passwordless Flows:</strong> Eliminación total del nombre de usuario y contraseña mediante credenciales residentes.</li>
            </ul>
          </section>

          <section>
            <h2>Resultados e Impacto</h2>
            <div class="sidebar-card" style="margin: 2rem 0; border-left: 4px solid var(--accent-primary);">
              <h3>Conclusiones Técnicas</h3>
              <p><strong>Seguridad Superior:</strong> Inmunidad ante ataques de interceptación y suplantación ya que las claves privadas nunca abandonan el token físico.</p>
              <p style="margin-top: 1rem;"><strong>Usabilidad:</strong> Reducción drástica de la fricción al eliminar la necesidad de recordar o rotar contraseñas complejas.</p>
            </div>
          </section>

          <div style="margin-top: 5rem; text-align: center;">
            <a href="#home" class="btn btn-secondary">
              ${icons.arrowLeft} Volver al Inicio
            </a>
          </div>
        </div>

        <aside class="project-sidebar">
          <div class="sidebar-card">
            <h3>Stack del Proyecto</h3>
            <div class="tech-list-detailed">
              <div class="tech-item-detailed">
                <strong>Protocolos</strong>
                <span>FIDO2, WebAuthn, CTAP, SAML</span>
              </div>
              <div class="tech-item-detailed">
                <strong>Servidores</strong>
                <span>PrivacyIDEA, SimpleSAMLphp</span>
              </div>
              <div class="tech-item-detailed">
                <strong>Infraestructura</strong>
                <span>Ubuntu, Apache2, SQL, PHP 7.2</span>
              </div>
              <div class="tech-item-detailed">
                <strong>Criptografía</strong>
                <span>ECC (Curva Elíptica), HMAC</span>
              </div>
            </div>
          </div>
          
          <div class="sidebar-card">
            <h3>Repositorio</h3>
            <a href="https://github.com/tosito1/TFG-FIDO-PrivacyIDEA" target="_blank" class="btn btn-primary" style="width: 100%;">
              ${icons.github} Ver repositorio
            </a>
          </div>
        </aside>
      </div>
    </div>
  </div>
`
const renderProjectHexapodo = () => `
  <div class="project-page">
    <div class="container reveal">
      <a href="#home" class="project-back-btn">
        ${icons.arrowLeft} Volver al Portfolio
      </a>
      
      <header class="project-hero">
        <h1 class="gradient-text">Hexápodo con IA Autónoma</h1>
        <p class="modal-subtitle">Edge AI | Computer Vision | NLP | Robótica Avanzada</p>
      </header>

      <div class="project-grid">
        <div class="project-main-content">
          <section>
            <h2>Percepción y Autonomía en el Edge</h2>
            <p>Este proyecto representa la convergencia de la robótica bio-inspirada con la Inteligencia Artificial moderna. El objetivo fue dotar a un robot hexápodo de una <strong>consciencia situacional</strong> completa, permitiéndole navegar de forma autónoma, detectar intrusos y comunicarse con humanos mediante lenguaje natural.</p>
          </section>

          <div class="practice-grid">
            <div class="practice-card reveal">
              <span class="practice-tag">COMPUTER VISION</span>
              <h3>Dual Neural Vision</h3>
              <p>Inferencia doble en tiempo real: detección de objetos (YOLO/SSD) y clasificación de terreno (CNN custom) optimizadas en <strong>TFLite</strong>.</p>
            </div>
            
            <div class="practice-card reveal">
              <span class="practice-tag">HCI</span>
              <h3>Whisper Interface</h3>
              <p>Procesamiento de audio mediante <strong>Transformers</strong>. Decodificación de comandos en español con espectrogramas Log-Mel en tiempo real.</p>
            </div>

            <div class="practice-card reveal">
              <span class="practice-tag">NETWORKING</span>
              <h3>Concurrent Sockets</h3>
              <p>Infraestructura <strong>multihilo</strong> que gestiona sockets TCP bidireccionales, telemetría y control de motores simultáneamente.</p>
            </div>

            <div class="practice-card reveal">
              <span class="practice-tag">ENGINEERING</span>
              <h3>State Automation</h3>
              <p>Lógica de control basada en una <strong>Máquina de Estados Finita</strong>: Reposo, Vigilancia Estática y Navegación Dinámica.</p>
            </div>
          </div>

          <section>
            <h2>1. Visión por Computadora y Edge AI</h2>
            <p>Se desarrollaron dos redes neuronales para dotar al robot de autonomía espacial:</p>
            
            <div class="sidebar-card" style="margin: 1.5rem 0; width: 100%;">
              <h3>Detección de Intrusos (Object Detection)</h3>
              <ul class="learning-list">
                <li class="learning-item"><strong>Data-centric AI:</strong> Entrenamiento con 504 imágenes originales y <strong>Data Augmentation</strong> masivo (rotaciones, brillo ±22%, saturación ±25% y volteos).</li>
                <li class="learning-item"><strong>Corrección de Sesgo:</strong> Se eliminaron falsos positivos (extintores vs esferas) re-entrenando con imágenes de fondo sin anotaciones para forzar el aprendizaje de la topología esférica.</li>
                <li class="learning-item"><strong>Métricas:</strong> 99.8% Precisión | 98.0% Recall.</li>
              </ul>
            </div>

            <div class="sidebar-card" style="margin: 1.5rem 0; width: 100%;">
              <h3>Clasificación de Entorno (CNN Custom)</h3>
              <p>Para evitar caídas, diseñé una CNN secuencial en <strong>Keras</strong> desde cero:</p>
              <ul class="learning-list">
                <li class="learning-item"><strong>Arquitectura:</strong> Bloques Conv2D (64 y 32 filtros 3x3, ReLU) + MaxPool2D (2x2) -> Flatten -> Dense 128 -> Dense 64 -> Softmax.</li>
                <li class="learning-item"><strong>Edge Opt:</strong> Convertido a <strong>cuantizado .tflite</strong> para ejecución ultra-ligera en Raspberry Pi mediante <code>tflite-runtime</code>.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2>2. Procesamiento de Lenguaje Natural (HCI)</h2>
            <p>Implementación de un sistema de control bidireccional por voz:</p>
            <ul class="learning-list">
              <li class="learning-item"><strong>Whisper Inference:</strong> Captura de audio a 44.4 kHz procesada como espectrogramas Log-Mel para el modelo <strong>"Base" de OpenAI Whisper</strong>. Decodificación instantánea de comandos clave como "ESTÍTICA" o "DINÍMICA".</li>
              <li class="learning-item"><strong>Feedback Vocal:</strong> Sistema de respuestas auditivas pregrabadas gestionadas por <code>pygame</code> para evitar la latencia de síntesis XTTS en el edge.</li>
            </ul>
          </section>

          <section>
            <h2>3. Arquitectura y Control de Estado</h2>
            <ul class="learning-list">
              <li class="learning-item"><strong>Comunicaciones TCP:</strong> Canal bidireccional robusto. El robot escucha en el <strong>puerto 8040</strong> y responde alertas en el <strong>puerto 8060</strong>.</li>
              <li class="learning-item"><strong>Multithreading:</strong> Orquestación mediante <code>threading</code> para evitar bloqueos: el bucle de escucha de voz se ejecuta en paralelo a la inferencia visual y el control de motores.</li>
              <li class="learning-item"><strong>Navegación Lógica:</strong> Si la CNN detecta "Borde Cerca" (0), el robot rota preventivamente; si detecta "Borde Lejos" (1), continúa el patrullaje buscando intrusos.</li>
            </ul>
          </section>

          <section>
            <h2>4. Troubleshooting Crítico</h2>
            <div class="sidebar-card" style="margin: 1.5rem 0; border-left: 4px solid var(--accent-primary);">
              <h3>Resolución de Conflictos</h3>
              <p><strong>Desafío Coral TPU vs Python 3.11:</strong> Debido a la incompatibilidad de drivers, tomé la decisión de ingeniería de optimizar el código para <strong>CPU pura</strong>. Demostré que una correcta cuantización en TFLite permitía inferencia en tiempo real sin necesidad de hardware dedicado adicional.</p>
              <p style="margin-top: 1rem;"><strong>FFmpeg Runtime:</strong> Solución de carga dinámica de librerías mediante <code>os.environ</code> para asegurar la compatibilidad de Whisper en cualquier sistema operativo cliente.</p>
            </div>
          </section>

          <div style="margin-top: 5rem; text-align: center;">
            <a href="#home" class="btn btn-secondary">
              ${icons.arrowLeft} Volver al Inicio
            </a>
          </div>
        </div>

        <aside class="project-sidebar">
          <div class="sidebar-card">
            <h3>Stack Tecnológico</h3>
            <div class="tech-list-detailed">
              <div class="tech-item-detailed">
                <strong>IA & Deep Learning</strong>
                <span>TFLite, Keras, Whisper (Base)</span>
              </div>
              <div class="tech-item-detailed">
                <strong>Computer Vision</strong>
                <span>OpenCV, Data-centric AI</span>
              </div>
              <div class="tech-item-detailed">
                <strong>Core System</strong>
                <span>Python 3.11, Threading, Sockets</span>
              </div>
              <div class="tech-item-detailed">
                <strong>Hardware Edge</strong>
                <span>Raspberry Pi, PWM Control</span>
              </div>
            </div>
          </div>
          
          <div class="sidebar-card">
            <h3>Repositorio</h3>
            <a href="https://github.com/tosito1/Robot-Hexapodo-IA" target="_blank" class="btn btn-primary" style="width: 100%;">
              ${icons.github} Ver repositorio
            </a>
          </div>
        </aside>
      </div>
    </div>
  </div>
`

// Routing Logic
const renderPage = () => {
  const hash = window.location.hash
  const header = document.querySelector('header')

  if (hash === '#proyecto/paniculas') {
    app.innerHTML = `
      ${renderProjectPaniculas()}
      ${renderFooter()}
    `
    header.style.display = 'none'
  } else if (hash === '#proyecto/cloud') {
    app.innerHTML = `
      ${renderProjectCloud()}
      ${renderFooter()}
    `
    header.style.display = 'none'
  } else if (hash === '#proyecto/dss') {
    app.innerHTML = `
      ${renderProjectDSS()}
      ${renderFooter()}
    `
    header.style.display = 'none'
  } else if (hash === '#proyecto/tid') {
    app.innerHTML = `
      ${renderProjectTID()}
      ${renderFooter()}
    `
    header.style.display = 'none'
  } else if (hash === '#proyecto/ic') {
    app.innerHTML = `
      ${renderProjectIC()}
      ${renderFooter()}
    `
    header.style.display = 'none'
  } else if (hash === '#proyecto/tfg') {
    app.innerHTML = `
      ${renderProjectTFG()}
      ${renderFooter()}
    `
    header.style.display = 'none'
  } else if (hash === '#proyecto/paquito') {
    app.innerHTML = `
      ${renderProjectPaquito()}
      ${renderFooter()}
    `
    header.style.display = 'none'
  } else if (hash === '#proyecto/museo') {
    app.innerHTML = `
      ${renderProjectMuseo()}
      ${renderFooter()}
    `
    header.style.display = 'none'
  } else if (hash === '#proyecto/hexapodo') {
    app.innerHTML = `
      ${renderProjectHexapodo()}
      ${renderFooter()}
    `
    header.style.display = 'none'
  } else {
    app.innerHTML = `
      ${renderHero()}
      ${renderExperience()}
      ${renderProjects()}
      ${renderCertificates()}
      ${renderEducation()}
      ${renderSkills()}
      ${renderLanguages()}
      ${renderOtherInfo()}
      ${renderContact()}
      ${renderFooter()}
      ${renderScrollTop()}
    `
    header.style.display = 'block'
    createMobileMenu()
    handleHeaderScroll()
  }

  initRevealAnimations()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// PDF Generation Logic
const generatePDF = (isShort = false) => {
  const element = document.getElementById('content');
  const opt = {
    margin: [15, 15, 15, 15],
    filename: `CV_${userData.name.replace(/\s+/g, '_')}${isShort ? '_Short' : ''}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
      logging: false,
      scrollY: 0,
      windowWidth: 800
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  document.body.classList.add('is-generating-pdf');
  if (isShort) {
    document.body.classList.add('is-short-cv');
  }
  
  setTimeout(() => {
    html2pdf().set(opt).from(element).save().then(() => {
      document.body.classList.remove('is-generating-pdf');
      document.body.classList.remove('is-short-cv');
    }).catch(err => {
      console.error('Error generating PDF:', err);
      document.body.classList.remove('is-generating-pdf');
      document.body.classList.remove('is-short-cv');
    });
  }, 1000);
};

// Initial Render and navigation
window.addEventListener('hashchange', renderPage)
document.addEventListener('DOMContentLoaded', () => {
  renderPage()

  // Attach PDF listeners
  const downloadBtn = document.getElementById('download-cv');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', (e) => {
      e.preventDefault();
      generatePDF(false);
    });
  }

  const downloadShortBtn = document.getElementById('download-cv-short');
  if (downloadShortBtn) {
    downloadShortBtn.addEventListener('click', (e) => {
      e.preventDefault();
      generatePDF(true);
    });
  }
})
