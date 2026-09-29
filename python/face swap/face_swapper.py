import cv2
import numpy as np
import face_recognition
import pickle

class LiveFaceSwapper:
    def __init__(self):
        self.known_face_encodings = []
        self.known_face_names = []
        self.load_model()
        
    def load_model(self):
        """Carga el modelo entrenado"""
        try:
            with open('models/face_model.pkl', 'rb') as f:
                data = pickle.load(f)
                self.known_face_encodings = data['encodings']
                self.known_face_names = data['names']
            print("Modelo cargado exitosamente")
        except Exception as e:
            print(f"Error al cargar el modelo: {str(e)}")
            
    def run(self):
        """Inicia el intercambio facial en vivo"""
        # Iniciar la cámara
        cap = cv2.VideoCapture(0)
        
        if not cap.isOpened():
            print("No se pudo acceder a la cámara")
            return
            
        print("Presiona 'q' para salir")
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            # Reducir el tamaño del frame para mejor rendimiento
            small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
            rgb_small_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)
            
            # Encontrar caras en el frame actual
            face_locations = face_recognition.face_locations(rgb_small_frame)
            face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)
            
            face_names = []
            for face_encoding in face_encodings:
                # Verificar si la cara coincide con las caras conocidas
                matches = face_recognition.compare_faces(self.known_face_encodings, face_encoding)
                name = "Desconocido"
                
                if True in matches:
                    first_match_index = matches.index(True)
                    name = self.known_face_names[first_match_index]
                
                face_names.append(name)
            
            # Dibujar los resultados
            for (top, right, bottom, left), name in zip(face_locations, face_names):
                # Escalar las coordenadas
                top *= 4
                right *= 4
                bottom *= 4
                left *= 4
                
                # Dibujar un rectángulo alrededor de la cara
                cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)
                
                # Dibujar una etiqueta con el nombre
                cv2.rectangle(frame, (left, bottom - 35), (right, bottom), (0, 255, 0), cv2.FILLED)
                font = cv2.FONT_HERSHEY_DUPLEX
                cv2.putText(frame, name, (left + 6, bottom - 6), font, 0.6, (255, 255, 255), 1)
            
            # Mostrar el resultado
            cv2.imshow('Video', frame)
            
            # Salir si se presiona 'q'
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        
        # Liberar la cámara y cerrar ventanas
        cap.release()
        cv2.destroyAllWindows()
