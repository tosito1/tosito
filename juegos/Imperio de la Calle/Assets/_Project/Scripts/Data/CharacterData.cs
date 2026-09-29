using UnityEngine;

namespace MafiaTycoon.Data
{
    [CreateAssetMenu(fileName = "NewCharacter", menuName = "MafiaTycoon/Character Data", order = 3)]
    public class CharacterData : ScriptableObject
    {
        [Header("Identity")]
        public string characterID;
        public string characterName;
        public CharacterType type;
        public CharacterRarity rarity;
        public Sprite portrait;

        [Header("Base Stats (Level 1)")]
        public float baseAttack = 10;
        public float baseDefense = 10;
        public double baseEconomicBonus = 5.0; // Profit bonus (flat or multiplier)

        [Header("Growth Factors")]
        public float attackGrowthPerLevel = 1.2f;
        public float defenseGrowthPerLevel = 1.2f;
        public float econGrowthPerLevel = 1.1f;

        [Header("Combat Stats")]
        public float baseHealth = 100f;
        public float healthGrowthPerLevel = 20f;

        [Header("Experience")]
        public int baseExpRequired = 100;
        public float expMultiplier = 1.5f;

        public int GetExpRequiredForLevel(int level)
        {
            return (int)(baseExpRequired * System.Math.Pow(expMultiplier, level - 1));
        }
    }
}
