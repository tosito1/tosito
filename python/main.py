import cv2
import mediapipe as mp
import pyautogui
pyautogui.FAILSAFE = False
import os
# Ocultar advertencias de TensorFlow
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
try:
    import tensorflow as tf
    gpus = tf.config.list_physical_devices('GPU')
    if gpus:
        print(f"GPUs detectadas: {[gpu.name for gpu in gpus]}")
    else:
        print("No se detectaron GPUs para TensorFlow. Se usará CPU.")
except ImportError:
    print("TensorFlow no está instalado. Solo CPU disponible para MediaPipe.")

def main():
    cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)  # DirectShow para menor latencia en Windows
    if not cap.isOpened():
        print("No se pudo abrir la cámara.")
        return

    mp_hands = mp.solutions.hands
    mp_drawing = mp.solutions.drawing_utils
    # Usar solo 1 mano para menos procesamiento y mayor velocidad
    hands = mp_hands.Hands(static_image_mode=False,
                           max_num_hands=2,
                           min_detection_confidence=0.7,
                           min_tracking_confidence=0.7)

    screen_w, screen_h = pyautogui.size()
    cam_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    cam_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    prev_x, prev_y = None, None
    smooth_factor = 0.2  # Suavizado del movimiento del cursor

    import time
    mode = 1  # 1: mover/click, 2: mouse completo, 3: scroll
    mode_names = {1: 'MOVER+CLICK', 2: 'MOUSE COMPLETO', 3: 'SCROLL'}
    # Margen para reducir el área de control (porcentaje de la imagen)
    margin = 0.25  # 25% de margen a cada lado

    # Variables para scroll progresivo
    scroll_counter = 0
    scroll_direction = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            print("No se pudo leer el frame.")
            break
        frame = cv2.flip(frame, 1)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands.process(rgb_frame)

        # Detección de manos y asignación izquierda/derecha
        right_hand = None
        left_hand = None
        handedness = []
        if results.multi_handedness:
            handedness = [h.classification[0].label for h in results.multi_handedness]
        if results.multi_hand_landmarks:
            for idx, hand_landmarks in enumerate(results.multi_hand_landmarks):
                label = handedness[idx] if idx < len(handedness) else 'Right'
                if label == 'Right':
                    right_hand = hand_landmarks
                else:
                    left_hand = hand_landmarks

        # Cambiar modo con la mano izquierda (número de dedos extendidos)
        if left_hand:
            # Contar dedos extendidos (excepto pulgar)
            fingers = []
            for tip_id in [8, 12, 16]:  # Índice, medio, anular
                tip = left_hand.landmark[tip_id]
                pip = left_hand.landmark[tip_id - 2]
                fingers.append(tip.y < pip.y)
            num_fingers = sum(fingers)
            if num_fingers == 0:
                mode = 1
            elif num_fingers == 1:
                mode = 2
            elif num_fingers >= 2:
                mode = 3
            cv2.putText(frame, f'MODO: {mode_names[mode]}', (10, 40), cv2.FONT_HERSHEY_SIMPLEX, 1, (255,255,0), 2)

        # Mano derecha: aplicar acción según modo
        if right_hand:
            mp_drawing.draw_landmarks(frame, right_hand, mp_hands.HAND_CONNECTIONS)
            index_finger_tip = right_hand.landmark[8]
            thumb_tip = right_hand.landmark[4]
            # Escalar el área útil de la cámara para que no sea necesario ir a los bordes
            x_norm = (index_finger_tip.x - margin) / (1 - 2 * margin)
            y_norm = (index_finger_tip.y - margin) / (1 - 2 * margin)
            x_norm = min(max(x_norm, 0), 1)
            y_norm = min(max(y_norm, 0), 1)
            x = int(x_norm * cam_w)
            y = int(y_norm * cam_h)
            screen_x = int(x_norm * screen_w)
            screen_y = int(y_norm * screen_h)


            if mode != 3:
                # Suavizado del movimiento del cursor
                if prev_x is not None and prev_y is not None:
                    screen_x = int(prev_x + (screen_x - prev_x) * smooth_factor)
                    screen_y = int(prev_y + (screen_y - prev_y) * smooth_factor)
                pyautogui.moveTo(screen_x, screen_y, duration=0)
                prev_x, prev_y = screen_x, screen_y
                cv2.circle(frame, (x, y), 10, (0, 255, 255), -1)

            thumb_x = int(thumb_tip.x * cam_w)
            thumb_y = int(thumb_tip.y * cam_h)
            # Usar distancia 3D y condición de orientación para evitar falsos clics
            dx = index_finger_tip.x - thumb_tip.x
            dy = index_finger_tip.y - thumb_tip.y
            dz = index_finger_tip.z - thumb_tip.z
            distance_thumb_index = (dx ** 2 + dy ** 2 + dz ** 2) ** 0.5 * cam_w
            # Solo considerar clic si el índice está por encima del pulgar (en y) y cerca en 3D

            # Cooldowns para evitar múltiples acciones seguidas
            if not hasattr(main, 'last_click_time'):
                main.last_click_time = 0
            if not hasattr(main, 'last_double_click_time'):
                main.last_double_click_time = 0
            if not hasattr(main, 'last_right_click_time'):
                main.last_right_click_time = 0
            if not hasattr(main, 'dragging'):
                main.dragging = False
            now = time.time()

            if mode == 1:
                # Solo mover y clic izquierdo (pulgar e índice juntos)
                if distance_thumb_index < 40:
                    if now - main.last_click_time > 0.7:
                        pyautogui.click()
                        main.last_click_time = now
                        cv2.putText(frame, 'CLICK', (x, y-30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0,0,255), 2)
            elif mode == 2:
                # Mouse completo (clic, doble clic, derecho, drag)
                # Doble clic: índice y medio juntos SOLO si el cursor está casi quieto
                middle_tip = right_hand.landmark[12]
                middle_x = int(middle_tip.x * cam_w)
                middle_y = int(middle_tip.y * cam_h)
                distance_index_middle = ((x - middle_x) ** 2 + (y - middle_y) ** 2) ** 0.5
                movement = 0
                if prev_x is not None and prev_y is not None:
                    movement = ((screen_x - prev_x) ** 2 + (screen_y - prev_y) ** 2) ** 0.5
                if distance_thumb_index < 40:
                    if now - main.last_click_time > 0.7:
                        pyautogui.click()
                        main.last_click_time = now
                        cv2.putText(frame, 'CLICK', (x, y-30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0,0,255), 2)
                if distance_index_middle < 40 and movement < 10:
                    if now - main.last_double_click_time > 1.2:
                        pyautogui.doubleClick()
                        main.last_double_click_time = now
                        cv2.putText(frame, 'DOUBLE CLICK', (x, y-60), cv2.FONT_HERSHEY_SIMPLEX, 1, (255,0,0), 2)
                ring_tip = right_hand.landmark[16]
                ring_x = int(ring_tip.x * cam_w)
                ring_y = int(ring_tip.y * cam_h)
                distance_index_ring = ((x - ring_x) ** 2 + (y - ring_y) ** 2) ** 0.5
                if distance_index_ring < 40:
                    if now - main.last_right_click_time > 1.2:
                        pyautogui.rightClick()
                        main.last_right_click_time = now
                        cv2.putText(frame, 'RIGHT CLICK', (x, y-90), cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0), 2)
                # Drag
                if distance_thumb_index < 30:
                    if not main.dragging:
                        pyautogui.mouseDown()
                        main.dragging = True
                        cv2.putText(frame, 'DRAG', (x, y-120), cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,255), 2)
                else:
                    if main.dragging:
                        pyautogui.mouseUp()
                        main.dragging = False
            elif mode == 3:
                # Scroll: velocidad depende de la distancia vertical del índice respecto a la base
                base_index = right_hand.landmark[6]
                vec_y = index_finger_tip.y - base_index.y
                # Invertir la dirección: si el dedo sube, scroll ABAJO; si baja, scroll ARRIBA
                if abs(vec_y) > 0.04:
                    # La velocidad depende de la distancia, no del tiempo
                    # Cuanto más lejos, más rápido (factor cuadrático para más sensibilidad)
                    scroll_direction = 1 if vec_y < 0 else -1  # invertido respecto a antes
                    scroll_speed = int(min(40 + 600 * abs(vec_y) ** 2, 120))
                    pyautogui.scroll(scroll_speed * scroll_direction)
                    if scroll_direction == 1:
                        cv2.putText(frame, f'SCROLL DOWN {scroll_speed}', (x, y-30), cv2.FONT_HERSHEY_SIMPLEX, 1, (255,255,255), 2)
                    else:
                        cv2.putText(frame, f'SCROLL UP {scroll_speed}', (x, y-30), cv2.FONT_HERSHEY_SIMPLEX, 1, (255,255,255), 2)
                else:
                    scroll_direction = 0
        else:
            prev_x, prev_y = None, None

        cv2.putText(frame, f'MODO: {mode_names[mode]}', (10, 40), cv2.FONT_HERSHEY_SIMPLEX, 1, (255,255,0), 2)

        cv2.imshow('Cámara - Reconocimiento de Manos', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
