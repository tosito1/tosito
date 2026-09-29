using System.Collections.Generic;
using UnityEngine;

namespace MafiaTycoon.Data
{
    [System.Serializable]
    public enum RewardType
    {
        Money,
        Reputation,
        Item
    }

    [System.Serializable]
    public class LevelReward
    {
        public int atLevel;
        public RewardType type;
        public double amount;
        public string itemID; // Used if type is Item
    }

    [CreateAssetMenu(fileName = "PlayerLevelConfig", menuName = "MafiaTycoon/Player Level Config", order = 8)]
    public class PlayerLevelConfig : ScriptableObject
    {
        [Header("Experience Curve")]
        public int baseExpRequired = 100;
        public float expMultiplier = 1.2f;

        [Header("Rewards")]
        public List<LevelReward> levelRewards;

        public int GetExpRequiredForLevel(int level)
        {
            if (level <= 1) return baseExpRequired;
            return (int)(baseExpRequired * Mathf.Pow(expMultiplier, level - 1));
        }

        public LevelReward GetRewardForLevel(int level)
        {
            return levelRewards.Find(r => r.atLevel == level);
        }
    }
}
