using UnityEngine;
using MafiaTycoon.Data;
using MafiaTycoon.Gameplay;
using System.Collections.Generic;

namespace MafiaTycoon.Core
{
    public class PrestigeManager : MonoBehaviour
    {
        public static PrestigeManager Instance { get; private set; }

        [Header("Configuration")]
        public PrestigeConfig config;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        public double GetPotentialPoints()
        {
            if (GameManager.Instance == null) return 0;
            return config.CalculatePoints(GameManager.Instance.data.money);
        }

        [ContextMenu("Perform Prestige")]
        public void PerformPrestige()
        {
            if (GameManager.Instance == null) return;

            double points = GetPotentialPoints();
            if (points <= 0)
            {
                Debug.LogWarning("Not enough money to prestige yet!");
                return;
            }

            var data = GameManager.Instance.data;

            // 1. Add points
            data.influencePoints += points;
            data.timesPrestiged++;

            // 2. Reset Economy
            data.money = 0;
            data.incomePerSecond = 0;
            
            // 3. Reset Businesses (Reset levels, but keep unlocked status)
            foreach (var business in data.businesses)
            {
                business.level = 0;
                business.hasManager = false;
                business.assignedManagerID = "";
            }

            // 4. Reset Zones (Keep unlocked, but lose control)
            foreach (var zone in data.zones)
            {
                zone.status = ZoneStatus.Unlocked;
                zone.assignedDefenderIDs = new List<string>();
            }

            // 5. Force save and reload or refresh logic
            GameManager.Instance.SaveGame();
            
            // In a real game, you might reload the scene here:
            // UnityEngine.SceneManagement.SceneManager.LoadScene(0);

            Debug.Log($"<color=cyan>[PRESTIGE] Done! Influence Points added: {points:F1}. Global Multiplier is now: {GetGlobalMultiplier():P}</color>");
        }

        public double GetGlobalMultiplier()
        {
            if (GameManager.Instance == null) return 1.0;
            return config.GetMultiplier(GameManager.Instance.data.influencePoints);
        }
    }
}
