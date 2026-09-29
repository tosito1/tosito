import os.path
import datetime
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from dotenv import load_dotenv

load_dotenv()

# If modifying these scopes, delete the file token.json.
SCOPES = ['https://www.googleapis.com/auth/calendar']

class CalendarEngine:
    def __init__(self, credentials_path='credentials.json', token_path='token.json'):
        self.creds = None
        self.credentials_path = credentials_path
        self.token_path = token_path
        self.service = None
        
        # El token.json almacena los tokens de acceso y refresco del usuario
        if os.path.exists(self.token_path):
            self.creds = Credentials.from_authorized_user_file(self.token_path, SCOPES)
            
        # Si no hay credenciales válidas disponibles, pedir al usuario que se identifique.
        if not self.creds or not self.creds.valid:
            if self.creds and self.creds.expired and self.creds.refresh_token:
                try:
                    self.creds.refresh(Request())
                    with open(self.token_path, 'w') as token:
                        token.write(self.creds.to_json())
                except Exception as e:
                    print(f"Error refrescando token: {e}")
            else:
                # Esto requerirá intervención manual (abrirá el navegador)
                # En un entorno de servidor real, esto se manejaría de forma distinta
                if os.path.exists(self.credentials_path):
                    flow = InstalledAppFlow.from_client_secrets_file(
                        self.credentials_path, SCOPES)
                    self.creds = flow.run_local_server(port=0)
                    # Guardar las credenciales para la próxima vez
                    with open(self.token_path, 'w') as token:
                        token.write(self.creds.to_json())
                else:
                    print(f"AVISO: No se encontró {self.credentials_path}. La integración de Calendario está deshabilitada.")

        if self.creds:
            try:
                self.service = build('calendar', 'v3', credentials=self.creds)
            except Exception as e:
                print(f"Error inicializando servicio de Google Calendar: {e}")

    def get_upcoming_events(self, max_results=10):
        """Muestra los próximos eventos del calendario del usuario."""
        if not self.service:
            return []
            
        now = datetime.datetime.utcnow().isoformat() + 'Z'  # 'Z' indica tiempo UTC
        try:
            events_result = self.service.events().list(
                calendarId='primary', timeMin=now,
                maxResults=max_results, singleEvents=True,
                orderBy='startTime'
            ).execute()
            return events_result.get('items', [])
        except HttpError as error:
            print(f'Ocurrió un error en el API: {error}')
            return []

    def check_conflicts(self, start_time, end_time):
        """Verifica si hay eventos que coincidan en el rango dado."""
        if not self.service:
            return None
            
        try:
            events_result = self.service.events().list(
                calendarId='primary', timeMin=start_time, timeMax=end_time,
                singleEvents=True
            ).execute()
            return events_result.get('items', [])
        except HttpError as error:
            print(f'Error al verificar conflictos: {error}')
            return []

    def add_event(self, summary, start_time, end_time, description=None, location=None):
        """Añade un nuevo evento al calendario primario."""
        if not self.service:
            return None
            
        event = {
            'summary': summary,
            'location': location,
            'description': description,
            'start': {
                'dateTime': start_time, # formato ISO (ej. 2024-03-07T15:00:00Z)
                'timeZone': 'UTC',
            },
            'end': {
                'dateTime': end_time,
                'timeZone': 'UTC',
            },
        }
        
        try:
            event = self.service.events().insert(calendarId='primary', body=event).execute()
            return event
        except HttpError as error:
            print(f'Error al crear evento: {error}')
            return None
