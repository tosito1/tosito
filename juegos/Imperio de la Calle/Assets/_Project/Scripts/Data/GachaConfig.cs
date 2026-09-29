using System.Collections.Generic;
using UnityEngine;
using MafiaTycoon.Data;

namespace MafiaTycoon.Data
{
    [CreateAssetMenu(fileName = "NewGachaPool", menuName = "MafiaTycoon/Gacha Pool", order = 4)]
    public class GachaConfig : ScriptableObject
    {
        [Header("Pool")]
        public string poolName;
        public List<CharacterData> characterPool;

        [Header("Rates (Percentage 0-100)")]
        public float commonRate = 70.0f;
        public float rareRate = 20.0f;
        public float epicRate = 8.0f;
        public float legendaryRate = 2.0f;

        // Note: The sum of rates should ideally be 100.
    }
}
