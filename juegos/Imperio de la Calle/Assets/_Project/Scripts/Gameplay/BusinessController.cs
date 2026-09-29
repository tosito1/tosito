using UnityEngine;
using MafiaTycoon.Data;
using MafiaTycoon.Core;

namespace MafiaTycoon.Gameplay
{
    public class BusinessController : MonoBehaviour
    {
        public static event System.Action OnBusinessUpgraded;

        [Header("Data")]
        public BusinessData config;
        public ManagerData assignedManager; // The SO data of the hired manager
        
        [Header("Runtime State")]
        public BusinessSaveData saveData;
        [SerializeField] private float currentCycleTimer;
        [SerializeField] private bool isManualCycleRunning;
        public bool isFrozen;

        public int CurrentLevel => saveData?.level ?? 0;
        public bool IsAutomated => config.autoByDefault || saveData.hasManager;
        
        public float NormalizedProgress => (config.baseCycleTime > 0) ? currentCycleTimer / config.baseCycleTime : 0;

        private void Start()
        {
            Initialize();
        }

        private void Initialize()
        {
            if (BusinessManager.Instance == null)
            {
                Debug.LogError("BusinessManager not found!");
                return;
            }

            // Bind to global save data
            saveData = BusinessManager.Instance.GetBusinessSaveData(config.businessID);
            
            // TODO: In a real UI, you'd load the ManagerData SO from a Resource/Addressable based on saveData.assignedManagerID
            
            UpdateGlobalIncome();
        }

        private void Update()
        {
            if (CurrentLevel <= 0 || isFrozen) return;

            if (IsAutomated)
            {
                UpdateCycleTimer(Time.deltaTime);
                if (currentCycleTimer >= config.baseCycleTime)
                {
                    currentCycleTimer = 0;
                }
            }
            else if (isManualCycleRunning)
            {
                UpdateCycleTimer(Time.deltaTime);
                if (currentCycleTimer >= config.baseCycleTime)
                {
                    CompleteManualCycle();
                }
            }
        }

        private void UpdateCycleTimer(float dt)
        {
            float speed = assignedManager != null ? assignedManager.speedMultiplier : 1.0f;
            currentCycleTimer += dt * speed;
        }

        public void ManualCollect()
        {
            if (IsAutomated || isManualCycleRunning || CurrentLevel <= 0) return;
            
            isManualCycleRunning = true;
            currentCycleTimer = 0;
        }

        private void CompleteManualCycle()
        {
            isManualCycleRunning = false;
            currentCycleTimer = 0;
            
            double reward = CalculateCurrentIncome();
            GameManager.Instance.AddMoney(reward);
            
            Debug.Log($"<color=green>Manual Collection: ${reward:N2} from {config.businessName}</color>");
        }

        public double CalculateUpgradeCost()
        {
            return config.GetCostAtLevel(saveData.level);
        }

        public double CalculateCurrentIncome()
        {
            double baseProd = config.GetProductionAtLevel(saveData.level);
            float multiplier = assignedManager != null ? assignedManager.productionMultiplier : 1.0f;
            return baseProd * multiplier;
        }

        [ContextMenu("Upgrade Business")]
        public void Upgrade()
        {
            double cost = CalculateUpgradeCost();

            if (GameManager.Instance.TrySpendMoney(cost))
            {
                saveData.level++;
                UpdateGlobalIncome();
                OnBusinessUpgraded?.Invoke();
                GameManager.Instance.SaveGame();
                Debug.Log($"<color=cyan>{config.businessName} Upgraded to Level {saveData.level}!</color>");
            }
        }

        public void AssignManager(ManagerData manager)
        {
            assignedManager = manager;
            saveData.hasManager = true;
            saveData.assignedManagerID = manager.managerID;
            
            UpdateGlobalIncome();
            Debug.Log($"<color=magenta>Manager {manager.managerName} assigned to {config.businessName}!</color>");
        }

        public void UpdateGlobalIncome()
        {
            var allBusinesses = Object.FindObjectsByType<BusinessController>(FindObjectsInactive.Exclude);
            
            double total = 0;
            foreach (var b in allBusinesses)
            {
                if (b.IsAutomated)
                {
                    total += b.CalculateCurrentIncome();
                }
            }

            if (GameManager.Instance != null)
            {
                // Apply Prestige Multiplier if PrestigeManager exists
                double multiplier = 1.0;
                if (PrestigeManager.Instance != null)
                {
                    multiplier = PrestigeManager.Instance.GetGlobalMultiplier();
                }

                GameManager.Instance.data.incomePerSecond = total * multiplier;
            }
        }

        public void Freeze(float duration)
        {
            if (isFrozen) return;
            StartCoroutine(FreezeRoutine(duration));
        }

        private System.Collections.IEnumerator FreezeRoutine(float duration)
        {
            isFrozen = true;
            UpdateGlobalIncome(); // Recalculate to stop passive income from this business
            
            yield return new WaitForSeconds(duration);
            
            isFrozen = false;
            UpdateGlobalIncome(); // Recalculate to resume
            Debug.Log($"<color=white>{config.businessName} has resumed operations.</color>");
        }
    }
}
