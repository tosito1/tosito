using UnityEngine;

namespace MafiaTycoon.Data
{
    [CreateAssetMenu(fileName = "NewZone", menuName = "MafiaTycoon/Zone Data", order = 5)]
    public class ZoneData : ScriptableObject
    {
        [Header("Identity")]
        public string zoneID;
        public string zoneName;
        [TextArea] public string description;

        [Header("Requirements")]
        public int requiredLevel = 1;

        [Header("Economics")]
        public double conquerCost = 1000;
        public double passiveIncomeBonus = 50.0;

        [Header("Defense & Risk")]
        public float baseDefenseDifficulty = 100f; // Base power required to defend
        public float attackFrequency = 0.05f;      // Probability factor for being attacked
    }
}
