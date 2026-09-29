using UnityEngine;
using MafiaTycoon.Data;
using MafiaTycoon.Core;

namespace MafiaTycoon.Gameplay
{
    /// <summary>
    /// Runtime logic for a crew member instance.
    /// Manages leveling, experience, and stat calculation.
    /// </summary>
    [System.Serializable]
    public class CharacterInstance
    {
        public CharacterData config;
        public CharacterSaveData runtimeData;

        public CharacterInstance(CharacterData config, CharacterSaveData runtimeData)
        {
            this.config = config;
            this.runtimeData = runtimeData;
        }

        public string Name => config.characterName;
        public int Level => runtimeData.level;

        // --- Stat Calculations ---

        public float GetCurrentAttack()
        {
            float total = config.baseAttack + (Level - 1) * config.attackGrowthPerLevel;
            if (InventoryManager.Instance != null)
                total += InventoryManager.Instance.GetAttackBonus(runtimeData.equippedItemInstanceIDs);
            return total;
        }

        public float GetCurrentDefense()
        {
            float total = config.baseDefense + (Level - 1) * config.defenseGrowthPerLevel;
            if (InventoryManager.Instance != null)
                total += InventoryManager.Instance.GetDefenseBonus(runtimeData.equippedItemInstanceIDs);
            return total;
        }

        public double GetCurrentEconomicBonus()
        {
            double total = config.baseEconomicBonus + (Level - 1) * config.econGrowthPerLevel;
            if (InventoryManager.Instance != null)
                total += InventoryManager.Instance.GetEconomicBonus(runtimeData.equippedItemInstanceIDs);
            return total;
        }

        public float GetMaxHealth()
        {
            return config.baseHealth + (Level - 1) * config.healthGrowthPerLevel;
        }

        // --- Leveling Logic ---

        public int ExpToNextLevel => config.GetExpRequiredForLevel(Level);

        public void AddExperience(int amount)
        {
            runtimeData.currentExp += amount;
            
            while (runtimeData.currentExp >= ExpToNextLevel)
            {
                LevelUp();
            }
        }

        private void LevelUp()
        {
            runtimeData.currentExp -= ExpToNextLevel;
            runtimeData.level++;
            
            Debug.Log($"<color=cyan>{config.characterName} Leveled Up to {runtimeData.level}!</color>");
            // TODO: Trigger event for UI update
        }
    }
}
