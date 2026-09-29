using UnityEngine;

namespace MafiaTycoon.Data
{
    [CreateAssetMenu(fileName = "PrestigeConfig", menuName = "MafiaTycoon/Prestige Config", order = 6)]
    public class PrestigeConfig : ScriptableObject
    {
        [Header("Earning Formula")]
        public double prestigeThreshold = 1000000; // $1M minimum to start earning points
        public double divisor = 100000;          // Scaling factor for points

        [Header("Bonuses")]
        public float multiplierPerPoint = 0.02f; // +2% global income per point

        /// <summary>
        /// Points = Sqrt(CurrentMoney / Divisor)
        /// This is a simple power curve.
        /// </summary>
        public double CalculatePoints(double currentMoney)
        {
            if (currentMoney < prestigeThreshold) return 0;
            return System.Math.Sqrt(currentMoney / divisor);
        }

        public double GetMultiplier(double points)
        {
            return 1.0 + (points * multiplierPerPoint);
        }
    }
}
