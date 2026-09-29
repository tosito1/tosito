import tkinter as tk
from tkinter import filedialog, ttk
from datetime import datetime, timedelta

# --- CONFIGURACIÓN ACTUALIZADA ---
# El Epoch real para tarjetas modernas de Andalucía es el año 2000
EPOCH_START = datetime(2000, 1, 1, 0, 0, 0)
FACTOR_SALDO = 0.005

class CTMA_Pro_Analizador:
    def __init__(self, root):
        self.root = root
        self.root.title("CTMA Forensics Studio v2.0 - [SISTEMA ACTUALIZADO]")
        self.root.geometry("650x600")
        
        # --- UI ---
        self.btn_cargar = ttk.Button(root, text="📂 Abrir DUMP de Tarjeta", command=self.cargar_archivo)
        self.btn_cargar.pack(pady=10)

        # Panel de Datos Generales
        frame_top = ttk.LabelFrame(root, text=" Información de la Tarjeta ")
        frame_top.pack(fill="x", padx=10, pady=5)
        
        self.lbl_uid = ttk.Label(frame_top, text="UID Físico: ---")
        self.lbl_uid.pack(padx=10, pady=2, anchor="w")
        
        self.lbl_id = ttk.Label(frame_top, text="ID Usuario (Chip): ---")
        self.lbl_id.pack(padx=10, pady=2, anchor="w")

        # Panel de Saldo
        frame_mid = ttk.LabelFrame(root, text=" Estado Económico (Sector 9) ")
        frame_mid.pack(fill="x", padx=10, pady=5)
        self.lbl_saldo = ttk.Label(frame_mid, text="SALDO: --.-- €", font=("Arial", 16, "bold"))
        self.lbl_saldo.pack(pady=10)

        # Panel de Historial
        frame_bot = ttk.LabelFrame(root, text=" Historial de Viajes (Epoch 2000) ")
        frame_bot.pack(fill="both", expand=True, padx=10, pady=5)

        self.tabla = ttk.Treeview(frame_bot, columns=("N", "Fecha", "Minutos Hex"), show="headings")
        self.tabla.heading("N", text="Pos"); self.tabla.column("N", width=40)
        self.tabla.heading("Fecha", text="Fecha y Hora de Validación")
        self.tabla.heading("Minutos Hex", text="Timestamp (Raw)")
        self.tabla.pack(fill="both", expand=True, padx=5, pady=5)

    def cargar_archivo(self):
        path = filedialog.askopenfilename(filetypes=[("Texto", "*.txt")])
        if not path: return
        self.procesar(path)

    def procesar(self, path):
        bloques = {}
        uid = "Desconocido"
        try:
            with open(path, 'r') as f:
                for linea in f:
                    if "UID:" in linea: uid = linea.split(":")[1].strip()
                    if "Bloque" in linea:
                        p = linea.split(":")
                        n = int(p[0].replace("Bloque","").strip())
                        d = p[1].replace(" ","").strip()
                        bloques[n] = d
        except: return

        self.lbl_uid.config(text=f"UID Físico: {uid}")

        # Decodificar ID (Sector 8, Bloque 32)
        if 32 in bloques:
            id_real = bloques[32][:8]
            self.lbl_id.config(text=f"ID Usuario (Chip): {id_real}")

        # Decodificar Saldo (Sector 9, Bloque 37) - Little Endian
        if 37 in bloques:
            raw = bloques[37][:8]
            inv = "".join(reversed([raw[i:i+2] for i in range(0, 8, 2)]))
            valor = int(inv, 16) * FACTOR_SALDO
            self.lbl_saldo.config(text=f"SALDO: {valor:.2f} €")

        # Decodificar Viajes
        for i in self.tabla.get_children(): self.tabla.delete(i)
        
        viajes = []
        # Buscamos en los bloques de historial
        for b_num in [40, 41, 42, 44, 45, 46, 48, 49, 50]:
            if b_num in bloques and not bloques[b_num].startswith("000000"):
                hex_time = bloques[b_num][4:10] # Bytes 2, 3 y 4
                try:
                    minutos = int(hex_time, 16)
                    # El gran cambio: Sumamos a la fecha base del año 2000
                    fecha = EPOCH_START + timedelta(minutes=minutos)
                    viajes.append((fecha, hex_time))
                except: continue
        
        viajes.sort(key=lambda x: x[0], reverse=True)
        for i, (f, h) in enumerate(viajes, 1):
            self.tabla.insert("", "end", values=(i, f.strftime("%d/%m/%Y %H:%M"), h))

if __name__ == "__main__":
    root = tk.Tk()
    app = CTMA_Pro_Analizador(root)
    root.mainloop()