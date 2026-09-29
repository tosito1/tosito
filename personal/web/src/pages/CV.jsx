import React, { useState, useEffect, useRef } from 'react';
import {
    User, Briefcase, GraduationCap, Star, Settings,
    Plus, Trash2, Printer, MapPin, Phone, Mail, Car,
    Clock, CalendarCheck, Camera, CheckCircle, Palette,
    ChevronDown, ChevronUp, Layout, GitBranch,
    Languages, Type, Globe, ChevronLeft, ChevronRight,
    Code, Link as LinkIcon, ArrowUp, ArrowDown, Award,
    Download, Upload, AlignLeft, Columns, Activity, Sparkles, SlidersHorizontal
} from 'lucide-react';

// --- SUB-COMPONENTES ESTABLES (FUERA DE APP PARA EVITAR RE-CREACIÓN Y CRASHES) ---

const NavButton = ({ id, icon: Icon, label, activeTab, setActiveTab, setExpandedItem }) => (
    <button
        onClick={() => { setActiveTab(id); setExpandedItem(null); }}
        className={`flex flex-col items-center justify-center gap-1.5 py-4 px-2 rounded-2xl transition-all duration-300 ${activeTab === id ? 'bg-white/10 text-white shadow-xl ring-1 ring-white/20' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
    >
        <div className={`p-2.5 rounded-xl transition-all ${activeTab === id ? 'bg-blue-600 shadow-lg scale-110' : 'bg-slate-800'}`}>
            {Icon ? <Icon size={20} /> : <Star size={20} />}
        </div>
        <span className={`text-[9px] font-black uppercase tracking-tighter text-center leading-none ${activeTab === id ? 'opacity-100' : 'opacity-50'}`}>{String(label || '')}</span>
    </button>
);

const InputField = ({ label, value, onChange, type = "text", icon: Icon, placeholder = "" }) => (
    <div className="flex flex-col gap-1.5 mb-4 group">
        <label className="premium-label">{label}</label>
        <div className="relative">
            {Icon && (
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Icon className="w-4 h-4" />
                </div>
            )}
            <input
                type={type}
                value={value || ""}
                onChange={onChange}
                placeholder={placeholder}
                className={`premium-input ${Icon ? 'pl-11' : 'pl-4'}`}
            />
        </div>
    </div>
);

const ArrayEditorItem = ({ item, index, section, titleField, subField, IconDef, children, expandedItem, setExpandedItem, moveItem, deleteItem, containerLength }) => (
    <div className={`premium-card !p-0 mb-4 ${expandedItem === item.id ? 'ring-2 ring-blue-500/50 border-blue-400' : ''}`}>
        <div className="flex items-center">
            <div className="flex flex-col border-r border-slate-100 bg-slate-50/50">
                <button onClick={(e) => { e.stopPropagation(); moveItem(section, index, -1); }} disabled={index === 0} className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 transition-colors"><ArrowUp size={16} /></button>
                <button onClick={(e) => { e.stopPropagation(); moveItem(section, index, 1); }} disabled={index === containerLength - 1} className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 transition-colors"><ArrowDown size={16} /></button>
            </div>

            <div onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)} className="p-4 flex-1 flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${expandedItem === item.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}`}>
                        <IconDef size={18} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-slate-800 leading-tight">{item[titleField] || 'Nuevo elemento'}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-bold uppercase tracking-wider">{item[subField] || 'Sin especificar'}</p>
                    </div>
                </div>
                {expandedItem === item.id ? <ChevronUp className="w-5 h-5 text-blue-500" /> : <ChevronDown className="w-5 h-5 text-slate-400 transition-transform group-hover:translate-y-0.5" />}
            </div>
        </div>

        {expandedItem === item.id && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/80">
                <div className="space-y-1">
                    {children}
                    <button onClick={() => deleteItem(section, item.id)} className="w-full mt-3 py-2 text-xs font-bold text-red-600 bg-white border border-red-200 hover:bg-red-50 hover:border-red-300 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm">
                        <Trash2 className="w-3.5 h-3.5" /> Eliminar
                    </button>
                </div>
            </div>
        )}
    </div>
);

// --- DATOS INICIALES (Seguros) ---
const initialData = {
    personal: {
        name: "Antonio José",
        lastName: "Muriel Gálvez",
        email: "antoniojse2001@gmail.com",
        phone: "(+34) 693 045 322",
        location: "Granada, España",
        subLocation: "Herrera, Sevilla",
        drivingLicense: "Carnet B",
        linkedin: "linkedin.com/in/antoniojose",
        github: "github.com/antoniojse2001",
        image: "https://placehold.co/150x150/334155/ffffff?text=FOTO",
    },
    profiles: {
        hosteleria: {
            title: "Hostelería | Atención al Cliente",
            summary: "Graduado en Ingeniería Informática y estudiante de Máster, con un perfil altamente organizado, resolutivo y acostumbrado a trabajar bajo presión. Busco desarrollarme en el sector de la hostelería y los eventos, aportando mi excelente capacidad de comunicación y adaptabilidad a entornos dinámicos. Destaco por mi trato amable, gran sentido de la responsabilidad y mi formación certificada en salvamento y primeros auxilios (DESA), aportando un plus de seguridad indispensable en entornos de alta afluencia."
        },
        it: {
            title: "Ingeniero Informático | Sistemas, Redes y Ciberseguridad",
            summary: "Ingeniero informático especializado en diseño de infraestructuras, administración de sistemas (Linux/Windows) y ciberseguridad ofensiva/defensiva. Experiencia sólida en virtualización (Docker, Kubernetes), redes complejas (BGP, OSPF, VLANs) y automatización cloud (AWS). Acostumbrado a diagnosticar y solucionar incidencias críticas bajo presión. Apasionado por la Inteligencia Artificial (TensorFlow), el desarrollo (Kotlin, React) y la mejora continua."
        }
    },
    experiences: [
        { id: 1, role: "Administrador de Sistemas", company: "Nanobytes", date: "06/2025 - 09/2025", description: "Implementación y mantenimiento de servidores garantizando alta disponibilidad.\nOptimización de recursos y costes mediante virtualización y contenedores.\nDiagnóstico y resolución ágil de problemas técnicos bajo presión.", sector: "it" },
        { id: 2, role: "Camarero / Atención al Cliente", company: "Restaurante Casa Esteban", date: "06/2021 - 06/2025", description: "Atención integral: Servicio en sala y terraza garantizando excelente trato.\nGestión ágil bajo presión: Toma de comandas y coordinación con cocina.", sector: "ambos" },
        { id: 3, role: "Camarero en alta afluencia", company: "Pizzería Montes", date: "09/2018 - 09/2020", description: "Gestión eficiente de pedidos en picos de alta demanda.\nResolución rápida de incidencias de cara al público.", sector: "ambos" }
    ],
    projects: [
        { id: 1, name: "Sistema 2FA (WebAuth & FIDO)", tech: "Ciberseguridad / Web", date: "2024", description: "Desarrollo de sistema de autenticación seguro de doble factor contra phishing.", link: "github.com/antoniojse2001", sector: "it" },
        { id: 2, name: "Hexápodo IA y Visión", tech: "Python / OpenCV", date: "2024", description: "Vigilancia autónoma con Raspberry Pi 4 e instrucciones por comandos de voz.", link: "", sector: "it" },
        { id: 3, name: "Apps Móviles (Chat & Gestión)", tech: "Kotlin / Firebase", date: "2023", description: "App de mensajería y otra para gestión de socios con roles y notificaciones push.", link: "", sector: "it" },
        { id: 4, name: "Automatización de Viviendas", tech: "Arduino / KNX", date: "2022", description: "Gestión inteligente de iluminación y clima mediante KNX y MQTT.", link: "", sector: "it" }
    ],
    education: [
        { id: 1, degree: "Máster en Ingeniería Informática", institution: "Universidad de Granada", date: "09/2024 - Actual", description: "", sector: "ambos" },
        { id: 2, degree: "Grado en Ingeniería Informática", institution: "Universidad de Huelva", date: "09/2020 - 07/2024", description: "", sector: "ambos" }
    ],
    certifications: [
        { id: 1, name: "CCNA v7: Redes, Seg. y Automat.", issuer: "Cisco", date: "2024", sector: "it" },
        { id: 2, name: "Socorrista Acuático y DESA", issuer: "Entidad Certificadora", date: "2023", sector: "ambos" },
        { id: 3, name: "Monitor de Natación / Aquagym", issuer: "Entidad Deportiva", date: "2023", sector: "hosteleria" }
    ],
    skills: [
        { id: 1, name: "Cloud (AWS, Azure, GCP)", level: "Intermedio", sector: "it" },
        { id: 2, name: "Docker & Kubernetes", level: "Intermedio", sector: "it" },
        { id: 3, name: "Redes (BGP, OSPF, STP)", level: "Avanzado", sector: "it" },
        { id: 4, name: "Pentesting & Seguridad", level: "Avanzado", sector: "it" },
        { id: 5, name: "Linux & Windows Server", level: "Avanzado", sector: "it" },
        { id: 6, name: "Desarrollo (React, Spring)", level: "Intermedio", sector: "it" },
        { id: 7, name: "Python, Java, SQL", level: "Avanzado", sector: "it" },
        { id: 8, name: "Primeros Auxilios y DESA", level: "Experto", sector: "ambos" },
        { id: 9, name: "Trabajo bajo presión", level: "Experto", sector: "ambos" },
        { id: 10, name: "Resolución de problemas", level: "Experto", sector: "ambos" },
        { id: 11, name: "Atención al Cliente", level: "Experto", sector: "hosteleria" }
    ],
    languages: [
        { id: 1, name: "Español", level: "Nativo", percentage: 100, details: "" },
        { id: 2, name: "Inglés", level: "B2", percentage: 75, details: "Competencia completa oral y escrita." }
    ],
    settings: {
        accentColor: "#3b82f6",
        fontClass: "font-sans",
        layout: "modern",
        fontSize: 10,
        lineHeight: 1.5,
        imagePosition: 20
    }
};

const THEMES = [
    { name: 'Azul IT', color: '#3b82f6' },
    { name: 'Ciber Verde', color: '#10b981' },
    { name: 'Ejecutivo', color: '#0f172a' },
    { name: 'Granate', color: '#e11d48' },
    { name: 'Púrpura', color: '#8b5cf6' },
];

const FONTS = [
    { name: 'Limpia (Inter)', class: 'font-sans' },
    { name: 'Formal (Serif)', class: 'font-serif' },
    { name: 'Código (Mono)', class: 'font-mono' },
];

export default function App() {
    const [data, setData] = useState(initialData);
    const [activeProfile, setActiveProfile] = useState('it');
    const [activeTab, setActiveTab] = useState('personal');
    const [expandedItem, setExpandedItem] = useState(null);
    const [showPanels, setShowPanels] = useState(true);
    const sidebarRef = useRef(null);
    const paperRef = useRef(null);
    const tabsContainerRef = useRef(null);

    // --- SISTEMA DE MIGRACIÓN Y CARGA ROBUSTA ---
    useEffect(() => {
        const loadStoredData = () => {
            const keys = ['cvBuilderPro_FinalDB_v8', 'cvBuilderPro_FinalDB_v7', 'cvBuilderPro_FinalDB_v6', 'cvBuilderPro_FinalDB_v5'];
            for (const key of keys) {
                const stored = localStorage.getItem(key);
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored);
                        const mergedData = {
                            ...initialData,
                            ...parsed,
                            personal: { ...initialData.personal, ...(parsed.personal || {}) },
                            profiles: { ...initialData.profiles, ...(parsed.profiles || {}) },
                            // Always enforce modern layout to match reference HTML
                            settings: { ...initialData.settings, ...(parsed.settings || {}), layout: 'modern' },
                            experiences: parsed.experiences || initialData.experiences,
                            projects: parsed.projects || initialData.projects,
                            education: parsed.education || initialData.education,
                            certifications: parsed.certifications || initialData.certifications,
                            skills: parsed.skills || initialData.skills,
                            languages: parsed.languages || initialData.languages,
                        };
                        setData(mergedData);
                        if (key !== 'cvBuilderPro_FinalDB_v8') {
                            localStorage.setItem('cvBuilderPro_FinalDB_v8', JSON.stringify(mergedData));
                        }
                        return true;
                    } catch (e) { console.error(`Error cargando ${key}:`, e); }
                }
            }
            return false;
        };

        if (!loadStoredData()) {
            setData(initialData);
            localStorage.setItem('cvBuilderPro_FinalDB_v8', JSON.stringify(initialData));
        }
    }, []);

    // --- MODO CV: Oculta el nav global de tu app principal ---
    useEffect(() => {
        document.body.classList.add('cv-mode');
        return () => {
            document.body.classList.remove('cv-mode');
        };
    }, []);

    useEffect(() => {
        localStorage.setItem('cvBuilderPro_FinalDB_v8', JSON.stringify(data));
    }, [data]);

    // --- 1. DECLARACIÓN DE FILTROS ---
    const filterByProfile = (items) => Array.isArray(items) ? items.filter(item => item.sector === activeProfile || item.sector === 'ambos') : [];

    const filteredExperiences = filterByProfile(data.experiences);
    const filteredProjects = filterByProfile(data.projects);
    const filteredEducation = filterByProfile(data.education);
    const filteredCerts = filterByProfile(data.certifications);
    const filteredSkills = filterByProfile(data.skills);

    const currentProfile = data?.profiles?.[activeProfile] || initialData.profiles.it;

    const accentColor = data?.settings?.accentColor || "#3b82f6";
    const fontClass = data?.settings?.fontClass || "font-sans";
    const baseSize = data?.settings?.fontSize || 10;
    const lineHeight = data?.settings?.lineHeight || 1.5;
    const layout = data?.settings?.layout || "executive";

    // --- 2. CÁLCULO ATS ---
    const getATSScore = () => {
        let score = 0;
        let tips = [];

        if (data?.personal?.name && data?.personal?.lastName) { score += 5; } else { tips.push("Añade tu nombre y apellidos."); }
        if (data?.personal?.email && data?.personal?.phone) { score += 10; } else { tips.push("Completa email y teléfono."); }
        if (data?.personal?.location) { score += 5; } else { tips.push("Añade tu ubicación."); }
        if (data?.personal?.linkedin || data?.personal?.github) { score += 10; } else { tips.push("Añade perfiles profesionales."); }
        if (currentProfile?.title) { score += 5; } else { tips.push("Añade un titular profesional."); }

        if (currentProfile?.summary?.length > 150) { score += 15; }
        else if (currentProfile?.summary?.length > 0) { score += 5; tips.push("Amplía tu resumen."); }
        else { tips.push("Añade un resumen profesional."); }

        if (filteredExperiences?.length > 0) {
            score += 10;
            const hasGoodDescriptions = filteredExperiences.every(exp => exp.description && exp.description.length > 50);
            if (hasGoodDescriptions) { score += 10; } else { tips.push("Mejora las descripciones de experiencia."); }
        } else { tips.push("Añade experiencia relevante."); }

        if (filteredEducation?.length > 0) { score += 10; } else { tips.push("Añade tu formación académica."); }

        if (filteredSkills?.length >= 5) { score += 10; }
        else if (filteredSkills?.length > 0) { score += 5; tips.push("Añade al menos 5 habilidades."); }
        else { tips.push("Añade habilidades clave (skills)."); }

        if (data?.languages?.length > 0) { score += 5; } else { tips.push("Añade los idiomas que dominas."); }
        if (filteredProjects?.length > 0 || filteredCerts?.length > 0) { score += 5; } else { tips.push("Añade proyectos o certificaciones."); }

        return { score: Math.min(score, 100), tips };
    };

    const atsData = getATSScore();
    const atsScore = atsData.score;
    const atsTips = atsData.tips;

    // --- MANEJADORES DE ESTADO ---
    const updateData = (section, field, value) => {
        setData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
    };

    const updateProfileText = (field, value) => {
        setData(prev => ({
            ...prev,
            profiles: { ...prev.profiles, [activeProfile]: { ...prev.profiles[activeProfile], [field]: value } }
        }));
    };

    const updateArrayItem = (section, id, field, value) => {
        setData(prev => ({
            ...prev,
            [section]: prev[section].map(item => item.id === id ? { ...item, [field]: value } : item)
        }));
    };

    const addItem = (section, defaultItem) => {
        const newItem = { id: crypto.randomUUID(), ...defaultItem };
        if (section !== 'languages') newItem.sector = activeProfile;
        setData(prev => ({ ...prev, [section]: [newItem, ...prev[section]] }));
        setExpandedItem(newItem.id);
    };

    const deleteItem = (section, id) => {
        setData(prev => ({ ...prev, [section]: prev[section].filter(item => item.id !== id) }));
    };

    const moveItem = (section, index, direction) => {
        setData(prev => {
            const newArray = [...prev[section]];
            if (index + direction < 0 || index + direction >= newArray.length) return prev;
            const temp = newArray[index];
            newArray[index] = newArray[index + direction];
            newArray[index + direction] = temp;
            return { ...prev, [section]: newArray };
        });
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => updateData('personal', 'image', event.target.result);
            reader.readAsDataURL(file);
        }
    };

    const exportJSON = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
        const a = document.createElement("a");
        a.href = dataStr;
        a.download = `Mi_CV_${activeProfile}.json`;
        a.click();
    };

    const importJSON = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                if (!importedData.personal || !importedData.profiles) throw new Error("JSON Inválido");
                setData(importedData);
                alert("Datos importados con éxito");
            } catch (err) {
                alert("Error al leer el archivo JSON.");
            }
        };
        reader.readAsText(file);
    };

    // --- NUEVA FUNCIÓN: EXPORTAR A HTML ---
    const exportHTML = () => {
        if (!paperRef.current) return;

        // Limpieza temporal para evitar que se exporten elementos no deseados si los hubiera
        const cvContent = paperRef.current.outerHTML;
        const pageTitle = `${data?.personal?.name || 'CV'}_${data?.personal?.lastName || ''}_CV`.replace(/ /g, '_');

        const htmlTemplate = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data?.personal?.name} ${data?.personal?.lastName} - CV</title>
    <!-- Carga de Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Fuentes Premium -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        @page { 
            margin: 0; 
            size: A4 portrait; 
        }
        body { 
            margin: 0; 
            padding: 0; 
            background-color: #cbd5e1; 
            font-family: 'Inter', sans-serif;
            display: flex;
            justify-content: center;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        .print-container {
            width: 210mm;
            min-height: 297mm;
            background-color: white;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            margin: 2rem auto;
            position: relative;
        }
        @media print {
            body { 
                background-color: white; 
                padding: 0;
            }
            .print-container {
                margin: 0;
                box-shadow: none;
                width: 210mm;
                height: 297mm;
                overflow: hidden;
            }
            .no-print { display: none !important; }
            section { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    ${cvContent}
</body>
</html>`;

        const blob = new Blob([htmlTemplate], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${pageTitle}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex h-screen w-full bg-[#f8fafc] font-sans overflow-hidden text-slate-900 notranslate" translate="no">
            <style>{`
                /* --- CLASES PERSONALIZADAS EN CSS PURO (Soluciona problemas de renderizado con Tailwind) --- */
                .glass-panel {
                  background-color: rgba(255, 255, 255, 0.7);
                  backdrop-filter: blur(24px);
                  border-right: 1px solid rgba(255, 255, 255, 0.2);
                  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                }
                
                .glass-panel-dark {
                  background-color: rgba(15, 23, 42, 0.95);
                  backdrop-filter: blur(40px);
                  border-right: 1px solid rgba(255, 255, 255, 0.1);
                  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                }
                
                .premium-input {
                  width: 100%;
                  padding: 0.75rem 1rem;
                  background-color: #ffffff;
                  border: 1px solid #e2e8f0;
                  border-radius: 1rem;
                  outline: none;
                  color: #1e293b;
                  font-size: 0.875rem;
                  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                  transition: all 0.3s;
                }
                
                .premium-input:focus {
                  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
                  border-color: #3b82f6;
                  background-color: #ffffff;
                }
                
                .premium-input::placeholder {
                  color: #94a3b8;
                }

                .premium-label {
                  display: block;
                  font-size: 11px;
                  font-weight: 800;
                  color: #64748b;
                  text-transform: uppercase;
                  letter-spacing: 0.12em;
                  margin-bottom: 0.5rem;
                  padding-left: 0.25rem;
                  padding-right: 0.25rem;
                }

                .premium-card {
                  background-color: #ffffff;
                  padding: 1.5rem;
                  border-radius: 1.5rem;
                  border: 1px solid rgba(226, 232, 240, 0.6);
                  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.04);
                  position: relative;
                  overflow: hidden;
                  transition: all 0.3s;
                }

                .premium-card:hover {
                  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.06);
                  border-color: #cbd5e1;
                }

                /* Control de overrides explícitos para no perder márgenes/paddings */
                .premium-card.\\!p-0 { padding: 0 !important; }
                .premium-card.\\!p-3 { padding: 0.75rem !important; }

                .nav-pill {
                  display: flex;
                  align-items: center;
                  gap: 0.75rem;
                  padding: 0.75rem 1rem;
                  border-radius: 1rem;
                  transition: all 0.5s;
                }
                
                .nav-pill-active {
                  background: linear-gradient(to right, #2563eb, #4f46e5);
                  color: white;
                  box-shadow: 0 10px 25px rgba(37, 99, 235, 0.3);
                  transform: scale(1.02);
                  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
                }

                .custom-scrollbar::-webkit-scrollbar {
                  width: 5px;
                  height: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: rgba(0, 0, 0, 0.1);
                  border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: rgba(0, 0, 0, 0.2);
                }
                
                @media print {
                    @page { margin: 0; size: A4 portrait; }
                    body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background-color: white !important; }
                    .no-print { display: none !important; }
                    .print-container { border: none !important; margin: 0 auto !important; width: 210mm !important; height: 297mm !important; max-width: 210mm !important; box-shadow: none !important; overflow: hidden !important; }
                    section { page-break-inside: avoid !important; }
                    .print-wrapper { padding: 0 !important; background: white !important; overflow: visible !important; height: auto !important; }
                }
                
                .print-container {
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                    word-break: break-word;
                }
                .print-container p, .print-container span, .print-container li, .print-container h1, .print-container h2, .print-container h3 {
                    overflow-wrap: break-word;
                    word-break: break-word;
                }
            `}</style>

            {/* --- PANEL LATERAL UNIFICADO (PREMIUM GLASS) --- */}
            <aside
                ref={sidebarRef}
                className={`flex shrink-0 h-full transition-all duration-500 ease-in-out z-20 print:hidden overflow-hidden glass-panel-dark ${showPanels ? 'w-[36rem]' : 'w-0'}`}
            >
                {/* 1. BARRA DE NAVEGACIÓN (VERTICAL SIDEBAR) */}
                <div className="w-24 bg-slate-900 flex flex-col shrink-0 border-r border-white/5 overflow-y-auto custom-scrollbar no-print py-6 gap-2 px-2">
                    <NavButton id="personal" icon={User} label="Datos" activeTab={activeTab} setActiveTab={setActiveTab} setExpandedItem={setExpandedItem} />
                    <NavButton id="experiencia" icon={Briefcase} label="Exp." activeTab={activeTab} setActiveTab={setActiveTab} setExpandedItem={setExpandedItem} />
                    <NavButton id="proyectos" icon={Code} label="Proyectos" activeTab={activeTab} setActiveTab={setActiveTab} setExpandedItem={setExpandedItem} />
                    <NavButton id="estudios" icon={GraduationCap} label="Estudios" activeTab={activeTab} setActiveTab={setActiveTab} setExpandedItem={setExpandedItem} />
                    <NavButton id="certificaciones" icon={Award} label="Certs" activeTab={activeTab} setActiveTab={setActiveTab} setExpandedItem={setExpandedItem} />
                    <NavButton id="habilidades" icon={Star} label="Skills" activeTab={activeTab} setActiveTab={setActiveTab} setExpandedItem={setExpandedItem} />
                    <NavButton id="idiomas" icon={Languages} label="Idiomas" activeTab={activeTab} setActiveTab={setActiveTab} setExpandedItem={setExpandedItem} />
                    <NavButton id="ajustes" icon={Palette} label="Diseño" activeTab={activeTab} setActiveTab={setActiveTab} setExpandedItem={setExpandedItem} />
                </div>

                {/* 2. AREA DE EDICIÓN (PANEL PRINCIPAL) */}
                <div className="flex-1 bg-white flex flex-col z-10 relative overflow-hidden shadow-[-20px_0_40px_rgba(0,0,0,0.1)]">

                    {/* CABECERA DINÁMICA (STICKY) */}
                    <div className="p-8 pb-7 border-b border-slate-100 bg-white/95 backdrop-blur-md sticky top-0 z-30 flex items-start justify-between gap-4 overflow-visible min-h-[110px]">
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-4">
                            <div className="p-2.5 bg-blue-50 rounded-[18px] shadow-sm border border-blue-100/50 shrink-0">
                                {activeTab === 'personal' && <User className="w-6 h-6 text-blue-600" />}
                                {activeTab === 'experiencia' && <Briefcase className="w-6 h-6 text-blue-600" />}
                                {activeTab === 'proyectos' && <Code className="w-6 h-6 text-blue-600" />}
                                {activeTab === 'estudios' && <GraduationCap className="w-6 h-6 text-blue-600" />}
                                {activeTab === 'certificaciones' && <Award className="w-6 h-6 text-blue-600" />}
                                {activeTab === 'habilidades' && <Star className="w-6 h-6 text-blue-600" />}
                                {activeTab === 'idiomas' && <Languages className="w-6 h-6 text-blue-600" />}
                                {activeTab === 'ajustes' && <Palette className="w-6 h-6 text-blue-600" />}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[10px] uppercase font-black text-slate-400 leading-none mb-1.5 whitespace-nowrap opacity-70 tracking-widest">
                                    Editor Premium
                                </span>
                                <span className="text-xl font-black leading-tight capitalize bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent truncate pb-1">
                                    {activeTab === 'personal' && 'Identidad y Contacto'}
                                    {activeTab === 'experiencia' && 'Trayectoria Laboral'}
                                    {activeTab === 'proyectos' && 'Proyectos e Impacto'}
                                    {activeTab === 'estudios' && 'Formación y Grados'}
                                    {activeTab === 'certificaciones' && 'Logros Certificados'}
                                    {activeTab === 'habilidades' && 'Skills y Competencias'}
                                    {activeTab === 'idiomas' && 'Dominio Lingüístico'}
                                    {activeTab === 'ajustes' && 'Estética y Formatos'}
                                </span>
                            </div>
                        </h2>

                        <div className="flex items-center gap-3 bg-slate-50/80 p-2.5 pr-4 rounded-[22px] border border-slate-200/50 shadow-sm group cursor-help transition-all hover:bg-white hover:shadow-md">
                            <div className="relative w-11 h-11">
                                <svg className="w-11 h-11 transform -rotate-90">
                                    <circle cx="22" cy="22" r="19" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-200" />
                                    <circle cx="22" cy="22" r="19" stroke="currentColor" strokeWidth="4" fill="transparent"
                                        strokeDasharray={119.3} strokeDashoffset={119.3 - (119.3 * (atsScore || 0)) / 100}
                                        className={`transition-all duration-1000 ${atsScore > 80 ? 'text-emerald-500' : atsScore > 50 ? 'text-amber-500' : 'text-red-500'}`} />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-slate-900">
                                    {atsScore}%
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Optimización ATS</span>
                                <span className={`text-[10px] font-black uppercase ${atsScore > 80 ? 'text-emerald-600' : atsScore > 65 ? 'text-blue-600' : 'text-amber-600'}`}>
                                    {atsScore > 85 ? 'Perfil Élite' : atsScore > 65 ? 'Nivel Alto' : 'En Mejora'}
                                </span>
                            </div>

                            <div className="absolute right-0 top-full mt-3 w-72 bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.4)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 pointer-events-none scale-95 group-hover:scale-100 origin-top-right backdrop-blur-xl">
                                <div className="relative z-10 w-full text-left">
                                    <h4 className="text-white font-black text-[11px] uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-white/10 pb-3"><Activity className="w-4 h-4 text-blue-400" /> Auditoría de Perfil</h4>
                                    {atsTips.length === 0 ? (
                                        <p className="text-emerald-400 text-xs font-semibold flex items-start gap-2 bg-emerald-500/10 p-3 rounded-2xl"><Sparkles className="w-4 h-4 shrink-0" />¡Excelente! Tu CV es totalmente compatible con sistemas ATS.</p>
                                    ) : (
                                        <ul className="space-y-2.5">
                                            {(atsTips || []).map((tip, i) => (
                                                <li key={`tip-${i}`} className="text-slate-300 text-[11px] flex items-start gap-2.5 leading-relaxed">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(37,99,235,0.6)]"></div>
                                                    {tip}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-7 pt-4">
                        {['personal', 'experiencia', 'proyectos', 'estudios', 'certificaciones', 'habilidades'].includes(activeTab) && (
                            <div className="bg-slate-200/50 p-1.5 rounded-[22px] flex border border-slate-200 shadow-inner overflow-hidden">
                                <button
                                    onClick={() => setActiveProfile('hosteleria')}
                                    className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-[0.15em] rounded-2xl transition-all duration-500 flex items-center justify-center gap-2 ${activeProfile === 'hosteleria' ? 'bg-white text-orange-600 shadow-xl scale-[1.02] border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-white/40'}`}
                                >
                                    <Globe className="w-4 h-4" /> Hostelería
                                </button>
                                <button
                                    onClick={() => setActiveProfile('it')}
                                    className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-[0.15em] rounded-2xl transition-all duration-500 flex items-center justify-center gap-2 ${activeProfile === 'it' ? 'bg-white text-blue-700 shadow-xl scale-[1.02] border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-white/40'}`}
                                >
                                    <Layout className="w-4 h-4" /> <span>Informática</span>
                                </button>
                            </div>
                        )}
                    </div>

                    <div ref={tabsContainerRef} className="flex-1 overflow-y-auto p-7 bg-slate-50/50 custom-scrollbar">
                        <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
                            {/* TABS CONTENIDO */}
                            {activeTab === 'personal' && (
                                <div className="space-y-6">
                                    <div className="premium-card">
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
                                        <InputField label="Título Profesional" value={currentProfile.title} onChange={(e) => updateProfileText('title', e.target.value)} icon={Briefcase} />
                                        <div className="flex flex-col gap-2 mt-4">
                                            <label className="premium-label flex justify-between items-center pr-2">
                                                Resumen Profesional <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                                            </label>
                                            <textarea
                                                value={currentProfile.summary}
                                                onChange={(e) => updateProfileText('summary', e.target.value)}
                                                rows="6"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none resize-none leading-relaxed transition-all duration-300 placeholder:text-slate-400"
                                                placeholder="Escribe un resumen impactante..."
                                            />
                                        </div>
                                    </div>

                                    <div className="premium-card space-y-4">
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>

                                        <div className="flex flex-col gap-1.5 mb-6 group">
                                            <label className="premium-label flex items-center gap-1.5 text-indigo-600">
                                                <Camera className="w-3.5 h-3.5" /> Foto de Perfil
                                            </label>
                                            <div className="flex flex-col gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl transition-all hover:border-indigo-300">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative group/avatar cursor-pointer shrink-0">
                                                        <img
                                                            src={data?.personal?.image || 'https://placehold.co/150x150/e2e8f0/94a3b8?text=FOTO'}
                                                            alt="Perfil"
                                                            className="w-16 h-16 rounded-full object-cover border-[3px] border-white shadow-md bg-slate-200"
                                                            style={{ objectPosition: `50% ${data?.settings?.imagePosition ?? 20}%` }}
                                                        />
                                                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer">
                                                            <Camera className="w-5 h-5 text-white" />
                                                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                                        </label>
                                                    </div>
                                                    <div className="flex flex-col gap-1.5 flex-1">
                                                        <label className="bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider cursor-pointer transition-all shadow-sm flex items-center justify-center gap-2 w-max">
                                                            <Upload className="w-3.5 h-3.5" /> Cambiar Imagen
                                                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                                        </label>
                                                        <p className="text-[10px] text-slate-400 font-medium">Se recomienda 1:1 (cuadrada). Formatos JPG/PNG.</p>
                                                    </div>
                                                    {data?.personal?.image && (
                                                        <button
                                                            onClick={() => updateData('personal', 'image', '')}
                                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all self-start mt-1"
                                                            title="Quitar foto"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>

                                                {/* --- CONTROLADOR DE ENCUADRE --- */}
                                                {data?.personal?.image && (
                                                    <div className="pt-3 border-t border-slate-200/60 mt-1">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                                                                Encuadre Vertical
                                                            </label>
                                                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                                                {data?.settings?.imagePosition ?? 20}%
                                                            </span>
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="100"
                                                            value={data?.settings?.imagePosition ?? 20}
                                                            onChange={(e) => updateData('settings', 'imagePosition', parseInt(e.target.value))}
                                                            className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                                        />
                                                        <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-medium uppercase">
                                                            <span>Arriba</span>
                                                            <span>Abajo</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <InputField label="Nombre" value={data?.personal?.name} onChange={(e) => updateData('personal', 'name', e.target.value)} icon={User} />
                                        <InputField label="Apellidos" value={data?.personal?.lastName} onChange={(e) => updateData('personal', 'lastName', e.target.value)} icon={User} />
                                        <InputField label="Email Personal" type="email" value={data?.personal?.email} onChange={(e) => updateData('personal', 'email', e.target.value)} icon={Mail} />
                                        <InputField label="Teléfono de contacto" value={data?.personal?.phone} onChange={(e) => updateData('personal', 'phone', e.target.value)} icon={Phone} />
                                        <InputField label="Localización" value={data?.personal?.location} onChange={(e) => updateData('personal', 'location', e.target.value)} icon={MapPin} />
                                        <InputField label="Sub-Localización" value={data?.personal?.subLocation} onChange={(e) => updateData('personal', 'subLocation', e.target.value)} icon={MapPin} />
                                        <InputField label="Carnet y Vehículo" value={data?.personal?.drivingLicense} onChange={(e) => updateData('personal', 'drivingLicense', e.target.value)} icon={Car} />
                                        <InputField label="Perfil de LinkedIn" value={data?.personal?.linkedin} onChange={(e) => updateData('personal', 'linkedin', e.target.value)} icon={LinkIcon} />
                                        <InputField label="Enlace a GitHub" value={data?.personal?.github} onChange={(e) => updateData('personal', 'github', e.target.value)} icon={GitBranch} />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'experiencia' && (
                                <div className="space-y-4">
                                    <button
                                        onClick={() => addItem('experiences', { role: "Puesto", company: "Empresa", date: "Año", description: "", sector: activeProfile })}
                                        className="w-full bg-blue-50/40 hover:bg-white text-blue-600 border-2 border-blue-200 border-dashed text-xs font-black uppercase tracking-widest py-6 rounded-3xl flex items-center justify-center gap-3 transition-all duration-300 hover:shadow-xl hover:scale-[1.01] hover:border-blue-400 group"
                                    >
                                        <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg group-hover:scale-110 transition-transform"><Plus className="w-4 h-4" /></div>
                                        Añadir Nueva Experiencia
                                    </button>
                                    {data.experiences.map((exp, idx) => (
                                        <ArrayEditorItem
                                            key={exp.id}
                                            item={exp}
                                            index={idx}
                                            section="experiences"
                                            titleField="role"
                                            subField="company"
                                            IconDef={Briefcase}
                                            expandedItem={expandedItem}
                                            setExpandedItem={setExpandedItem}
                                            moveItem={moveItem}
                                            deleteItem={deleteItem}
                                            containerLength={data.experiences.length}
                                        >
                                            <div className="p-6 space-y-5 bg-white">
                                                <InputField label="Posición / Cargo" value={exp.role} onChange={(e) => updateArrayItem('experiences', exp.id, 'role', e.target.value)} />
                                                <div className="grid grid-cols-2 gap-4">
                                                    <InputField label="Empresa" value={exp.company} onChange={(e) => updateArrayItem('experiences', exp.id, 'company', e.target.value)} />
                                                    <InputField label="Periodo (Ej: 2021 - Actualidad)" value={exp.date} onChange={(e) => updateArrayItem('experiences', exp.id, 'date', e.target.value)} />
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <label className="premium-label">Sector Destacado</label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {['hosteleria', 'it', 'ambos'].map(s => (
                                                            <button
                                                                key={s}
                                                                onClick={() => updateArrayItem('experiences', exp.id, 'sector', s)}
                                                                className={`py-2 px-1 text-[10px] font-black uppercase tracking-wider rounded-xl border transition-all ${exp.sector === s ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}
                                                            >
                                                                {s === 'hosteleria' ? 'Hostel' : s === 'it' ? 'IT' : 'Global'}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <label className="premium-label">Logros y Responsabilidades (Uno por línea)</label>
                                                    <textarea
                                                        value={exp.description || ""}
                                                        onChange={(e) => updateArrayItem('experiences', exp.id, 'description', e.target.value)}
                                                        rows="4"
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none resize-y transition-all"
                                                        placeholder="• Diseñé una arquitectura escalable..."
                                                    />
                                                </div>
                                            </div>
                                        </ArrayEditorItem>
                                    ))}
                                </div>
                            )}
                            {activeTab === 'proyectos' && (
                                <div className="space-y-4">
                                    <button
                                        onClick={() => addItem('projects', { name: "Proyecto", tech: "Tecnologías", date: "Año", description: "", link: "", sector: activeProfile })}
                                        className="w-full bg-blue-50/40 hover:bg-white text-blue-600 border-2 border-blue-200 border-dashed text-xs font-black uppercase tracking-widest py-6 rounded-3xl flex items-center justify-center gap-3 transition-all duration-300 hover:shadow-xl hover:scale-[1.01] hover:border-blue-400 group"
                                    >
                                        <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg group-hover:scale-110 transition-transform"><Plus className="w-4 h-4" /></div>
                                        Añadir Nuevo Proyecto
                                    </button>
                                    {data.projects.map((proj, idx) => (
                                        <ArrayEditorItem
                                            key={proj.id}
                                            item={proj}
                                            index={idx}
                                            section="projects"
                                            titleField="name"
                                            subField="tech"
                                            IconDef={Code}
                                            expandedItem={expandedItem}
                                            setExpandedItem={setExpandedItem}
                                            moveItem={moveItem}
                                            deleteItem={deleteItem}
                                            containerLength={data.projects.length}
                                        >
                                            <div className="p-6 space-y-5 bg-white border-t border-slate-100">
                                                <InputField label="Nombre del Proyecto" value={proj.name} onChange={(e) => updateArrayItem('projects', proj.id, 'name', e.target.value)} />
                                                <div className="grid grid-cols-2 gap-4">
                                                    <InputField label="Tecnologías (Ej: React, Python)" value={proj.tech} onChange={(e) => updateArrayItem('projects', proj.id, 'tech', e.target.value)} />
                                                    <InputField label="Enlace / Repo" value={proj.link} onChange={(e) => updateArrayItem('projects', proj.id, 'link', e.target.value)} />
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <label className="premium-label text-blue-500">Sector de Visualización</label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {['hosteleria', 'it', 'ambos'].map(s => (
                                                            <button
                                                                key={s}
                                                                onClick={() => updateArrayItem('projects', proj.id, 'sector', s)}
                                                                className={`py-2 px-1 text-[10px] font-black uppercase tracking-wider rounded-xl border transition-all ${proj.sector === s ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}
                                                            >
                                                                {s === 'hosteleria' ? 'Hostel' : s === 'it' ? 'IT' : 'Global'}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <label className="premium-label">Breve Descripción</label>
                                                    <textarea
                                                        value={proj.description || ""}
                                                        onChange={(e) => updateArrayItem('projects', proj.id, 'description', e.target.value)}
                                                        rows="3"
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none resize-y transition-all"
                                                        placeholder="Describe tu rol y el impacto del proyecto..."
                                                    />
                                                </div>
                                            </div>
                                        </ArrayEditorItem>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'estudios' && (
                                <div className="space-y-4">
                                    <button
                                        onClick={() => addItem('education', { degree: "Título", institution: "Institución", date: "Año", sector: activeProfile })}
                                        className="w-full bg-indigo-50/40 hover:bg-white text-indigo-600 border-2 border-indigo-200 border-dashed text-xs font-black uppercase tracking-widest py-6 rounded-3xl flex items-center justify-center gap-3 transition-all duration-300 hover:shadow-xl hover:scale-[1.01] hover:border-indigo-400 group"
                                    >
                                        <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg group-hover:scale-110 transition-transform"><Plus className="w-4 h-4" /></div>
                                        Añadir Formación
                                    </button>
                                    {data.education.map((edu, idx) => (
                                        <ArrayEditorItem
                                            key={edu.id}
                                            item={edu}
                                            index={idx}
                                            section="education"
                                            titleField="degree"
                                            subField="institution"
                                            IconDef={GraduationCap}
                                            expandedItem={expandedItem}
                                            setExpandedItem={setExpandedItem}
                                            moveItem={moveItem}
                                            deleteItem={deleteItem}
                                            containerLength={data.education.length}
                                        >
                                            <div className="p-6 space-y-5 bg-white border-t border-slate-100">
                                                <InputField label="Título / Carrera" value={edu.degree} onChange={(e) => updateArrayItem('education', edu.id, 'degree', e.target.value)} />
                                                <div className="grid grid-cols-2 gap-4">
                                                    <InputField label="Institución" value={edu.institution} onChange={(e) => updateArrayItem('education', edu.id, 'institution', e.target.value)} />
                                                    <InputField label="Fecha / Periodo" value={edu.date} onChange={(e) => updateArrayItem('education', edu.id, 'date', e.target.value)} />
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <label className="premium-label">Sector</label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {['hosteleria', 'it', 'ambos'].map(s => (
                                                            <button
                                                                key={s}
                                                                onClick={() => updateArrayItem('education', edu.id, 'sector', s)}
                                                                className={`py-2 px-1 text-[10px] font-black uppercase tracking-wider rounded-xl border transition-all ${edu.sector === s ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}
                                                            >
                                                                {s === 'hosteleria' ? 'Hostel' : s === 'it' ? 'IT' : 'Global'}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </ArrayEditorItem>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'certificaciones' && (
                                <div className="space-y-4">
                                    <button
                                        onClick={() => addItem('certifications', { name: "Certificación", issuer: "Emisor", date: "Año", sector: activeProfile })}
                                        className="w-full bg-amber-50/40 hover:bg-white text-amber-600 border-2 border-amber-200 border-dashed text-xs font-black uppercase tracking-widest py-6 rounded-3xl flex items-center justify-center gap-3 transition-all duration-300 hover:shadow-xl hover:scale-[1.01] hover:border-amber-400 group"
                                    >
                                        <div className="p-2 bg-amber-600 text-white rounded-xl shadow-lg group-hover:scale-110 transition-transform"><Plus className="w-4 h-4" /></div>
                                        Añadir Certificación
                                    </button>
                                    {data.certifications.map((cert, idx) => (
                                        <ArrayEditorItem
                                            key={cert.id}
                                            item={cert}
                                            index={idx}
                                            section="certifications"
                                            titleField="name"
                                            subField="issuer"
                                            IconDef={Award}
                                            expandedItem={expandedItem}
                                            setExpandedItem={setExpandedItem}
                                            moveItem={moveItem}
                                            deleteItem={deleteItem}
                                            containerLength={data.certifications.length}
                                        >
                                            <div className="p-6 space-y-5 bg-white border-t border-slate-100">
                                                <InputField label="Nombre del Certificado" value={cert.name} onChange={(e) => updateArrayItem('certifications', cert.id, 'name', e.target.value)} />
                                                <div className="grid grid-cols-2 gap-4">
                                                    <InputField label="Emisor / Plataforma" value={cert.issuer} onChange={(e) => updateArrayItem('certifications', cert.id, 'issuer', e.target.value)} />
                                                    <InputField label="Fecha" value={cert.date} onChange={(e) => updateArrayItem('certifications', cert.id, 'date', e.target.value)} />
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <label className="premium-label">Sector</label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {['hosteleria', 'it', 'ambos'].map(s => (
                                                            <button
                                                                key={s}
                                                                onClick={() => updateArrayItem('certifications', cert.id, 'sector', s)}
                                                                className={`py-2 px-1 text-[10px] font-black uppercase tracking-wider rounded-xl border transition-all ${cert.sector === s ? 'bg-amber-600 text-white border-amber-600 shadow-lg' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}
                                                            >
                                                                {s === 'hosteleria' ? 'Hostel' : s === 'it' ? 'IT' : 'Global'}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </ArrayEditorItem>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'habilidades' && (
                                <div className="space-y-4">
                                    <button
                                        onClick={() => addItem('skills', { name: "Habilidad", level: "Senior", sector: activeProfile })}
                                        className="w-full bg-emerald-50/40 hover:bg-white text-emerald-600 border-2 border-emerald-200 border-dashed text-xs font-black uppercase tracking-widest py-6 rounded-3xl flex items-center justify-center gap-3 transition-all duration-300 hover:shadow-xl hover:scale-[1.01] hover:border-emerald-400 group"
                                    >
                                        <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-lg group-hover:scale-110 transition-transform"><Plus className="w-4 h-4" /></div>
                                        Añadir Nueva Habilidad
                                    </button>
                                    <div className="grid grid-cols-1 gap-2">
                                        {data.skills.map((skill, idx) => (
                                            <div key={skill?.id || `skill-${idx}`} className="premium-card !p-3 flex items-center gap-4 group">
                                                <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => moveItem('skills', idx, -1)} className="p-1 hover:text-emerald-600 transition-colors"><ArrowUp size={14} /></button>
                                                    <button onClick={() => moveItem('skills', idx, 1)} className="p-1 hover:text-emerald-600 transition-colors"><ArrowDown size={14} /></button>
                                                </div>
                                                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                                    <Star size={14} />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={String(skill?.name || '')}
                                                    onChange={(e) => updateArrayItem('skills', skill.id, 'name', e.target.value)}
                                                    className="flex-1 bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:text-slate-300"
                                                    placeholder="Nombre de Habilidad"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        value={String(skill?.level || 'Básico')}
                                                        onChange={(e) => updateArrayItem('skills', skill.id, 'level', e.target.value)}
                                                        className="bg-slate-50 border border-slate-200 text-[10px] font-black uppercase tracking-wider rounded-lg px-2 py-1.5 outline-none focus:border-emerald-500"
                                                    >
                                                        <option value="Básico">Básico</option>
                                                        <option value="Intermedio">Intermedio</option>
                                                        <option value="Avanzado">Avanzado</option>
                                                        <option value="Experto">Experto</option>
                                                    </select>
                                                    <select
                                                        value={String(skill?.sector || 'it')}
                                                        onChange={(e) => updateArrayItem('skills', skill.id, 'sector', e.target.value)}
                                                        className="bg-slate-50 border border-slate-200 text-[10px] font-black uppercase tracking-wider rounded-lg px-2 py-1.5 outline-none focus:border-slate-800"
                                                    >
                                                        <option value="hosteleria">Hostel</option>
                                                        <option value="it">IT</option>
                                                        <option value="ambos">Ambos</option>
                                                    </select>
                                                    <button onClick={() => deleteItem('skills', skill.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'idiomas' && (
                                <div className="space-y-4">
                                    <button
                                        onClick={() => addItem('languages', { name: "Idioma", level: "Nivel Intermedio", percentage: 50, details: "" })}
                                        className="w-full bg-violet-50/40 hover:bg-white text-violet-600 border-2 border-violet-200 border-dashed text-xs font-black uppercase tracking-widest py-6 rounded-3xl flex items-center justify-center gap-3 transition-all duration-300 hover:shadow-xl hover:scale-[1.01] hover:border-violet-400 group"
                                    >
                                        <div className="p-2 bg-violet-600 text-white rounded-xl shadow-lg group-hover:scale-110 transition-transform"><Plus className="w-4 h-4" /></div>
                                        Añadir Nuevo Idioma
                                    </button>
                                    {data.languages.map((lang, idx) => (
                                        <ArrayEditorItem
                                            key={lang.id}
                                            item={lang}
                                            index={idx}
                                            section="languages"
                                            titleField="name"
                                            subField="level"
                                            IconDef={Languages}
                                            expandedItem={expandedItem}
                                            setExpandedItem={setExpandedItem}
                                            moveItem={moveItem}
                                            deleteItem={deleteItem}
                                            containerLength={data.languages.length}
                                        >
                                            <div className="p-6 space-y-6 bg-white border-t border-slate-100">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <InputField label="Idioma" value={lang.name} onChange={(e) => updateArrayItem('languages', lang.id, 'name', e.target.value)} />
                                                    <InputField label="Nivel Certificado" value={lang.level} onChange={(e) => updateArrayItem('languages', lang.id, 'level', e.target.value)} />
                                                </div>
                                                <div className="flex flex-col gap-3">
                                                    <label className="premium-label flex justify-between">
                                                        Dominio Estimado <span>{lang.percentage}%</span>
                                                    </label>
                                                    <div className="relative pt-1">
                                                        <input type="range" min="10" max="100" step="5" value={lang.percentage} onChange={(e) => updateArrayItem('languages', lang.id, 'percentage', parseInt(e.target.value))} className="w-full accent-violet-600 h-2.5 bg-slate-100 rounded-xl appearance-none cursor-pointer" />
                                                        <div className="flex justify-between text-[8px] font-black uppercase tracking-tighter text-slate-400 mt-2">
                                                            <span>Elemental</span>
                                                            <span>Profesional</span>
                                                            <span>Bilingüe</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <InputField label="Notas adicionales (Ej: TFG en inglés)" value={lang.details} onChange={(e) => updateArrayItem('languages', lang.id, 'details', e.target.value)} />
                                            </div>
                                        </ArrayEditorItem>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'ajustes' && (
                                <div className="space-y-6 pb-10">
                                    <div className="premium-card">
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 mb-6 flex items-center gap-2">
                                            <Layout className="w-4 h-4 text-blue-600" /> Diseño y Estructura
                                        </h3>
                                        <div className="grid grid-cols-3 gap-3">
                                            <button onClick={() => updateData('settings', 'layout', 'modern')} className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${layout === 'modern' ? 'bg-blue-50 border-blue-500 shadow-lg scale-[1.02]' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                                                <div className="w-full aspect-video bg-slate-100 rounded-lg overflow-hidden flex shadow-inner">
                                                    <div className="w-1/3 bg-slate-800 h-full"></div>
                                                    <div className="w-2/3 bg-white h-full p-1 space-y-0.5">
                                                        <div className="w-full h-1 bg-slate-200 rounded-full"></div>
                                                        <div className="w-3/4 h-1 bg-slate-100 rounded-full"></div>
                                                    </div>
                                                </div>
                                                <span className="text-[9px] font-black uppercase tracking-widest leading-none">Moderno</span>
                                            </button>
                                            <button onClick={() => updateData('settings', 'layout', 'executive')} className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${layout === 'executive' ? 'bg-blue-50 border-blue-500 shadow-lg scale-[1.02]' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                                                <div className="w-full aspect-video bg-white rounded-lg overflow-hidden flex flex-col shadow-inner">
                                                    <div className="w-full h-1/4 bg-blue-500"></div>
                                                    <div className="flex flex-1 p-1 gap-1">
                                                        <div className="w-1/4 h-full bg-slate-50 rounded"></div>
                                                        <div className="w-3/4 h-full space-y-0.5">
                                                            <div className="w-full h-1 bg-slate-200 rounded-full"></div>
                                                            <div className="w-full h-1 bg-slate-100 rounded-full"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className="text-[9px] font-black uppercase tracking-widest leading-none">Ejecutivo</span>
                                            </button>
                                            <button onClick={() => updateData('settings', 'layout', 'classic')} className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${layout === 'classic' ? 'bg-blue-50 border-blue-500 shadow-lg scale-[1.02]' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                                                <div className="w-full aspect-video bg-white rounded-lg overflow-hidden flex flex-col p-1 gap-1 shadow-inner border border-slate-100">
                                                    <div className="w-full h-1.5 bg-slate-200 rounded-full"></div>
                                                    <div className="w-full flex-1 bg-slate-50 rounded-sm"></div>
                                                </div>
                                                <span className="text-[9px] font-black uppercase tracking-widest leading-none">Clásico</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="premium-card">
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 mb-6 flex items-center gap-2">
                                            <Palette className="w-4 h-4 text-amber-500" /> Identidad Visual
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-3 mb-6">
                                            {THEMES.map(theme => (
                                                <button key={theme.color} onClick={() => updateData('settings', 'accentColor', theme.color)} className={`w-8 h-8 rounded-full ring-2 ring-offset-2 transition-all ${accentColor === theme.color ? 'ring-slate-800 scale-110' : 'ring-transparent hover:scale-110'}`} style={{ backgroundColor: theme.color }} title={theme.name}></button>
                                            ))}
                                            <div className="h-6 w-px bg-slate-200 mx-1"></div>
                                            <label className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500 cursor-pointer shadow-md ring-2 ring-offset-2 ring-transparent hover:scale-110 transition-all">
                                                <input type="color" value={accentColor} onChange={(e) => updateData('settings', 'accentColor', e.target.value)} className="opacity-0 w-0 h-0" />
                                                <Plus size={14} className="text-white drop-shadow-md" />
                                            </label>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="premium-label">Espaciado ({lineHeight}x)</label>
                                                    <input type="range" min="1.1" max="2" step="0.05" value={lineHeight} onChange={(e) => updateData('settings', 'lineHeight', parseFloat(e.target.value))} className="w-full accent-blue-600 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer" />
                                                </div>
                                                <div>
                                                    <label className="premium-label">Tamaño Letra ({baseSize}px)</label>
                                                    <input type="range" min="8" max="14" step="0.25" value={baseSize} onChange={(e) => updateData('settings', 'fontSize', parseFloat(e.target.value))} className="w-full accent-blue-600 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer" />
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="premium-label">Fuente Global</label>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {FONTS.map(f => (
                                                        <button
                                                            key={f.class}
                                                            onClick={() => updateData('settings', 'fontClass', f.class)}
                                                            className={`py-2 px-3 text-[10px] font-bold text-left rounded-xl border transition-all ${fontClass === f.class ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'} ${f.class}`}
                                                        >
                                                            {f.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-8 border-t border-slate-100">
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 mb-6 flex items-center gap-2">
                                            <Download className="w-4 h-4 text-blue-600" /> Finalizar y Exportar
                                        </h3>
                                        <div className="flex flex-col gap-4">
                                            <button 
                                                onClick={exportHTML} 
                                                className="w-full bg-blue-600 text-white py-4 px-6 rounded-[22px] text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:scale-95 group"
                                            >
                                                <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" /> 
                                                Descargar CV Profesional (HTML)
                                            </button>
                                            
                                            <div className="grid grid-cols-2 gap-4 mt-2">
                                                <button 
                                                    onClick={exportJSON} 
                                                    className="bg-slate-900 text-white py-4 rounded-[22px] text-[9px] font-black uppercase tracking-[0.15em] flex items-center justify-center gap-2 shadow-xl hover:bg-black hover:-translate-y-1 transition-all group"
                                                >
                                                    <Download className="w-4 h-4 text-slate-400 group-hover:text-white" /> Copia JSON
                                                </button>
                                                <label className="bg-white border-2 border-slate-100 text-slate-800 py-4 rounded-[22px] text-[9px] font-black uppercase tracking-[0.15em] flex items-center justify-center gap-2 cursor-pointer hover:border-blue-200 hover:bg-blue-50/30 hover:-translate-y-1 transition-all shadow-sm group">
                                                    <Upload className="w-4 h-4 text-slate-400 group-hover:text-blue-500" /> Cargar JSON
                                                    <input type="file" accept=".json" onChange={importJSON} className="hidden" />
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </aside>

            {/* --- ÁREA DE VISTA PREVIA (DERECHA) --- */}
            <div className="flex-1 print-wrapper relative no-print-bg custom-scrollbar flex flex-col items-stretch overflow-x-auto min-w-0"
                style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>

                <button
                    onClick={() => setShowPanels(!showPanels)}
                    className="fixed top-1/2 -translate-y-1/2 z-50 py-5 px-1.5 rounded-r-xl transition-all duration-500 ease-in-out focus:outline-none no-print group"
                    style={{ left: showPanels ? '36rem' : '0', background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderLeft: 'none', color: 'rgba(255,255,255,0.5)', boxShadow: '4px 0 20px rgba(0,0,0,0.4)' }}
                    title={showPanels ? "Ocultar panel" : "Mostrar panel"}
                >
                    {showPanels ? <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" style={{ color: 'rgba(255,255,255,0.7)' }} /> : <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" style={{ color: 'rgba(255,255,255,0.7)' }} />}
                </button>

                <div className="fixed bottom-8 right-8 no-print z-50 flex flex-col gap-3">
                    <button onClick={exportHTML}
                        className="group flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all duration-300 hover:-translate-y-1"
                        style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                        <Download className="w-4 h-4 opacity-70 group-hover:opacity-100" /> Descargar HTML
                    </button>
                    <button onClick={() => window.print()}
                        className="group flex items-center justify-center gap-2 py-3.5 px-8 rounded-2xl font-black text-sm text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                        style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`, boxShadow: `0 10px 30px ${accentColor}50` }}>
                        <Printer className="w-4 h-4 group-hover:scale-110 transition-transform" /> Imprimir PDF
                    </button>
                </div>

                {/* --- AREA DE PREVISUALIZACIÓN (PAPEL A4) --- */}
                <div className="flex-1 py-10 md:py-14 px-4 overflow-y-auto overflow-x-auto custom-scrollbar print:p-0 print:bg-white min-w-0 flex flex-col"
                    style={{ background: 'transparent' }}>
                    <div className="min-w-max flex flex-col items-center justify-start p-4 mx-auto">
                        <div
                            ref={paperRef}
                            className={`print-container bg-white ${fontClass} relative`}
                            style={{ width: '210mm', minHeight: '297mm', fontSize: `${baseSize}px`, lineHeight: lineHeight, transformOrigin: 'top center', boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)' }}
                        >

                            {/* =========================================
              PLANTILLA 1: MODERNO (2 COLUMNAS)
              ========================================= */}
                            {layout === 'modern' && (
                                <div className="flex flex-row h-full min-h-[297mm]">
                                    {/* Columna Izquierda Oscura */}
                                    <aside className="w-1/3 bg-slate-800 text-slate-100 pl-10 pt-10 pr-8 pb-10 flex flex-col shrink-0 relative z-10">
                                        <div className="flex justify-center mt-2 mb-4">
                                            <div className="relative w-24 h-24 group">
                                                <img
                                                    src={data?.personal?.image || ''}
                                                    alt="Perfil"
                                                    className="w-full h-full rounded-full object-cover border-[3px] border-slate-500 shadow-2xl bg-white"
                                                    style={{ objectPosition: `50% ${data?.settings?.imagePosition ?? 20}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-5">
                                            <section>
                                                <h2 className="text-[1.15em] font-black border-b-2 border-slate-600/50 pb-1.5 mb-3 uppercase tracking-widest text-slate-300">Contacto</h2>
                                                <ul className="space-y-1.5 text-[0.95em]">
                                                    {data?.personal?.location && <li className="flex items-start gap-2.5"><MapPin className="w-[1.2em] h-[1.2em] mt-0.5 shrink-0" style={{ color: accentColor }} /><span className="leading-snug"><span>{data.personal.location}</span><br /><span className="text-slate-400 text-[0.9em]"><span>{data.personal.subLocation}</span></span></span></li>}
                                                    {data?.personal?.phone && <li className="flex items-center gap-2.5"><Phone className="w-[1.2em] h-[1.2em] shrink-0" style={{ color: accentColor }} /><span>{data.personal.phone}</span></li>}
                                                    {data?.personal?.email && <li className="flex items-center gap-2.5"><Mail className="w-[1.2em] h-[1.2em] shrink-0" style={{ color: accentColor }} /><span className="break-all"><span>{data.personal.email}</span></span></li>}
                                                    {data?.personal?.linkedin && <li className="flex items-center gap-2.5"><LinkIcon className="w-[1.2em] h-[1.2em] shrink-0" style={{ color: accentColor }} /><span className="break-all"><span>{data.personal.linkedin}</span></span></li>}
                                                    {data?.personal?.github && <li className="flex items-center gap-2.5"><GitBranch className="w-[1.2em] h-[1.2em] shrink-0" style={{ color: accentColor }} /><span className="break-all"><span>{data.personal.github}</span></span></li>}
                                                    {data?.personal?.drivingLicense && <li className="flex items-center gap-2.5"><Car className="w-[1.2em] h-[1.2em] shrink-0" style={{ color: accentColor }} /><span><span>{data.personal.drivingLicense}</span></span></li>}
                                                </ul>
                                            </section>

                                            {filteredSkills?.length > 0 && (
                                                <section>
                                                    <h2 className="flex items-center gap-2 text-[0.72em] font-black uppercase tracking-[0.22em] text-slate-400 mb-3">
                                                        <span className="inline-block w-3 h-[2px] rounded-full" style={{ backgroundColor: accentColor }}></span>
                                                        Habilidades
                                                        <span className="flex-1 h-px bg-slate-700/80"></span>
                                                    </h2>
                                                    <div className="flex flex-col gap-1.5">
                                                        {(filteredSkills || []).map((skill, idx) => {
                                                            const lvlMap = { 'Básico': 1, 'Intermedio': 2, 'Avanzado': 3, 'Experto': 4 };
                                                            const lvl = lvlMap[skill?.level] || 2;
                                                            return (
                                                                <div key={skill?.id || `fskill-${idx}`}
                                                                    className="flex items-center justify-between px-2.5 py-2 rounded-lg border border-slate-700/60"
                                                                    style={{ backgroundColor: `${accentColor}08` }}>
                                                                    <span className="text-[0.88em] font-semibold text-slate-200 leading-tight truncate pr-2">{skill?.name}</span>
                                                                    <div className="flex gap-[3px] shrink-0">
                                                                        {[1, 2, 3, 4].map(d => (
                                                                            <div key={d} className="w-[5px] h-[5px] rounded-full"
                                                                                style={{ backgroundColor: d <= lvl ? accentColor : '#334155' }}></div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </section>
                                            )}

                                            {/* IDIOMAS */}
                                            {data?.languages?.length > 0 && (
                                                <section>
                                                    <h2 className="flex items-center gap-2 text-[0.72em] font-black uppercase tracking-[0.22em] text-slate-400 mb-3">
                                                        <span className="inline-block w-3 h-[2px] rounded-full" style={{ backgroundColor: accentColor }}></span>
                                                        Idiomas
                                                        <span className="flex-1 h-px bg-slate-700/80"></span>
                                                    </h2>
                                                    <ul className="space-y-2.5 text-[0.9em]">
                                                        {data.languages.map(lang => (
                                                            <li key={lang.id}>
                                                                <div className="flex justify-between mb-1.5">
                                                                    <span className="font-bold text-slate-200">{lang.name}</span>
                                                                    <span className="text-[0.8em] font-black uppercase tracking-widest px-2 py-0.5 rounded-md" style={{ color: accentColor, backgroundColor: `${accentColor}18` }}>{lang.level}</span>
                                                                </div>
                                                                <div className="w-full bg-slate-700/60 rounded-full h-[0.35em] overflow-hidden">
                                                                    <div className="h-full rounded-full" style={{ width: `${lang.percentage}%`, background: `linear-gradient(to right, ${accentColor}cc, ${accentColor})` }}></div>
                                                                </div>
                                                                {lang.details && <p className="text-[0.82em] text-slate-500 mt-1 leading-snug">{lang.details}</p>}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </section>
                                            )}
                                        </div>
                                    </aside>

                                    {/* ── Columna Derecha Premium ── */}
                                    <main className="flex-1 pl-8 pr-9 py-9 bg-white text-slate-800 flex flex-col gap-5 shrink-0 z-0">

                                        {/* PERFIL */}
                                        <section>
                                            <h2 className="flex items-center gap-2 text-[1.05em] font-black uppercase tracking-wider text-slate-800 mb-2.5 pb-1.5 border-b border-slate-100">
                                                <div className="w-[3px] h-[1.1em] rounded-full mr-0.5" style={{ backgroundColor: accentColor }}></div>
                                                <div className="w-[1.6em] h-[1.6em] rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
                                                    <User className="w-[1em] h-[1em]" />
                                                </div>
                                                Perfil Profesional
                                            </h2>
                                            <p className="text-slate-600 text-[0.95em] text-justify leading-relaxed font-medium">{currentProfile?.summary}</p>
                                        </section>

                                        {/* EXPERIENCIA */}
                                        {filteredExperiences?.length > 0 && (
                                            <section>
                                                <h2 className="flex items-center gap-2 text-[1.05em] font-black uppercase tracking-wider text-slate-800 mb-3 pb-1.5 border-b border-slate-100">
                                                    <div className="w-[3px] h-[1.1em] rounded-full mr-0.5" style={{ backgroundColor: accentColor }}></div>
                                                    <div className="w-[1.6em] h-[1.6em] rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
                                                        <Briefcase className="w-[1em] h-[1em]" />
                                                    </div>
                                                    Experiencia Laboral
                                                </h2>
                                                <div className="space-y-3">
                                                    {filteredExperiences.map((exp, idx) => {
                                                        const bulletPoints = (exp.description || '').split('\n').filter(line => line.trim() !== '');
                                                        return (
                                                            <div key={exp.id} className="relative pl-4 border-l-2" style={{ borderColor: idx === 0 ? accentColor : '#e2e8f0' }}>
                                                                <div className="absolute -left-[5px] top-1.5 w-[8px] h-[8px] rounded-full ring-2 ring-white" style={{ backgroundColor: idx === 0 ? accentColor : '#cbd5e1' }}></div>
                                                                <div className="flex items-start justify-between gap-2 mb-0.5">
                                                                    <h3 className="text-[1.05em] font-black text-slate-900 leading-tight">{exp.role}</h3>
                                                                    <span className="text-[0.72em] font-bold whitespace-nowrap shrink-0 mt-0.5 px-2 py-0.5 rounded-full border"
                                                                        style={{ borderColor: `${accentColor}35`, color: accentColor, backgroundColor: `${accentColor}08` }}>
                                                                        {exp.date}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[0.82em] font-black uppercase tracking-wider mb-1.5" style={{ color: accentColor }}>{exp.company}</p>
                                                                <ul className="text-slate-600 space-y-0.5 text-[0.9em] font-medium">
                                                                    {bulletPoints.map((point, i) => {
                                                                        const colonIndex = point.indexOf(':');
                                                                        if (colonIndex !== -1 && colonIndex < 35) {
                                                                            return <li key={i} className="flex items-start gap-1.5">
                                                                                <span className="mt-[0.35em] w-[5px] h-[5px] rounded-full shrink-0" style={{ backgroundColor: accentColor }}></span>
                                                                                <span><span className="font-bold text-slate-800">{point.substring(0, colonIndex + 1)}</span>{point.substring(colonIndex + 1)}</span>
                                                                            </li>;
                                                                        }
                                                                        return <li key={i} className="flex items-start gap-1.5">
                                                                            <span className="mt-[0.35em] w-[5px] h-[5px] rounded-full shrink-0" style={{ backgroundColor: accentColor }}></span>
                                                                            <span>{point}</span>
                                                                        </li>;
                                                                    })}
                                                                </ul>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </section>
                                        )}

                                        {/* PROYECTOS */}
                                        {filteredProjects?.length > 0 && (
                                            <section>
                                                <h2 className="flex items-center gap-2 text-[1.05em] font-black uppercase tracking-wider text-slate-800 mb-3 pb-1.5 border-b border-slate-100">
                                                    <div className="w-[3px] h-[1.1em] rounded-full mr-0.5" style={{ backgroundColor: accentColor }}></div>
                                                    <div className="w-[1.6em] h-[1.6em] rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
                                                        <Code className="w-[1em] h-[1em]" />
                                                    </div>
                                                    Proyectos Destacados
                                                </h2>
                                                <div className="grid grid-cols-2 gap-2.5">
                                                    {(filteredProjects || []).map((proj, idx) => (
                                                        <div key={proj?.id || `proj-${idx}`}
                                                            className="rounded-xl border border-slate-100 p-2.5 relative overflow-hidden"
                                                            style={{ background: `linear-gradient(135deg, #f8fafc 0%, white 100%)` }}>
                                                            <div className="absolute top-0 left-0 w-full h-[2.5px]" style={{ background: `linear-gradient(to right, ${accentColor}, ${accentColor}60)` }}></div>
                                                            <div className="flex items-start justify-between mb-1">
                                                                <h3 className="text-[0.95em] font-black text-slate-900 leading-tight w-[88%]">{proj.name}</h3>
                                                                {proj.link && <LinkIcon className="w-[0.9em] h-[0.9em] text-slate-300 mt-0.5 shrink-0" />}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 mb-1.5">
                                                                <span className="text-[0.68em] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md" style={{ color: accentColor, backgroundColor: `${accentColor}12` }}>{proj.tech}</span>
                                                                {proj.date && <span className="text-[0.68em] text-slate-400 font-semibold">{proj.date}</span>}
                                                            </div>
                                                            <p className="text-[0.85em] font-medium text-slate-600 leading-snug">{proj.description}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>
                                        )}

                                        {/* EDUCACIÓN + CERTIFICACIONES */}
                                        <div className="grid grid-cols-2 gap-5">
                                            {filteredEducation?.length > 0 && (
                                                <section>
                                                    <h2 className="flex items-center gap-2 text-[1.05em] font-black uppercase tracking-wider text-slate-800 mb-2.5 pb-1.5 border-b border-slate-100">
                                                        <div className="w-[3px] h-[1.1em] rounded-full mr-0.5" style={{ backgroundColor: accentColor }}></div>
                                                        <GraduationCap className="w-[1.2em] h-[1.2em]" style={{ color: accentColor }} />
                                                        Educación
                                                    </h2>
                                                    <div className="space-y-2.5">
                                                        {(filteredEducation || []).map((edu, idx) => (
                                                            <div key={edu?.id || `edu-${idx}`} className="pl-3 border-l-2" style={{ borderColor: `${accentColor}40` }}>
                                                                <h3 className="text-[0.9em] font-black text-slate-900 leading-tight mb-0.5">{edu.degree}</h3>
                                                                <p className="text-[0.8em] font-semibold text-slate-500">{edu.institution}</p>
                                                                <p className="text-[0.75em] font-medium text-slate-400">{edu.date}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </section>
                                            )}

                                            {filteredCerts?.length > 0 && (
                                                <section>
                                                    <h2 className="flex items-center gap-2 text-[1.05em] font-black uppercase tracking-wider text-slate-800 mb-2.5 pb-1.5 border-b border-slate-100">
                                                        <div className="w-[3px] h-[1.1em] rounded-full mr-0.5" style={{ backgroundColor: accentColor }}></div>
                                                        <Award className="w-[1.2em] h-[1.2em]" style={{ color: accentColor }} />
                                                        Certificaciones
                                                    </h2>
                                                    <div className="space-y-2.5">
                                                        {(filteredCerts || []).map((cert, idx) => (
                                                            <div key={cert?.id || `cert-${idx}`} className="pl-3 border-l-2" style={{ borderColor: `${accentColor}40` }}>
                                                                <h3 className="text-[0.9em] font-black text-slate-900 leading-tight mb-0.5">{String(cert?.name || 'Certificado')}</h3>
                                                                <p className="text-[0.8em] font-semibold text-slate-500">{String(cert?.issuer || '')}</p>
                                                                <p className="text-[0.75em] font-medium text-slate-400">{String(cert?.date || '')}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </section>
                                            )}
                                        </div>
                                    </main>
                                </div>
                            )}

                            {/* =========================================
              PLANTILLA 2: EJECUTIVO (HEADER COMPLETO)
              ========================================= */}
                            {layout === 'executive' && (
                                <div className="flex flex-col h-full min-h-[297mm] bg-white">
                                    {/* Header Full Width */}
                                    <header className="w-full text-white px-12 py-8 flex items-center gap-8 relative z-10" style={{ backgroundColor: accentColor }}>
                                        <div className="w-24 h-24 shrink-0 relative">
                                            <img
                                                src={data?.personal?.image || ''}
                                                alt="Perfil"
                                                className="w-full h-full rounded-full object-cover border-[4px] border-white/20 shadow-xl bg-white"
                                                style={{ objectPosition: `50% ${data?.settings?.imagePosition ?? 20}%` }}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <h1 className="text-[2.8em] font-black tracking-tight leading-none mb-1 text-white">{data?.personal?.name} {data?.personal?.lastName}</h1>
                                            <h2 className="text-[1.2em] font-bold tracking-widest uppercase text-white/80">{currentProfile?.title}</h2>
                                        </div>
                                    </header>

                                    <div className="flex flex-row flex-1">
                                        {/* Columna Izquierda (30%) Blanca */}
                                        <aside className="w-1/3 bg-slate-50 border-r border-slate-200 pl-12 pr-8 py-8 flex flex-col gap-6 shrink-0">
                                            <section>
                                                <h2 className="text-[1.1em] font-black border-b-2 border-slate-200 pb-1 mb-4 uppercase tracking-widest text-slate-800" style={{ borderBottomColor: accentColor }}>Contacto</h2>
                                                <ul className="space-y-2.5 text-[0.9em] text-slate-600 font-medium">
                                                    {data?.personal?.location && <li className="flex items-center gap-2"><MapPin className="w-[1.2em] h-[1.2em]" style={{ color: accentColor }} />{data.personal.location}</li>}
                                                    {data?.personal?.phone && <li className="flex items-center gap-2"><Phone className="w-[1.2em] h-[1.2em]" style={{ color: accentColor }} />{data.personal.phone}</li>}
                                                    {data?.personal?.email && <li className="flex items-center gap-2"><Mail className="w-[1.2em] h-[1.2em]" style={{ color: accentColor }} /><span className="break-all">{data.personal.email}</span></li>}
                                                    {data?.personal?.linkedin && <li className="flex items-center gap-2"><LinkIcon className="w-[1.2em] h-[1.2em]" style={{ color: accentColor }} /><span className="break-all">{data.personal.linkedin}</span></li>}
                                                    {data?.personal?.github && <li className="flex items-center gap-2"><GitBranch className="w-[1.2em] h-[1.2em]" style={{ color: accentColor }} /><span className="break-all">{data.personal.github}</span></li>}
                                                    {data?.personal?.drivingLicense && <li className="flex items-center gap-2"><Car className="w-[1.2em] h-[1.2em]" style={{ color: accentColor }} />{data.personal.drivingLicense}</li>}
                                                </ul>
                                            </section>

                                            {filteredSkills?.length > 0 && (
                                                <section>
                                                    <h2 className="text-[1.1em] font-black border-b-2 border-slate-200 pb-1 mb-4 uppercase tracking-widest text-slate-800" style={{ borderBottomColor: accentColor }}>Habilidades</h2>
                                                    <div className="flex flex-col gap-2">
                                                        {filteredSkills.map(skill => (
                                                            <div key={skill.id} className="w-full bg-slate-50/80 border border-slate-100 px-3 py-2.5 rounded-xl flex flex-col shadow-sm hover:shadow-md transition-shadow">
                                                                <span className="text-[0.95em] font-bold text-slate-800 leading-tight">{skill.name}</span>
                                                                <span className="text-[0.75em] font-black uppercase tracking-widest mt-0.5" style={{ color: accentColor }}>{skill.level}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </section>
                                            )}

                                            {data?.languages?.length > 0 && (
                                                <section>
                                                    <h2 className="text-[1.1em] font-black border-b-2 border-slate-200 pb-1 mb-4 uppercase tracking-widest text-slate-800" style={{ borderBottomColor: accentColor }}>Idiomas</h2>
                                                    <ul className="space-y-3 text-[0.9em] text-slate-700">
                                                        {data.languages.map(lang => (
                                                            <li key={lang.id}>
                                                                <div className="flex justify-between mb-1"><span className="font-bold">{lang.name}</span><span className="font-black text-[0.85em]" style={{ color: accentColor }}>{lang.level}</span></div>
                                                                <div className="w-full bg-slate-200 rounded-full h-[0.4em]"><div className="h-[0.4em] rounded-full" style={{ width: `${lang.percentage}%`, backgroundColor: accentColor }}></div></div>
                                                                {lang.details && <p className="text-[0.8em] text-slate-500 mt-1 leading-snug font-medium">{lang.details}</p>}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </section>
                                            )}
                                        </aside>

                                        {/* Columna Derecha (70%) */}
                                        <main className="w-2/3 pl-8 pr-12 py-8 bg-white text-slate-800 flex flex-col gap-6 shrink-0 z-0">
                                            <section>
                                                <h2 className="text-[1.15em] font-black text-slate-800 flex items-center gap-2 mb-3 border-b-2 border-slate-100 pb-1 uppercase tracking-wide">
                                                    <User className="w-[1.2em] h-[1.2em]" style={{ color: accentColor }} /> Perfil Profesional
                                                </h2>
                                                <p className="text-slate-600 text-[1em] text-justify font-medium leading-relaxed">{currentProfile?.summary}</p>
                                            </section>

                                            {filteredExperiences?.length > 0 && (
                                                <section>
                                                    <h2 className="text-[1.15em] font-black text-slate-800 flex items-center gap-2 mb-3 border-b-2 border-slate-100 pb-1 uppercase tracking-wide">
                                                        <Briefcase className="w-[1.2em] h-[1.2em]" style={{ color: accentColor }} /> Experiencia
                                                    </h2>
                                                    <div className="space-y-3">
                                                        {filteredExperiences.map((exp) => {
                                                            const bulletPoints = (exp.description || '').split('\n').filter(line => line.trim() !== '');
                                                            return (
                                                                <div key={exp.id}>
                                                                    <div className="flex items-start justify-between gap-4 mb-0.5">
                                                                        <h3 className="text-[1.1em] font-black text-slate-900 leading-tight">{exp.role}</h3>
                                                                        <span className="text-[0.75em] font-black text-slate-400 uppercase tracking-widest text-right mt-1 shrink-0">{exp.date}</span>
                                                                    </div>
                                                                    <p className="text-[0.85em] font-bold uppercase tracking-wider mb-1.5" style={{ color: accentColor }}>{exp.company}</p>
                                                                    <ul className="text-slate-600 space-y-1.5 text-[0.95em] font-medium ml-4 list-disc marker:text-slate-300">
                                                                        {bulletPoints.map((point, i) => <li key={i}>{point}</li>)}
                                                                    </ul>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </section>
                                            )}

                                            {filteredProjects?.length > 0 && (
                                                <section>
                                                    <h2 className="text-[1.15em] font-black text-slate-800 flex items-center gap-2 mb-3 border-b-2 border-slate-100 pb-1 uppercase tracking-wide">
                                                        <Code className="w-[1.2em] h-[1.2em]" style={{ color: accentColor }} /> Proyectos
                                                    </h2>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        {filteredProjects.map(proj => (
                                                            <div key={proj.id}>
                                                                <h3 className="text-[1em] font-black text-slate-900 leading-tight">{proj.name}</h3>
                                                                <p className="text-[0.75em] font-bold uppercase tracking-widest mb-1 mt-0.5" style={{ color: accentColor }}>{proj.tech}</p>
                                                                <p className="text-[0.85em] font-medium text-slate-600 leading-snug">{proj.description}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </section>
                                            )}

                                            <div className="grid grid-cols-2 gap-4">
                                                {filteredEducation?.length > 0 && (
                                                    <section>
                                                        <h2 className="text-[1.15em] font-black text-slate-800 flex items-center gap-2 mb-3 border-b-2 border-slate-100 pb-1 uppercase tracking-wide">
                                                            <GraduationCap className="w-[1.2em] h-[1.2em]" style={{ color: accentColor }} /> Educación
                                                        </h2>
                                                        <div className="space-y-3">
                                                            {filteredEducation.map(edu => (
                                                                <div key={edu.id}>
                                                                    <h3 className="text-[0.95em] font-black text-slate-900 leading-tight mb-0.5">{edu.degree}</h3>
                                                                    <p className="text-[0.85em] font-bold text-slate-500">{edu.institution} | <span className="font-normal text-slate-400">{edu.date}</span></p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </section>
                                                )}

                                                {filteredCerts?.length > 0 && (
                                                    <section>
                                                        <h2 className="text-[1.15em] font-black text-slate-800 flex items-center gap-2 mb-3 border-b-2 border-slate-100 pb-1 uppercase tracking-wide">
                                                            <Award className="w-[1.2em] h-[1.2em]" style={{ color: accentColor }} /> Certificaciones
                                                        </h2>
                                                        <div className="space-y-3">
                                                            {filteredCerts.map(cert => (
                                                                <div key={cert.id}>
                                                                    <h3 className="text-[0.95em] font-black text-slate-900 leading-tight mb-0.5">{cert.name}</h3>
                                                                    <p className="text-[0.85em] font-bold text-slate-500">{cert.issuer} | <span className="font-normal text-slate-400">{cert.date}</span></p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </section>
                                                )}
                                            </div>
                                        </main>
                                    </div>
                                </div>
                            )}

                            {/* =========================================
              PLANTILLA 3: CLÁSICO (1 COLUMNA)
              ========================================= */}
                            {layout === 'classic' && (
                                <div className="flex flex-col px-14 py-10 h-full min-h-[297mm] bg-white">

                                    <header className="text-center mb-6 border-b-[3px] pb-4" style={{ borderColor: accentColor }}>
                                        {data?.personal?.image && (
                                            <div className="flex justify-center mb-4">
                                                <img
                                                    src={data.personal.image}
                                                    alt="Perfil"
                                                    className="w-24 h-24 rounded-full object-cover border-[3px] shadow-sm"
                                                    style={{ borderColor: accentColor, objectPosition: `50% ${data?.settings?.imagePosition ?? 20}%` }}
                                                />
                                            </div>
                                        )}
                                        <h1 className="text-[3.2em] font-black text-slate-900 uppercase tracking-tighter leading-none mb-1">
                                            {data?.personal?.name} <span style={{ color: accentColor }}>{data?.personal?.lastName}</span>
                                        </h1>
                                        <h2 className="text-[1.2em] text-slate-600 font-bold tracking-widest uppercase mb-3">{currentProfile?.title}</h2>
                                        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[0.85em] text-slate-500 font-medium">
                                            {data?.personal?.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {data.personal.location}</span>}
                                            {data?.personal?.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {data.personal.phone}</span>}
                                            {data?.personal?.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {data.personal.email}</span>}
                                            {data?.personal?.linkedin && <span className="flex items-center gap-1"><LinkIcon className="w-3 h-3" /> {data.personal.linkedin}</span>}
                                        </div>
                                    </header>

                                    <div className="flex flex-col gap-4">

                                        <section>
                                            <h3 className="text-[1.15em] font-black uppercase tracking-widest text-slate-800 border-b border-slate-200 pb-1 mb-3">Perfil Profesional</h3>
                                            <p className="text-[1.05em] text-slate-700 text-justify font-medium leading-relaxed underline-offset-4 decoration-slate-200">{currentProfile?.summary}</p>
                                        </section>

                                        {filteredExperiences?.length > 0 && (
                                            <section>
                                                <h3 className="text-[1.15em] font-black uppercase tracking-widest text-slate-800 border-b border-slate-200 pb-1 mb-3">Experiencia Laboral</h3>
                                                <div className="space-y-3">
                                                    {filteredExperiences.map(exp => {
                                                        const bulletPoints = (exp.description || '').split('\n').filter(line => line.trim() !== '');
                                                        return (
                                                            <div key={exp.id}>
                                                                <div className="flex justify-between items-end mb-0.5">
                                                                    <h4 className="text-[1.05em] font-bold text-slate-900">{exp.role}</h4>
                                                                    <span className="text-[0.85em] font-bold text-slate-500">{exp.date}</span>
                                                                </div>
                                                                <div className="text-[0.9em] font-bold uppercase text-slate-600 mb-1" style={{ color: accentColor }}>{exp.company}</div>
                                                                <ul className="text-[0.95em] text-slate-700 font-medium ml-4 list-disc marker:text-slate-400">
                                                                    {bulletPoints.map((point, i) => <li key={i}>{point}</li>)}
                                                                </ul>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </section>
                                        )}

                                        {filteredProjects?.length > 0 && (
                                            <section>
                                                <h3 className="text-[1.15em] font-black uppercase tracking-widest text-slate-800 border-b border-slate-200 pb-1 mb-3">Proyectos Destacados</h3>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {filteredProjects.map(proj => (
                                                        <div key={proj.id} className="border-l-[3px] pl-3 py-0.5" style={{ borderColor: accentColor }}>
                                                            <h4 className="text-[1em] font-bold text-slate-900">{proj.name}</h4>
                                                            <div className="text-[0.8em] font-bold uppercase text-slate-500 mb-1">{proj.tech}</div>
                                                            <p className="text-[0.9em] text-slate-700 font-medium">{proj.description}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>
                                        )}

                                        <div className="grid grid-cols-2 gap-5">
                                            {filteredEducation?.length > 0 && (
                                                <section>
                                                    <h3 className="text-[1.15em] font-black uppercase tracking-widest text-slate-800 border-b border-slate-200 pb-1 mb-3">Educación</h3>
                                                    <div className="space-y-2">
                                                        {filteredEducation.map(edu => (
                                                            <div key={edu.id}>
                                                                <h4 className="text-[0.95em] font-bold text-slate-900">{edu.degree}</h4>
                                                                <div className="text-[0.85em] text-slate-600 font-medium">{edu.institution} <span className="text-slate-400">| {edu.date}</span></div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </section>
                                            )}
                                            {filteredCerts?.length > 0 && (
                                                <section>
                                                    <h3 className="text-[1.15em] font-black uppercase tracking-widest text-slate-800 border-b border-slate-200 pb-1 mb-3">Certificaciones</h3>
                                                    <div className="space-y-2">
                                                        {filteredCerts.map(cert => (
                                                            <div key={cert.id}>
                                                                <h4 className="text-[0.95em] font-bold text-slate-900">{cert.name}</h4>
                                                                <div className="text-[0.85em] text-slate-600 font-medium">{cert.issuer} <span className="text-slate-400">| {cert.date}</span></div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </section>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-3 gap-5 mt-1">
                                            {filteredSkills?.length > 0 && (
                                                <section className="col-span-2">
                                                    <h3 className="text-[1.15em] font-black uppercase tracking-widest text-slate-800 border-b border-slate-200 pb-1 mb-3">Habilidades y Competencias</h3>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {filteredSkills.map(skill => (
                                                            <span key={skill.id} className="text-[0.85em] font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200">
                                                                {skill.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </section>
                                            )}
                                            {data?.languages?.length > 0 && (
                                                <section className="col-span-1">
                                                    <h3 className="text-[1.15em] font-black uppercase tracking-widest text-slate-800 border-b border-slate-200 pb-1 mb-3">Idiomas</h3>
                                                    <ul className="space-y-1.5">
                                                        {(data?.languages || []).map((lang, idx) => (
                                                            <li key={lang?.id || `lang-${idx}`} className="text-[0.9em] flex justify-between border-b border-slate-50 pb-1">
                                                                <span className="font-bold text-slate-800">{String(lang?.name || '')}</span>
                                                                <span className="font-black" style={{ color: accentColor }}>{String(lang?.level || '')}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </section>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}