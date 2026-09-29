import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, ArrowRight, ArrowLeft, Activity, Stethoscope, Skull, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { saveUserData, saveHistoryRecord, getUserData, saveQuestionnaireEntry, awardXP, unlockBadge } from '../lib/dataService';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

const questionsList = [
  { id: 'age', text: '¿Cuántos años llevas castigando a tu cuerpo?', type: 'number', min: 14, max: 120, placeholder: 'Ej: 30' },
  { id: 'weight', text: '¿Cuántos kilos de pura toxicidad pesas?', type: 'number', min: 30, max: 300, placeholder: 'Ej: 75' },
  { id: 'height', text: '¿Cuánto mides (en cm, sin mentir)?', type: 'number', min: 100, max: 250, placeholder: 'Ej: 175' },
  { id: 'sleep', text: '¿Cuántas horas "cierras los ojos" al día?', type: 'number', min: 0, max: 24, placeholder: 'Ej: 7' },
  { id: 'sitting', text: '¿Cuántas horas tienes el culo pegado a la silla?', type: 'number', min: 0, max: 24, placeholder: 'Ej: 8' },
  { id: 'exercise', text: '¿Días a la semana que levantas algo más pesado que una jarra?', type: 'number', min: 0, max: 7, placeholder: 'Ej: 3' },
  { id: 'junkFood', text: '¿Cuántas veces por semana pides comida guarra por pereza?', type: 'number', min: 0, max: 21, placeholder: 'Ej: 2' },
  { id: 'water', text: '¿Cuántos litros de agua (sin mezclar con alcohol) bebes al día?', type: 'number', min: 0, max: 10, placeholder: 'Ej: 2' },
  { id: 'bloodPressure', text: '¿Cómo va esa presión arterial de tanta cafeína y estrés?', type: 'select', options: [{val: '0', label: 'De locos / Normal'}, {val: '1', label: 'Ligeramente alta, soy un nervio'}, {val: '2', label: 'Hipertensión a tope'}] },
  { id: 'cholesterol', text: '¿Cómo está ese colesterol de tanta fritanga?', type: 'select', options: [{val: '0', label: 'Normal / Paso del médico'}, {val: '1', label: 'Ligeramente alto'}, {val: '2', label: 'Sangre de mantequilla'}] },
  { id: 'chronicDisease', text: '¿Padeces alguna enfermedad crónica (diabetes, asma, etc.)?', type: 'select', options: [{val: '0', label: 'Sano como una manzana'}, {val: '1', label: 'Sí, soy un pupas'}] },
  { id: 'familyHistory', text: '¿Historial de enfermedades graves en tu familia genética?', type: 'select', options: [{val: '0', label: 'Genética de dioses'}, {val: '1', label: 'Sí, genética regulera'}] },
  { id: 'socialCircle', text: '¿Tienes amigos de verdad o solo colegas de fiesta?', type: 'select', options: [{val: '0', label: 'Amigos leales a muerte'}, {val: '1', label: 'Me siento más solo que la una'}] },
  { id: 'stress', text: 'Del 1 al 10, ¿cuánto te apetece gritarle a la gente por la calle?', type: 'number', min: 1, max: 10, placeholder: 'Ej: 5' },
  { id: 'depression', text: '¿Te sientes al borde del abismo existencial?', type: 'select', options: [{val: '0', label: 'Qué va, soy feliz'}, {val: '1', label: 'Solo los domingos de bajón'}, {val: '2', label: 'Bastante a menudo'}, {val: '3', label: 'Vivo en la miseria'}] },
  { id: 'hardDrugs', text: '¿Le das a las drogas duras (cocaína, MDMA, pastis...)?', type: 'select', options: [{val: '0', label: 'Soy un puto ángel'}, {val: '1', label: 'En Nochevieja cae algo'}, {val: '2', label: 'Finde sí, finde no'}, {val: '3', label: 'Mi camello es mi mejor amigo'}] },
  { id: 'bingeDrinking', text: '¿Borracheras al mes en las que no recuerdas cómo llegaste a casa?', type: 'number', min: 0, max: 30, placeholder: 'Ej: 0' }
];

const generateAnalyses = (score, age, expectancy, answers = {}) => {
  const yearsLeft = Math.max(0, expectancy - age);
  const v = (id, defaultVal) => answers[id] !== undefined && answers[id] !== '' ? parseFloat(answers[id]) : defaultVal;

  const w = v('weight', 75);
  const h = v('height', 175) / 100;
  const bmi = w / (h * h);
  let bmiCat = "Normopeso";
  if (bmi < 18.5) bmiCat = "Infrapeso";
  else if (bmi > 25 && bmi <= 30) bmiCat = "Sobrepeso";
  else if (bmi > 30) bmiCat = "Obesidad";

  let prof = `Paciente de ${age} años con un IMC de ${bmi.toFixed(1)} (${bmiCat}). `;
  if (v('bloodPressure', 0) > 0 || v('cholesterol', 0) > 0 || v('chronicDisease', 0) > 0) {
    prof += `Se observan marcadores de riesgo clínico activos. `;
  }
  if (score > 80) prof += "La homeostasis metabólica es óptima. El riesgo de mortalidad prematura por causas prevenibles es estadísticamente insignificante.";
  else if (score > 50) prof += "Parámetros funcionales estables, aunque la convergencia de ciertos factores de riesgo conductuales sugiere margen de mejora para optimizar la longevidad.";
  else prof += "Alerta clínica. El perfil presentado sugiere un proceso acelerado de degeneración celular. Se requiere intervención médica drástica.";

  let norm = `Tu puntuación es ${score}/100. `;
  let advices = [];
  if (v('sleep', 7) < 6) advices.push("necesitas dormir más de tus horas actuales");
  if (v('water', 2) < 1.5) advices.push("deberías beber más agua");
  if (v('exercise', 3) < 2) advices.push("tienes que hacer más ejercicio a la semana");
  if (v('junkFood', 0) > 3) advices.push("debes reducir la comida ultraprocesada");
  if (v('stress', 5) > 7) advices.push("busca formas de reducir tu estrés diario");
  if (v('sitting', 6) > 10) advices.push("debes levantarte más a menudo de la silla");
  
  if (advices.length > 0) {
    norm += `Para mejorar, te aconsejo que ${advices.join(', ')}.`;
  } else {
    norm += `¡Sigue así! Tienes unos hábitos muy saludables que te permitirán disfrutar de una gran calidad de vida.`;
  }

  let jokes = [];
  if (v('sleep', 7) < 5) jokes.push("Tus ojeras son tan grandes que tienen su propio código postal.");
  if (v('junkFood', 0) > 4) jokes.push("Tus arterias tienen más atasco que la M-30 en hora punta.");
  if (v('exercise', 3) === 0) jokes.push("La última vez que sudaste fue intentando abrir un bote de mermelada.");
  if (v('bingeDrinking', 0) > 2 || v('hardDrugs', 0) > 0) jokes.push("Tu hígado ha pedido asilo político en otro cuerpo más sano.");
  if (v('stress', 5) > 8) jokes.push("Estás a un email de distancia de irte a vivir al bosque y hablar con los pájaros.");

  let joke = "";
  if (jokes.length > 0) {
    joke = jokes.join(' ') + ` Te quedan unos ${yearsLeft} años de dar guerra si no petas antes.`;
  } else if (score < 40) {
    joke = "Sinceramente, es un milagro médico que estés vivo para leer esto. Eres un zombie de manual.";
  } else {
    joke = "Literalmente vas a enterrarnos a todos. Eres inmortal. Seguramente tu sangre cure enfermedades.";
  }

  return { prof, norm, joke };
};

const Questionnaire = () => {
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [analyses, setAnalyses] = useState(null);
  
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const questionContentRef = useRef(null);
  const resultsRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const loadExistingData = async () => {
      const data = await getUserData();
      if (data && data.questionnaireAnswers && Object.keys(data.questionnaireAnswers).length > 0) {
        setAnswers(data.questionnaireAnswers);
        const age = parseFloat(data.questionnaireAnswers.age) || 30;
        setAnalyses(generateAnalyses(data.healthScore, age, data.lifeExpectancy, data.questionnaireAnswers));
        setShowResults(true);
      }
      setLoadingInitial(false);
    };
    loadExistingData();
  }, []);

  useGSAP(() => {
    if (!loadingInitial && !showResults) {
      gsap.fromTo(".gsap-progress", { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" });
      gsap.fromTo(".gsap-question-area", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", delay: 0.2 });
    }
  }, { scope: containerRef, dependencies: [showResults, loadingInitial] });

  useGSAP(() => {
    if (showResults && analyses) {
      gsap.fromTo(".gsap-result-card", {
        y: 40,
        opacity: 0
      }, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.2,
        ease: "back.out(1.2)"
      });
    }
  }, { scope: resultsRef, dependencies: [showResults, analyses] });

  useEffect(() => {
    if (!showResults && !loadingInitial && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex, showResults, loadingInitial]);

  const animateTransition = (newIndex, direction) => {
    const xOut = direction > 0 ? -100 : 100;
    const xIn = direction > 0 ? 100 : -100;

    gsap.to(questionContentRef.current, {
      x: xOut, opacity: 0, duration: 0.3, ease: "power2.in",
      onComplete: () => {
        setCurrentIndex(newIndex);
        gsap.fromTo(questionContentRef.current, { x: xIn, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, ease: "power2.out" });
      }
    });
  };

  const handleNext = () => {
    const q = questionsList[currentIndex];
    const val = answers[q.id];
    
    if (val === undefined || val === '') {
      toast.error('Por favor, responde a la pregunta antes de continuar.', { icon: '⚠️' });
      return;
    }

    if (q.type === 'number') {
      const num = parseFloat(val);
      if (isNaN(num) || num < q.min || num > q.max) {
        toast.error(`Por favor, introduce un número válido (entre ${q.min} y ${q.max}).`);
        return;
      }
    }

    if (currentIndex < questionsList.length - 1) {
      animateTransition(currentIndex + 1, 1);
    } else {
      calculateScore();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      animateTransition(currentIndex - 1, -1);
    }
  };

  const handleChange = (val) => {
    const q = questionsList[currentIndex];
    setAnswers({ ...answers, [q.id]: val });
    
    if (q.type === 'select') {
      setTimeout(() => handleNext(), 300);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleNext();
    }
  };

  const calculateScore = async () => {
    let healthScore = 80;
    let lifeExpectancy = 82;

    const v = (id, defaultVal) => answers[id] !== undefined && answers[id] !== '' ? parseFloat(answers[id]) : defaultVal;

    const age = v('age', 30);
    const sleep = v('sleep', 7);
    const sitting = v('sitting', 6);
    
    if (sleep < 5) { healthScore -= 10; lifeExpectancy -= 2; }
    else if (sleep >= 7 && sleep <= 9) { healthScore += 5; lifeExpectancy += 1; }
    if (sitting > 10) { healthScore -= 5; lifeExpectancy -= 1; }

    const exercise = v('exercise', 0);
    const junkFood = v('junkFood', 2);
    const water = v('water', 1.5);
    healthScore += (exercise * 2) - (junkFood * 1.5);
    lifeExpectancy += (exercise * 0.5) - (junkFood * 0.3);
    if (water < 1) healthScore -= 3;

    if (v('bloodPressure', 0) === 1) { healthScore -= 5; lifeExpectancy -= 1; }
    if (v('bloodPressure', 0) === 2) { healthScore -= 15; lifeExpectancy -= 4; }

    if (v('cholesterol', 0) === 1) { healthScore -= 5; lifeExpectancy -= 1; }
    if (v('cholesterol', 0) === 2) { healthScore -= 10; lifeExpectancy -= 3; }

    if (v('chronicDisease', 0) === 1) { healthScore -= 15; lifeExpectancy -= 5; }
    if (v('familyHistory', 0) === 1) { healthScore -= 5; lifeExpectancy -= 3; }

    if (v('socialCircle', 0) === 1) { healthScore -= 10; lifeExpectancy -= 3; }

    const stress = v('stress', 5);
    const depression = v('depression', 0);
    healthScore -= (stress - 5) * 1.5; 
    if (depression === 2) { healthScore -= 10; lifeExpectancy -= 2; }
    if (depression === 3) { healthScore -= 20; lifeExpectancy -= 5; }

    const hardDrugs = v('hardDrugs', 0);
    const binge = v('bingeDrinking', 0);

    if (hardDrugs === 1) { healthScore -= 10; lifeExpectancy -= 3; }
    if (hardDrugs === 2) { healthScore -= 25; lifeExpectancy -= 10; }
    if (hardDrugs === 3) { healthScore -= 40; lifeExpectancy -= 20; }
    if (binge > 4) { healthScore -= 15; lifeExpectancy -= 5; }
    else if (binge > 0) { healthScore -= (binge * 2); lifeExpectancy -= (binge * 0.5); }

    if (age > 60) healthScore -= (age - 60) * 0.5;

    healthScore = Math.min(Math.max(Math.round(healthScore), 0), 100);
    lifeExpectancy = Math.max(Math.round(lifeExpectancy), age + 1);

    const userData = await getUserData();
    const habitsData = userData.habits || {};

    await saveUserData({
      healthScore,
      lifeExpectancy,
      habits: habitsData,
      questionnaireAnswers: answers
    });
    
    await saveQuestionnaireEntry(answers, healthScore, lifeExpectancy);
    await saveHistoryRecord(healthScore, lifeExpectancy);
    
    const xpResult = await awardXP(100, 'questionnaire');
    if (xpResult && xpResult.leveledUp) {
      toast.success(`¡Subiste al Nivel ${xpResult.newLevel}! 🎉`, { icon: '⭐', style: { background: 'var(--bg-dark)', color: '#fff', border: '1px solid var(--accent-primary)' } });
    } else {
      toast.success('+100 XP por completar el cuestionario', { icon: '✨', style: { background: 'var(--bg-dark)', color: '#fff' } });
    }
    const unlocked = await unlockBadge('first_blood');
    if (unlocked) toast.success('Insignia desbloqueada: Primer Paso 🥇', { duration: 4000, style: { background: 'var(--bg-dark)', color: '#fff', border: '1px solid gold' } });

    
    setAnalyses(generateAnalyses(healthScore, age, lifeExpectancy, answers));
    
    gsap.to(containerRef.current, {
      opacity: 0, duration: 0.3, onComplete: () => {
        setShowResults(true);
      }
    });
  };

  const startNewQuestionnaire = () => {
    gsap.to(resultsRef.current, {
      opacity: 0, duration: 0.3, onComplete: () => {
        setShowResults(false);
        setAnswers({});
        setCurrentIndex(0);
        setAnalyses(null);
      }
    });
  };

  if (loadingInitial) {
    return <div className="flex items-center justify-center" style={{ height: '100%', color: 'var(--text-muted)' }}>Cargando datos...</div>;
  }

  const q = questionsList[currentIndex];

  if (showResults && analyses) {
    return (
      <div ref={resultsRef} className="flex-col gap-6" style={{ maxWidth: '800px', margin: '0 auto', width: '100%', padding: '2rem 0' }}>
        <h1 className="text-center mb-4"><span className="text-gradient">Tu Veredicto Final</span></h1>
        
        <div className="glass-card gsap-result-card" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
          <div className="flex items-center gap-3 mb-2">
            <Stethoscope color="var(--accent-primary)" />
            <h3 style={{ margin: 0 }}>Diagnóstico Profesional</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>{analyses.prof}</p>
        </div>

        <div className="glass-card gsap-result-card" style={{ borderLeft: '4px solid var(--accent-success)' }}>
          <div className="flex items-center gap-3 mb-2">
            <Activity color="var(--accent-success)" />
            <h3 style={{ margin: 0 }}>Opinión Normal</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>{analyses.norm}</p>
        </div>

        <div className="glass-card gsap-result-card" style={{ borderLeft: '4px solid var(--accent-danger)' }}>
          <div className="flex items-center gap-3 mb-2">
            <Skull color="var(--accent-danger)" />
            <h3 style={{ margin: 0 }}>La Cruda Realidad</h3>
          </div>
          <p style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem', lineHeight: '1.6' }}>"{analyses.joke}"</p>
        </div>

        <div className="gsap-result-card flex justify-center gap-4 mt-6" style={{ flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={startNewQuestionnaire} style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
            <RotateCcw size={18} /> Nuevo Cuestionario
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/')} style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
            Ir a mi Dashboard <ArrowRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-col items-center justify-center" style={{ height: '100%', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      
      <div className="w-full mb-12 gsap-progress">
        <div className="flex justify-between items-center mb-2">
          <span style={{ color: 'var(--text-muted)' }}>Pregunta {currentIndex + 1} de {questionsList.length}</span>
          <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>{Math.round(((currentIndex) / questionsList.length) * 100)}%</span>
        </div>
        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
          <div style={{ width: `${((currentIndex + 1) / questionsList.length) * 100}%`, height: '100%', background: 'var(--accent-primary)', borderRadius: '3px', transition: 'width 0.4s ease' }}></div>
        </div>
      </div>

      <div className="w-full flex-col items-center gsap-question-area" style={{ flex: 1, justifyContent: 'center' }}>
        <div ref={questionContentRef} className="w-full flex-col items-center">
          <h2 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '3rem', lineHeight: '1.2' }}>
            {q.text}
          </h2>

          <div style={{ width: '100%', maxWidth: '400px' }}>
            {q.type === 'select' ? (
              <div className="flex-col gap-3">
                {q.options.map((opt) => (
                  <button 
                    key={opt.val}
                    className="btn"
                    onClick={() => handleChange(opt.val)}
                    style={{ 
                      width: '100%', padding: '1.2rem', fontSize: '1.1rem', 
                      background: answers[q.id] === opt.val ? 'var(--accent-primary)' : 'rgba(0,0,0,0.3)',
                      color: answers[q.id] === opt.val ? '#fff' : 'var(--text-main)',
                      border: `1px solid ${answers[q.id] === opt.val ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
                      justifyContent: 'center', transition: 'all 0.2s ease'
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex-col items-center gap-4">
                <input 
                  ref={inputRef}
                  type="number" 
                  min={q.min}
                  max={q.max}
                  placeholder={q.placeholder}
                  value={answers[q.id] || ''} 
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  onKeyDown={handleKeyDown}
                  className="mobile-input-lg"
                  style={{ 
                    width: '100%', padding: '1.5rem', borderRadius: 'var(--radius-sm)', 
                    border: '2px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)', 
                    color: 'var(--accent-primary)', fontSize: '2.5rem', textAlign: 'center', outline: 'none'
                  }}
                />
                <button className="btn btn-primary" onClick={handleNext} style={{ width: '100%', padding: '1.2rem', fontSize: '1.2rem' }}>
                  Aceptar <ArrowRight size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full flex justify-between mt-12 pt-4">
        <button 
          className="btn" 
          onClick={handlePrev} 
          disabled={currentIndex === 0}
          style={{ opacity: currentIndex === 0 ? 0 : 1, pointerEvents: currentIndex === 0 ? 'none' : 'auto', background: 'transparent', color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={18} style={{ marginRight: '8px' }} /> Anterior
        </button>
      </div>

    </div>
  );
};

export default Questionnaire;
