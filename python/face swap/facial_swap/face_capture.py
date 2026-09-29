import cv2
import os
import time
from datetime import datetime

class FaceCapture:
    def __init__(self, output_folder="training_data/your_face"):
        self.output_folder = output_folder
        self.cap = cv2.VideoCapture(0)
        self.cap.set(3, 640)  # Ancho
        self.cap.set(4, 480)  # Alto
        
        # Crear directorio si no existe
        os.makedirs(output_folder, exist_ok=True)
        
        # Contador de fotos
        self.photo_count = 0
        self.max_photos = 50  # Número máximo de fotos a capturar
        
    def detect_faces(self, frame):
        """Detecta rostros en el frame usando Haar Cascade"""
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30),
            flags=cv2.CASCADE_SCALE_IMAGE
        )
        return faces
    
    def draw_guidelines(self, frame):
        """Dibuja guías para ayudar con el posicionamiento"""
        height, width = frame.shape[:2]
        
        # Línea central vertical
        cv2.line(frame, (width//2, 0), (width//2, height), (0, 255, 0), 1)
        # Línea central horizontal
        cv2.line(frame, (0, height//2), (width, height//2), (0, 255, 0), 1)
        
        # Círculo en el centro
        cv2.circle(frame, (width//2, height//2), 50, (0, 255, 0), 2)
        
        # Rectángulo donde debe ir el rostro
        face_rect_start = (width//2 - 100, height//2 - 100)
        face_rect_end = (width//2 + 100, height//2 + 100)
        cv2.rectangle(frame, face_rect_start, face_rect_end, (0, 255, 0), 2)
        
        return frame
    
    def save_face_photo(self, frame, faces):
        """Guarda la foto del rostro detectado"""
        if len(faces) == 1:
            x, y, w, h = faces[0]
            
            # Extraer región del rostro con margen
            margin = 20
            x1 = max(0, x - margin)
            y1 = max(0, y - margin)
            x2 = min(frame.shape[1], x + w + margin)
            y2 = min(frame.shape[1], y + h + margin)
            
            face_roi = frame[y1:y2, x1:x2]
            
            if face_roi.size > 0:
                # Generar nombre único con timestamp
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
                filename = f"face_{timestamp}_{self.photo_count:03d}.jpg"
                filepath = os.path.join(self.output_folder, filename)
                
                # Guardar imagen
                cv2.imwrite(filepath, face_roi)
                self.photo_count += 1
                print(f"✅ Foto guardada: {filename} (Total: {self.photo_count}/{self.max_photos})")
                
                return True
        
        return False
    
    def show_instructions(self, frame):
        """Muestra instrucciones en pantalla"""
        instructions = [
            "INSTRUCCIONES:",
            "1. Colocate en el centro del marco",
            "2. Manten tu rostro dentro del rectangulo verde",
            f"3. Fotos capturadas: {self.photo_count}/{self.max_photos}",
            "4. Mueve la cabeza lentamente a diferentes angulos",
            "5. Presiona 'c' para capturar manualmente",
            "6. Presiona 'a' para captura automatica",
            "7. Presiona 'q' para terminar"
        ]
        
        y_offset = 30
        for i, instruction in enumerate(instructions):
            color = (255, 255, 255) if i > 0 else (0, 255, 255)
            font_size = 0.5 if i > 0 else 0.6
            cv2.putText(frame, instruction, (10, y_offset), 
                       cv2.FONT_HERSHEY_SIMPLEX, font_size, color, 1)
            y_offset += 25
        
        return frame
    
    def capture_auto_mode(self, frame, faces):
        """Modo automático de captura"""
        if len(faces) == 1 and self.photo_count < self.max_photos:
            # Capturar cada 2 segundos en modo automático
            current_time = time.time()
            if hasattr(self, 'last_auto_capture'):
                if current_time - self.last_auto_capture >= 2:  # 2 segundos
                    if self.save_face_photo(frame, faces):
                        self.last_auto_capture = current_time
            else:
                self.last_auto_capture = current_time
                if self.save_face_photo(frame, faces):
                    return True
        return False
    
    def run(self):
        """Ejecuta el sistema de captura"""
        print("=== MODO CAPTURA DE ROSTRO ===")
        print(f"Las fotos se guardarán en: {self.output_folder}")
        print("Preparando cámara...")
        
        time.sleep(2)
        
        auto_mode = False
        capture_mode_text = "MODO: Manual (Presiona 'a' para automatico)"
        
        while True:
            ret, frame = self.cap.read()
            if not ret:
                print("Error: No se pudo acceder a la cámara")
                break
            
            # Voltear frame para efecto espejo
            frame = cv2.flip(frame, 1)
            
            # Detectar rostros
            faces = self.detect_faces(frame)
            
            # Dibujar guías
            frame = self.draw_guidelines(frame)
            
            # Mostrar instrucciones
            frame = self.show_instructions(frame)
            
            # Dibujar rectángulos alrededor de rostros detectados
            for (x, y, w, h) in faces:
                color = (0, 255, 0) if len(faces) == 1 else (0, 0, 255)
                cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
                cv2.putText(frame, f"Rostro detectado", (x, y-10),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
            
            # Mostrar modo actual
            cv2.putText(frame, capture_mode_text, (10, 470),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)
            
            # Modo automático
            if auto_mode and len(faces) == 1:
                self.capture_auto_mode(frame, faces)
                capture_mode_text = "MODO: Automatico (Presiona 'm' para manual)"
            else:
                capture_mode_text = "MODO: Manual (Presiona 'a' para automatico)"
            
            # Mostrar frame
            cv2.imshow('Captura de Rostro - Presiona "q" para salir', frame)
            
            # Controles del teclado
            key = cv2.waitKey(1) & 0xFF
            
            if key == ord('q'):  # Salir
                break
            elif key == ord('c'):  # Capturar manualmente
                if len(faces) == 1:
                    self.save_face_photo(frame, faces)
                else:
                    print("❌ No se detectó un rostro o hay múltiples rostros")
            elif key == ord('a'):  # Activar modo automático
                auto_mode = True
                print("🔁 Modo automático activado")
            elif key == ord('m'):  # Activar modo manual
                auto_mode = False
                print("✋ Modo manual activado")
            
            # Verificar si se alcanzó el máximo de fotos
            if self.photo_count >= self.max_photos:
                print(f"🎉 ¡Se capturaron {self.max_photos} fotos! Cerrando...")
                time.sleep(2)
                break
        
        # Liberar recursos
        self.cap.release()
        cv2.destroyAllWindows()
        
        print(f"\n✅ Captura completada: {self.photo_count} fotos guardadas en '{self.output_folder}'")
        return self.photo_count

def analyze_dataset(folder_path):
    """Analiza el dataset de fotos capturadas"""
    if not os.path.exists(folder_path):
        print("❌ No existe el directorio de fotos")
        return
    
    image_files = [f for f in os.listdir(folder_path) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    
    print(f"\n=== ANÁLISIS DEL DATASET ===")
    print(f"Total de fotos: {len(image_files)}")
    
    if image_files:
        # Mostrar primeras 5 fotos
        print("Primeras 5 fotos:")
        for i, filename in enumerate(image_files[:5]):
            print(f"  {i+1}. {filename}")
        
        if len(image_files) > 5:
            print(f"  ... y {len(image_files) - 5} más")
        
        print(f"\nRecomendaciones:")
        if len(image_files) < 20:
            print("  ⚠️  Considera capturar más fotos (mínimo 20 recomendado)")
        else:
            print("  ✅ Cantidad de fotos suficiente")
        
        print("  ✅ Puedes proceder con el entrenamiento del modelo")

if __name__ == "__main__":
    capture = FaceCapture()
    num_photos = capture.run()
    
    if num_photos > 0:
        analyze_dataset(capture.output_folder)