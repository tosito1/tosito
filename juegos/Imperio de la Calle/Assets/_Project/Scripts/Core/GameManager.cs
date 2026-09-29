using UnityEngine;
using MafiaTycoon.Data;

namespace MafiaTycoon.Core
{
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }
        public static event System.Action<double> OnMoneyEarned;

        [Header("Player State")]
        public PlayerData data;

        [Header("Settings")]
        [SerializeField] private float autoSaveInterval = 60f;
        private float _saveTimer;

        private void Awake()
        {
            // Singleton implementation
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);

            InitializeGame();
        }

        private void InitializeGame()
        {
            // 1. Load Data
            data = SaveManager.Load();

            // 2. Calculate Offline Progress
            double offlineSeconds = MafiaTycoon.Core.MafiaTimeUtils.GetOfflineSeconds(data.lastSaveTime);
            if (offlineSeconds > 0)
            {
                ApplyOfflineProgress(offlineSeconds);
            }

            Debug.Log($"Game Initialized. Money: {data.money}");
        }

        private void ApplyOfflineProgress(double seconds)
        {
            // Calculate how much money was earned while away
            double earnings = seconds * data.incomePerSecond;
            
            if (earnings > 0)
            {
                AddMoney(earnings);
                Debug.Log($"<color=yellow>Welcome back! You were away for {seconds:F0} seconds and earned ${earnings:N2}.</color>");
            }
        }

        private void Update()
        {
            // 1. Generate passive income in real-time
            if (data.incomePerSecond > 0)
            {
                AddMoney(data.incomePerSecond * Time.deltaTime);
            }

            // 2. Handle autosave
            _saveTimer += Time.deltaTime;
            if (_saveTimer >= autoSaveInterval)
            {
                SaveGame();
                _saveTimer = 0;
            }
        }

        public void SaveGame()
        {
            SaveManager.Save(data);
        }

        private void OnApplicationQuit()
        {
            SaveGame();
        }

        private void OnApplicationPause(bool pause)
        {
            if (pause)
            {
                SaveGame();
            }
        }
        
        /// <summary>
        /// Adds money to the player's balance.
        /// </summary>
        public void AddMoney(double amount)
        {
            if (amount <= 0) return;
            
            data.money += amount;
            OnMoneyEarned?.Invoke(amount);
            // TODO: Trigger UI update events here (e.g., OnMoneyChanged?.Invoke(data.money))
        }

        public double GetTotalIncomePerSecond()
        {
            return data.incomePerSecond;
        }

        /// <summary>
        /// Attempts to spend a certain amount of money.
        /// Returns true if successful, false if insufficient funds.
        /// </summary>
        public bool TrySpendMoney(double amount)
        {
            if (amount <= 0) return true;

            if (data.money >= amount)
            {
                data.money -= amount;
                // TODO: Trigger UI update events here
                return true;
            }

            Debug.LogWarning("Insufficient funds!");
            return false;
        }
    }
}
