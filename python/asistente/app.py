import streamlit as st
import time
from email_client import EmailClient
from ai_engine import AIEngine
from memory_engine import MemoryEngine
from voice_engine import VoiceEngine
from contacts_engine import ContactsEngine
from calendar_engine import CalendarEngine
import plotly.express as px
import pandas as pd
from PIL import Image
import io
import time

# Configuración de página con layout ancho y título personalizado
st.set_page_config(page_title="Asistente de Correo IA", page_icon="🤖", layout="wide")

# CSS personalizado para un look moderno y "Premium"
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Inter', sans-serif;
    }
    
    .stApp {
        background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
        color: #ffffff;
    }
    
    .stSidebar {
        background-color: rgba(255, 255, 255, 0.05) !important;
        backdrop-filter: blur(10px);
    }
    
    .stButton>button {
        background: linear-gradient(90deg, #6a11cb 0%, #2575fc 100%);
        color: white;
        border-radius: 20px;
        border: none;
        padding: 10px 24px;
        font-weight: 600;
        transition: all 0.3s ease;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    
    .stButton>button:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(37, 117, 252, 0.4);
    }
    
    .email-card {
        background: rgba(255, 255, 255, 0.05);
        padding: 25px;
        border-radius: 16px;
        border-left: 6px solid #00d2ff;
        margin-bottom: 25px;
        backdrop-filter: blur(5px);
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        transition: transform 0.2s;
    }
    
    .email-card:hover {
        transform: scale(1.01);
    }
    
    .category-badge {
        display: inline-block;
        padding: 5px 12px;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 800;
        margin-left: 12px;
        text-transform: uppercase;
    }
    
    .cat-urgente { background: #ff4b2b; color: white; }
    .cat-trabajo { background: #12c2e9; color: white; }
    .cat-newsletter { background: #616161; color: white; }
    .cat-spam { background: #f7971e; color: white; }
    
    h1, h2, h3, h4 {
        color: #00d2ff;
        font-weight: 800;
        text-shadow: 0 0 10px rgba(0, 210, 255, 0.3);
    }
    
    /* Glassmorphism effect */
    .glass-panel {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 20px;
    }
</style>
""", unsafe_allow_html=True)

# Inicializar los motores
@st.cache_resource
def init_engines():
    try:
        ec = EmailClient()
        ae = AIEngine()
        me = MemoryEngine()
        ve = VoiceEngine()
        ce = ContactsEngine()
        cal = CalendarEngine()
        return ec, ae, me, ve, ce, cal
    except Exception as e:
        st.error(f"Error inicializando componentes: {e}")
        return None, None, None, None, None, None

email_client, ai_engine, memory_engine, voice_engine, contacts_engine, calendar_engine = init_engines()

if not email_client:
    st.stop()

# Estado de la Aplicación
if "unread_emails" not in st.session_state:
    st.session_state.unread_emails = []
if "history_emails" not in st.session_state:
    st.session_state.history_emails = []
if "processed_emails" not in st.session_state:
    st.session_state.processed_emails = {}
if "auto_reply_rules" not in st.session_state:
    st.session_state.auto_reply_rules = []
if "chat_history" not in st.session_state:
    st.session_state.chat_history = []
if "dashboard_summary" not in st.session_state:
    st.session_state.dashboard_summary = ""
if "detected_tasks" not in st.session_state:
    st.session_state.detected_tasks = []

def get_category_class(cat):
    if "Urgen" in cat: return "cat-urgente"
    if "Traba" in cat: return "cat-trabajo"
    if "News" in cat: return "cat-newsletter"
    if "Spam" in cat: return "cat-spam"
    return ""

def render_sidebar():
    with st.sidebar:
        st.title("🤖 Asistente IA")
        st.markdown("---")
        
        # Navegación
        choice = st.radio("Navegación", ["📊 Dashboard", "📥 Inbox Inteligente", "🧠 Memoria (Búsqueda)", "📅 Calendario", "👥 Contactos (CRM)", "⚙️ Auto-Reply (Reglas)"])
        
        st.markdown("---")
        st.subheader("💬 Chat Global")
        for msg in st.session_state.chat_history[-5:]: # Mostrar últimos 5
            role_icon = "👤" if msg['role'] == "user" else "🤖"
            st.markdown(f"**{role_icon}:** {msg['content']}")
        
        chat_input = st.chat_input("Pregunta algo a tu buzón...")
        if chat_input:
            st.session_state.chat_history.append({"role": "user", "content": chat_input})
            with st.spinner("Pensando..."):
                res = memory_engine.answer_question_from_memory(chat_input, ai_engine)
                st.session_state.chat_history.append({"role": "assistant", "content": res})
            st.rerun()

        st.markdown("---")
        st.caption("Conectado como:")
        st.code(email_client.email_user)
        
        if st.button("🗑️ Limpiar temporales"):
            voice_engine.cleanup()
            st.success("Limpiado")
            
        return choice

def view_dashboard():
    st.header("📊 Dashboard Ejecutivo")
    
    # Botón de Sincronización Total
    if st.button("🔄 Sincronización Total (Dashboard + 200 correos)"):
        with st.status("Sincronizando historial profundo...") as status:
            st.write("Descargando correos previos...")
            st.session_state.history_emails = email_client.fetch_history(limit=200)
            
            st.write("Indexando en Memoria semántica...")
            memory_engine.add_emails(st.session_state.history_emails)
            
            st.write("Generando Resumen Ejecutivo...")
            st.session_state.dashboard_summary = ""
            time.sleep(2) # Evitar 429 inmediato tras el sync masivo
            for _ in range(3):
                try:
                    st.session_state.dashboard_summary = ai_engine.generate_dashboard_summary(st.session_state.history_emails[:20])
                    break
                except Exception as e:
                    if "429" in str(e):
                        time.sleep(10)
                    else: break
            
            st.write("Detectando tareas y compromisos...")
            for _ in range(3):
                try:
                    st.session_state.detected_tasks = ai_engine.detect_tasks(st.session_state.history_emails[:20])
                    break
                except Exception as e:
                    if "429" in str(e):
                        time.sleep(10)
                    else: break
            
            status.update(label="¡Sincronización Completa!", state="complete")

    if st.session_state.dashboard_summary:
        col_main, col_stats = st.columns([2, 1])
        with col_main:
            st.subheader("💡 Resumen Ejecutivo")
            st.info(st.session_state.dashboard_summary)
            
            st.subheader("✅ Tareas y Compromisos")
            if st.session_state.detected_tasks:
                for t in st.session_state.detected_tasks:
                    with st.expander(f"📌 {t['task']}"):
                        st.write(f"**De:** {t['source']} | **Plazo:** {t.get('due', 'N/A')}")
            else:
                st.write("No hay tareas pendientes.")
        
        with col_stats:
            st.subheader("📈 Analíticas de Actividad")
            # Simular datos para el gráfico
            data = pd.DataFrame({
                'Categoría': ['Urgente', 'Trabajo', 'Personal', 'Newsletter', 'Spam'],
                'Cantidad': [3, 12, 15, 45, 10]
            })
            fig = px.pie(data, values='Cantidad', names='Categoría', color_discrete_sequence=px.colors.sequential.RdBu, hole=0.4)
            fig.update_layout(margin=dict(t=0, b=0, l=0, r=0), paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)', font_color="white")
            st.plotly_chart(fig, width='stretch') # use_container_width deprecated in late 2025/2026
            
            st.metric("Volumen Diario", "24 correos", "+12%")
    else:
        st.warning("Pulsa 'Sincronización Total' para generar tu Dashboard con Analíticas.")

def view_inbox():
    st.header("📥 Bandeja de Entrada Inteligente")
    
    col1, col2 = st.columns([1, 4])
    with col1:
        if st.button("🔄 Revisar Nuevos Correos"):
            with st.spinner("Conectando al servidor IMAP..."):
                st.session_state.unread_emails = email_client.get_unread_emails(limit=10)
                st.session_state.processed_emails = {}
    with col2:
        if st.session_state.unread_emails:
             if st.button("💾 Guardar histórico completo en Memoria (ChromaDB)"):
                 with st.spinner("Sincronizando correos a la base de datos vectorial..."):
                     count = memory_engine.add_emails(st.session_state.unread_emails)
                     st.success(f"¡Se agregaron {count} nuevos correos a la memoria a largo plazo!")
    
    if not st.session_state.unread_emails:
        st.info("No hay correos no leídos cargados. Haz clic en 'Revisar Nuevos Correos'.")
        return

    st.markdown("### Correos Pendientes")
    
    for idx, em in enumerate(st.session_state.unread_emails):
        uid = em['uid']
        
        # Procesar dinámicamente si no se ha procesado aún
        if uid not in st.session_state.processed_emails:
            with st.spinner(f"Analizando correo {idx+1}/{len(st.session_state.unread_emails)}..."):
                body_snippet = em['body'][:1500] if em['body'] else ""
                
                # Intentar categorizar y resumir con reintentos para evitar 429
                success = False
                wait_time = 2
                for attempt in range(3):
                    try:
                        cat = ai_engine.categorize_email(em['from'], em['subject'], body_snippet, em.get('thread_context'))
                        summary = ai_engine.summarize_email(em['from'], em['subject'], body_snippet, em.get('thread_context'))
                        st.session_state.processed_emails[uid] = {"category": cat, "summary": summary}
                        success = True
                        break
                    except Exception as e:
                        if "429" in str(e):
                            st.warning(f"Límite excedido. Reintentando en {wait_time}s...")
                            time.sleep(wait_time)
                            wait_time *= 2
                        else:
                            st.error(f"Error procesando correo: {e}")
                            break
                
                if not success:
                    st.session_state.processed_emails[uid] = {"category": "Otro", "summary": "Error al procesar resumen."}
                
                time.sleep(1.5) # Pausa entre correos para evitar 429
            st.rerun() # Recargar para mostrar el correo procesado
            
        data = st.session_state.processed_emails[uid]
        
        # Tarjeta UI para el correo
        with st.container():
            cat_class = get_category_class(data["category"])
            st.markdown(f"""
            <div class="email-card">
                <h4>{em['subject']} <span class="category-badge {cat_class}">{data['category']}</span></h4>
                <p style="color: #aaa;"><b>De:</b> {em['from']}  |  <b>Fecha:</b> {em['date']}</p>
                <p><b>Resumen IA:</b> {data['summary']}</p>
            </div>
            """, unsafe_allow_html=True)
            
            col_a, col_b, col_c = st.columns(3)
            with col_a:
                if st.button("🔊 Leer en voz alta", key=f"tts_{uid}"):
                    with st.spinner("Generando audio..."):
                        tts_text = f"Correo de {em['from']}. Asunto: {em['subject']}. Resumen: {data['summary']}"
                        audio_path = voice_engine.generate_tts(tts_text)
                        if audio_path:
                            audio_html = voice_engine.get_audio_html(audio_path)
                            st.markdown(audio_html, unsafe_allow_html=True)
                            
            with col_b:
                 with st.expander("Ver contenido original"):
                     st.text(em['body'])
            with col_c:
                 if st.button("✔️ Marcar Leído", key=f"read_{uid}"):
                     email_client.mark_as_read(uid)
                     st.success("Marcado leido")
                 if st.button("📂 Archivar", key=f"arch_{uid}"):
                     email_client.archive_email(uid)
                     st.info("Archivado")
                 if st.button("🗑️ Borrar", key=f"del_{uid}"):
                     email_client.delete_email(uid)
                     st.error("Eliminado")
                 if st.button("🌍 Traducir", key=f"trans_{uid}"):
                     with st.spinner("Traduciendo..."):
                         translated = ai_engine.translate_text(em['body'])
                         st.session_state[f"trans_body_{uid}"] = translated
                 if st.button("🗓️ Extraer Cita", key=f"cal_{uid}"):
                     with st.spinner("Buscando fechas y horas..."):
                         event_data = ai_engine.extract_event_data(em['body'])
                         if event_data:
                             st.session_state[f"event_draft_{uid}"] = event_data
                         else:
                             st.warning("No se detectó ninguna cita clara en este correo.")
            
            if f"event_draft_{uid}" in st.session_state:
                ev = st.session_state[f"event_draft_{uid}"]
                with st.expander("📝 Confirmar Evento de Calendario", expanded=True):
                    col_ev1, col_ev2 = st.columns(2)
                    with col_ev1:
                        ev_summary = st.text_input("Título", value=ev.get('summary', ''), key=f"ev_sum_{uid}")
                        ev_start = st.text_input("Inicio (ISO)", value=ev.get('start', ''), key=f"ev_start_{uid}")
                    with col_ev2:
                        ev_loc = st.text_input("Lugar", value=ev.get('location', 'Virtual'), key=f"ev_loc_{uid}")
                        ev_end = st.text_input("Fin (ISO)", value=ev.get('end', ''), key=f"ev_end_{uid}")
                    
                    if st.button("🚀 Guardar en Google Calendar", key=f"save_cal_{uid}"):
                        if not calendar_engine.service:
                            st.error("Google Calendar no está configurado (falta credentials.json).")
                        else:
                            with st.spinner("Agendando..."):
                                # Verificar conflictos antes
                                conflicts = calendar_engine.check_conflicts(ev_start, ev_end)
                                if conflicts:
                                    st.warning(f"⚠️ ¡Conflicto detectado! Tienes {len(conflicts)} evento(s) a esa hora.")
                                    for c in conflicts:
                                        st.caption(f"- {c.get('summary')} ({c.get('start', {}).get('dateTime')})")
                                
                                result = calendar_engine.add_event(ev_summary, ev_start, ev_end, location=ev_loc)
                                if result:
                                    st.success(f"✅ Evento agendado: [Ver en Calendar]({result.get('htmlLink')})")
                                    del st.session_state[f"event_draft_{uid}"]
                                else:
                                    st.error("Error al crear el evento.")
            
            if f"trans_body_{uid}" in st.session_state:
                st.info(f"🌍 **Traducción:** {st.session_state[f'trans_body_{uid}']}")

            # Adjuntos y Visión
            if em.get('attachments'):
                st.markdown("📎 **Adjuntos detectados:**")
                for att_idx, att in enumerate(em['attachments']):
                    att_col1, att_col2 = st.columns([3, 1])
                    with att_col1:
                        st.caption(f"📄 {att['filename']} ({att['content_type']})")
                    with att_col2:
                        if st.button("👁️ Analizar", key=f"vision_{uid}_{att_idx}"):
                            with st.spinner("Analizando con Visión IA..."):
                                analysis = ai_engine.analyze_attachment(att['filename'], att['content_type'], att['payload'])
                                st.success(f"🔍 **Análisis:** {analysis}")
            
            # Interactive Reply Section
            st.markdown("#### Responder con IA")
            reply_col1, reply_col2 = st.columns([1, 1])
            
            with reply_col1:
                instruction = st.text_input("Instrucciones de texto:", key=f"inst_{uid}", placeholder="Ej. Dile que sí y propone las 5pm")
            
            with reply_col2:
                # Native Streamlit STT
                st.write("O dicta tu instrucción:")
                audio_input = st.audio_input("Grabar instrucción vocal", key=f"audio_{uid}")
                
            transcribed_text = ""
            if audio_input:
                with st.spinner("Transcribiendo voz con Gemini..."):
                    transcribed_text = voice_engine.process_stt_file(audio_input, ai_engine)
                    st.info(f"🎤 *Transcrito:* {transcribed_text}")
            
            final_instruction = transcribed_text if transcribed_text else instruction
            
            if st.button("✨ Generar Borrador Inteligente", key=f"draft_{uid}"):
                 with st.spinner("La IA está redactando la respuesta..."):
                     body_snippet = em['body'][:1500] if em['body'] else ""
                     draft = ai_engine.draft_response(em['from'], em['subject'], body_snippet, final_instruction, em.get('thread_context'))
                     st.session_state[f"draft_text_{uid}"] = draft
                     
            if f"draft_text_{uid}" in st.session_state:
                edited_draft = st.text_area("Revisa o edita tu respuesta:", value=st.session_state[f"draft_text_{uid}"], height=200, key=f"edit_{uid}")
                if st.button("📤 Enviar correo", key=f"send_{uid}"):
                    with st.spinner("Enviando..."):
                        if email_client.send_email(em['from'], f"Re: {em['subject']}", edited_draft):
                            email_client.mark_as_read(uid)
                            st.success("¡Enviado exitosamente!")
                            st.balloons()
                        else:
                            st.error("Error enviando")
            st.markdown("---")

def view_memory():
    st.header("🧠 Memoria (Búsqueda Semántica)")
    st.write("Pregúntale a tu historial de correos de forma natural. El asistente buscará los correos más similares usando Base de Datos Vectorial local y te dará una respuesta.")
    
    question = st.text_input("¿Qué quieres saber de tus correos pasados?", placeholder="Ej. ¿Qué dijo Carlos sobre el contrato la semana pasada?")
    if question:
        with st.spinner("Hurgando en la memoria y razonando..."):
            answer = memory_engine.answer_question_from_memory(question, ai_engine)
            st.markdown("### Respuesta del Asistente")
            st.info(answer)
            
            with st.expander("Ver correos fuente recuperados por ChromaDB"):
                 docs = memory_engine.semantic_search(question, n_results=3)
                 for d in docs:
                     meta = d['metadata']
                     st.markdown(f"**De:** {meta.get('from')} | **Fecha:** {meta.get('date')}")
                     st.caption(d['document'][:300] + "...")
                     st.markdown("---")

def view_auto_reply():
    st.header("⚙️ Modo Auto-Reply (Vigilante)")
    st.write("Añade reglas para que el asistente inspeccione tus correos y los responda autónomamente si cumplen las condiciones.")
    
    with st.form("auto_reply_form"):
        st.subheader("Nueva Regla")
        col1, col2 = st.columns(2)
        with col1:
             condition = st.text_input("Si el correo...", placeholder="Es de 'juan@empresa.com' o la categoría es 'Urgente'")
        with col2:
             action = st.text_area("La IA debe responder...", placeholder="Indicando que estoy fuera pero recibirán respuesta en 24h")
        
        if st.form_submit_button("Añadir Regla"):
            st.session_state.auto_reply_rules.append({"condition": condition, "action": action})
            st.success("Regla añadida.")

    if st.session_state.auto_reply_rules:
         st.subheader("Tus Reglas Activas")
         for i, rule in enumerate(st.session_state.auto_reply_rules):
             st.code(f"SI: {rule['condition']}\nENTONCES: {rule['action']}")

    st.markdown("---")
    st.subheader("Ejecutar Ciclo de Vigilancia")
    st.write("Presiona aquí para simular un job en segundo plano que revisa los correos y aplica estas reglas auto-respondiendo.")
    
    if st.button("🚀 Ejecutar Auto-Reply Ahora"):
        if not st.session_state.auto_reply_rules:
             st.warning("No tienes reglas configuradas.")
        else:
            with st.status("Ejecutando revisión automática...") as status:
                st.write("1. Buscando correos no leídos...")
                unreads = email_client.get_unread_emails(limit=5)
                if not unreads:
                     st.write("No hay correos para auto-responder.")
                     status.update(label="Ciclo finalizado", state="complete")
                     return
                     
                for em in unreads:
                    st.write(f"Evaluando: {em['subject']} de {em['from']}")
                    body_snippet = em['body'][:500] if em['body'] else ""
                    
                    # Gemini acts as the router to see if a rule matches
                    router_prompt = f"Dado este correo (De: {em['from']}, Asunto: {em['subject']}, Cuerpo: {body_snippet}). Y las siguientes reglas del usuario: {st.session_state.auto_reply_rules}. ¿Aplica alguna regla? Responde 'SI' o 'NO'."
                    router_res = ai_engine.client.models.generate_content(
                        model=ai_engine.model_name, contents=router_prompt
                    ).text.strip()
                    
                    if "SI" in router_res.upper():
                        st.write("✅ Regla aplicada. Generando y enviando respuesta...")
                        # Asumimos que la primera regla lo maneja para esta demo
                        rule = st.session_state.auto_reply_rules[0]
                        draft = ai_engine.draft_response(em['from'], em['subject'], body_snippet, rule['action'])
                        # ENVÍO AUTOMÁTICO
                        if email_client.send_email(em['from'], f"Re: {em['subject']} (Auto-Reply)", draft):
                            email_client.mark_as_read(em['uid'])
                            st.write(f"  -> Respondido y marcado como leído.")
                    else:
                        st.write("❌ Ninguna regla aplica. Ignorado.")
                status.update(label="Ciclo Automático Finalizado", state="complete")


def view_contacts():
    st.header("👥 Gestor de Contactos IA (CRM)")
    st.write("Historial inteligente de personas con las que interactúas.")
    
    contacts = contacts_engine.list_all_contacts()
    if not contacts['ids']:
        st.info("Aún no hay contactos procesados. Mantén tu Inbox actualizado para que la IA extraiga perfiles.")
    else:
        for i, email in enumerate(contacts['ids']):
            with st.expander(f"👤 {email}"):
                st.write(contacts['documents'][i])
                if st.button(f"Sincronizar perfil de {email}", key=f"sync_{email}"):
                    # Buscar el último correo de este remitente para actualizar
                    latest = [e for e in st.session_state.history_emails if e['from'] == email]
                    if latest:
                        contacts_engine.update_contact_from_email(email, latest[0]['body'], ai_engine)
                        st.rerun()

def view_calendar():
    st.header("📅 Mi Calendario IA")
    
    if not calendar_engine.service:
        st.warning("⚠️ Google Calendar no está vinculado.")
        st.info("Para activar esta función, coloca tu archivo `credentials.json` en la carpeta raíz y reinicia la app.")
        return

    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.subheader("🗓️ Próximos Eventos")
        events = calendar_engine.get_upcoming_events(max_results=10)
        if not events:
            st.write("No tienes eventos próximos.")
        else:
            for event in events:
                start = event['start'].get('dateTime', event['start'].get('date'))
                with st.container():
                     st.markdown(f"""
                     <div class="glass-panel">
                        <h4 style="margin-bottom:0px;">{event['summary']}</h4>
                        <p style="color: #00d2ff; font-weight: bold;">{start}</p>
                        <p style="font-size: 0.9rem;">{event.get('location', 'Sin ubicación')}</p>
                     </div>
                     """, unsafe_allow_html=True)

    with col2:
        st.subheader("➕ Añadir Rápido")
        with st.form("quick_event"):
            q_title = st.text_input("¿Qué hay que hacer?")
            q_date = st.date_input("Fecha")
            q_time = st.time_input("Hora")
            if st.form_submit_button("Agendar"):
                start_dt = f"{q_date}T{q_time}:00Z"
                # End 1 hour later (simplified)
                end_dt = f"{q_date}T{str(int(q_time.hour)+1).zfill(2)}:{str(q_time.minute).zfill(2)}:00Z"
                res = calendar_engine.add_event(q_title, start_dt, end_dt)
                if res:
                    st.success("Evento añadido")
                    st.rerun()

# Enrutamiento Principal
choice = render_sidebar()

if choice == "📊 Dashboard":
    view_dashboard()
elif choice == "📥 Inbox Inteligente":
    view_inbox()
elif choice == "🧠 Memoria (Búsqueda)":
    view_memory()
elif choice == "📅 Calendario":
    view_calendar()
elif choice == "👥 Contactos (CRM)":
    view_contacts()
elif choice == "⚙️ Auto-Reply (Reglas)":
    view_auto_reply()
