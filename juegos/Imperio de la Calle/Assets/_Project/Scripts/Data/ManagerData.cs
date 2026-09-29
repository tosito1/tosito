using UnityEngine;

namespace MafiaTycoon.Data
{
    /// <summary>
    /// Definition template for a Manager in the Mafia Tycoon game.
    /// Managers can automate businesses and provide bonuses.
    /// </summary>
    [CreateAssetMenu(fileName = "NewManager", menuName = "MafiaTycoon/Manager Data", order = 2)]
    public class ManagerData : ScriptableObject
    {
        [Header("Identity")]
        public string managerID;
        public string managerName;
        [TextArea] public string description;

        [Header("Economics")]
        public double hireCost = 1000;
        public float productionMultiplier = 2.0f; // Multiplier for business production
        public float speedMultiplier = 1.0f;      // Multiplier for cycle speed (1.0 = no change)
    }
}
