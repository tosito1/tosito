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
        layout: "executive",
        fontSize: 10,
        lineHeight: 1.5
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
    const fileInputRef = useRef(null);

    // --- SISTEMA DE MIGRACIÓN Y CARGA ROBUSTA (Versión 7.1) ---
    useEffect(() => {
        const loadStoredData = () => {
            const keys = ['cvBuilderPro_FinalDB_v7', 'cvBuilderPro_FinalDB_v6', 'cvBuilderPro_FinalDB_v5'];
            for (const key of keys) {
                const stored = localStorage.getItem(key);
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored);
                        // Fusión profunda para evitar pérdida de datos estructurales
                        const mergedData = {
                            ...initialData,
                            ...parsed,
                            personal: { ...initialData.personal, ...(parsed.personal || {}) },
                            profiles: { ...initialData.profiles, ...(parsed.profiles || {}) },
                            settings: { ...initialData.settings, ...(parsed.settings || {}) },
                            experiences: parsed.experiences || initialData.experiences,
                            projects: parsed.projects || initialData.projects,
                            education: parsed.education || initialData.education,
                            certifications: parsed.certifications || initialData.certifications,
                            skills: parsed.skills || initialData.skills,
                            languages: parsed.languages || initialData.languages,
                        };
                        setData(mergedData);
                        if (key !== 'cvBuilderPro_FinalDB_v7') {
                            localStorage.setItem('cvBuilderPro_FinalDB_v7', JSON.stringify(mergedData));
                        }
                        return true;
                    } catch (e) { console.error(`Error cargando ${key}:`, e); }
                }
            }
            return false;
        };

        if (!loadStoredData()) {
            setData(initialData);
            localStorage.setItem('cvBuilderPro_FinalDB_v7', JSON.stringify(initialData));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('cvBuilderPro_FinalDB_v7', JSON.stringify(data));
    }, [data]);


    // --- 1. DECLARACIÓN DE FILTROS (Moviendo esto arriba evita el error de la pantalla blanca) ---
    const filterByProfile = (items) => Array.isArray(items) ? items.filter(item => item.sector === activeProfile || item.sector === 'ambos') : [];

    const filteredExperiences = filterByProfile(data.experiences);
    const filteredProjects = filterByProfile(data.projects);
    const filteredEducation = filterByProfile(data.education);
    const filteredCerts = filterByProfile(data.certifications);
    const filteredSkills = filterByProfile(data.skills);

    // Fallback de seguridad para el perfil
    const currentProfile = data?.profiles?.[activeProfile] || initialData.profiles.it;

    const accentColor = data?.settings?.accentColor || "#3b82f6";
    const fontClass = data?.settings?.fontClass || "font-sans";
    const baseSize = data?.settings?.fontSize || 10;
    const lineHeight = data?.settings?.lineHeight || 1.5;
    const layout = data?.settings?.layout || "executive";

    // --- 2. CÁLCULO ATS SEGURO AVANZADO ---
    const getATSScore = () => {
        let score = 0;
        let tips = [];

        if (data?.personal?.name && data?.personal?.lastName) { score += 5; } else { tips.push("Añade tu nombre y apellidos."); }
        if (data?.personal?.email && data?.personal?.phone) { score += 10; } else { tips.push("Completa email y teléfono."); }
        if (data?.personal?.location) { score += 5; } else { tips.push("Añade tu ubicación."); }
        if (data?.personal?.linkedin || data?.personal?.github) { score += 10; } else { tips.push("Añade perfiles profesionales (LinkedIn/GitHub)."); }
        if (currentProfile?.title) { score += 5; } else { tips.push("Añade un titular profesional."); }
        
        if (currentProfile?.summary?.length > 150) { score += 15; }
        else if (currentProfile?.summary?.length > 0) { score += 5; tips.push("Amplía tu resumen (mín. 150 caracteres)."); }
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
        const newItem = { id: Date.now(), ...defaultItem };
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
                alert("Error al leer el archivo JSON. Asegúrate de que es un archivo válido de CV Builder Pro.");
            }
        };
        reader.readAsText(file);
    };

    // --- COMPONENTES UI REUTILIZABLES ---
    const NavButton = ({ id, icon: Icon, label }) => (
        <button
            onClick={() => { setActiveTab(id); setExpandedItem(null); }}
            className={`w-full flex flex-col items-center justify-center py-3 gap-1.5 transition-all relative ${activeTab === id ? 'text-white bg-slate-800' : 'text-slate-400 hover:text-white'}`}
        >
            <Icon className="w-5 h-5" />
            <span className="text-[8.5px] uppercase font-bold tracking-wider text-center px-1">{label}</span>
            {activeTab === id && <div className="absolute left-0 w-1 h-full bg-blue-500 top-0 shadow-[0_0_12px_rgba(59,130,246,0.8)]"></div>}
        </button>
    );

    const InputField = ({ label, value, onChange, type = "text", icon: Icon, placeholder = "" }) => (
        <div className="flex flex-col gap-1 mb-3">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</label>
            <div className="relative">
                {Icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icon className="w-3.5 h-3.5" /></div>}
                <input
                    type={type}
                    value={value || ""}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={`w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pr-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${Icon ? 'pl-9' : 'pl-3'}`}
                />
            </div>
        </div>
    );

    const ArrayEditorItem = ({ item, index, section, titleField, subField, IconDef, children }) => (
        <div className={`bg-white rounded-xl border transition-all shadow-sm overflow-hidden ${expandedItem === item.id ? 'border-blue-500 ring-1 ring-blue-500 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
            <div className="flex items-center">
                <div className="flex flex-col border-r border-slate-100 bg-slate-50/80">
                    <button onClick={(e) => { e.stopPropagation(); moveItem(section, index, -1); }} disabled={index === 0} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:bg-transparent transition-colors"><ArrowUp size={14} /></button>
                    <button onClick={(e) => { e.stopPropagation(); moveItem(section, index, 1); }} disabled={index === data[section].length - 1} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:bg-transparent transition-colors"><ArrowDown size={14} /></button>
                </div>

                <div onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)} className="p-3 flex-1 flex items-center justify-between cursor-pointer hover:bg-slate-50/50">
                    <div>
                        <h4 className="text-sm font-bold text-slate-800 leading-tight">{item[titleField] || 'Nuevo elemento'}</h4>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5"><IconDef className="w-3 h-3 text-slate-400" /> {item[subField] || 'Detalle'}</p>
                    </div>
                    {expandedItem === item.id ? <ChevronUp className="w-4 h-4 text-blue-500" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
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

    return (
        <div className="flex h-screen w-full bg-[#f8fafc] font-sans overflow-hidden">
            <style>{`
        @media print {
            @page { margin: 0; size: A4 portrait; }
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background-color: white !important; }
            .no-print { display: none !important; }
            .print-container { min-height: 297mm !important; border: none !important; margin: 0 !important; width: 100% !important; max-width: 100% !important; box-shadow: none !important; }
            .print-wrapper { padding: 0 !important; background: white !important; overflow: visible !important; height: auto !important; }
        }
        /* Scrollbar styling for panels */
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>

            {/* --- ENVOLTORIO PANELES LATERALES --- */}
            <div className={`flex shrink-0 h-full transition-all duration-500 ease-in-out z-20 print:hidden shadow-2xl overflow-hidden ${showPanels ? 'w-[32rem]' : 'w-0'}`}>

                {/* 1. MENÚ NAVBAR OSCURO */}
                <div className="w-[5.5rem] bg-[#0f172a] flex flex-col items-center py-6 shrink-0 border-r border-slate-800 relative z-20">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.4)] mb-6 border border-blue-400/20">
                        <Layout className="w-6 h-6 text-white" />
                    </div>

                    {/* ATS Score Circular Widget */}
                    <div className="mb-6 flex flex-col items-center group relative cursor-help">
                        <div className="relative w-12 h-12">
                            <svg className="w-12 h-12 transform -rotate-90">
                                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-800" />
                                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent"
                                    strokeDasharray={125.6} strokeDashoffset={125.6 - (125.6 * (atsScore || 0)) / 100}
                                    className={`transition-all duration-1000 ${atsScore > 80 ? 'text-emerald-500' : atsScore > 50 ? 'text-amber-500' : 'text-red-500'}`} />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                                {atsScore}%
                            </div>
                        </div>
                        <span className="text-[8px] font-bold text-slate-500 uppercase mt-1 tracking-wider">Score</span>
                        
                        {/* Tooltip de Análisis ATS */}
                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 w-64 bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 pointer-events-none">
                            <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-4 h-4 bg-slate-900 border-l border-b border-slate-700 transform rotate-45"></div>
                            <div className="relative z-10 w-full text-left">
                                <h4 className="text-white font-bold text-xs mb-2 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-blue-400" /> Análisis ATS</h4>
                                {atsTips.length === 0 ? (
                                    <p className="text-emerald-400 text-xs font-medium flex items-start gap-1.5"><Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />¡Excelente! Tu CV está perfectamente optimizado.</p>
                                ) : (
                                    <ul className="space-y-1.5">
                                        {atsTips.map((tip, i) => (
                                            <li key={i} className="text-amber-200 text-[10px] flex items-start gap-1.5 leading-snug">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 shrink-0"></div>
                                                {tip}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full flex flex-col gap-1 overflow-y-auto custom-scrollbar">
                        <NavButton id="personal" icon={User} label="Datos" />
                        <NavButton id="experiencia" icon={Briefcase} label="Exp." />
                        <NavButton id="proyectos" icon={Code} label="Proyectos" />
                        <NavButton id="estudios" icon={GraduationCap} label="Estudios" />
                        <NavButton id="certificaciones" icon={Award} label="Certs." />
                        <NavButton id="habilidades" icon={Star} label="Skills" />
                        <NavButton id="idiomas" icon={Languages} label="Idiomas" />
                        <div className="my-2 mx-auto w-8 h-px bg-slate-800"></div>
                        <NavButton id="ajustes" icon={Settings} label="Diseño" />
                    </div>
                </div>

                {/* 2. PANEL DE EDICIÓN BLANCO */}
                <div className="w-[26.5rem] bg-white border-r border-slate-200 flex flex-col z-10 shrink-0 relative">

                    <div className="p-6 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                            {activeTab === 'personal' && <span className="flex items-center gap-2"><User className="text-blue-500" /> Perfil y Datos</span>}
                            {activeTab === 'experiencia' && <span className="flex items-center gap-2"><Briefcase className="text-blue-500" /> Experiencia</span>}
                            {activeTab === 'proyectos' && <span className="flex items-center gap-2"><Code className="text-blue-500" /> Proyectos</span>}
                            {activeTab === 'estudios' && <span className="flex items-center gap-2"><GraduationCap className="text-blue-500" /> Formación</span>}
                            {activeTab === 'certificaciones' && <span className="flex items-center gap-2"><Award className="text-blue-500" /> Licencias</span>}
                            {activeTab === 'habilidades' && <span className="flex items-center gap-2"><Star className="text-blue-500" /> Habilidades</span>}
                            {activeTab === 'idiomas' && <span className="flex items-center gap-2"><Languages className="text-blue-500" /> Idiomas</span>}
                            {activeTab === 'ajustes' && <span className="flex items-center gap-2"><Palette className="text-blue-500" /> Diseño Premium</span>}
                        </h2>

                        {['personal', 'experiencia', 'proyectos', 'estudios', 'certificaciones', 'habilidades'].includes(activeTab) && (
                            <div className="bg-slate-100/80 p-1.5 rounded-lg flex border border-slate-200 shadow-inner mt-4">
                                <button
                                    onClick={() => setActiveProfile('hosteleria')}
                                    className={`flex-1 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all flex items-center justify-center gap-1.5 ${activeProfile === 'hosteleria' ? 'bg-white text-orange-600 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <Globe className="w-3.5 h-3.5" /> Hostelería
                                </button>
                                <button
                                    onClick={() => setActiveProfile('it')}
                                    className={`flex-1 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all flex items-center justify-center gap-1.5 ${activeProfile === 'it' ? 'bg-white text-blue-700 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <Layout className="w-3.5 h-3.5" /> Informática
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 custom-scrollbar">

                        {/* TABS CONTENIDO */}
                        {activeTab === 'personal' && (
                            <div className="space-y-6">
                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                    <InputField label="Título Profesional" value={currentProfile.title} onChange={(e) => updateProfileText('title', e.target.value)} icon={Briefcase} />
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between">
                                            Resumen Profesional <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                        </label>
                                        <textarea value={currentProfile.summary} onChange={(e) => updateProfileText('summary', e.target.value)} rows="5" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none leading-relaxed" />
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                                    <div className="grid grid-cols-2 gap-x-3">
                                        <div className="col-span-2"><InputField label="Nombre" value={data?.personal?.name} onChange={(e) => updateData('personal', 'name', e.target.value)} icon={User} /></div>
                                        <div className="col-span-2"><InputField label="Apellidos" value={data?.personal?.lastName} onChange={(e) => updateData('personal', 'lastName', e.target.value)} icon={User} /></div>
                                        <div className="col-span-2"><InputField label="Email" type="email" value={data?.personal?.email} onChange={(e) => updateData('personal', 'email', e.target.value)} icon={Mail} /></div>
                                        <div className="col-span-2"><InputField label="Teléfono" value={data?.personal?.phone} onChange={(e) => updateData('personal', 'phone', e.target.value)} icon={Phone} /></div>
                                        <InputField label="Ciudad/País" value={data?.personal?.location} onChange={(e) => updateData('personal', 'location', e.target.value)} icon={MapPin} />
                                        <InputField label="Dir. Secundaria" value={data?.personal?.subLocation} onChange={(e) => updateData('personal', 'subLocation', e.target.value)} icon={MapPin} />
                                        <div className="col-span-2"><InputField label="Carnet/Vehículo" value={data?.personal?.drivingLicense} onChange={(e) => updateData('personal', 'drivingLicense', e.target.value)} icon={Car} /></div>
                                        <div className="col-span-2"><InputField label="LinkedIn" value={data?.personal?.linkedin} onChange={(e) => updateData('personal', 'linkedin', e.target.value)} icon={LinkIcon} /></div>
                                        <div className="col-span-2"><InputField label="GitHub" value={data?.personal?.github} onChange={(e) => updateData('personal', 'github', e.target.value)} icon={GitBranch} /></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'experiencia' && (
                            <div className="space-y-3">
                                <button onClick={() => addItem('experiences', { role: "Puesto", company: "Empresa", date: "Año", description: "", sector: activeProfile })} className="w-full bg-blue-50/50 hover:bg-blue-100 text-blue-600 border border-blue-200 border-dashed text-sm font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm">
                                    <Plus className="w-4 h-4" /> Añadir Experiencia
                                </button>
                                {data.experiences.map((exp, idx) => (
                                    <ArrayEditorItem key={exp.id} item={exp} index={idx} section="experiences" titleField="role" subField="company" IconDef={Briefcase}>
                                        <InputField label="Puesto" value={exp.role} onChange={(e) => updateArrayItem('experiences', exp.id, 'role', e.target.value)} />
                                        <div className="grid grid-cols-2 gap-3">
                                            <InputField label="Empresa" value={exp.company} onChange={(e) => updateArrayItem('experiences', exp.id, 'company', e.target.value)} />
                                            <InputField label="Fechas" value={exp.date} onChange={(e) => updateArrayItem('experiences', exp.id, 'date', e.target.value)} />
                                        </div>
                                        <div className="flex flex-col gap-1 mb-3">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Perfil</label>
                                            <select value={exp.sector} onChange={(e) => updateArrayItem('experiences', exp.id, 'sector', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                                                <option value="hosteleria">Hostelería</option><option value="it">Informática</option><option value="ambos">Ambos</option>
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Descripción</label>
                                            <textarea value={exp.description || ""} onChange={(e) => updateArrayItem('experiences', exp.id, 'description', e.target.value)} rows="3" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none resize-y focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                    </ArrayEditorItem>
                                ))}
                            </div>
                        )}

                        {activeTab === 'proyectos' && (
                            <div className="space-y-3">
                                <button onClick={() => addItem('projects', { name: "Proyecto", tech: "Tecnologías", date: "Año", description: "", link: "", sector: activeProfile })} className="w-full bg-blue-50/50 hover:bg-blue-100 text-blue-600 border border-blue-200 border-dashed text-sm font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm">
                                    <Plus className="w-4 h-4" /> Añadir Proyecto
                                </button>
                                {data.projects.map((proj, idx) => (
                                    <ArrayEditorItem key={proj.id} item={proj} index={idx} section="projects" titleField="name" subField="tech" IconDef={Code}>
                                        <InputField label="Nombre" value={proj.name} onChange={(e) => updateArrayItem('projects', proj.id, 'name', e.target.value)} />
                                        <div className="grid grid-cols-2 gap-3">
                                            <InputField label="Tecnologías" value={proj.tech} onChange={(e) => updateArrayItem('projects', proj.id, 'tech', e.target.value)} />
                                            <InputField label="Año" value={proj.date} onChange={(e) => updateArrayItem('projects', proj.id, 'date', e.target.value)} />
                                        </div>
                                        <InputField label="Enlace (Opcional)" value={proj.link || ""} onChange={(e) => updateArrayItem('projects', proj.id, 'link', e.target.value)} icon={LinkIcon} />
                                        <div className="flex flex-col gap-1 mb-3">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Perfil</label>
                                            <select value={proj.sector} onChange={(e) => updateArrayItem('projects', proj.id, 'sector', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                                                <option value="hosteleria">Hostelería</option><option value="it">Informática</option><option value="ambos">Ambos</option>
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Descripción</label>
                                            <textarea value={proj.description || ""} onChange={(e) => updateArrayItem('projects', proj.id, 'description', e.target.value)} rows="2" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none resize-y focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                    </ArrayEditorItem>
                                ))}
                            </div>
                        )}

                        {activeTab === 'estudios' && (
                            <div className="space-y-3">
                                <button onClick={() => addItem('education', { degree: "Titulación", institution: "Centro", date: "Año", description: "", sector: activeProfile })} className="w-full bg-blue-50/50 hover:bg-blue-100 text-blue-600 border border-blue-200 border-dashed text-sm font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm">
                                    <Plus className="w-4 h-4" /> Añadir Formación
                                </button>
                                {data.education.map((edu, idx) => (
                                    <ArrayEditorItem key={edu.id} item={edu} index={idx} section="education" titleField="degree" subField="institution" IconDef={GraduationCap}>
                                        <InputField label="Titulación" value={edu.degree} onChange={(e) => updateArrayItem('education', edu.id, 'degree', e.target.value)} />
                                        <div className="grid grid-cols-2 gap-3">
                                            <InputField label="Institución" value={edu.institution} onChange={(e) => updateArrayItem('education', edu.id, 'institution', e.target.value)} />
                                            <InputField label="Fechas" value={edu.date} onChange={(e) => updateArrayItem('education', edu.id, 'date', e.target.value)} />
                                        </div>
                                        <div className="flex flex-col gap-1 mb-3">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Perfil</label>
                                            <select value={edu.sector} onChange={(e) => updateArrayItem('education', edu.id, 'sector', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                                                <option value="hosteleria">Hostelería</option><option value="it">Informática</option><option value="ambos">Ambos</option>
                                            </select>
                                        </div>
                                    </ArrayEditorItem>
                                ))}
                            </div>
                        )}

                        {activeTab === 'certificaciones' && (
                            <div className="space-y-3">
                                <button onClick={() => addItem('certifications', { name: "Certificación", issuer: "Emisor", date: "Año", sector: activeProfile })} className="w-full bg-blue-50/50 hover:bg-blue-100 text-blue-600 border border-blue-200 border-dashed text-sm font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm">
                                    <Plus className="w-4 h-4" /> Añadir Certificación
                                </button>
                                {(data.certifications || []).map((cert, idx) => (
                                    <ArrayEditorItem key={cert.id} item={cert} index={idx} section="certifications" titleField="name" subField="issuer" IconDef={Award}>
                                        <InputField label="Nombre" value={cert.name} onChange={(e) => updateArrayItem('certifications', cert.id, 'name', e.target.value)} />
                                        <div className="grid grid-cols-2 gap-3">
                                            <InputField label="Emisor" value={cert.issuer} onChange={(e) => updateArrayItem('certifications', cert.id, 'issuer', e.target.value)} />
                                            <InputField label="Año" value={cert.date} onChange={(e) => updateArrayItem('certifications', cert.id, 'date', e.target.value)} />
                                        </div>
                                        <div className="flex flex-col gap-1 mb-3">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Perfil</label>
                                            <select value={cert.sector} onChange={(e) => updateArrayItem('certifications', cert.id, 'sector', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                                                <option value="hosteleria">Hostelería</option><option value="it">Informática</option><option value="ambos">Ambos</option>
                                            </select>
                                        </div>
                                    </ArrayEditorItem>
                                ))}
                            </div>
                        )}

                        {activeTab === 'habilidades' && (
                            <div className="space-y-3">
                                <button onClick={() => addItem('skills', { name: "Habilidad", level: "Intermedio", sector: activeProfile })} className="w-full bg-blue-50/50 hover:bg-blue-100 text-blue-600 border border-blue-200 border-dashed text-sm font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm">
                                    <Plus className="w-4 h-4" /> Añadir Habilidad
                                </button>
                                <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-1">
                                    {data.skills.map((skill, idx) => (
                                        <div key={skill.id} className="flex gap-2 items-center p-2 hover:bg-slate-50 rounded-lg group border border-transparent hover:border-slate-200 transition-colors">
                                            <div className="flex flex-col opacity-30 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => moveItem('skills', idx, -1)} className="p-0.5 hover:text-blue-500"><ArrowUp size={12} /></button>
                                                <button onClick={() => moveItem('skills', idx, 1)} className="p-0.5 hover:text-blue-500"><ArrowDown size={12} /></button>
                                            </div>
                                            <input type="text" value={skill.name} onChange={(e) => updateArrayItem('skills', skill.id, 'name', e.target.value)} className="flex-1 text-slate-800 text-xs font-semibold bg-transparent px-2 py-1 outline-none border-b border-transparent focus:border-blue-500" />
                                            <select value={skill.level} onChange={(e) => updateArrayItem('skills', skill.id, 'level', e.target.value)} className="w-24 text-[10px] text-slate-800 border border-slate-200 rounded p-1.5 bg-white outline-none focus:border-blue-500">
                                                <option value="Básico">Básico</option><option value="Intermedio">Intermedio</option><option value="Avanzado">Avanzado</option><option value="Experto">Experto</option>
                                            </select>
                                            <select value={skill.sector} onChange={(e) => updateArrayItem('skills', skill.id, 'sector', e.target.value)} className="w-20 text-[10px] border border-slate-200 rounded p-1.5 bg-white outline-none focus:border-blue-500">
                                                <option value="it">IT</option><option value="hosteleria">Hostel</option><option value="ambos">Ambos</option>
                                            </select>
                                            <button onClick={() => deleteItem('skills', skill.id)} className="text-slate-300 hover:text-red-500 p-1.5 bg-white rounded-md border border-slate-100 shadow-sm"><Trash2 size={14} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'idiomas' && (
                            <div className="space-y-3">
                                <button onClick={() => addItem('languages', { name: "Idioma", level: "A2", percentage: 50, details: "" })} className="w-full bg-blue-50/50 hover:bg-blue-100 text-blue-600 border border-blue-200 border-dashed text-sm font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm">
                                    <Plus className="w-4 h-4" /> Añadir Idioma
                                </button>
                                {data.languages.map((lang, idx) => (
                                    <ArrayEditorItem key={lang.id} item={lang} index={idx} section="languages" titleField="name" subField="level" IconDef={Languages}>
                                        <div className="grid grid-cols-2 gap-3">
                                            <InputField label="Idioma" value={lang.name} onChange={(e) => updateArrayItem('languages', lang.id, 'name', e.target.value)} />
                                            <InputField label="Nivel" value={lang.level} onChange={(e) => updateArrayItem('languages', lang.id, 'level', e.target.value)} />
                                        </div>
                                        <div className="flex flex-col gap-1 mb-3">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between">
                                                <span>Dominio ({lang.percentage}%)</span>
                                            </label>
                                            <input type="range" min="10" max="100" step="5" value={lang.percentage} onChange={(e) => updateArrayItem('languages', lang.id, 'percentage', parseInt(e.target.value))} className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                                        </div>
                                    </ArrayEditorItem>
                                ))}
                            </div>
                        )}

                        {activeTab === 'ajustes' && (
                            <div className="space-y-5">

                                {/* Export/Import JSON */}
                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex gap-3 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-slate-800"></div>
                                    <button onClick={exportJSON} className="flex-1 bg-slate-800 text-white text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-sm">
                                        <Download size={16} /> Respaldar (JSON)
                                    </button>
                                    <button onClick={() => fileInputRef.current.click()} className="flex-1 bg-white text-slate-700 border border-slate-300 text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
                                        <Upload size={16} /> Cargar (JSON)
                                    </button>
                                    <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={importJSON} />
                                </div>

                                {/* Templates */}
                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><Layout className="w-4 h-4 text-blue-500" /> Selector de Plantilla</h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        <button onClick={() => updateData('settings', 'layout', 'modern')} className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${layout === 'modern' ? 'border-blue-500 bg-blue-50 shadow-md scale-[1.02]' : 'border-slate-200 hover:border-slate-300'}`}>
                                            <Columns size={24} className={layout === 'modern' ? 'text-blue-600' : 'text-slate-400'} />
                                            <span className="text-[10px] font-bold text-center">Moderno<br />(2 Col)</span>
                                        </button>
                                        <button onClick={() => updateData('settings', 'layout', 'executive')} className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${layout === 'executive' ? 'border-blue-500 bg-blue-50 shadow-md scale-[1.02]' : 'border-slate-200 hover:border-slate-300'}`}>
                                            <Layout size={24} className={layout === 'executive' ? 'text-blue-600' : 'text-slate-400'} />
                                            <span className="text-[10px] font-bold text-center">Ejecutivo<br />(Cabecera)</span>
                                        </button>
                                        <button onClick={() => updateData('settings', 'layout', 'classic')} className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${layout === 'classic' ? 'border-blue-500 bg-blue-50 shadow-md scale-[1.02]' : 'border-slate-200 hover:border-slate-300'}`}>
                                            <AlignLeft size={24} className={layout === 'classic' ? 'text-blue-600' : 'text-slate-400'} />
                                            <span className="text-[10px] font-bold text-center">Clásico<br />(1 Col)</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Global Settings */}
                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">

                                    {/* Color Personalizado Infinito */}
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
                                            <span className="flex items-center gap-2"><Palette className="w-4 h-4 text-blue-500" /> Color Acento</span>
                                            <span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500 font-mono">{accentColor}</span>
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-3">
                                            {THEMES.map(theme => (
                                                <button key={theme.color} onClick={() => updateData('settings', 'accentColor', theme.color)} className={`w-8 h-8 rounded-full ring-2 ring-offset-2 transition-all ${accentColor === theme.color ? 'ring-slate-800 scale-110' : 'ring-transparent hover:scale-110'}`} style={{ backgroundColor: theme.color }} title={theme.name}></button>
                                            ))}
                                            <div className="h-6 w-px bg-slate-200 mx-1"></div>
                                            <label className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500 cursor-pointer shadow-md ring-2 ring-offset-2 ring-transparent hover:scale-110 transition-all" title="Color Personalizado">
                                                <input type="color" value={accentColor} onChange={(e) => updateData('settings', 'accentColor', e.target.value)} className="opacity-0 w-0 h-0" />
                                                <Plus size={14} className="text-white drop-shadow-md" />
                                            </label>
                                        </div>
                                    </div>

                                    <hr className="border-slate-100" />

                                    {/* Espaciado */}
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
                                            <span className="flex items-center gap-2"><SlidersHorizontal className="w-4 h-4 text-blue-500" /> Espaciado (Líneas)</span>
                                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{lineHeight}x</span>
                                        </h3>
                                        <input type="range" min="1.1" max="2" step="0.05" value={lineHeight} onChange={(e) => updateData('settings', 'lineHeight', parseFloat(e.target.value))} className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                                        <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-bold uppercase"><span>Compacto</span><span>Holgado</span></div>
                                    </div>

                                    {/* Tamaño Letra */}
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
                                            <span className="flex items-center gap-2"><Type className="w-4 h-4 text-blue-500" /> Tamaño Letra Global</span>
                                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{baseSize}px</span>
                                        </h3>
                                        <input type="range" min="8" max="14" step="0.25" value={baseSize} onChange={(e) => updateData('settings', 'fontSize', parseFloat(e.target.value))} className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                                        <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-bold uppercase"><span>Pequeña</span><span>Grande</span></div>
                                    </div>

                                    <hr className="border-slate-100" />

                                    {/* Tipografía */}
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><Type className="w-4 h-4 text-blue-500" /> Tipografía</h3>
                                        <div className="grid grid-cols-3 gap-2">
                                            {FONTS.map(f => (
                                                <button key={f.class} onClick={() => updateData('settings', 'fontClass', f.class)} className={`p-2 border rounded-lg text-xs transition-all ${fontClass === f.class ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'} ${f.class}`}>
                                                    {f.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* --- ÁREA DE VISTA PREVIA (DERECHA) --- */}
            <div className="flex-1 overflow-y-auto bg-slate-200 print-wrapper py-8 md:py-12 px-4 relative no-print-bg custom-scrollbar flex flex-col items-center">

                <button
                    onClick={() => setShowPanels(!showPanels)}
                    className="fixed top-1/2 -translate-y-1/2 z-50 bg-white border border-slate-200 border-l-0 shadow-[4px_0_20px_rgba(0,0,0,0.1)] py-5 px-1.5 rounded-r-xl transition-all duration-500 ease-in-out text-slate-400 hover:text-blue-600 hover:bg-blue-50 focus:outline-none no-print group"
                    style={{ left: showPanels ? '32rem' : '0' }}
                    title={showPanels ? "Ocultar panel" : "Mostrar panel"}
                >
                    {showPanels ? <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" /> : <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />}
                </button>

                <div className="fixed bottom-8 right-8 no-print z-50">
                    <button onClick={() => window.print()} className="bg-slate-900 hover:bg-black text-white font-bold py-3.5 px-8 rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.3)] hover:shadow-[0_15px_35px_rgba(0,0,0,0.4)] transition-all duration-300 flex items-center justify-center gap-2 focus:ring-4 focus:ring-slate-400 transform hover:-translate-y-1">
                        <Printer className="w-5 h-5" /> Exportar a PDF
                    </button>
                </div>

                {/* --- DOCUMENTO A4 --- */}
                <div className={`print-container bg-white shadow-2xl ${fontClass}`} style={{ width: '210mm', minHeight: '297mm', fontSize: `${baseSize}px`, lineHeight: lineHeight }}>

                    {/* =========================================
              PLANTILLA 1: MODERNO (2 COLUMNAS)
              ========================================= */}
                    {layout === 'modern' && (
                        <div className="flex flex-row h-full min-h-[297mm]">
                            {/* Columna Izquierda Oscura */}
                            <aside className="w-[33%] bg-slate-800 text-slate-100 p-6 flex flex-col shrink-0 relative z-10">
                                <div className="flex justify-center mt-2 mb-4">
                                    <div className="relative w-28 h-28 group">
                                        <img src={data?.personal?.image || ''} alt="Perfil" className="w-full h-full rounded-full object-cover object-[50%_35%] border-[3px] border-slate-500 shadow-2xl bg-white" />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-5">
                                    <section>
                                        <h2 className="text-[1.15em] font-black border-b-2 border-slate-600/50 pb-1.5 mb-2.5 uppercase tracking-widest text-slate-300">Contacto</h2>
                                        <ul className="space-y-2 text-[0.95em]">
                                            {data?.personal?.location && <li className="flex items-start gap-2.5"><MapPin className="w-[1.2em] h-[1.2em] mt-0.5 shrink-0" style={{ color: accentColor }} /><span className="leading-snug">{data.personal.location}<br /><span className="text-slate-400 text-[0.9em]">{data.personal.subLocation}</span></span></li>}
                                            {data?.personal?.phone && <li className="flex items-center gap-2.5"><Phone className="w-[1.2em] h-[1.2em] shrink-0" style={{ color: accentColor }} /><span>{data.personal.phone}</span></li>}
                                            {data?.personal?.email && <li className="flex items-center gap-2.5"><Mail className="w-[1.2em] h-[1.2em] shrink-0" style={{ color: accentColor }} /><span className="break-all">{data.personal.email}</span></li>}
                                            {data?.personal?.linkedin && <li className="flex items-center gap-2.5"><LinkIcon className="w-[1.2em] h-[1.2em] shrink-0" style={{ color: accentColor }} /><span className="break-all">{data.personal.linkedin}</span></li>}
                                            {data?.personal?.github && <li className="flex items-center gap-2.5"><GitBranch className="w-[1.2em] h-[1.2em] shrink-0" style={{ color: accentColor }} /><span className="break-all">{data.personal.github}</span></li>}
                                            {data?.personal?.drivingLicense && <li className="flex items-center gap-2.5"><Car className="w-[1.2em] h-[1.2em] shrink-0" style={{ color: accentColor }} /><span>{data.personal.drivingLicense}</span></li>}
                                        </ul>
                                    </section>

                                    {filteredSkills?.length > 0 && (
                                        <section>
                                            <h2 className="text-[1.15em] font-black border-b-2 border-slate-600/50 pb-1.5 mb-2.5 uppercase tracking-widest text-slate-300">Habilidades</h2>
                                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-1.5">
                                                {filteredSkills.map(skill => (
                                                    <div key={skill.id} className="bg-slate-700 border border-slate-600 px-2 py-1.5 rounded flex flex-col justify-center">
                                                        <span className="text-[0.95em] font-semibold text-white leading-tight">{skill.name}</span>
                                                        <span className="text-[0.7em] font-black uppercase tracking-widest mt-0.5" style={{ color: accentColor }}>{skill.level}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {data?.languages?.length > 0 && (
                                        <section>
                                            <h2 className="text-[1.15em] font-black border-b-2 border-slate-600/50 pb-1.5 mb-2.5 uppercase tracking-widest text-slate-300">Idiomas</h2>
                                            <ul className="space-y-2.5 text-[0.95em]">
                                                {data.languages.map(lang => (
                                                    <li key={lang.id}>
                                                        <div className="flex justify-between mb-0.5"><span className="font-bold text-white">{lang.name}</span><span className="font-black text-[0.85em]" style={{ color: accentColor }}>{lang.level}</span></div>
                                                        <div className="w-full bg-slate-700/80 rounded-full h-[0.4em]"><div className="h-[0.4em] rounded-full" style={{ width: `${lang.percentage}%`, backgroundColor: accentColor }}></div></div>
                                                        {lang.details && <p className="text-[0.85em] text-slate-400 mt-1 leading-snug">{lang.details}</p>}
                                                    </li>
                                                ))}
                                            </ul>
                                        </section>
                                    )}
                                </div>
                            </aside>

                            {/* Columna Derecha Blanca */}
                            <main className="w-[67%] p-8 bg-white text-slate-800 flex flex-col gap-5 shrink-0 z-0">
                                <header>
                                    <h1 className="text-[2.8em] font-black text-slate-900 mb-0 tracking-tighter leading-[1.05]">
                                        {data?.personal?.name} <br /><span style={{ color: accentColor }}>{data?.personal?.lastName}</span>
                                    </h1>
                                    <p className="text-[1.05em] text-slate-500 font-bold tracking-wide uppercase mt-1.5">{currentProfile?.title}</p>
                                </header>

                                <section>
                                    <h2 className="text-[1.1em] font-black text-slate-800 flex items-center gap-2 mb-1.5 border-b-2 border-slate-100 pb-1 uppercase tracking-wide">
                                        <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}><User className="w-[1.2em] h-[1.2em]" /></div> Perfil
                                    </h2>
                                    <p className="text-slate-600 text-[1.05em] text-justify font-medium">{currentProfile?.summary}</p>
                                </section>

                                {filteredExperiences?.length > 0 && (
                                    <section>
                                        <h2 className="text-[1.1em] font-black text-slate-800 flex items-center gap-2 mb-2.5 border-b-2 border-slate-100 pb-1.5 uppercase tracking-wide">
                                            <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}><Briefcase className="w-[1.2em] h-[1.2em]" /></div> Experiencia Laboral
                                        </h2>
                                        <div className="space-y-3 relative before:absolute before:inset-0 before:ml-[4.5px] before:-translate-x-px before:h-full before:w-[2px] before:bg-slate-100">
                                            {filteredExperiences.map((exp, idx) => {
                                                const bulletPoints = (exp.description || '').split('\n').filter(line => line.trim() !== '');
                                                return (
                                                    <div key={exp.id} className="relative flex items-start gap-4">
                                                        <div className="absolute left-[4.5px] -translate-x-1/2 mt-1.5 w-[10px] h-[10px] rounded-full ring-[3px] ring-white z-10" style={{ backgroundColor: idx === 0 ? accentColor : '#cbd5e1' }}></div>
                                                        <div className="ml-4 w-full">
                                                            <div className="flex items-center justify-between mb-0.5">
                                                                <h3 className="text-[1.1em] font-black text-slate-900 leading-tight">{exp.role}</h3>
                                                                <span className="text-[0.75em] font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap tracking-widest uppercase ml-2 border" style={{ borderColor: `${accentColor}30`, color: accentColor, backgroundColor: `${accentColor}05` }}>{exp.date}</span>
                                                            </div>
                                                            <p className="text-[0.9em] font-bold text-slate-500 mb-1 uppercase tracking-wide">{exp.company}</p>
                                                            <ul className="text-slate-600 space-y-0.5 text-[0.95em] font-medium">
                                                                {bulletPoints.map((point, i) => {
                                                                    const colonIndex = point.indexOf(':');
                                                                    if (colonIndex !== -1 && colonIndex < 35) {
                                                                        return <li key={i} className="flex items-start"><CheckCircle className="w-[0.9em] h-[0.9em] mr-1.5 mt-[0.25em] shrink-0" style={{ color: accentColor }} /><span><span className="font-bold text-slate-900">{point.substring(0, colonIndex + 1)}</span>{point.substring(colonIndex + 1)}</span></li>;
                                                                    }
                                                                    return <li key={i} className="flex items-start"><CheckCircle className="w-[0.9em] h-[0.9em] mr-1.5 mt-[0.25em] shrink-0" style={{ color: accentColor }} /><span>{point}</span></li>;
                                                                })}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </section>
                                )}

                                {filteredProjects?.length > 0 && (
                                    <section>
                                        <h2 className="text-[1.1em] font-black text-slate-800 flex items-center gap-2 mb-2.5 border-b-2 border-slate-100 pb-1.5 uppercase tracking-wide">
                                            <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}><Code className="w-[1.2em] h-[1.2em]" /></div> Proyectos
                                        </h2>
                                        <div className="grid grid-cols-2 gap-3">
                                            {filteredProjects.map(proj => (
                                                <div key={proj.id} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 shadow-sm relative overflow-hidden group">
                                                    <div className="absolute top-0 left-0 w-full h-[3px] opacity-70" style={{ backgroundColor: accentColor }}></div>
                                                    <div className="flex justify-between items-start mb-0.5">
                                                        <h3 className="text-[1em] font-black text-slate-900 leading-tight w-[85%]">{proj.name}</h3>
                                                        {proj.link && <LinkIcon className="w-[1em] h-[1em] text-slate-400 mt-0.5 shrink-0" />}
                                                    </div>
                                                    <p className="text-[0.75em] font-bold uppercase tracking-widest mb-1" style={{ color: accentColor }}>{proj.tech}</p>
                                                    <p className="text-[0.9em] font-medium text-slate-600 leading-snug">{proj.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                <div className="grid grid-cols-2 gap-6">
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
                    )}

                    {/* =========================================
              PLANTILLA 2: EJECUTIVO (HEADER COMPLETO)
              ========================================= */}
                    {layout === 'executive' && (
                        <div className="flex flex-col h-full min-h-[297mm] bg-white">
                            {/* Header Full Width */}
                            <header className="w-full text-white p-8 flex items-center gap-8 relative z-10" style={{ backgroundColor: accentColor }}>
                                <div className="w-28 h-28 shrink-0 relative">
                                    <img src={data?.personal?.image || ''} alt="Perfil" className="w-full h-full rounded-full object-cover border-[4px] border-white/20 shadow-xl bg-white" />
                                </div>
                                <div>
                                    <h1 className="text-[3.2em] font-black tracking-tight leading-none mb-1 text-white">{data?.personal?.name} {data?.personal?.lastName}</h1>
                                    <h2 className="text-[1.2em] font-bold tracking-widest uppercase text-white/80">{currentProfile?.title}</h2>
                                </div>
                            </header>

                            <div className="flex flex-row flex-1">
                                {/* Columna Izquierda (30%) Blanca */}
                                <aside className="w-[30%] bg-slate-50 border-r border-slate-200 p-6 flex flex-col gap-6 shrink-0">
                                    <section>
                                        <h2 className="text-[1.1em] font-black border-b-2 border-slate-200 pb-1 mb-3 uppercase tracking-widest text-slate-800" style={{ borderBottomColor: accentColor }}>Contacto</h2>
                                        <ul className="space-y-2 text-[0.9em] text-slate-600 font-medium">
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
                                            <h2 className="text-[1.1em] font-black border-b-2 border-slate-200 pb-1 mb-3 uppercase tracking-widest text-slate-800" style={{ borderBottomColor: accentColor }}>Habilidades</h2>
                                            <div className="flex flex-col gap-1.5">
                                                {filteredSkills.map(skill => (
                                                    <div key={skill.id} className="w-full bg-white border border-slate-200 px-2.5 py-1.5 rounded flex flex-col shadow-sm">
                                                        <span className="text-[0.95em] font-bold text-slate-800 leading-tight">{skill.name}</span>
                                                        <span className="text-[0.75em] font-black uppercase tracking-widest mt-0.5" style={{ color: accentColor }}>{skill.level}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {data?.languages?.length > 0 && (
                                        <section>
                                            <h2 className="text-[1.1em] font-black border-b-2 border-slate-200 pb-1 mb-3 uppercase tracking-widest text-slate-800" style={{ borderBottomColor: accentColor }}>Idiomas</h2>
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
                                <main className="w-[70%] p-8 bg-white text-slate-800 flex flex-col gap-5 shrink-0 z-0">
                                    <section>
                                        <h2 className="text-[1.15em] font-black text-slate-800 flex items-center gap-2 mb-2 border-b-2 border-slate-100 pb-1 uppercase tracking-wide">
                                            <User className="w-[1.2em] h-[1.2em]" style={{ color: accentColor }} /> Perfil Profesional
                                        </h2>
                                        <p className="text-slate-600 text-[1em] text-justify font-medium">{currentProfile?.summary}</p>
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
                                                            <div className="flex items-end justify-between mb-0.5">
                                                                <h3 className="text-[1.1em] font-black text-slate-900 leading-tight">{exp.role}</h3>
                                                                <span className="text-[0.8em] font-bold text-slate-500 uppercase tracking-widest">{exp.date}</span>
                                                            </div>
                                                            <p className="text-[0.9em] font-bold uppercase tracking-wide mb-1" style={{ color: accentColor }}>{exp.company}</p>
                                                            <ul className="text-slate-600 space-y-0.5 text-[0.95em] font-medium ml-4 list-disc marker:text-slate-300">
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

                                    <div className="grid grid-cols-2 gap-6">
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
                        <div className="flex flex-col p-10 h-full min-h-[297mm] bg-white">

                            <header className="text-center mb-6 border-b-[3px] pb-5" style={{ borderColor: accentColor }}>
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

                            <div className="flex flex-col gap-5">

                                <section>
                                    <h3 className="text-[1.15em] font-black uppercase tracking-widest text-slate-800 border-b border-slate-200 pb-1 mb-2">Perfil Profesional</h3>
                                    <p className="text-[1em] text-slate-700 text-justify font-medium">{currentProfile?.summary}</p>
                                </section>

                                {filteredExperiences?.length > 0 && (
                                    <section>
                                        <h3 className="text-[1.15em] font-black uppercase tracking-widest text-slate-800 border-b border-slate-200 pb-1 mb-3">Experiencia Laboral</h3>
                                        <div className="space-y-4">
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
                                        <div className="grid grid-cols-2 gap-4">
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

                                <div className="grid grid-cols-2 gap-6">
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

                                <div className="grid grid-cols-3 gap-6 mt-2">
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
                                                {data.languages.map(lang => (
                                                    <li key={lang.id} className="text-[0.9em] flex justify-between border-b border-slate-50 pb-1">
                                                        <span className="font-bold text-slate-800">{lang.name}</span>
                                                        <span className="font-black" style={{ color: accentColor }}>{lang.level}</span>
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
    );
}