import tkinter as tk
from tkinter import filedialog, ttk
from datetime import datetime, timedelta

# Constantes del Sistema
EPOCH_START = datetime(1997, 1, 1)
FACTOR_SALDO = 0.005

PROVINCIAS = {
    '01': 'Sevilla', '02': 'Cádiz', '03': 'Granada', 
    '04': 'Málaga', '05': 'Campo de Gibraltar', '06': 'Jaén', 
    '07': 'Almería', '08': 'Córdoba', '09': 'Huelva'
}

class CTMA_Forensics_App:
    def __init__(self, root):
        self.root = root
        self.root.title("CTMA Forensics Studio - Analizador RFID")
        self.root.geometry("600x550")
        self.root.configure(padx=20, pady=20)
        
        # --- ESTILOS ---
        style = ttk.Style()
        style.theme_use('clam')
        style.configure("TButton", font=("Arial", 10, "bold"))
        style.configure("Header.TLabel", font=("Arial", 14, "bold"), foreground="#2c3e50")
        style.configure("Info.TLabel", font=("Arial", 11))
        
        # --- INTERFAZ ---
        # Botón Cargar
        self.btn_cargar = ttk.Button(root, text="📂 Cargar archivo DUMP", command=self.cargar_archivo)
        self.btn_cargar.pack(fill="x", pady=(0, 15))
        
        self.lbl_archivo = ttk.Label(root, text="Ningún archivo cargado", foreground="gray")
        self.lbl_archivo.pack(pady=(0, 15))

        # Marco de Identidad
        frame_id = ttk.LabelFrame(root, text=" 👤 Perfil del Usuario (Sector 8) ")
        frame_id.pack(fill="x", pady=5, ipadx=10, ipady=10)
        self.lbl_id = ttk.Label(frame_id, text="ID Usuario: ---", style="Info.TLabel")
        self.lbl_id.pack(anchor="w")
        self.lbl_prov = ttk.Label(frame_id, text="Provincia: ---", style="Info.TLabel")
        self.lbl_prov.pack(anchor="w")

        # Marco de Saldo
        frame_saldo = ttk.LabelFrame(root, text=" 💶 Monedero (Sector 9) ")
        frame_saldo.pack(fill="x", pady=5, ipadx=10, ipady=10)
        self.lbl_saldo = ttk.Label(frame_saldo, text="Saldo Disponible: --- €", style="Header.TLabel")
        self.lbl_saldo.pack(anchor="w")

        # Marco de Viajes
        frame_viajes = ttk.LabelFrame(root, text=" 🚌 Historial de Viajes (Ring Buffer) ")
        frame_viajes.pack(fill="both", expand=True, pady=5)
        
        # Tabla de viajes
        columnas = ("#", "Fecha y Hora", "Hex Timestamp")
        self.tabla = ttk.Treeview(frame_viajes, columns=columnas, show="headings", height=10)
        self.tabla.heading("#", text="Nº")
        self.tabla.heading("Fecha y Hora", text="Fecha de Validación")
        self.tabla.heading("Hex Timestamp", text="Datos Brutos (Hex)")
        self.tabla.column("#", width=30, anchor="center")
        self.tabla.column("Fecha y Hora", width=200, anchor="center")
        self.tabla.column("Hex Timestamp", width=150, anchor="center")
        self.tabla.pack(fill="both", expand=True, padx=10, pady=10)

    def cargar_archivo(self):
        filepath = filedialog.askopenfilename(
            title="Selecciona el archivo DUMP de la tarjeta",
            filetypes=(("Archivos de texto", "*.txt"), ("Todos los archivos", "*.*"))
        )
        if not filepath:
            return
            
        self.lbl_archivo.config(text=f"Analizando: {filepath.split('/')[-1]}")
        self.procesar_dump(filepath)

    def procesar_dump(self, filepath):
        bloques = {}
        # Leer el archivo y guardarlo en un diccionario {num_bloque: "AABBCC..."}
        try:
            with open(filepath, 'r') as f:
                for linea in f:
                    if linea.startswith("Bloque"):
                        partes = linea.split(":")
                        num = int(partes[0].replace("Bloque", "").strip())
                        datos_hex = partes[1].replace(" ", "").strip()
                        bloques[num] = datos_hex
        except Exception as e:
            self.lbl_archivo.config(text=f"Error leyendo el archivo: {e}")
            return

        # --- 1. DECODIFICAR IDENTIDAD (Bloque 32) ---
        if 32 in bloques and len(bloques[32]) >= 8:
            hex_id = bloques[32][:8]
            # CORRECCIÓN: Los 8 dígitos completos forman el ID de usuario.
            # El prefijo de provincia no se guarda aquí, solo está impreso.
            self.lbl_id.config(text=f"ID Usuario Interno: {hex_id}")
            self.lbl_prov.config(text="Provincia: (Asignada en la base de datos central)")
        else:
            self.lbl_id.config(text="ID Usuario: No encontrado")
            self.lbl_prov.config(text="Provincia: ---")

        # --- 2. DECODIFICAR SALDO (Bloque 37) ---
        if 37 in bloques and len(bloques[37]) >= 8:
            hex_saldo = bloques[37][:8]
            # Little Endian: Invertir el orden de los bytes
            hex_invertido = "".join(reversed([hex_saldo[i:i+2] for i in range(0, 8, 2)]))
            try:
                decimal_saldo = int(hex_invertido, 16)
                saldo_real = decimal_saldo * FACTOR_SALDO
                self.lbl_saldo.config(text=f"Saldo Disponible: {saldo_real:.2f} €")
            except ValueError:
                self.lbl_saldo.config(text="Error calculando saldo")
        else:
            self.lbl_saldo.config(text="Saldo Disponible: No encontrado")

        # --- 3. DECODIFICAR VIAJES (Sectores 10, 11 y 12) ---
        for item in self.tabla.get_children():
            self.tabla.delete(item) # Limpiar tabla anterior

        # Bloques donde se guardan los viajes
        bloques_viajes = [40, 41, 42, 44, 45, 46, 48, 49, 50]
        viajes_encontrados = []

        for b in bloques_viajes:
            if b in bloques and len(bloques[b]) >= 10:
                fila = bloques[b]
                # Si el bloque está vacío (todo ceros), saltarlo
                if fila.startswith("0000000000000000"):
                    continue
                
                # El Timestamp son los bytes 2, 3 y 4 (índices 4 al 9 del string)
                hex_time = fila[4:10]
                try:
                    minutos = int(hex_time, 16)
                    fecha_viaje = EPOCH_START + timedelta(minutes=minutos)
                    viajes_encontrados.append({
                        "bloque": b,
                        "fecha": fecha_viaje,
                        "hex": hex_time
                    })
                except ValueError:
                    continue

        # Ordenar los viajes del más reciente al más antiguo
        viajes_encontrados.sort(key=lambda x: x["fecha"], reverse=True)

        for i, viaje in enumerate(viajes_encontrados, 1):
            fecha_str = viaje["fecha"].strftime("%d/%m/%Y - %H:%M")
            self.tabla.insert("", "end", values=(i, fecha_str, viaje["hex"]))

if __name__ == "__main__":
    root = tk.Tk()
    app = CTMA_Forensics_App(root)
    root.mainloop()