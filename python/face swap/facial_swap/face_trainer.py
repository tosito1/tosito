import cv2
import numpy as np
import os
import face_recognition
import pickle
from collections import defaultdict

class FaceTrainer:
    def __init__(self):
        self.known_encodings = []
        self.known_names = []
        
    def extract_face_encodings(self, image):
        """Extrae codificaciones faciales de una imagen"""
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        face_locations = face_recognition.face_locations(rgb_image)
        face_encodings = face_recognition.face_encodings(rgb_image, face_locations)
        return face_encodings
    
    def load_training_images(self, folder_path, person_name):
        """Carga y procesa imágenes de entrenamiento"""
        encodings = []
        
        for filename in os.listdir(folder_path):
            if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                image_path = os.path.join(folder_path, filename)
                image = cv2.imread(image_path)
                
                if image is not None:
                    face_encodings = self.extract_face_encodings(image)
                    if face_encodings:
                        encodings.extend(face_encodings)
                        print(f"Procesada {filename}: {len(face_encodings)} rostros encontrados")
        
        return encodings
    
    def train_model(self, data_folder):
        """Entrena el modelo con las imágenes proporcionadas"""
        for person_name in os.listdir(data_folder):
            person_folder = os.path.join(data_folder, person_name)
            
            if os.path.isdir(person_folder):
                print(f"Entrenando con imágenes de: {person_name}")
                encodings = self.load_training_images(person_folder, person_name)
                
                if encodings:
                    self.known_encodings.extend(encodings)
                    self.known_names.extend([person_name] * len(encodings))
                    print(f"Added {len(encodings)} encodings for {person_name}")
        
        # Guardar el modelo entrenado
        model_data = {
            'encodings': self.known_encodings,
            'names': self.known_names
        }
        
        with open('models/face_model.pkl', 'wb') as f:
            pickle.dump(model_data, f)
        
        print(f"Modelo entrenado con {len(self.known_encodings)} codificaciones faciales")
        return True

if __name__ == "__main__":
    # Crear directorios necesarios
    os.makedirs('models', exist_ok=True)
    os.makedirs('training_data/your_face', exist_ok=True)
    
    trainer = FaceTrainer()
    
    # Verificar que hay imágenes para entrenar
    if not os.listdir('training_data/your_face'):
        print("Por favor, coloca imágenes de tu rostro en 'training_data/your_face/'")
        print("Recomendación: 10-20 imágenes con diferentes ángulos e iluminaciones")
    else:
        trainer.train_model('training_data')