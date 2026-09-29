using System.Collections.Generic;
using UnityEngine;
using MafiaTycoon.Data;
using MafiaTycoon.Gameplay;
using System.Linq;

namespace MafiaTycoon.Core
{
    public class GachaManager : MonoBehaviour
    {
        public static GachaManager Instance { get; private set; }

        [Header("Settings")]
        public double rollCost = 10000;
        
        [Header("Probabilities (Percentage)")]
        [Range(0, 100)] public float commonWeight = 70f;
        [Range(0, 100)] public float rareWeight = 20f;
        [Range(0, 100)] public float epicWeight = 8f;
        [Range(0, 100)] public float legendaryWeight = 2f;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        public CharacterData RollCharacter()
        {
            if (GameManager.Instance == null || CrewManager.Instance == null) return null;

            if (!GameManager.Instance.TrySpendMoney(rollCost))
            {
                Debug.LogWarning("Not enough money for recruitment!");
                return null;
            }

            CharacterRarity rolledRarity = GetRandomRarity();
            return PickFromPool(rolledRarity);
        }

        private CharacterRarity GetRandomRarity()
        {
            float rand = Random.Range(0f, 100f);
            
            if (rand <= legendaryWeight) return CharacterRarity.Legendario;
            if (rand <= legendaryWeight + epicWeight) return CharacterRarity.Epico;
            if (rand <= legendaryWeight + epicWeight + rareWeight) return CharacterRarity.Raro;
            
            return CharacterRarity.Comun;
        }

        private CharacterData PickFromPool(CharacterRarity rarity)
        {
            var pool = CrewManager.Instance.allCharacters.Where(c => c.rarity == rarity).ToList();
            
            if (pool.Count == 0)
            {
                Debug.LogWarning($"Pool for rarity {rarity} is empty! Scaling down...");
                // Fallback to lower rarity if pool is empty
                if (rarity != CharacterRarity.Comun) 
                    return PickFromPool((CharacterRarity)((int)rarity - 1));
                    
                return CrewManager.Instance.allCharacters[0];
            }

            return pool[Random.Range(0, pool.Count)];
        }
    }
}
