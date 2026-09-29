using UnityEngine;
using MafiaTycoon.Data;
using MafiaTycoon.Core;

namespace MafiaTycoon.Gameplay.Shooter
{
    public class ShooterManager : MonoBehaviour
    {
        public static ShooterManager Instance { get; private set; }

        public GameObject playerPrefab;
        public GameObject enemyPrefab;
        
        [Header("Scene References")]
        public Transform playerSpawnPoint;
        public Transform[] enemySpawnPoints;
        
        [Header("Level State")]
        public bool isCombatActive = false;
        private int aliveEnemies = 0;
        private string currentZoneFighting = "";

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);

            if (GetComponent<GameJuice>() == null)
            {
                gameObject.AddComponent<GameJuice>();
            }
        }

        public void StartCombat(string zoneID, int enemyCount)
        {
            currentZoneFighting = zoneID;
            isCombatActive = true;
            aliveEnemies = 0;

            // Limpiar clones anteriores si el usuario le dio varias veces al botón de Test
            ShooterHealth[] oldCombatants = Object.FindObjectsByType<ShooterHealth>(FindObjectsInactive.Exclude, FindObjectsSortMode.None);
            foreach (var c in oldCombatants)
            {
                if (c != null) DestroyImmediate(c.gameObject);
            }

            // Mostrar el entorno Shooter (MapBase)
            if (transform.childCount > 0)
            {
                transform.GetChild(0).gameObject.SetActive(true);
            }

            // Instanciar jugador
            if (playerPrefab != null && playerSpawnPoint != null)
            {
                GameObject player = Instantiate(playerPrefab, playerSpawnPoint.position, Quaternion.identity);
                // Conectar cámara al jugador
                CameraController cam = Camera.main.gameObject.GetComponent<CameraController>();
                if (cam == null) cam = Camera.main.gameObject.AddComponent<CameraController>();
                cam.SetTarget(player.transform);
                
                // Suscribirse a muerte del jugador
                ShooterHealth playerHealth = player.GetComponent<ShooterHealth>();
                if (playerHealth != null)
                {
                    playerHealth.onDeath.AddListener(OnPlayerDied);
                }
            }

            // Instanciar enemigos
            for (int i = 0; i < enemyCount; i++)
            {
                Transform spawnP = enemySpawnPoints[Random.Range(0, enemySpawnPoints.Length)];
                GameObject enemy = Instantiate(enemyPrefab, spawnP.position, Quaternion.identity);
                aliveEnemies++;

                ShooterHealth enemyHealth = enemy.GetComponent<ShooterHealth>();
                if (enemyHealth != null)
                {
                    enemyHealth.onDeath.AddListener(OnEnemyDied);
                }
            }
            
            Debug.Log($"Iniciando asalto Shooter en la zona {zoneID} con {enemyCount} enemigos.");
        }

        private void OnEnemyDied()
        {
            aliveEnemies--;
            if (aliveEnemies <= 0 && isCombatActive)
            {
                WinCombat();
            }
        }

        private void OnPlayerDied()
        {
            if (!isCombatActive) return;
            LoseCombat();
        }

        private void WinCombat()
        {
            isCombatActive = false;
            Debug.Log("¡Tiroteo ganado! Zona conquistada.");
            // Comunicar con el Tycoon:
            if (ZoneManager.Instance != null && !string.IsNullOrEmpty(currentZoneFighting))
            {
                ZoneManager.Instance.CompleteConquest(currentZoneFighting);
            }
            EndCombatScene();
        }

        private void LoseCombat()
        {
            isCombatActive = false;
            Debug.Log("Jugador abatido. Asalto fracasado.");
            EndCombatScene();
        }

        private void EndCombatScene()
        {
            // Aquí volveríamos a la UI del Tycoon limpiando la escena Shooter
            // Como esto es un Game Object, podemos destruir todos los combatientes
            ShooterHealth[] allCombatants = Object.FindObjectsByType<ShooterHealth>(FindObjectsInactive.Exclude);
            foreach (var c in allCombatants)
            {
                if (c != null) Destroy(c.gameObject);
            }
            
            // Volver a activar la UI Principal (Esto requiere conectarlo con un gestor principal)
            var canvas = GameObject.Find("UI_Canvas");
            if (canvas != null) canvas.GetComponent<Canvas>().enabled = true;
            
            var combatCanvas = GameObject.Find("Combat_Canvas");
            if (combatCanvas != null) combatCanvas.GetComponent<Canvas>().enabled = false;
            
            // Ocultar entorno shooter 
            if (transform.childCount > 0)
            {
                transform.GetChild(0).gameObject.SetActive(false); 
            }
        }

        [ContextMenu("TESTER: Ejecutar Asalto de Prueba (Activa Escena)")]
        public void TestCombat()
        {
            var canvas = GameObject.Find("UI_Canvas");
            if (canvas != null) canvas.GetComponent<Canvas>().enabled = false;
            
            var combatCanvas = GameObject.Find("Combat_Canvas");
            if (combatCanvas != null) combatCanvas.GetComponent<Canvas>().enabled = true;

            StartCombat("TestZone", 4);
        }
    }
}
