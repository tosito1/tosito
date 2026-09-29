using UnityEngine;

namespace MafiaTycoon.Data
{
    [CreateAssetMenu(fileName = "NewItem", menuName = "MafiaTycoon/Item Data", order = 6)]
    public class ItemData : ScriptableObject
    {
        [Header("Identity")]
        public string itemID;
        public string itemName;
        public ItemType type;
        public CharacterRarity rarity;
        [TextArea] public string description;

        [Header("Stat Modifiers")]
        public float attackBonus;
        public float defenseBonus;
        public double economicBonus; // Flat bonus to income
        public float economicMultiplier = 1.0f; // Multiplier to income (1.0 = no bonus)
    }
}
