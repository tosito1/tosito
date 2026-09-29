import cv2
import numpy as np
import os
import pickle
import time
from datetime import datetime

print("🎭 Iniciando Sistema de Intercambio Facial...")

# ==============================
# CLASE FaceCapture
# ==============================

class FaceCapture:
    def __init__(self, output_folder="training_data/your_face"):
        self.output_folder = output_folder
        self.cap = cv2.VideoCapture(0)
        if not self.cap.isOpened():
            print("❌ Error: No se pudo acceder a la cámara")
            return
        
        self.cap.set(3, 640)  # Ancho
        self.cap.set(4, 480)  # Alto
        
        # Crear directorio si no existe
        os.makedirs(output_folder, exist_ok=True)
        
        # Contador de fotos
        self.photo_count = 0
        self.max_photos = 20  # Número máximo de fotos a capturar
        
    def detect_faces(self, frame):
        """Detecta rostros en el frame usando Haar Cascade"""
        try:
            face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30)
            )
            return faces
        except Exception as e:
            print(f"Error en detección facial: {e}")
            return []
    
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
                # Generar nombre único
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"face_{timestamp}_{self.photo_count:03d}.jpg"
                filepath = os.path.join(self.output_folder, filename)
                
                # Guardar imagen
                cv2.imwrite(filepath, face_roi)
                self.photo_count += 1
                print(f"✅ Foto {self.photo_count}/{self.max_photos} guardada")
                return True
        
        return False
    
    def show_instructions(self, frame):
        """Muestra instrucciones en pantalla"""
        instructions = [
            "INSTRUCCIONES:",
            "1. Posicionate en el centro",
            "2. Manten tu rostro en el rectangulo verde",
            f"3. Fotos: {self.photo_count}/{self.max_photos}",
            "4. Mueve la cabeza a diferentes angulos",
            "5. 'c' = Capturar manual",
            "6. 'a' = Modo automatico",
            "7. 'q' = Salir"
        ]
        
        y_offset = 30
        for i, instruction in enumerate(instructions):
            color = (255, 255, 255) if i > 0 else (0, 255, 255)
            font_size = 0.5 if i > 0 else 0.6
            cv2.putText(frame, instruction, (10, y_offset), 
                       cv2.FONT_HERSHEY_SIMPLEX, font_size, color, 1)
            y_offset += 25
        
        return frame
    
    def run(self):
        """Ejecuta el sistema de captura"""
        print("=== MODO CAPTURA DE ROSTRO ===")
        print(f"📁 Fotos se guardarán en: {self.output_folder}")
        print("🔄 Preparando cámara...")
        
        time.sleep(2)
        
        auto_mode = False
        
        while True:
            ret, frame = self.cap.read()
            if not ret:
                print("❌ Error: No se pudo leer la cámara")
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
            
            # Modo actual
            mode_text = "MODO: Automatico" if auto_mode else "MODO: Manual"
            cv2.putText(frame, mode_text, (10, 450),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)
            
            # Modo automático
            if auto_mode and len(faces) == 1 and self.photo_count < self.max_photos:
                current_time = time.time()
                if hasattr(self, 'last_auto_capture'):
                    if current_time - self.last_auto_capture >= 2:  # Cada 2 segundos
                        self.save_face_photo(frame, faces)
                        self.last_auto_capture = current_time
                else:
                    self.last_auto_capture = current_time
                    self.save_face_photo(frame, faces)
            
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
                    print("❌ No se detectó un rostro único")
            elif key == ord('a'):  # Activar modo automático
                auto_mode = True
                print("🔁 Modo automático activado")
            elif key == ord('m'):  # Activar modo manual
                auto_mode = False
                print("✋ Modo manual activado")
            
            # Verificar si se alcanzó el máximo de fotos
            if self.photo_count >= self.max_photos:
                print(f"🎉 ¡Se capturaron {self.max_photos} fotos!")
                time.sleep(2)
                break
        
        # Liberar recursos
        self.cap.release()
        cv2.destroyAllWindows()
        
        print(f"\n✅ Captura completada: {self.photo_count} fotos")
        return self.photo_count

# ==============================
# CLASE SimpleFaceTrainer
# ==============================

class SimpleFaceTrainer:
    def __init__(self):
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        self.face_recognizer = cv2.face.LBPHFaceRecognizer_create()
        self.faces = []
        self.labels = []
        
    def prepare_training_data(self, data_folder):
        """Prepara los datos de entrenamiento"""
        print("🔍 Buscando imágenes de entrenamiento...")
        
        person_folder = os.path.join(data_folder, "your_face")
        if not os.path.exists(person_folder):
            print(f"❌ No se encuentra la carpeta: {person_folder}")
            return False
        
        image_files = [f for f in os.listdir(person_folder) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
        
        if not image_files:
            print("❌ No hay imágenes en la carpeta")
            return False
        
        print(f"📸 Encontradas {len(image_files)} imágenes")
        
        for i, filename in enumerate(image_files):
            image_path = os.path.join(person_folder, filename)
            image = cv2.imread(image_path)
            
            if image is None:
                print(f"❌ No se pudo cargar: {filename}")
                continue
                
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            faces = self.face_cascade.detectMultiScale(gray, 1.1, 5)
            
            if len(faces) == 1:
                x, y, w, h = faces[0]
                face_roi = gray[y:y+h, x:x+w]
                
                # Redimensionar para consistencia
                face_roi = cv2.resize(face_roi, (100, 100))
                
                self.faces.append(face_roi)
                self.labels.append(0)  # Label 0 para "your_face"
                print(f"✅ Rostro {i+1}/{len(image_files)} procesado")
            else:
                print(f"❌ {filename}: No se detectó rostro o múltiples rostros")
        
        return len(self.faces) > 0
    
    def train_model(self, data_folder):
        """Entrena el modelo"""
        try:
            print("🔄 Preparando datos de entrenamiento...")
            success = self.prepare_training_data(data_folder)
            
            if not success or not self.faces:
                print("❌ No hay datos suficientes para entrenar")
                return False
            
            print(f"🧠 Entrenando con {len(self.faces)} rostros...")
            self.face_recognizer.train(self.faces, np.array(self.labels))
            
            # Guardar modelo
            os.makedirs('models', exist_ok=True)
            model_path = 'models/face_model.yml'
            self.face_recognizer.save(model_path)
            
            # Guardar información del modelo
            model_info = {
                'faces_count': len(self.faces),
                'training_date': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                'label': 'your_face'
            }
            
            with open('models/model_info.pkl', 'wb') as f:
                pickle.dump(model_info, f)
            
            print(f"✅ Modelo entrenado y guardado: {model_path}")
            print(f"📊 Rostros utilizados: {len(self.faces)}")
            return True
            
        except Exception as e:
            print(f"❌ Error en entrenamiento: {e}")
            return False

# ==============================
# CLASE LiveFaceSwapper
# ==============================

class LiveFaceSwapper:
    def __init__(self):
        self.cap = cv2.VideoCapture(0)
        if not self.cap.isOpened():
            print("❌ Error: No se pudo acceder a la cámara")
            return
        
        self.cap.set(3, 640)
        self.cap.set(4, 480)
        
        # Cargar modelo si existe
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        self.face_recognizer = cv2.face.LBPHFaceRecognizer_create()
        
        model_path = 'models/face_model.yml'
        if os.path.exists(model_path):
            try:
                self.face_recognizer.read(model_path)
                print("✅ Modelo facial cargado")
                self.model_loaded = True
            except:
                print("❌ Error cargando el modelo")
                self.model_loaded = False
        else:
            print("❌ Modelo no encontrado. Usando solo detección.")
            self.model_loaded = False
    
    def process_frame(self, frame):
        """Procesa el frame para detectar e intercambiar rostros"""
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(gray, 1.1, 5)
        
        for (x, y, w, h) in faces:
            try:
                if self.model_loaded:
                    # Predecir si es tu rostro
                    face_roi = gray[y:y+h, x:x+w]
                    face_roi = cv2.resize(face_roi, (100, 100))
                    
                    label, confidence = self.face_recognizer.predict(face_roi)
                    
                    # Si la confianza es baja, es probablemente tu rostro
                    if confidence < 70:  # Es tu rostro
                        cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
                        cv2.putText(frame, "TU ROSTRO", (x, y-10),
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
                    else:  # Es otro rostro - aplicar reemplazo
                        replacement = self.create_replacement_face((h, w, 3))
                        frame[y:y+h, x:x+w] = replacement
                        cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 0, 255), 2)
                        cv2.putText(frame, "ROSTRO REEMPLAZADO", (x, y-10),
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
                else:
                    # Solo detección sin modelo
                    cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 0, 0), 2)
                    cv2.putText(frame, "ROSTRO DETECTADO", (x, y-10),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 1)
                    
            except Exception as e:
                print(f"Error procesando rostro: {e}")
        
        return frame
    
    def create_replacement_face(self, shape):
        """Crea un rostro de reemplazo simple"""
        face = np.ones(shape, dtype=np.uint8) * 255  # Fondo blanco
        
        h, w = shape[:2]
        
        # Dibujar características faciales simples
        cv2.circle(face, (w//3, h//3), w//12, (0, 0, 0), -1)  # Ojo izquierdo
        cv2.circle(face, (2*w//3, h//3), w//12, (0, 0, 0), -1)  # Ojo derecho
        cv2.ellipse(face, (w//2, 2*h//3), (w//4, h//10), 0, 0, 180, (0, 0, 0), 3)  # Boca
        
        return face
    
    def run(self):
        """Ejecuta el sistema en tiempo real"""
        print("🎥 Iniciando cámara... Presiona 'q' para salir")
        
        while True:
            ret, frame = self.cap.read()
            if not ret:
                break
            
            frame = cv2.flip(frame, 1)
            processed_frame = self.process_frame(frame)
            
            # Mostrar instrucciones
            cv2.putText(processed_frame, "Presiona 'q' para salir", (10, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            
            cv2.imshow('Live Face Swapper', processed_frame)
            
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        
        self.cap.release()
        cv2.destroyAllWindows()

# ==============================
# FUNCIONES AUXILIARES
# ==============================

def analyze_dataset():
    """Analiza el dataset de fotos capturadas"""
    folder_path = "training_data/your_face"
    
    if not os.path.exists(folder_path):
        print("❌ No existe el directorio de fotos")
        return
    
    image_files = [f for f in os.listdir(folder_path) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    
    print(f"\n=== ANÁLISIS DEL DATASET ===")
    print(f"📊 Total de fotos: {len(image_files)}")
    
    if image_files:
        print("📸 Primeras fotos:")
        for i, filename in enumerate(image_files[:5]):
            print(f"  {i+1}. {filename}")
        
        if len(image_files) > 5:
            print(f"  ... y {len(image_files) - 5} más")
        
        print(f"\n💡 Recomendaciones:")
        if len(image_files) < 10:
            print("  ⚠️  Captura más fotos (mínimo 10 recomendado)")
        else:
            print("  ✅ Cantidad de fotos suficiente")
        
        print("  ✅ Puedes proceder con el entrenamiento")
    else:
        print("  ❌ No hay fotos en el directorio")

def clear_screen():
    """Limpia la pantalla de la consola"""
    os.system('cls' if os.name == 'nt' else 'clear')

def show_menu():
    """Muestra el menú principal"""
    print("\n" + "🎭" + "="*50 + "🎭")
    print("           SISTEMA DE INTERCAMBIO FACIAL IA")
    print("🎭" + "="*50 + "🎭")
    print("\n📍 OPCIONES DISPONIBLES:")
    print("1. 📸 Capturar fotos de mi rostro")
    print("2. 🧠 Entrenar modelo con mis fotos") 
    print("3. 🔄 Iniciar intercambio facial en vivo")
    print("4. 📊 Analizar dataset de fotos")
    print("5. 🚪 Salir")
    print("\n" + "="*55)

# ==============================
# FUNCIÓN PRINCIPAL
# ==============================

def main():
    # Crear directorios necesarios
    os.makedirs('training_data/your_face', exist_ok=True)
    os.makedirs('models', exist_ok=True)
    
    while True:
        clear_screen()
        show_menu()
        
        try:
            choice = input("\n🎯 Selecciona una opción (1-5): ").strip()
        except KeyboardInterrupt:
            print("\n\n👋 ¡Hasta pronto!")
            break
        
        if choice == "1":
            clear_screen()
            print("=== 📸 MODO CAPTURA DE FOTOS ===")
            print("\n💡 Recomendaciones:")
            print("  • Busca buena iluminación")
            print("  • Fondo simple")
            print("  • Diferentes ángulos y expresiones")
            print("  • Al menos 10-15 fotos")
            
            input("\n🎯 Presiona Enter para comenzar...")
            
            capture = FaceCapture()
            if capture.cap.isOpened():
                num_photos = capture.run()
                if num_photos > 0:
                    print(f"\n✅ ¡Captura exitosa! {num_photos} fotos guardadas.")
                else:
                    print("\n❌ No se capturaron fotos.")
            else:
                print("❌ No se pudo acceder a la cámara")
            
            input("\n⏎ Presiona Enter para continuar...")
        
        elif choice == "2":
            clear_screen()
            print("=== 🧠 ENTRENAMIENTO DEL MODELO ===")
            
            if not os.path.exists('training_data/your_face') or not os.listdir('training_data/your_face'):
                print("❌ No hay fotos para entrenar. Usa la opción 1 primero.")
                input("\n⏎ Presiona Enter para continuar...")
                continue
            
            print("🔄 Iniciando entrenamiento...")
            trainer = SimpleFaceTrainer()
            success = trainer.train_model('training_data')
            
            if success:
                print("\n✅ ¡Modelo entrenado exitosamente!")
            else:
                print("\n❌ Error en el entrenamiento.")
            
            input("\n⏎ Presiona Enter para continuar...")
        
        elif choice == "3":
            clear_screen()
            print("=== 🔄 INTERCAMBIO FACIAL EN VIVO ===")
            
            if not os.path.exists('models/face_model.yml'):
                print("❌ Primero entrena el modelo (opción 2).")
                input("\n⏎ Presiona Enter para continuar...")
                continue
            
            print("🎥 Iniciando cámara...")
            print("👤 Se reemplazarán rostros que no sean el tuyo")
            print("🎯 Presiona 'q' para salir")
            print("\n🔄 Iniciando en 3 segundos...")
            time.sleep(3)
            
            swapper = LiveFaceSwapper()
            if swapper.cap.isOpened():
                swapper.run()
            else:
                print("❌ No se pudo acceder a la cámara")
                input("\n⏎ Presiona Enter para continuar...")
        
        elif choice == "4":
            clear_screen()
            print("=== 📊 ANÁLISIS DEL DATASET ===")
            analyze_dataset()
            input("\n⏎ Presiona Enter para continuar...")
        
        elif choice == "5":
            print("\n👋 ¡Hasta pronto!")
            break
        
        else:
            print("❌ Opción no válida. Por favor selecciona 1-5.")
            input("\n⏎ Presiona Enter para continuar...")

if __name__ == "__main__":
    print("🔧 Inicializando sistema...")
    main()