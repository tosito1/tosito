import os
import sys
import time
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.prompt import Prompt, Confirm
from email_client import EmailClient
from ai_engine import AIEngine

console = Console()

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

def show_header():
    clear_screen()
    console.print(Panel.fit("[bold cyan]🤖 Asistente Inteligente de Correo[/bold cyan]", border_style="cyan"))
    console.print("[dim]Conectando con tu bandeja de entrada y cerebro de IA...[/dim]\n")

def check_new_emails(email_client: EmailClient, ai_engine: AIEngine):
    console.print("[yellow]Buscando correos no leídos...[/yellow]")
    emails = email_client.get_unread_emails(limit=5)
    
    if not emails:
        console.print("[green]¡No tienes correos nuevos![/green]")
        return
    
    table = Table(show_header=True, header_style="bold magenta")
    table.add_column("De", style="dim")
    table.add_column("Asunto")
    table.add_column("Categoría", justify="center")
    table.add_column("Resumen IA")

    processed_emails = []
    
    for idx, em in enumerate(emails):
        console.print(f"Procesando correo {idx+1}/{len(emails)} de [bold]{em['from']}[/bold]...", end="\r")
        
        # Limit body size to avoid huge prompts
        body_snippet = em['body'][:1500] if em['body'] else ""
        
        cat = ai_engine.categorize_email(em['from'], em['subject'], body_snippet)
        summary = ai_engine.summarize_email(em['from'], em['subject'], body_snippet)
        
        # Colorize category
        cat_colored = cat
        if "Urgente" in cat: cat_colored = f"[bold red]{cat}[/bold red]"
        elif "Trabajo" in cat: cat_colored = f"[blue]{cat}[/blue]"
        elif "Newsletter" in cat: cat_colored = f"[dim]{cat}[/dim]"
        
        table.add_row(em['from'][:25], em['subject'][:30] + "..." if len(em['subject']) > 30 else em['subject'], cat_colored, summary)
        
        processed_emails.append({
            "email": em,
            "category": cat,
            "summary": summary
        })
    
    clear_screen()
    show_header()
    console.print(table)
    
    # Opciones post-lectura
    while True:
        console.print("\n[bold]Opciones:[/bold]")
        console.print("1. Redactar respuesta con IA a un correo")
        console.print("2. Marcar todos como leídos")
        console.print("3. Volver al menú principal")
        
        choice = Prompt.ask("Elige una opción", choices=["1", "2", "3"])
        
        if choice == "1":
            try:
                mail_idx = int(Prompt.ask("¿A qué correo deseas responder? (1 al " + str(len(processed_emails)) + ")")) - 1
                if 0 <= mail_idx < len(processed_emails):
                    draft_reply_flow(email_client, ai_engine, processed_emails[mail_idx]['email'])
                else:
                    console.print("[red]Índice inválido.[/red]")
            except ValueError:
                console.print("[red]Entrada inválida.[/red]")
                
        elif choice == "2":
            with console.status("[yellow]Marcando correos como leídos...[/yellow]"):
                for p_em in processed_emails:
                    email_client.mark_as_read(p_em['email']['uid'])
            console.print("[green]Corres marcados como leídos.[/green]")
            break
        elif choice == "3":
            break

def draft_reply_flow(email_client: EmailClient, ai_engine: AIEngine, email_data):
    console.print(f"\n[bold cyan]Borrador para:[/bold cyan] {email_data['from']}")
    console.print(f"[bold cyan]Asunto original:[/bold cyan] {email_data['subject']}")
    
    instrucciones = Prompt.ask("Dile a la IA cómo responder (ej. 'Di que sí y propone reunirnos mañana', o presiona Enter para que decida sola)")
    
    with console.status("[yellow]La IA está escribiendo...[/yellow]"):
        body_snippet = email_data['body'][:1500] if email_data['body'] else ""
        draft = ai_engine.draft_response(email_data['from'], email_data['subject'], body_snippet, instrucciones)
    
    console.print(Panel(draft, title="[bold green]Borrador Generado[/bold green]", border_style="green"))
    
    action = Prompt.ask("¿Qué deseas hacer?", choices=["enviar", "editar", "cancelar"])
    
    if action == "enviar":
        with console.status("[yellow]Enviando correo...[/yellow]"):
            success = email_client.send_email(email_data['from'], f"Re: {email_data['subject']}", draft)
        if success:
            console.print("[green]¡Correo enviado exitosamente![/green]")
            email_client.mark_as_read(email_data['uid'])
        else:
            console.print("[bold red]Fallo al enviar correo.[/bold red]")
            
    elif action == "editar":
        console.print("[yellow]Para editar en consola, pega la nueva versión completa:[/yellow]")
        console.print("[dim](Tip: Copia el borrador arriba, modifícalo y pégalo. Presiona Enter dos veces para terminar)[/dim]")
        
        lines = []
        while True:
            line = input()
            if line == "":
                break
            lines.append(line)
        
        edited_draft = "\n".join(lines)
        if Confirm.ask("¿Enviar ahora esta versión editada?"):
            with console.status("[yellow]Enviando correo...[/yellow]"):
                success = email_client.send_email(email_data['from'], f"Re: {email_data['subject']}", edited_draft)
            if success:
                console.print("[green]¡Correo enviado exitosamente![/green]")
                email_client.mark_as_read(email_data['uid'])

def draft_new_email(email_client: EmailClient, ai_engine: AIEngine):
    console.print("\n[bold cyan]Nuevo Correo Asistido por IA[/bold cyan]")
    to_email = Prompt.ask("Destinatario")
    subject = Prompt.ask("Asunto del correo")
    instrucciones = Prompt.ask("¿Qué quieres que diga el correo?")
    
    with console.status("[yellow]La IA está escribiendo...[/yellow]"):
        # For a new email, we reuse the draft_response prompt but without original email context
        prompt = f"Redacta un correo profesional inicial con el asunto '{subject}' basado en las siguientes instrucciones: {instrucciones}"
        draft = ai_engine.client.models.generate_content(
            model=ai_engine.model_name,
            contents=prompt,
        ).text.strip()
        
    console.print(Panel(draft, title="[bold green]Borrador Generado[/bold green]", border_style="green"))
    
    if Confirm.ask("¿Enviar correo?"):
        with console.status("[yellow]Enviando correo...[/yellow]"):
            success = email_client.send_email(to_email, subject, draft)
        if success:
            console.print("[green]¡Correo enviado exitosamente![/green]")
        else:
            console.print("[bold red]Fallo al enviar correo.[/bold red]")

def main():
    try:
        email_client = EmailClient()
        ai_engine = AIEngine()
    except Exception as e:
        console.print(f"[bold red]Error de inicialización:[/bold red] {e}")
        console.print("Asegúrate de haber configurado tu archivo .env correctamente.")
        return

    while True:
        show_header()
        table = Table(show_header=False, box=None)
        table.add_row("[bold cyan]1.[/bold cyan] Revisar nuevos correos (IA resume y categoriza)")
        table.add_row("[bold cyan]2.[/bold cyan] Redactar nuevo correo con IA")
        table.add_row("[bold cyan]3.[/bold cyan] Salir")
        console.print(Panel(table, title="[bold]Menú Principal[/bold]"))
        
        choice = Prompt.ask("Qué quieres hacer?", choices=["1", "2", "3"])
        
        if choice == "1":
            check_new_emails(email_client, ai_engine)
        elif choice == "2":
            draft_new_email(email_client, ai_engine)
        elif choice == "3":
            console.print("[bold green]¡Hasta luego![/bold green]")
            break

if __name__ == "__main__":
    main()
