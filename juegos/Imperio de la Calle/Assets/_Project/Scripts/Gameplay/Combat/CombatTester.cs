using System.Collections.Generic;
using UnityEngine;
using MafiaTycoon.Core;
using MafiaTycoon.Data;
using MafiaTycoon.Gameplay;

namespace MafiaTycoon.Gameplay.Combat
{
    public class CombatTester : MonoBehaviour
    {
        [Header("Manual Battle Setup")]
        public List<CharacterData> enemyTeamConfigs;
        public int enemyLevel = 1;

        [ContextMenu("Simulate Battle with Active Crew")]
        public void StartSimulatedBattle()
        {
            if (CombatManager.Instance == null || CrewManager.Instance == null)
            {
                Debug.LogError("Managers not found in scene!");
                return;
            }

            if (CrewManager.Instance.activeCrew.Count == 0)
            {
                Debug.LogWarning("You have no crew members to fight with!");
                return;
            }

            // Create temporary enemy instances
            List<CharacterInstance> enemyTeam = new List<CharacterInstance>();
            foreach (var config in enemyTeamConfigs)
            {
                // We pass a dummy save data for enemies
                var dummySave = new CharacterSaveData(config.characterID, enemyLevel);
                enemyTeam.Add(new CharacterInstance(config, dummySave));
            }

            if (enemyTeam.Count == 0)
            {
                Debug.LogWarning("Enemy team is empty!");
                return;
            }

            CombatManager.Instance.SimulateBattle(CrewManager.Instance.activeCrew, enemyTeam);
        }
    }
}
