using System;
using UnityEngine;
using MafiaTycoon.Data;

namespace MafiaTycoon.Core
{
    public class PlayerLevelManager : MonoBehaviour
    {
        public static PlayerLevelManager Instance { get; private set; }

        [Header("Configuration")]
        public PlayerLevelConfig config;

        // Events
        public static event Action<int> OnPlayerLevelUp;
        public static event Action<int> OnPlayerExpChanged;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        /// <summary>
        /// Adds experience to the player.
        /// </summary>
        public void AddExp(int amount)
        {
            if (GameManager.Instance == null || config == null) return;

            var data = GameManager.Instance.data;
            data.playerExp += amount;

            int needed = config.GetExpRequiredForLevel(data.playerLevel);
            
            while (data.playerExp >= needed)
            {
                LevelUp();
                needed = config.GetExpRequiredForLevel(data.playerLevel);
            }

            OnPlayerExpChanged?.Invoke(data.playerExp);
            Debug.Log($"[Player] Exp Added: {amount}. Current: {data.playerExp}/{needed}");
        }

        private void LevelUp()
        {
            var data = GameManager.Instance.data;
            data.playerExp -= config.GetExpRequiredForLevel(data.playerLevel);
            data.playerLevel++;

            Debug.Log($"<color=yellow>[BOSS] Level Up! You are now Level {data.playerLevel}</color>");
            
            GameManager.Instance.SaveGame();
            ApplyRewards(data.playerLevel);
            OnPlayerLevelUp?.Invoke(data.playerLevel);
        }

        private void ApplyRewards(int level)
        {
            LevelReward reward = config.GetRewardForLevel(level);
            if (reward == null) return;

            switch (reward.type)
            {
                case RewardType.Money:
                    GameManager.Instance.AddMoney(reward.amount);
                    Debug.Log($"[Reward] Gained ${reward.amount} for Level {level}");
                    break;
                case RewardType.Reputation:
                    GameManager.Instance.data.reputation += (int)reward.amount;
                    Debug.Log($"[Reward] Gained {reward.amount} Reputation for Level {level}");
                    break;
                case RewardType.Item:
                    InventoryManager.Instance.AddItem(reward.itemID);
                    Debug.Log($"[Reward] Gained Item {reward.itemID} for Level {level}");
                    break;
            }
        }

        public float GetExpProgress()
        {
            if (config == null) return 0;
            var data = GameManager.Instance.data;
            int needed = config.GetExpRequiredForLevel(data.playerLevel);
            return (float)data.playerExp / needed;
        }
    }
}
