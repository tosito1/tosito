import os
import smtplib
from email.message import EmailMessage
from imap_tools import MailBox, AND, OR
import email.utils
import base64
from dotenv import load_dotenv

load_dotenv()

class EmailClient:
    def __init__(self):
        self.email_user = os.getenv("EMAIL_USER")
        self.email_pass = os.getenv("EMAIL_APP_PASSWORD")
        self.imap_server = os.getenv("IMAP_SERVER", "imap.gmail.com")
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", 587))
        
        if not self.email_user or not self.email_pass:
            raise ValueError("Las credenciales EMAIL_USER y EMAIL_APP_PASSWORD no están configuradas en .env")

    def get_unread_emails(self, limit=10):
        """Busca correos no leídos."""
        return self._fetch_emails(AND(seen=False), limit)

    def fetch_history(self, limit=100):
        """Busca correos históricos (leídos o no)."""
        return self._fetch_emails(AND(all=True), limit)

    def _fetch_emails(self, criteria, limit):
        """Función interna para descarga genérica de correos."""
        emails = []
        try:
            with MailBox(self.imap_server).login(self.email_user, self.email_pass) as mailbox:
                msgs = list(mailbox.fetch(criteria, limit=limit, reverse=True))
                for msg in msgs:
                    attachments = []
                    for att in msg.attachments:
                        attachments.append({
                            "filename": att.filename,
                            "content_type": att.content_type,
                            "payload": base64.b64encode(att.payload).decode() if isinstance(att.payload, bytes) else att.payload
                        })
                        
                    emails.append({
                        "uid": msg.uid,
                        "message_id": msg.headers.get('message-id', [''])[0] if isinstance(msg.headers.get('message-id'), tuple) else msg.headers.get('message-id', ''),
                        "subject": msg.subject,
                        "from": msg.from_,
                        "date": msg.date,
                        "body": msg.text or msg.html,
                        "flags": msg.flags,
                        "attachments": attachments
                    })
        except Exception as e:
            print(f"Error al obtener correos: {e}")
        return emails

    def mark_as_read(self, uid):
        """Marca un correo específico como leído usando su UID."""
        try:
            with MailBox(self.imap_server).login(self.email_user, self.email_pass) as mailbox:
                mailbox.flag(uid, [imap_tools.MailMessageFlags.SEEN], True)
                return True
        except Exception as e:
            print(f"Error al marcar como leído: {e}")
            return False

    def send_email(self, to_email, subject, body):
        """Envía un correo vía SMTP."""
        msg = EmailMessage()
        msg.set_content(body)
        msg['Subject'] = subject
        msg['From'] = self.email_user
        msg['To'] = to_email

        try:
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.email_user, self.email_pass)
                server.send_message(msg)
            return True
        except Exception as e:
            print(f"Error al enviar correo: {e}")
            return False

    def archive_email(self, uid):
        """Mueve el correo a la carpeta 'Archive' (o lo archiva en Gmail)."""
        try:
            with MailBox(self.imap_server).login(self.email_user, self.email_pass) as mailbox:
                # En Gmail, archivar es quitar de 'INBOX'
                mailbox.move(uid, 'Archive' if 'gmail' not in self.imap_server else '[Gmail]/Todos')
                return True
        except Exception as e:
            print(f"Error al archivar correo: {e}")
            return False

    def delete_email(self, uid):
        """Mueve el correo a la papelera (Trash)."""
        try:
            with MailBox(self.imap_server).login(self.email_user, self.email_pass) as mailbox:
                mailbox.delete(uid)
                return True
        except Exception as e:
            print(f"Error al eliminar correo: {e}")
            return False
