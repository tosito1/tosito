using UnityEngine;

namespace MafiaTycoon.Data
{
    /// <summary>
    /// Definition template for a business in the Mafia Tycoon game.
    /// Create instances of this via the Assets menu.
    /// </summary>
    [CreateAssetMenu(fileName = "NewBusiness", menuName = "MafiaTycoon/Business Data", order = 1)]
    public class BusinessData : ScriptableObject
    {
        [Header("Identity")]
        public string businessID; // Unique ID for matching with save data
        public string businessName;
        public Sprite icon;
        [TextArea] public string description;

        [Header("Economics")]
        public double baseCost = 10;
        public float costMultiplier = 1.15f; // Exponential growth factor
        public double baseProduction = 1.0;
        public float baseCycleTime = 2.0f;   // Seconds to complete a cycle
        public bool autoByDefault = false;   // If true, doesn't need a manager

        /// <summary>
        /// Calculates the cost for a specific level.
        /// Formula: BaseCost * (Multiplier ^ Level)
        /// </summary>
        public double GetCostAtLevel(int level)
        {
            if (level <= 0) return baseCost;
            return baseCost * System.Math.Pow(costMultiplier, level);
        }

        /// <summary>
        /// Calculates the production per second at a specific level.
        /// Formula: BaseProduction * Level
        /// </summary>
        public double GetProductionAtLevel(int level)
        {
            return baseProduction * level;
        }
    }
}
